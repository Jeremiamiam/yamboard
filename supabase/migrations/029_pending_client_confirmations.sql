-- Confirmation client : l'agent demande "X = Y ?" quand il a un doute.
CREATE TABLE pending_client_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_name TEXT NOT NULL,
  possible_match_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  possible_match_name TEXT,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pending_client_confirmations_created_at_idx ON pending_client_confirmations(created_at DESC);

ALTER TABLE pending_client_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pending_client_confirmations: agency select"
  ON pending_client_confirmations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "pending_client_confirmations: agency delete"
  ON pending_client_confirmations FOR DELETE
  USING (auth.uid() IS NOT NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'pending_client_confirmations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pending_client_confirmations;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
