-- Migration 012 — RPC sidebar inclut logo_path pour le logo client
DROP FUNCTION IF EXISTS get_clients_sidebar();
CREATE OR REPLACE FUNCTION get_clients_sidebar()
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  category text,
  primary_contact_name text,
  logo_path text
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
    ) AS primary_contact_name,
    c.logo_path
  FROM clients c
  WHERE c.category IN ('client', 'prospect', 'archived')
  ORDER BY c.created_at;
$$;
