-- Indexes for RLS policy columns (required for performance at any scale)
-- owner_id indexes (used in every RLS policy evaluation)
CREATE INDEX IF NOT EXISTS clients_owner_id_idx        ON clients(owner_id);
CREATE INDEX IF NOT EXISTS contacts_owner_id_idx       ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS contacts_client_id_idx      ON contacts(client_id);
CREATE INDEX IF NOT EXISTS projects_owner_id_idx       ON projects(owner_id);
CREATE INDEX IF NOT EXISTS projects_client_id_idx      ON projects(client_id);
CREATE INDEX IF NOT EXISTS budget_products_owner_id_idx   ON budget_products(owner_id);
CREATE INDEX IF NOT EXISTS budget_products_project_id_idx ON budget_products(project_id);
CREATE INDEX IF NOT EXISTS documents_owner_id_idx      ON documents(owner_id);
CREATE INDEX IF NOT EXISTS documents_client_id_idx     ON documents(client_id);
CREATE INDEX IF NOT EXISTS documents_project_id_idx    ON documents(project_id);
