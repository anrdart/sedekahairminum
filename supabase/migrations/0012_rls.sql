-- 0012_rls.sql
-- Row Level Security for every table. RLS is the real authorization boundary
-- (middleware is convenience). service_role bypasses all of this — it must never
-- reach the browser. auth.uid() is NULL for anon/service_role, so is_admin()/
-- is_editor() default to false and policies default-deny.

-- Enable RLS everywhere.
alter table public.profiles            enable row level security;
alter table public.activity_log        enable row level security;
alter table public.penerima            enable row level security;
alter table public.testimonials        enable row level security;
alter table public.faqs                enable row level security;
alter table public.stats               enable row level security;
alter table public.features            enable row level security;
alter table public.program_slides      enable row level security;
alter table public.gallery             enable row level security;
alter table public.hero_slides         enable row level security;
alter table public.values_list         enable row level security;
alter table public.team                enable row level security;
alter table public.misi                enable row level security;
alter table public.rekening            enable row level security;
alter table public.settings            enable row level security;
alter table public.media               enable row level security;
alter table public.categories          enable row level security;
alter table public.tags                enable row level security;
alter table public.articles            enable row level security;
alter table public.article_tags        enable row level security;
alter table public.contact_submissions enable row level security;

-- ── profiles ────────────────────────────────────────────────────────────────
-- Self policy uses id = auth.uid() directly (no helper) to avoid RLS recursion.
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_admin_select on public.profiles
  for select using (public.is_admin());
-- Users may edit their own profile but not change their own role.
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid()
    and role = (select role from public.profiles p where p.id = auth.uid()));
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ── marketing content (public read published, editor full CRUD) ─────────────
-- penerima
create policy penerima_public_read on public.penerima
  for select using (is_published = true);
create policy penerima_editor_all on public.penerima
  for all using (public.is_editor()) with check (public.is_editor());
-- testimonials
create policy testimonials_public_read on public.testimonials
  for select using (is_published = true);
create policy testimonials_editor_all on public.testimonials
  for all using (public.is_editor()) with check (public.is_editor());
-- faqs
create policy faqs_public_read on public.faqs
  for select using (is_published = true);
create policy faqs_editor_all on public.faqs
  for all using (public.is_editor()) with check (public.is_editor());
-- stats
create policy stats_public_read on public.stats
  for select using (is_published = true);
create policy stats_editor_all on public.stats
  for all using (public.is_editor()) with check (public.is_editor());
-- features
create policy features_public_read on public.features
  for select using (is_published = true);
create policy features_editor_all on public.features
  for all using (public.is_editor()) with check (public.is_editor());
-- program_slides
create policy program_slides_public_read on public.program_slides
  for select using (is_published = true);
create policy program_slides_editor_all on public.program_slides
  for all using (public.is_editor()) with check (public.is_editor());
-- gallery
create policy gallery_public_read on public.gallery
  for select using (is_published = true);
create policy gallery_editor_all on public.gallery
  for all using (public.is_editor()) with check (public.is_editor());
-- hero_slides
create policy hero_slides_public_read on public.hero_slides
  for select using (is_published = true);
create policy hero_slides_editor_all on public.hero_slides
  for all using (public.is_editor()) with check (public.is_editor());
-- values_list
create policy values_list_public_read on public.values_list
  for select using (is_published = true);
create policy values_list_editor_all on public.values_list
  for all using (public.is_editor()) with check (public.is_editor());
-- team
create policy team_public_read on public.team
  for select using (is_published = true);
create policy team_editor_all on public.team
  for all using (public.is_editor()) with check (public.is_editor());
-- misi
create policy misi_public_read on public.misi
  for select using (is_published = true);
create policy misi_editor_all on public.misi
  for all using (public.is_editor()) with check (public.is_editor());
-- rekening
create policy rekening_public_read on public.rekening
  for select using (is_published = true);
create policy rekening_editor_all on public.rekening
  for all using (public.is_editor()) with check (public.is_editor());

-- ── settings (anon read: site needs contact/social at runtime; admin write) ──
create policy settings_public_read on public.settings
  for select using (true);
create policy settings_admin_write on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ── media (public read for CDN; editor write) ───────────────────────────────
create policy media_public_read on public.media
  for select using (true);
create policy media_editor_write on public.media
  for all using (public.is_editor()) with check (public.is_editor());

-- ── categories / tags (public read; editor write) ───────────────────────────
create policy categories_public_read on public.categories
  for select using (true);
create policy categories_editor_all on public.categories
  for all using (public.is_editor()) with check (public.is_editor());
create policy tags_public_read on public.tags
  for select using (true);
create policy tags_editor_all on public.tags
  for all using (public.is_editor()) with check (public.is_editor());

-- ── articles (anon read published & not-future; editor full CRUD) ───────────
create policy articles_public_read on public.articles
  for select using (
    status = 'published' and published_at is not null and published_at <= now()
  );
create policy articles_editor_all on public.articles
  for all using (public.is_editor()) with check (public.is_editor());

-- article_tags readable when its article is publicly readable; editor write
create policy article_tags_public_read on public.article_tags
  for select using (
    exists (
      select 1 from public.articles a
      where a.id = article_id
        and a.status = 'published'
        and a.published_at <= now()
    )
  );
create policy article_tags_editor_all on public.article_tags
  for all using (public.is_editor()) with check (public.is_editor());

-- ── activity_log (insert by authenticated + system; select admin; immutable) ─
create policy activity_insert_authed on public.activity_log
  for insert to authenticated with check (true);
create policy activity_admin_select on public.activity_log
  for select using (public.is_admin());
-- No UPDATE/DELETE policy => rows are immutable to clients. record_activity()
-- and prune_heartbeats() are SECURITY DEFINER so they still insert/prune.

-- ── contact_submissions (anon INSERT via form; admin SELECT/UPDATE) ─────────
create policy contact_anon_insert on public.contact_submissions
  for insert to anon, authenticated with check (true);
create policy contact_admin_select on public.contact_submissions
  for select using (public.is_admin());
create policy contact_admin_update on public.contact_submissions
  for update using (public.is_admin()) with check (public.is_admin());
