# Sedekah Air Minum — CMS + Blog

Stack: Astro 5.18 hybrid + React 19 + TipTap v3 + shadcn (base-nova) + Supabase (Postgres+Auth+Storage), deploy Cloudflare Workers.

Penting: lihat `docs/SETUP.md` untuk langkah setup. Lihat `src/lib/supabase/types.ts` untuk schema types. Lihat `supabase/migrations/` untuk 14 file SQL.

Jangan hapus:
- Vite plugin `reactDomEdge()` di `astro.config.mjs` (memaksa react-dom/server ke edge build)
- `compatibility_flags: ["nodejs_compat_v2"]` di `wrangler.jsonc`

Aturan:
- Service-role key HANYA boleh dipakai di `src/pages/api/**` (lihat `createSupabaseAdmin`)
- `import.meta.env.PUBLIC_*` dibaca saat build — taruh di `.env.production` (anon key aman di-commit, RLS-guarded)
- Marketing pages = static, `/artikel/*` + `/admin/**` + `/api/**` = SSR (wajib `export const prerender = false`)
- Login UI: POST ke `/api/auth/login` (server-side), selalu tampilkan error generic, rate limit 3s/30s
- Selalu sanitize `content_html` lewat `sanitizeArticleHtml()` sebelum simpan
- Semua role login (editor/admin/owner) boleh edit & terbitkan artikel apa pun (selaras RLS `articles_editor_all`); guard cukup auth dasar di `save.ts`
- Owner-only admin creation; last-admin guard pada demote
- Untuk query ke `articles` join ke profiles: `author_id` FK ke `auth.users` (bukan profiles), fetch terpisah
- Cron secret HANYA via `X-Cron-Secret` header, jangan query string (ke-log di akses Cloudflare)
- Admin response: `Cache-Control: no-store`, `X-Frame-Options: DENY` (di middleware)
- Jangan pernah pakai `event.message` Supabase mentah di response ke client
- Password min 8 char + 1 upper + 1 digit, enforce di server
- CSP di `public/_headers`: form-action 'self', base-uri 'self', object-src 'none'. No unsafe-inline.

File penting: `astro.config.mjs`, `src/middleware.ts`, `src/lib/supabase/admin.ts`, `src/lib/security.ts`, `src/lib/sanitize.ts`, `src/worker.ts`, `wrangler.jsonc`, `public/_headers`.
