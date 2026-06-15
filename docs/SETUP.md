# Setup Guide — Sedekah Air Minum CMS

## Prerequisites

- [bun](https://bun.sh) ≥ 1.0
- [wrangler](https://developers.cloudflare.com/workers/wrangler/) (installed as devDep)
- A Supabase account (free tier works)
- A Cloudflare account with Workers & Pages

---

## 1. Clone & Install

```bash
git clone <repo-url> sedekahairminum
cd sedekahairminum
bun install
```

## 2. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Pick a name, set a DB password, choose a region close to your users
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://abcxyz.supabase.co`)
   - **anon public key** (safe for client)
   - **service_role key** (secret — server only)

## 3. Apply Migrations

Option A — **Supabase CLI** (recommended):

```bash
bunx supabase link --project-ref <your-ref>
bunx supabase db push
```

Option B — **SQL Editor** in the Supabase Dashboard:

Run each file in `supabase/migrations/` in order (0001 through 0014) in the SQL Editor.

## 4. Enable pg_cron (Optional)

In the Supabase Dashboard: **Database → Extensions** → search "pg_cron" → Enable.

Then run in SQL Editor:

```sql
select cron.schedule('heartbeat', '7 3 * * *', $$select public.heartbeat()$$);
select cron.schedule('prune-heartbeats', '42 4 * * *', $$select public.prune_heartbeats(7)$$);
```

## 5. Create Storage Buckets

The migration `0013_storage.sql` creates buckets automatically. If it didn't run cleanly, create them manually in **Storage** → **New bucket**:

| Bucket | Public |
|--------|--------|
| media | Yes |
| covers | Yes |
| avatars | Yes |
| docs | No |

## 6. Configure Environment

Copy `.env.example` to `.env` and `.dev.vars.example` to `.dev.vars`:

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
```

Fill in your Supabase credentials in both files.

## 7. Create Your Admin User

1. In the Supabase Dashboard: **Authentication → Users → Add user**
2. Use email + password (the same credentials you'll use to log in)
3. The `handle_new_user` trigger automatically creates a profile. The **first user** gets the `owner` role; subsequent users are `editor` (promote them from the dashboard later)

**Important:** After creating your admin user(s), disable public sign-ups:
**Authentication → Providers → Email → "Allow new users to sign up" → OFF**

## 8. Local Development

```bash
bun run dev
```

- Marketing pages render with data from Supabase (build-time fetch)
- Admin at `http://localhost:4321/admin/login`
- API routes at `http://localhost:4321/api/*`

## 9. Deploy to Cloudflare

### First-time setup

1. Create a **Workers & Pages** project in Cloudflare Dashboard
2. Create a KV namespace for Astro sessions:
   ```bash
   bunx wrangler kv namespace create SESSION
   ```
   Copy the `id` into `wrangler.jsonc` → `kv_namespaces[0].id`

3. Set secrets:
   ```bash
   bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   bunx wrangler secret put CF_DEPLOY_HOOK_URL
   bunx wrangler secret put CRON_SECRET
   ```

4. Set public vars in `wrangler.jsonc` → `vars`:
   ```json
   "PUBLIC_SUPABASE_URL": "https://abcxyz.supabase.co",
   "PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
   ```

### Deploy

```bash
bun run build
bunx wrangler deploy
```

### Deploy Hook (for CMS "Publish to site" button)

1. In Cloudflare Dashboard: **Workers & Pages → your project → Settings → Deploy hooks**
2. Create a hook, copy the URL
3. Set it as the `CF_DEPLOY_HOOK_URL` secret

### Cron Trigger

The `wrangler.jsonc` already defines a daily cron at 03:07 UTC. It fires the `scheduled()` handler which calls `/api/heartbeat` to keep the Supabase DB alive.

## 10. Regenerate Types (After Schema Changes)

```bash
bunx supabase gen types typescript --linked > src/lib/supabase/types.ts
```

Keep the convenience aliases at the bottom of the file.

---

## Architecture Overview

| Route | Mode | Description |
|-------|------|-------------|
| `/`, `/tentang`, `/penerima`, `/kontak` | Static (prerender) | Marketing pages, data from Supabase at build |
| `/artikel`, `/artikel/[slug]` | SSR | Blog, live from Supabase |
| `/admin/**` | SSR | Dashboard (auth-gated) |
| `/api/**` | SSR | REST endpoints |
| `/rss.xml`, `/sitemap-articles.xml` | SSR | Feed + article sitemap |

**Auth:** Supabase cookie-based via `@supabase/ssr`. Middleware gates `/admin/**`.

**Keep-alive:** Cloudflare Cron + pg_cron + organic dashboard writes prevent Supabase free-tier pause.

**Editor:** TipTap v3 with 16 extensions (headings, lists, tables, code blocks with syntax highlighting, images, links, alignment, etc.)

**CMS:** 12 marketing content types managed via a config-driven generic CRUD system. Blog articles have a dedicated bespoke editor.
