-- 0005_activity_log.sql
-- Audit trail + keep-alive heartbeat. Every dashboard mutation records a row
-- here; a daily heartbeat row doubles as the Supabase free-tier keep-alive
-- write (an INSERT counts as activity and resets the inactivity timer).

create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null, -- null = system
  action      text not null check (action in
                ('create','update','delete','login','logout','publish',
                 'unpublish','site_rebuild','heartbeat')),
  entity_type text,
  entity_id   uuid,
  summary     text,
  metadata    jsonb not null default '{}'::jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index activity_created_at_idx on public.activity_log (created_at desc);
create index activity_action_idx     on public.activity_log (action);
create index activity_entity_idx     on public.activity_log (entity_type, entity_id);
create index activity_actor_idx      on public.activity_log (actor_id);
create index activity_heartbeat_idx  on public.activity_log (created_at) where action = 'heartbeat';

-- Record an activity row as the current user (or system when uid is null).
create or replace function public.record_activity(
  p_action      text,
  p_entity_type text default null,
  p_entity_id   uuid default null,
  p_summary     text default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.activity_log (actor_id, action, entity_type, entity_id, summary, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_summary, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

-- Generic audit trigger reusable across tables (attached in later migrations).
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_id uuid;
begin
  v_action := case lower(tg_op)
                when 'insert' then 'create'
                when 'update' then 'update'
                else 'delete'
              end;
  v_id := coalesce(new.id, old.id);
  perform public.record_activity(
    v_action,
    tg_table_name,
    v_id,
    tg_table_name || ' ' || v_action,
    '{}'::jsonb
  );
  return coalesce(new, old);
end;
$$;

-- Keep-alive ping. Callable via RPC (from /api/heartbeat or pg_cron).
create or replace function public.heartbeat()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.record_activity('heartbeat', 'system', null, 'keep-alive ping',
    jsonb_build_object('source', 'cron'));
end;
$$;

-- Bound activity_log growth by pruning old heartbeat rows (real audit rows kept).
create or replace function public.prune_heartbeats(p_days int default 7)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.activity_log
   where action = 'heartbeat'
     and created_at < now() - make_interval(days => p_days);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Latest heartbeat timestamp — read by the dashboard keep-alive widget.
create or replace function public.last_heartbeat()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select max(created_at) from public.activity_log where action = 'heartbeat';
$$;

-- Optional pg_cron schedule (enable pg_cron in the dashboard first).
-- Off-the-:00 minutes on purpose. Uncomment to activate:
-- select cron.schedule('heartbeat', '7 3 * * *', $$select public.heartbeat()$$);
-- select cron.schedule('prune-heartbeats', '42 4 * * *', $$select public.prune_heartbeats(7)$$);
