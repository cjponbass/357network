-- Keep candidate document metadata usable even when writes bypass the UI.
UPDATE public.documents
SET name = 'Untitled document'
WHERE btrim(name) = '';

UPDATE public.documents
SET storage_path = NULL
WHERE storage_path IS NOT NULL AND btrim(storage_path) = '';

ALTER TABLE public.documents
  ADD CONSTRAINT documents_name_nonblank_check
  CHECK (btrim(name) <> '');

ALTER TABLE public.documents
  ADD CONSTRAINT documents_storage_path_nonblank_check
  CHECK (storage_path IS NULL OR btrim(storage_path) <> '');
