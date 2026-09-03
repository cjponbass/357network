begin;

create table if not exists public.skipped_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  source text not null,
  title text not null,
  company text not null,
  location text,
  description text,
  source_url text not null,
  posted_at timestamptz,
  salary_min numeric,
  salary_max numeric,
  currency text,
  remote boolean,
  tags text[] not null default '{}',
  skipped_at timestamptz not null default now(),
  unique(user_id, source_url)
);
alter table public.skipped_jobs enable row level security;
drop policy if exists "skipped_jobs_own" on public.skipped_jobs;
create policy "skipped_jobs_own" on public.skipped_jobs for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create index if not exists skipped_jobs_user_time_idx on public.skipped_jobs(user_id, skipped_at desc);

commit;
