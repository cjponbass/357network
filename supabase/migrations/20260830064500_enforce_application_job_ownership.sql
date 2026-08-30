-- Ensure authenticated users can only create or retarget applications to jobs they own.
-- The UI already scopes saved jobs by created_by; these policies enforce the same invariant at the database boundary.

DROP POLICY IF EXISTS "own applications insert" ON public.applications;
CREATE POLICY "own applications insert"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_id
      AND j.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "own applications update" ON public.applications;
CREATE POLICY "own applications update"
ON public.applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_id
      AND j.created_by = auth.uid()
  )
);
