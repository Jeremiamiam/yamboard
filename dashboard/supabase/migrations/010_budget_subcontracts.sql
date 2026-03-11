-- 010: Add subcontracts column to budget_products
-- Stores an array of { freelancerName, amount, status } objects

ALTER TABLE budget_products
  ADD COLUMN IF NOT EXISTS subcontracts JSONB;
