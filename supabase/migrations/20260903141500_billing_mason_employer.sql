begin;

alter table public.candidate_profiles
  add column if not exists is_mason boolean not null default false,
  add column if not exists employer_discoverable boolean not null default false;

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('basic','pro','auto')),
  status text not null default 'incomplete' check (status in ('incomplete','trialing','active','past_due','canceled','unpaid','paused')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.subscriptions from authenticated, anon;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from authenticated, anon;

create table if not exists public.employer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null check (length(trim(company_name)) > 0),
  recruiter_name text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.employer_profiles enable row level security;
drop policy if exists "employer_profiles_own_select" on public.employer_profiles;
drop policy if exists "employer_profiles_own_insert" on public.employer_profiles;
drop policy if exists "employer_profiles_own_update" on public.employer_profiles;
create policy "employer_profiles_own_select" on public.employer_profiles for select to authenticated using (auth.uid() = user_id);
create policy "employer_profiles_own_insert" on public.employer_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "employer_profiles_own_update" on public.employer_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.employer_interest_requests (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (length(trim(message)) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employer_user_id, candidate_user_id, status)
);
alter table public.employer_interest_requests enable row level security;
drop policy if exists "interest_employer_select" on public.employer_interest_requests;
drop policy if exists "interest_candidate_select" on public.employer_interest_requests;
drop policy if exists "interest_employer_insert" on public.employer_interest_requests;
drop policy if exists "interest_candidate_update" on public.employer_interest_requests;
create policy "interest_employer_select" on public.employer_interest_requests for select to authenticated using (auth.uid() = employer_user_id);
create policy "interest_candidate_select" on public.employer_interest_requests for select to authenticated using (auth.uid() = candidate_user_id);
create policy "interest_employer_insert" on public.employer_interest_requests for insert to authenticated with check (
  auth.uid() = employer_user_id
  and exists (select 1 from public.employer_profiles e where e.user_id = auth.uid())
  and exists (select 1 from public.candidate_profiles c where c.user_id = candidate_user_id and c.employer_discoverable = true)
);
create policy "interest_candidate_update" on public.employer_interest_requests for update to authenticated using (auth.uid() = candidate_user_id) with check (auth.uid() = candidate_user_id);

create or replace function public.search_discoverable_candidates(masons_only boolean default false)
returns table (
  user_id uuid,
  full_name text,
  headline text,
  city text,
  region text,
  country text,
  career_summary text,
  experience_highlights text,
  education text,
  certifications text,
  languages text,
  skills text[],
  is_mason boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select c.user_id, c.full_name, c.headline, c.city, c.region, c.country,
         c.career_summary, c.experience_highlights, c.education, c.certifications,
         c.languages, c.skills, c.is_mason
  from public.candidate_profiles c
  where c.employer_discoverable = true
    and (not masons_only or c.is_mason = true)
    and exists (select 1 from public.employer_profiles e where e.user_id = auth.uid())
  order by c.full_name;
$$;
revoke all on function public.search_discoverable_candidates(boolean) from public, anon;
grant execute on function public.search_discoverable_candidates(boolean) to authenticated;

commit;
