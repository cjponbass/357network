-- shared helpers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contract','internship');
CREATE TYPE public.work_arrangement AS ENUM ('onsite','hybrid','remote');
CREATE TYPE public.application_status AS ENUM ('draft','submitted','in_review','interview','offer','rejected','withdrawn');
CREATE TYPE public.document_kind AS ENUM ('resume','cover_letter','transcript','portfolio','other');

CREATE TABLE public.candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, full_name text NOT NULL DEFAULT '',
  headline text, email text, phone text, location text, website_url text, linkedin_url text, github_url text,
  years_experience integer CHECK (years_experience IS NULL OR years_experience >= 0), skills text[] NOT NULL DEFAULT '{}',
  work_authorization text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_profiles TO authenticated;
GRANT ALL ON public.candidate_profiles TO service_role;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.candidate_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.candidate_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.candidate_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.candidate_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_candidate_profiles_updated BEFORE UPDATE ON public.candidate_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, desired_titles text[] NOT NULL DEFAULT '{}',
  desired_locations text[] NOT NULL DEFAULT '{}', work_arrangements public.work_arrangement[] NOT NULL DEFAULT '{}',
  min_salary integer CHECK (min_salary IS NULL OR min_salary >= 0), currency text DEFAULT 'USD',
  email_notifications boolean NOT NULL DEFAULT true, weekly_digest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs select" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs insert" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs delete" ON public.user_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_preferences_updated BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_by uuid NOT NULL, title text NOT NULL, company text NOT NULL,
  location text, work_arrangement public.work_arrangement, employment_type public.employment_type,
  salary_min integer CHECK (salary_min IS NULL OR salary_min >= 0), salary_max integer CHECK (salary_max IS NULL OR salary_max >= 0),
  currency text DEFAULT 'USD', source_url text, ats_name text, description text, posted_at date,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_created_by ON public.jobs (created_by);
CREATE UNIQUE INDEX idx_jobs_created_by_source_url ON public.jobs (created_by, source_url) WHERE source_url IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs readable by authenticated" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "jobs insert own" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "jobs update own" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "jobs delete own" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind public.document_kind NOT NULL DEFAULT 'other',
  name text NOT NULL, storage_path text, mime_type text, size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  is_default boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_user_id ON public.documents (user_id);
CREATE UNIQUE INDEX idx_documents_storage_path ON public.documents (storage_path) WHERE storage_path IS NOT NULL;
CREATE UNIQUE INDEX idx_documents_default_per_kind ON public.documents (user_id, kind) WHERE is_default;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents select" ON public.documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own documents insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own documents update" ON public.documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own documents delete" ON public.documents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.saved_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, question text NOT NULL, answer text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_answers_user_id ON public.saved_answers (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_answers TO authenticated;
GRANT ALL ON public.saved_answers TO service_role;
ALTER TABLE public.saved_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answers select" ON public.saved_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own answers insert" ON public.saved_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own answers update" ON public.saved_answers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own answers delete" ON public.saved_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_saved_answers_updated BEFORE UPDATE ON public.saved_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'draft', submitted_at timestamptz,
  resume_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL, cover_letter_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, job_id)
);
CREATE INDEX idx_applications_user_id ON public.applications (user_id);
CREATE INDEX idx_applications_status ON public.applications (user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own applications select" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own applications insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own applications update" ON public.applications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own applications delete" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.owns_application(_application_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.applications a WHERE a.id = _application_id AND a.user_id = auth.uid());
$$;

CREATE TABLE public.application_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_status public.application_status, to_status public.application_status NOT NULL, note text,
  occurred_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_events_application ON public.application_status_events (application_id, occurred_at DESC);
GRANT SELECT, INSERT ON public.application_status_events TO authenticated;
GRANT ALL ON public.application_status_events TO service_role;
ALTER TABLE public.application_status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events select" ON public.application_status_events FOR SELECT TO authenticated USING (public.owns_application(application_id));
CREATE POLICY "own events insert" ON public.application_status_events FOR INSERT TO authenticated WITH CHECK (public.owns_application(application_id));

CREATE TABLE public.submission_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  submitted_at timestamptz, ats_name text, application_url text,
  resume_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL, cover_letter_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb, confirmation_text text, screenshot_path text,
  verified boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.submission_receipts TO authenticated;
GRANT ALL ON public.submission_receipts TO service_role;
ALTER TABLE public.submission_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own receipts select" ON public.submission_receipts FOR SELECT TO authenticated USING (public.owns_application(application_id));
CREATE TRIGGER trg_receipts_updated BEFORE UPDATE ON public.submission_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.candidate_profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();