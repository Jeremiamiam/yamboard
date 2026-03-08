-- Enable UUID generation (Supabase includes this by default but explicit is safe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Clients ─────────────────────────────────────────────────
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT UNIQUE,
  name        TEXT NOT NULL,
  industry    TEXT,
  category    TEXT NOT NULL CHECK (category IN ('client', 'prospect', 'archived')),
  status      TEXT NOT NULL CHECK (status IN ('active', 'draft', 'paused')),
  color       TEXT,
  since       TEXT,
  owner_id    UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Contacts ─────────────────────────────────────────────────
CREATE TABLE contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT,
  email       TEXT,
  phone       TEXT,
  is_primary  BOOLEAN DEFAULT false,
  owner_id    UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Projects ─────────────────────────────────────────────────
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  type             TEXT CHECK (type IN ('brand', 'site', 'campaign', 'social', 'other')),
  status           TEXT CHECK (status IN ('active', 'done', 'paused', 'draft')),
  description      TEXT,
  progress         INT DEFAULT 0,
  total_phases     INT DEFAULT 1,
  last_activity    TEXT,
  start_date       TEXT,
  potential_amount NUMERIC,
  owner_id         UUID REFERENCES auth.users(id) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── Budget Products ──────────────────────────────────────────
CREATE TABLE budget_products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  devis        JSONB,
  acompte      JSONB,
  avancement   JSONB,
  solde        JSONB,
  owner_id     UUID REFERENCES auth.users(id) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Documents ───────────────────────────────────────────────
CREATE TABLE documents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  type                TEXT CHECK (type IN ('brief', 'platform', 'campaign', 'site', 'other')),
  content             TEXT,
  storage_path        TEXT,
  external_url        TEXT,
  is_pinned           BOOLEAN DEFAULT false,
  pinned_from_project UUID REFERENCES projects(id) ON DELETE SET NULL,
  owner_id            UUID REFERENCES auth.users(id) NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);
