begin;

create table if not exists public.automation_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  manual_review boolean not null default true,
  ai_generated_resume boolean not null default true,
  ai_generated_cover_letter boolean not null default true,
  auto_retry_safe_failures boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.automation_preferences enable row level security;
drop policy if exists "automation_preferences_own" on public.automation_preferences;
create policy "automation_preferences_own" on public.automation_preferences
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.application_review_queue (
  application_id uuid primary key references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  review_type text not null default 'documents_and_questions' check (review_type in ('documents','questions','documents_and_questions')),
  status text not null default 'pending' check (status in ('pending','approved','cancelled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.application_review_queue enable row level security;
drop policy if exists "review_queue_own" on public.application_review_queue;
create policy "review_queue_own" on public.application_review_queue
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.application_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  sender text,
  recipient text,
  subject text,
  body_text text not null default '',
  provider_message_id text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, provider_message_id)
);
alter table public.application_messages enable row level security;
drop policy if exists "application_messages_own_select" on public.application_messages;
create policy "application_messages_own_select" on public.application_messages
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.application_messages from authenticated, anon;

create table if not exists public.application_portal_credentials (
  application_id uuid primary key references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  portal_url text,
  username text,
  password_ciphertext text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.application_portal_credentials enable row level security;
revoke all on public.application_portal_credentials from authenticated, anon;

create index if not exists application_messages_application_idx on public.application_messages(application_id, received_at desc);
create index if not exists application_review_queue_user_status_idx on public.application_review_queue(user_id, status, created_at desc);

commit;
