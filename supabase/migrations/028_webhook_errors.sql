-- Erreurs webhook (Resend, agent) — notifiées dans la cloche.
CREATE TABLE webhook_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'inbound_email',
  error_message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX webhook_errors_created_at_idx ON webhook_errors(created_at DESC);

ALTER TABLE webhook_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_errors: agency select"
  ON webhook_errors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "webhook_errors: agency delete"
  ON webhook_errors FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Insert via service role (webhook) uniquement

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'webhook_errors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE webhook_errors;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
