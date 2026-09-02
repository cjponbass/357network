-- Saved jobs are private candidate workspace data.
DROP POLICY IF EXISTS "jobs readable by authenticated" ON public.jobs;
DROP POLICY IF EXISTS "own jobs select" ON public.jobs;

CREATE POLICY "own jobs select"
ON public.jobs
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);
