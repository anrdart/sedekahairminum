-- 0011_contact.sql
-- Contact form submissions, replacing the Google Apps Script → Sheets flow.
-- The honeypot value is stored (not just dropped) for spam forensics; the API
-- still rejects rows where it is filled.

create table public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null,
  phone      text not null,
  email      text,
  topik      text,
  pesan      text not null,
  honeypot   text,
  status     text not null default 'new' check (status in ('new','read','replied','spam')),
  ip         inet,
  user_agent text,
  created_at timestamptz not null default now()  -- server time; supersedes client 'tanggal'
);

create index contact_created_idx on public.contact_submissions(created_at desc);
create index contact_status_idx  on public.contact_submissions(status);
