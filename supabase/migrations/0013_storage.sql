-- 0013_storage.sql
-- Storage buckets + object policies. The bucket `public` flag governs
-- unauthenticated CDN GETs; storage.objects policies govern the authenticated
-- API (uploads, deletes, private reads).

insert into storage.buckets (id, name, public) values
  ('media',   'media',   true),
  ('covers',  'covers',  true),
  ('avatars', 'avatars', true),
  ('docs',    'docs',    false)
on conflict (id) do nothing;

-- Public buckets: anyone reads; editors write/modify/delete.
create policy "public read media buckets" on storage.objects
  for select using (bucket_id in ('media','covers','avatars'));

create policy "editor insert media buckets" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('media','covers','avatars') and public.is_editor());

create policy "editor update media buckets" on storage.objects
  for update to authenticated
  using (bucket_id in ('media','covers','avatars') and public.is_editor());

create policy "editor delete media buckets" on storage.objects
  for delete to authenticated
  using (bucket_id in ('media','covers','avatars') and public.is_editor());

-- Private docs bucket: admin only (read via signed URLs in the app).
create policy "admin all docs bucket" on storage.objects
  for all to authenticated
  using (bucket_id = 'docs' and public.is_admin())
  with check (bucket_id = 'docs' and public.is_admin());
