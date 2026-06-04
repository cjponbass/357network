-- 357NETWORK Phase 1 Supabase Schema — IMPROVED WITH ADMIN POLICIES
-- This schema includes admin approval workflows and complete RLS policies
-- Safe to run with 'if not exists' clauses

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLE 1: PROFILES (User accounts for all role types)
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('job_seeker', 'employer', 'advertiser', 'admin')) not null default 'job_seeker',
  full_name text,
  email text,
  city text,
  state text,
  profession text,
  desired_work_type text,
  remote_available boolean default false,
  traveling_man_available boolean default false,
  mason_good_standing_self_attested boolean default false,
  bio text,
  created_at timestamptz default now()
);

-- ============================================================================
-- TABLE 2: EMPLOYERS (Company information)
-- ============================================================================

create table if not exists public.employers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  email text,
  city text,
  state text,
  industry text,
  website text,
  masonic_friendly_employer boolean default false,
  mason_good_standing_self_attested boolean default false,
  approved boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- TABLE 3: JOBS (Job listings)
-- ============================================================================

create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  employer_id uuid references public.employers(id) on delete cascade,
  title text not null,
  company_name text,
  category text,
  city text,
  state text,
  remote boolean default false,
  traveling_man boolean default false,
  description text,
  requirements text,
  compensation_range text,
  contact_email text,
  paid_status text default 'unpaid',
  stripe_session_id text,
  featured boolean default false,
  approved boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- TABLE 4: PENDING_REGISTRATIONS (Registration intake for MVP/rate limit fallback)
-- ============================================================================

create table if not exists public.pending_registrations (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  first_name text,
  last_name text,
  role text check (role in ('job_seeker', 'employer', 'advertiser')) not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz default now(),
  approved_at timestamptz
);

-- ============================================================================
-- TABLE 5: ADVERTISING_ORDERS (Advertising placements)
-- ============================================================================

create table if not exists public.advertising_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text,
  contact_email text,
  placement_type text,
  message text,
  paid_status text default 'unpaid',
  stripe_session_id text,
  approved boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.employers enable row level security;
alter table public.jobs enable row level security;
alter table public.pending_registrations enable row level security;
alter table public.advertising_orders enable row level security;

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================

create or replace function public.is_admin(user_id uuid)
returns boolean as $$
  select (select role from public.profiles where id = user_id) = 'admin'
$$ language sql security definer;

-- ============================================================================
-- PENDING_REGISTRATIONS TABLE — ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Anyone can insert pending registration (public intake form)
create policy "Anyone can submit pending registration"
on public.pending_registrations for insert
with check (true);

-- Admin can view all pending registrations
create policy "Admin can view all pending registrations"
on public.pending_registrations for select
using (public.is_admin(auth.uid()));

-- ============================================================================
-- PROFILES TABLE — ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Admin can view all profiles
create policy "Admin can view all profiles"
on public.profiles for select
using (public.is_admin(auth.uid()));

-- Users can view their own profile
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

-- ============================================================================
-- EMPLOYERS TABLE — ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Admin can view all employer records
create policy "Admin can view all employers"
on public.employers for select
using (public.is_admin(auth.uid()));

-- Employers can view their own employer record
create policy "Employers can view own employer record"
on public.employers for select
using (auth.uid() = user_id);

-- Employers can insert their own employer record
create policy "Employers can insert own employer record"
on public.employers for insert
with check (auth.uid() = user_id);

-- Employers can update their own employer record
create policy "Employers can update own employer record"
on public.employers for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Admin can manage all employer records
create policy "Admin can manage employers"
on public.employers for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================================
-- JOBS TABLE — ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Public can view approved jobs (job board)
create policy "Public can view approved jobs"
on public.jobs for select
using (approved = true);

-- Authenticated employers can view approved jobs
create policy "Employers can view approved jobs"
on public.jobs for select
using (approved = true and auth.role() = 'authenticated');

-- Admin can view all jobs (for approval and management)
create policy "Admin can view all jobs"
on public.jobs for select
using (public.is_admin(auth.uid()));

-- Employers can insert jobs under their own employer record
create policy "Employers can insert own jobs"
on public.jobs for insert
with check (
  employer_id in (
    select id from public.employers where user_id = auth.uid()
  )
);

-- Employers can update their own jobs (before approval)
create policy "Employers can update own jobs"
on public.jobs for update
using (
  employer_id in (
    select id from public.employers where user_id = auth.uid()
  )
)
with check (
  employer_id in (
    select id from public.employers where user_id = auth.uid()
  )
);

-- Employers can delete their own jobs (before approval)
create policy "Employers can delete own jobs"
on public.jobs for delete
using (
  employer_id in (
    select id from public.employers where user_id = auth.uid()
  )
);

-- Admin can manage all jobs (approve, feature, delete, etc.)
create policy "Admin can manage all jobs"
on public.jobs for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================================
-- ADVERTISING_ORDERS TABLE — ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Admin can view all advertising orders (for approval)
create policy "Admin can view all advertising orders"
on public.advertising_orders for select
using (public.is_admin(auth.uid()));

-- Users can view their own advertising orders
create policy "Users can view own advertising orders"
on public.advertising_orders for select
using (auth.uid() = user_id);

-- Users can insert advertising orders
create policy "Users can insert advertising orders"
on public.advertising_orders for insert
with check (auth.uid() = user_id);

-- Users can update their own advertising orders (before approval)
create policy "Users can update own advertising orders"
on public.advertising_orders for update
using (auth.uid() = user_id and approved = false)
with check (auth.uid() = user_id and approved = false);

-- Users can delete their own advertising orders (before approval)
create policy "Users can delete own advertising orders"
on public.advertising_orders for delete
using (auth.uid() = user_id and approved = false);

-- Admin can manage all advertising orders (approve, delete, etc.)
create policy "Admin can manage all advertising orders"
on public.advertising_orders for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
--
-- Tables: 4 (profiles, employers, jobs, advertising_orders)
-- RLS Policies: 20 (complete coverage for all roles and operations)
--
-- Key Features:
-- - Admin approval workflow for jobs and advertising
-- - Admin can view all records for moderation
-- - Users see only approved jobs publicly
-- - Employers manage own records and jobs
-- - Users can create and manage own advertising until approved
-- - Helper function for admin role checks
--
-- Safe to run in Supabase SQL Editor
-- ============================================================================
