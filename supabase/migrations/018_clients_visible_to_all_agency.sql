-- Tous les clients (et données liées) visibles par tous les utilisateurs authentifiés de l'agence.
-- INSERT/UPDATE/DELETE restent réservés au propriétaire (owner_id).

-- Clients : lecture pour tous
DROP POLICY IF EXISTS "clients: owner select" ON clients;
CREATE POLICY "clients: agency select" ON clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Contacts : lecture pour tous (liés aux clients)
DROP POLICY IF EXISTS "contacts: owner select" ON contacts;
CREATE POLICY "contacts: agency select" ON contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Projets : lecture pour tous
DROP POLICY IF EXISTS "projects: owner select" ON projects;
CREATE POLICY "projects: agency select" ON projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Produits budget : lecture pour tous
DROP POLICY IF EXISTS "budget_products: owner select" ON budget_products;
CREATE POLICY "budget_products: agency select" ON budget_products
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Documents : lecture pour tous
DROP POLICY IF EXISTS "documents: owner select" ON documents;
CREATE POLICY "documents: agency select" ON documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Liens clients : lecture pour tous
DROP POLICY IF EXISTS "client_links: owner select" ON client_links;
CREATE POLICY "client_links: agency select" ON client_links
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Logs d'activité : lecture pour tous (tout le monde voit l'activité de tous les clients)
DROP POLICY IF EXISTS "client_activity_logs: owner select" ON client_activity_logs;
CREATE POLICY "client_activity_logs: agency select" ON client_activity_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);
