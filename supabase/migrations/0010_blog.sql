-- 0010_blog.sql
-- Blog: categories, tags, articles (+ M2M article_tags). Articles store both the
-- TipTap JSON (content) and the sanitized rendered HTML (content_html) so public
-- pages render fast without a client editor.

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_tags_updated before update on public.tags
  for each row execute function public.set_updated_at();

create table public.articles (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  content          jsonb,          -- TipTap JSON document
  content_html     text,          -- sanitized rendered HTML
  cover_image      text,
  status           text not null default 'draft'
                   check (status in ('draft','published','scheduled','archived')),
  published_at     timestamptz,
  author_id        uuid references auth.users(id) on delete set null,
  category_id      uuid references public.categories(id) on delete set null,
  meta_title       text,
  meta_description text,
  og_image         text,
  reading_time     integer,
  view_count       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint articles_publish_chk check (
    (status in ('published','scheduled') and published_at is not null)
    or status in ('draft','archived')
  )
);
create unique index articles_slug_idx     on public.articles(slug);
create index articles_status_pub_idx      on public.articles(status, published_at desc);
create index articles_author_idx          on public.articles(author_id);
create index articles_category_idx        on public.articles(category_id);

create trigger trg_articles_updated before update on public.articles
  for each row execute function public.set_updated_at();
create trigger trg_articles_audit
  after insert or update or delete on public.articles
  for each row execute function public.audit_trigger();

create table public.article_tags (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);
create index article_tags_tag_idx on public.article_tags(tag_id);

-- Bump a published article's view counter without granting a broad UPDATE policy.
create or replace function public.increment_view(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.articles
     set view_count = view_count + 1
   where slug = p_slug
     and status = 'published'
     and published_at <= now();
$$;

-- Flip scheduled posts to published once their time arrives. Schedule with
-- pg_cron (or rely on the public read policy which already hides future posts):
-- select cron.schedule('publish-scheduled','*/5 * * * *',
--   $$update public.articles set status='published'
--      where status='scheduled' and published_at <= now()$$);
