-- 0007_marketing.sql
-- The marketing content tables that feed the static homepage / tentang / kontak.
-- All share: id, sort_order, is_published, created_at, updated_at + an
-- updated_at trigger. Reserved words avoided: desc -> descr, values -> values_list.

-- testimonials (Testimonials.astro)
create table public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  body         text not null,
  name         text not null,
  role         text not null default '',
  photo        text,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.set_updated_at();

-- faqs (FAQ.astro)
create table public.faqs (
  id           uuid primary key default gen_random_uuid(),
  q            text not null,
  a            text not null,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_faqs_updated before update on public.faqs
  for each row execute function public.set_updated_at();

-- stats / KPI (StatStrip.astro = grp 'home', penerima.astro = grp 'penerima')
create table public.stats (
  id           uuid primary key default gen_random_uuid(),
  grp          text not null check (grp in ('home','penerima')),
  num          integer not null,
  suffix       text not null default '',
  label        text not null,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index stats_grp_idx on public.stats(grp, sort_order);
create trigger trg_stats_updated before update on public.stats
  for each row execute function public.set_updated_at();

-- features (Features.astro)
create table public.features (
  id           uuid primary key default gen_random_uuid(),
  n            text not null,
  title        text not null,
  descr        text not null,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_features_updated before update on public.features
  for each row execute function public.set_updated_at();

-- program_slides (Features.astro carousel)
create table public.program_slides (
  id           uuid primary key default gen_random_uuid(),
  src          text not null,
  cap          text,
  meta         text,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_program_slides_updated before update on public.program_slides
  for each row execute function public.set_updated_at();

-- gallery (Gallery.astro)
create table public.gallery (
  id           uuid primary key default gen_random_uuid(),
  bg           text not null,
  title        text not null,
  meta         text,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_gallery_updated before update on public.gallery
  for each row execute function public.set_updated_at();

-- hero_slides (Hero.astro)
create table public.hero_slides (
  id           uuid primary key default gen_random_uuid(),
  src          text not null,
  cap          text,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_hero_slides_updated before update on public.hero_slides
  for each row execute function public.set_updated_at();

-- values_list (tentang.astro "values")
create table public.values_list (
  id           uuid primary key default gen_random_uuid(),
  n            text not null,
  title        text not null,
  descr        text not null,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_values_list_updated before update on public.values_list
  for each row execute function public.set_updated_at();

-- team (tentang.astro)
create table public.team (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default '',
  role         text not null,
  avatar       text,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_team_updated before update on public.team
  for each row execute function public.set_updated_at();

-- misi (tentang.astro — array of strings becomes rows)
create table public.misi (
  id           uuid primary key default gen_random_uuid(),
  body         text not null,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_misi_updated before update on public.misi
  for each row execute function public.set_updated_at();

-- rekening / bank accounts (kontak.astro)
create table public.rekening (
  id             uuid primary key default gen_random_uuid(),
  bank           text not null,
  no             text not null,
  label          text not null,
  account_holder text not null default 'Yayasan Gerakan Wakaf Sumur',
  sort_order     integer not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_rekening_updated before update on public.rekening
  for each row execute function public.set_updated_at();
