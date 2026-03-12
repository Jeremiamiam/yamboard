-- Les logs d'activité doivent être visibles par le propriétaire du client,
-- pas seulement par l'owner_id du log (cas email forwardé par un collaborateur).
DROP POLICY IF EXISTS "client_activity_logs: owner select" ON client_activity_logs;
CREATE POLICY "client_activity_logs: owner select" ON client_activity_logs
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id AND c.owner_id = auth.uid())
  );
