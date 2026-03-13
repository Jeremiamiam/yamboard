-- Storage documents : lecture pour tous les users authentifiés de l'agence.
-- Chacun peut lire les PDF/notes pour bosser sur les projets clients.
-- Upload et delete restent réservés au propriétaire (convention path {uid}/...).

DROP POLICY IF EXISTS "storage: owner read" ON storage.objects;

CREATE POLICY "storage: agency read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
