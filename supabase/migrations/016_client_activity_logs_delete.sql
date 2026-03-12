-- Permettre la suppression des logs d'activité par le propriétaire
CREATE POLICY "client_activity_logs: owner delete" ON client_activity_logs
  FOR DELETE USING (owner_id = auth.uid());
