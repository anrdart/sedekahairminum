export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ok, badRequest, forbidden, serverError, json } from '@/lib/api';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { recordActivity } from '@/lib/activity';
import { toSlug } from '@/lib/slug';
import readingTime from 'reading-time';

const schema = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  content: z.any().nullable().optional(),
  content_html: z.string().default(''),
  plain_text: z.string().default(''),
  cover_image: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  published_at: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  og_image: z.string().nullable().optional(),
  tag_ids: z.array(z.string().uuid()).default([]),
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

  const row = {
    title: payload.title,
    slug,
    excerpt: payload.excerpt ?? null,
    content: payload.content ?? null,
    content_html: cleanHtml,
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
      const { error } = await supabase.from('articles').update(row as never).eq('id', articleId);
      if (error) return slugError(error.message);
    } else {
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
