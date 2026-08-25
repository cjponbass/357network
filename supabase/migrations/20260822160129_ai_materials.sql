CREATE TABLE public.job_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  fit_score integer NOT NULL DEFAULT 0 CHECK (fit_score >= 0 AND fit_score <= 100),
  summary text, strengths text[] NOT NULL DEFAULT '{}'::text[], gaps text[] NOT NULL DEFAULT '{}'::text[],
  keyword_matches text[] NOT NULL DEFAULT '{}'::text[], missing_keywords text[] NOT NULL DEFAULT '{}'::text[],
  positioning text, model text, prompt_version text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, job_id)
);
CREATE INDEX idx_job_analyses_user ON public.job_analyses (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_analyses TO authenticated;
GRANT ALL ON public.job_analyses TO service_role;
ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses select" ON public.job_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own analyses insert" ON public.job_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own analyses update" ON public.job_analyses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own analyses delete" ON public.job_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_job_analyses_updated BEFORE UPDATE ON public.job_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.application_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  tailored_resume_text text NOT NULL DEFAULT '', cover_letter_text text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
  resume_model text, cover_letter_model text, prompt_version text, last_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, job_id)
);
CREATE INDEX idx_application_materials_user ON public.application_materials (user_id, created_at DESC);
CREATE INDEX idx_application_materials_application ON public.application_materials (application_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_materials TO authenticated;
GRANT ALL ON public.application_materials TO service_role;
ALTER TABLE public.application_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own materials select" ON public.application_materials FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own materials insert" ON public.application_materials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own materials update" ON public.application_materials FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own materials delete" ON public.application_materials FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_application_materials_updated BEFORE UPDATE ON public.application_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();