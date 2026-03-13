-- Suggestions email en attente d'approbation (contact, note).
-- L'agent propose au lieu de créer directement → l'utilisateur valide via la cloche.

CREATE TABLE pending_email_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('contact', 'note')),
  data JSONB NOT NULL,
  from_email TEXT,
  subject TEXT,
  sender_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pending_email_suggestions_created_at_idx ON pending_email_suggestions(created_at DESC);

ALTER TABLE pending_email_suggestions ENABLE ROW LEVEL SECURITY;

-- Lecture et suppression pour tous les users authentifiés (agence)
CREATE POLICY "pending_email_suggestions: agency select"
  ON pending_email_suggestions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "pending_email_suggestions: agency delete"
  ON pending_email_suggestions FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Insert via service role (webhook) uniquement — pas de policy INSERT pour authenticated

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'pending_email_suggestions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pending_email_suggestions;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
