-- Journal d'activité par client — suivi des dernières actions (email, chat, manuel)
-- Chaque collaborateur voit ce qui a été fait récemment sur le client.
CREATE TABLE client_activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,  -- email_summary, contact_added, note_added, link_added, project_created, product_added, etc.
  source      TEXT NOT NULL,  -- email | chat | manual
  summary     TEXT NOT NULL,  -- description lisible
  metadata    JSONB,          -- données additionnelles (nom créé, sujet mail, etc.)
  owner_id    UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_activity_logs_client_id_idx ON client_activity_logs(client_id);
CREATE INDEX IF NOT EXISTS client_activity_logs_created_at_idx ON client_activity_logs(created_at DESC);

ALTER TABLE client_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_activity_logs: owner select" ON client_activity_logs
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "client_activity_logs: owner insert" ON client_activity_logs
  FOR INSERT WITH CHECK (owner_id = auth.uid());
