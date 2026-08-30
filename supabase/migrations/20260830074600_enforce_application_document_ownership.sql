-- Prevent applications from referencing resume or cover-letter documents owned by another account.
-- Job ownership is already enforced; keep that invariant while adding document ownership checks.

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
  AND (
    resume_document_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = resume_document_id
        AND d.user_id = auth.uid()
    )
  )
  AND (
    cover_letter_document_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = cover_letter_document_id
        AND d.user_id = auth.uid()
    )
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
  AND (
    resume_document_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = resume_document_id
        AND d.user_id = auth.uid()
    )
  )
  AND (
    cover_letter_document_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = cover_letter_document_id
        AND d.user_id = auth.uid()
    )
  )
);