-- Enable RLS on all tables
ALTER TABLE clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;

-- ─── Clients ─────────────────────────────────────────────────
CREATE POLICY "clients: owner select" ON clients
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "clients: owner insert" ON clients
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "clients: owner update" ON clients
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "clients: owner delete" ON clients
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- ─── Contacts ─────────────────────────────────────────────────
CREATE POLICY "contacts: owner select" ON contacts
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "contacts: owner insert" ON contacts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "contacts: owner update" ON contacts
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "contacts: owner delete" ON contacts
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- ─── Projects ─────────────────────────────────────────────────
CREATE POLICY "projects: owner select" ON projects
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "projects: owner insert" ON projects
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "projects: owner update" ON projects
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "projects: owner delete" ON projects
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- ─── Budget Products ──────────────────────────────────────────
CREATE POLICY "budget_products: owner select" ON budget_products
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "budget_products: owner insert" ON budget_products
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "budget_products: owner update" ON budget_products
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "budget_products: owner delete" ON budget_products
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- ─── Documents ───────────────────────────────────────────────
CREATE POLICY "documents: owner select" ON documents
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents: owner insert" ON documents
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents: owner update" ON documents
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents: owner delete" ON documents
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);
