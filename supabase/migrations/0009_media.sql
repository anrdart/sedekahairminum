-- 0009_media.sql
-- Tracks files uploaded to Supabase Storage so the media library has a queryable
-- index (Storage itself has no rich metadata / alt text).

create table public.media (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null default 'media',
  path        text not null,
  filename    text not null,
  mime        text,
  size        bigint,
  width       integer,
  height      integer,
  alt         text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (bucket, path)
);

create index media_bucket_idx   on public.media(bucket);
create index media_uploader_idx on public.media(uploaded_by);
create index media_created_idx  on public.media(created_at desc);
