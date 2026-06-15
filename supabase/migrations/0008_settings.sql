-- 0008_settings.sql
-- Site-wide config as a key/value jsonb singleton-ish table. Read rarely,
-- written rarely, schema-fluid (new social network or toggle = no migration).
-- Keys used by the app: 'contact', 'social', 'feature_toggles'.

create table public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger trg_settings_updated
  before update on public.settings
  for each row execute function public.set_updated_at();
