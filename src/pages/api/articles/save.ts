export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ok, badRequest, forbidden, serverError, json } from '@/lib/api';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { recordActivity } from '@/lib/activity';
import { toSlug } from '@/lib/slug';
import readingTime from 'reading-time';

// Hard payload limits to prevent abuse / OOM.
const MAX_TITLE = 300;
const MAX_SLUG = 200;
const MAX_EXCERPT = 600;
const MAX_META_TITLE = 200;
const MAX_META_DESC = 500;
const MAX_CONTENT_HTML = 500_000; // ~500KB
const MAX_URL = 2000;

const schema = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Judul wajib diisi').max(MAX_TITLE),
  slug: z.string().min(1).max(MAX_SLUG),
  excerpt: z.string().max(MAX_EXCERPT).nullable().optional(),
  content: z.any().nullable().optional(),
  content_html: z.string().max(MAX_CONTENT_HTML).default(''),
  plain_text: z.string().max(MAX_CONTENT_HTML).default(''),
  cover_image: z.string().url().max(MAX_URL).nullable().optional()
    .or(z.literal('').transform(() => null)),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  published_at: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  meta_title: z.string().max(MAX_META_TITLE).nullable().optional(),
  meta_description: z.string().max(MAX_META_DESC).nullable().optional(),
  og_image: z.string().url().max(MAX_URL).nullable().optional()
    .or(z.literal('').transform(() => null)),
  tag_ids: z.array(z.string().uuid()).max(50).default([]),
});

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.role) return forbidden();

  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await request.json());
  } catch (e) {
    return badRequest(e instanceof z.ZodError ? e.issues[0]?.message ?? 'Data tidak valid' : 'Body tidak valid');
  }

  const supabase = locals.supabase;
  const slug = toSlug(payload.slug || payload.title);
  const cleanHtml = sanitizeArticleHtml(payload.content_html || '');
  const minutes = Math.max(1, Math.round(readingTime(payload.plain_text || '').minutes));

  // Publishing requires a published_at; default to now if missing.
  let publishedAt = payload.published_at ?? null;
  if ((payload.status === 'published' || payload.status === 'scheduled') && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  // Guard: if the editor didn't produce HTML (e.g. onCreate didn't fire) but
  // content JSON exists, don't overwrite existing content_html with empty string.
  const hasContent = payload.content && typeof payload.content === 'object';
  const htmlToSave = cleanHtml || (hasContent ? undefined : '');

  const row: Record<string, unknown> = {
    title: payload.title,
    slug,
    excerpt: payload.excerpt ?? null,
    content: payload.content ?? null,
    ...(htmlToSave !== undefined && { content_html: htmlToSave }),
    cover_image: payload.cover_image ?? null,
    status: payload.status,
    published_at: publishedAt,
    category_id: payload.category_id ?? null,
    meta_title: payload.meta_title ?? null,
    meta_description: payload.meta_description ?? null,
    og_image: payload.og_image ?? null,
    reading_time: minutes,
  };

  try {
    let articleId = payload.id ?? null;

    if (articleId) {
      // Ownership check on update: editor may only edit their own articles.
      // Owner/admin may edit any.
      if (locals.role === 'editor') {
        const { data: existing } = await supabase
          .from('articles')
          .select('author_id')
          .eq('id', articleId)
          .maybeSingle<{ author_id: string | null }>();
        if (existing && existing.author_id && existing.author_id !== locals.user.id) {
          return forbidden('Editor hanya bisa mengedit artikel sendiri');
        }
      }
      // Publish privilege: only owner/admin can publish or schedule.
      if (payload.status === 'published' || payload.status === 'scheduled') {
        if (locals.role !== 'owner' && locals.role !== 'admin') {
          return forbidden('Hanya owner/admin yang bisa menerbitkan artikel');
        }
      }
      const { error } = await supabase.from('articles').update(row as never).eq('id', articleId);
      if (error) return slugError(error.message);
    } else {
      // Create: same publish privilege for the new article.
      if (payload.status === 'published' || payload.status === 'scheduled') {
        if (locals.role !== 'owner' && locals.role !== 'admin') {
          return forbidden('Hanya owner/admin yang bisa menerbitkan artikel');
        }
      }
      const { data, error } = await supabase
        .from('articles')
        .insert({ ...row, author_id: locals.user.id } as never)
        .select('id')
        .single<{ id: string }>();
      if (error) return slugError(error.message);
      articleId = data.id;
    }

    // Sync tags (delete-all + re-insert is fine for the small counts here).
    await supabase.from('article_tags').delete().eq('article_id', articleId as string);
    if (payload.tag_ids.length) {
      await supabase
        .from('article_tags')
        .insert(payload.tag_ids.map((tag_id) => ({ article_id: articleId!, tag_id })) as never);
    }

    await recordActivity(supabase, {
      action: payload.status === 'published' ? 'publish' : payload.id ? 'update' : 'create',
      entityType: 'articles',
      entityId: articleId,
      summary: `${payload.id ? 'memperbarui' : 'membuat'} artikel "${payload.title}"`,
    });

    return ok({ id: articleId, slug });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : 'Gagal menyimpan');
  }
};

function slugError(message: string): Response {
  if (message.includes('articles_slug') || message.toLowerCase().includes('duplicate')) {
    return json({ ok: false, error: 'Slug sudah dipakai artikel lain' }, 409);
  }
  return serverError(message);
}
