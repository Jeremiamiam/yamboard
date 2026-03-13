-- Suppression de la notion de prospect : un client c'est un client.
-- 1. Migrer les prospects en clients
-- 2. Restreindre category à 'client' | 'archived'

UPDATE clients SET category = 'client' WHERE category = 'prospect';

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_category_check;
ALTER TABLE clients ADD CONSTRAINT clients_category_check
  CHECK (category IN ('client', 'archived'));

-- RPC sidebar : plus de prospect
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
  WHERE c.category IN ('client', 'archived')
  ORDER BY c.created_at;
$$;
