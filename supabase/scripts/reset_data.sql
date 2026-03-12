-- ============================================================
-- VIDAGE COMPLET — clients, projets, missions, documents, budget, contacts
-- ============================================================
-- À exécuter MANUELLEMENT dans Supabase Studio > SQL Editor
-- NE PAS ajouter aux migrations (sinon ça s'exécute à chaque deploy)
-- ============================================================

-- 1. Storage : supprimer tous les fichiers du bucket documents
DELETE FROM storage.objects WHERE bucket_id = 'documents';

-- 2. Clients → CASCADE supprime automatiquement :
--    - contacts (ON DELETE CASCADE)
--    - projects (ON DELETE CASCADE)
--    - documents (ON DELETE CASCADE)
--    - budget_products (via projects CASCADE)
DELETE FROM clients;

-- Vérification (doit retourner 0 partout)
-- SELECT (SELECT count(*) FROM clients) AS clients,
--        (SELECT count(*) FROM contacts) AS contacts,
--        (SELECT count(*) FROM projects) AS projects,
--        (SELECT count(*) FROM documents) AS documents,
--        (SELECT count(*) FROM budget_products) AS budget_products;
