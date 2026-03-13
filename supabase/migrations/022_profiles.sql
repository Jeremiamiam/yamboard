-- Table profiles : nom affiché + rôle pour chaque user de l'agence
CREATE TABLE profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil vide à chaque inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Tous les users authentifiés peuvent lire tous les profils
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Chaque user peut mettre à jour son propre profil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Insert uniquement via le trigger (pas de RLS INSERT public)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Insérer les profils pour les users existants (Jeremy admin, Corentin member)
-- Les UUIDs seront remplacés par les vrais IDs depuis Supabase Dashboard
-- À exécuter après avoir récupéré les IDs : SELECT id, email FROM auth.users;
INSERT INTO profiles (id, full_name, role)
SELECT id, split_part(email, '@', 1), 'member'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Mettre Jeremy en admin (à adapter avec son email réel)
-- UPDATE profiles SET full_name = 'Jérémy', role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'jeremy@agenceyam.fr');
--
-- UPDATE profiles SET full_name = 'Corentin', role = 'member'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'corentin@agenceyam.fr');
