-- Migration 011 — Logo client (SVG) pour remplacer les initiales
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logo_path TEXT;
