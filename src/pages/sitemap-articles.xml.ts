export const prerender = false;
import type { APIRoute } from 'astro';
import { getAllPublishedForFeed } from '@/lib/supabase/queries/articles';

// @astrojs/sitemap only enumerates static routes; SSR [slug] URLs are missing.
// This endpoint generates a sitemap for published articles so search engines
// discover them.
export const GET: APIRoute = async ({ locals }) => {
  const articles = await getAllPublishedForFeed(locals.supabase, 500);
  const site = 'https://sedekahairminum.com';

  const urls = articles.map((a) => {
    const lastmod = a.updated_at ?? a.published_at ?? '';
    return `<url><loc>${site}/artikel/${a.slug}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}<changefreq>weekly</changefreq></url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
