-- 0001_extensions.sql
-- Base extensions. pgcrypto provides gen_random_uuid(); citext for
-- case-insensitive text where useful. pg_cron is enabled separately in the
-- Supabase dashboard (Database → Extensions) and used in 0005/0010.

create extension if not exists pgcrypto;
create extension if not exists citext;
