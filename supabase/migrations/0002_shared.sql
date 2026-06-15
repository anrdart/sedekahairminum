-- 0002_shared.sql
-- Shared trigger function: keeps updated_at current on every UPDATE.
-- Enums are modelled as text + CHECK constraints throughout (ALTER TYPE on a
-- real enum is painful; CHECK constraints evolve with a simple migration).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
