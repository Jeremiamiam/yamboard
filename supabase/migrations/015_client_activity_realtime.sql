-- Realtime: toasts quand un log d'activité (source=email) est créé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'client_activity_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE client_activity_logs;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
