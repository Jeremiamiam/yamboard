-- ============================================================
-- Migration 005 — Storage bucket privé + RLS policies
-- ============================================================
-- ATTENTION : Ce script doit être exécuté manuellement dans
-- Supabase Studio > SQL Editor AVANT d'utiliser l'upload de PDF.
-- Il n'est PAS exécuté automatiquement.
-- ============================================================

-- 1. Création du bucket privé "documents"
--    public = false → accès uniquement via signed URLs (SEC-5)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies Storage
--    Convention de path : {uid}/{clientId}/{filename}
--    (storage.foldername(name))[1] extrait le premier segment = uid

-- Autoriser le propriétaire à uploader
CREATE POLICY "storage: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Autoriser le propriétaire à lire ses fichiers
CREATE POLICY "storage: owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Autoriser le propriétaire à supprimer ses fichiers
CREATE POLICY "storage: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
