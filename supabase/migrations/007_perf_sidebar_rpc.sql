-- RPC sidebar: 1 requête pour tous les clients avec contact principal (évite N+1 PostgREST)
-- RLS s'applique via SECURITY INVOKER (défaut)
CREATE OR REPLACE FUNCTION get_clients_sidebar()
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  category text,
  primary_contact_name text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.color,
    c.category,
    (
      SELECT co.name
      FROM contacts co
      WHERE co.client_id = c.id
      ORDER BY co.is_primary DESC, co.created_at
      LIMIT 1
    ) AS primary_contact_name
  FROM clients c
  WHERE c.category IN ('client', 'prospect', 'archived')
  ORDER BY c.created_at;
$$;

-- Index composite pour accélérer le lookup contact principal
CREATE INDEX IF NOT EXISTS contacts_client_primary_idx
  ON contacts(client_id, is_primary DESC, created_at);
