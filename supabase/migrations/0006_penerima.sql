-- 0006_penerima.sql
-- Recipients. Merges the table data (penerima.astro) with the map coordinates
-- (IndonesiaMap.tsx) into one CMS-driven source so both the /penerima table and
-- the map read from here. `status` is promoted from a hardcoded label to a real
-- column.

create table public.penerima (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null check (type in ('Pesantren','Yayasan')),
  city         text not null,                 -- kecamatan in the UI
  province     text not null default 'Gunung Kidul',
  alamat       text,                          -- full address (map tooltip)
  galon        integer not null default 0 check (galon >= 0),
  lat          double precision,
  lng          double precision,
  status       text not null default 'tersalurkan'
               check (status in ('tersalurkan','proses','pengajuan','arsip')),
  is_published boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index penerima_type_idx      on public.penerima(type);
create index penerima_published_idx on public.penerima(is_published);
create index penerima_sort_idx      on public.penerima(sort_order);

create trigger trg_penerima_updated
  before update on public.penerima
  for each row execute function public.set_updated_at();

create trigger trg_penerima_audit
  after insert or update or delete on public.penerima
  for each row execute function public.audit_trigger();
