-- Index sur category pour éviter le full scan sur .in('category', [...])
CREATE INDEX IF NOT EXISTS clients_category_idx ON clients(category);

-- RPC: budget products pour un client en 1 requête (évite 2 round-trips sur page client)
-- RLS s'applique via SECURITY INVOKER (défaut)
CREATE OR REPLACE FUNCTION get_budget_products_for_client(p_client_id uuid)
RETURNS SETOF budget_products
LANGUAGE sql
STABLE
AS $$
  SELECT bp.*
  FROM budget_products bp
  JOIN projects p ON p.id = bp.project_id
  WHERE p.client_id = p_client_id
  ORDER BY bp.created_at;
$$;
