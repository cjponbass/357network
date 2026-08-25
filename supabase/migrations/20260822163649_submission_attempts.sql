DROP POLICY IF EXISTS "jobs readable by authenticated" ON public.jobs;
CREATE POLICY "jobs select own" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "own events update" ON public.application_status_events;
DROP POLICY IF EXISTS "own events delete" ON public.application_status_events;
REVOKE UPDATE, DELETE ON public.application_status_events FROM authenticated;
GRANT ALL ON public.application_status_events TO service_role;
DROP POLICY IF EXISTS "own receipts insert" ON public.submission_receipts;
DROP POLICY IF EXISTS "own receipts update" ON public.submission_receipts;
DROP POLICY IF EXISTS "own receipts delete" ON public.submission_receipts;
REVOKE INSERT, UPDATE, DELETE ON public.submission_receipts FROM authenticated;
GRANT SELECT ON public.submission_receipts TO authenticated;
GRANT ALL ON public.submission_receipts TO service_role;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_id_created_by_key UNIQUE (id, created_by);
ALTER TABLE public.applications ADD CONSTRAINT applications_id_user_id_key UNIQUE (id, user_id);
DELETE FROM public.job_analyses a WHERE NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id=a.job_id AND j.created_by=a.user_id);
DELETE FROM public.application_materials m WHERE NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id=m.job_id AND j.created_by=m.user_id);
UPDATE public.application_materials m SET application_id=NULL WHERE m.application_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.id=m.application_id AND a.user_id=m.user_id);
DELETE FROM public.applications a WHERE NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id=a.job_id AND j.created_by=a.user_id);
ALTER TABLE public.job_analyses ADD CONSTRAINT job_analyses_job_owner_fkey FOREIGN KEY (job_id,user_id) REFERENCES public.jobs (id,created_by) ON DELETE CASCADE;
ALTER TABLE public.application_materials ADD CONSTRAINT application_materials_job_owner_fkey FOREIGN KEY (job_id,user_id) REFERENCES public.jobs (id,created_by) ON DELETE CASCADE;
ALTER TABLE public.application_materials ADD CONSTRAINT application_materials_application_owner_fkey FOREIGN KEY (application_id,user_id) REFERENCES public.applications (id,user_id) ON DELETE SET NULL;
ALTER TABLE public.applications ADD CONSTRAINT applications_job_owner_fkey FOREIGN KEY (job_id,user_id) REFERENCES public.jobs (id,created_by) ON DELETE CASCADE;
CREATE TYPE public.ats_provider AS ENUM ('greenhouse','lever','ashby','workday','unknown');
CREATE TYPE public.submission_state AS ENUM ('draft','queued','running','needs_user_input','succeeded','failed','cancelled');
CREATE TABLE public.submission_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL, ats_provider public.ats_provider NOT NULL DEFAULT 'unknown',
  state public.submission_state NOT NULL DEFAULT 'draft', dry_run boolean NOT NULL DEFAULT true,
  target_url text, automation_provider text, started_at timestamptz, completed_at timestamptz,
  error_category text, error_message text, unresolved_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  available_facts jsonb NOT NULL DEFAULT '{}'::jsonb, evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  receipt_id uuid REFERENCES public.submission_receipts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submission_attempts_application_owner_fkey FOREIGN KEY (application_id,user_id) REFERENCES public.applications (id,user_id) ON DELETE CASCADE
);
CREATE INDEX idx_submission_attempts_user ON public.submission_attempts (user_id,created_at DESC);
CREATE INDEX idx_submission_attempts_application ON public.submission_attempts (application_id,created_at DESC);
GRANT SELECT ON public.submission_attempts TO authenticated;
GRANT ALL ON public.submission_attempts TO service_role;
ALTER TABLE public.submission_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts select" ON public.submission_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_submission_attempts_updated BEFORE UPDATE ON public.submission_attempts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();