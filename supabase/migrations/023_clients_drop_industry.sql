-- Suppression de la colonne industry (plus utilisée)
ALTER TABLE clients DROP COLUMN IF EXISTS industry;
