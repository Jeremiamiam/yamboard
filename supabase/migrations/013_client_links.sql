-- Liens externes par client (Figma, Dropbox, Drive, site, etc.)
CREATE TABLE client_links (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  owner_id    UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_links_client_id_idx ON client_links(client_id);
CREATE INDEX IF NOT EXISTS client_links_owner_id_idx ON client_links(owner_id);

ALTER TABLE client_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_links: owner select" ON client_links
  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "client_links: owner insert" ON client_links
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "client_links: owner update" ON client_links
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "client_links: owner delete" ON client_links
  FOR DELETE USING (owner_id = auth.uid());
