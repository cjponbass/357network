-- Saved jobs are candidate-owned records. Keep direct database reads scoped to
-- the authenticated owner instead of exposing every candidate's saved jobs to
-- every signed-in account.
DROP POLICY IF EXISTS "jobs readable by authenticated" ON public.jobs;
DROP POLICY IF EXISTS "jobs select own" ON public.jobs;

CREATE POLICY "jobs select own"
ON public.jobs
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);
