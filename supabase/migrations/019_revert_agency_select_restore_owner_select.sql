-- Revert 018 : restaure les politiques owner (lecture limitée au propriétaire)
-- pour diagnostiquer si 018 causait des problèmes de mise à jour Supabase.

-- Clients
DROP POLICY IF EXISTS "clients: agency select" ON clients;
CREATE POLICY "clients: owner select" ON clients
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

-- Contacts
DROP POLICY IF EXISTS "contacts: agency select" ON contacts;
CREATE POLICY "contacts: owner select" ON contacts
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

-- Projets
DROP POLICY IF EXISTS "projects: agency select" ON projects;
CREATE POLICY "projects: owner select" ON projects
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

-- Produits budget
DROP POLICY IF EXISTS "budget_products: agency select" ON budget_products;
CREATE POLICY "budget_products: owner select" ON budget_products
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

-- Documents
DROP POLICY IF EXISTS "documents: agency select" ON documents;
CREATE POLICY "documents: owner select" ON documents
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

-- Liens clients
DROP POLICY IF EXISTS "client_links: agency select" ON client_links;
CREATE POLICY "client_links: owner select" ON client_links
  FOR SELECT USING (owner_id = auth.uid());

-- Logs d'activité (policy 017 : owner du log OU propriétaire du client)
DROP POLICY IF EXISTS "client_activity_logs: agency select" ON client_activity_logs;
CREATE POLICY "client_activity_logs: owner select" ON client_activity_logs
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id AND c.owner_id = auth.uid())
  );
