INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-documents', 'candidate-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "candidate docs select own" ON storage.objects;
DROP POLICY IF EXISTS "candidate docs insert own" ON storage.objects;
DROP POLICY IF EXISTS "candidate docs update own" ON storage.objects;
DROP POLICY IF EXISTS "candidate docs delete own" ON storage.objects;

CREATE POLICY "candidate docs select own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "candidate docs insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "candidate docs update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "candidate docs delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
