-- extraction_status: null = N/A (note, lien), 'processing' = PDF en cours, 'done' = extrait, 'failed' = échec
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS extraction_status TEXT
  CHECK (extraction_status IS NULL OR extraction_status IN ('processing', 'done', 'failed'));

-- Realtime: notifier le client quand extraction_status change (ignore si déjà présent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE documents;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; -- publication peut ne pas exister en local
END $$;
