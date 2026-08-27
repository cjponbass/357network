-- Saved jobs are private applicant workspace data.
-- Replace the original authenticated-wide SELECT policy with owner-only access.
DROP POLICY IF EXISTS "jobs readable by authenticated" ON public.jobs;
DROP POLICY IF EXISTS "jobs select own" ON public.jobs;

CREATE POLICY "jobs select own"
ON public.jobs
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);
