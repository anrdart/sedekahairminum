-- 0004_auth_helpers.sql
-- Role helper functions used by RLS policies. All are SECURITY DEFINER with a
-- fixed search_path so a SELECT on profiles inside a profiles policy does not
-- recurse through RLS (the function reads with the definer's privileges).

create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_user_role() in ('owner','admin'), false);
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_user_role() in ('owner','admin','editor'), false);
$$;
