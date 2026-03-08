-- ─── Seed data — YamBoard v1.0 ────────────────────────────────────────────────
-- Exécuter dans Supabase Studio > SQL Editor APRÈS 001_schema.sql + 002_rls.sql + 003_indexes.sql
--
-- AVANT D'EXÉCUTER : remplacer 'YOUR-AUTH-USER-UUID-HERE' par votre vrai UUID
-- Pour obtenir votre UUID : SELECT id FROM auth.users LIMIT 1; dans SQL Editor
-- (Créer un compte dans Supabase Dashboard > Authentication > Users si ce n'est pas encore fait)

DO $$
DECLARE
  -- Owner UUID — REMPLACER par le vrai UUID de auth.users
  owner_uuid UUID := 'YOUR-AUTH-USER-UUID-HERE';

  -- Client UUIDs
  brutus_id      UUID := uuid_generate_v4();
  bloo_id        UUID := uuid_generate_v4();
  forge_id       UUID := uuid_generate_v4();
  ornanza_id     UUID := uuid_generate_v4();
  solstice_id    UUID := uuid_generate_v4();
  kaia_id        UUID := uuid_generate_v4();
  novu_id        UUID := uuid_generate_v4();

  -- Project UUIDs
  identite_id    UUID := uuid_generate_v4();
  siteweb_id     UUID := uuid_generate_v4();
  campagne_id    UUID := uuid_generate_v4();
  refonte_id     UUID := uuid_generate_v4();
  plateforme_id  UUID := uuid_generate_v4();
  camprhum_id    UUID := uuid_generate_v4();
  kickoff_id     UUID := uuid_generate_v4();
  refinte_id     UUID := uuid_generate_v4();
  packaging_id   UUID := uuid_generate_v4();

  -- Budget product UUIDs
  bp1_id UUID := uuid_generate_v4();
  bp2_id UUID := uuid_generate_v4();
  bp3_id UUID := uuid_generate_v4();
  bp4_id UUID := uuid_generate_v4();
  bp5_id UUID := uuid_generate_v4();
  bp6_id UUID := uuid_generate_v4();
  bp7_id UUID := uuid_generate_v4();
  bp8_id UUID := uuid_generate_v4();
  bp9_id UUID := uuid_generate_v4();
  bp10_id UUID := uuid_generate_v4();

  -- Document UUIDs
  g1_id UUID := uuid_generate_v4();
  g2_id UUID := uuid_generate_v4();
  g3_id UUID := uuid_generate_v4();
  g4_id UUID := uuid_generate_v4();
  d1_id UUID := uuid_generate_v4();
  d2_id UUID := uuid_generate_v4();
  d3_id UUID := uuid_generate_v4();
  d4_id UUID := uuid_generate_v4();
  d5_id UUID := uuid_generate_v4();

BEGIN

-- ─── Clients (7) ──────────────────────────────────────────────────────────────
INSERT INTO clients (id, slug, name, industry, category, status, color, since, owner_id) VALUES
  (brutus_id,   'brutus',        'Brutus.club',     'E-commerce · Pet',         'client',   'active', '#f97316', 'Oct 2024', owner_uuid),
  (bloo_id,     'bloo-conseil',  'Bloo Conseil',    'Conseil · Cyber',          'client',   'active', '#3b82f6', 'Sep 2024', owner_uuid),
  (forge_id,    'forge',         'Forge',           'Wellness · Recovery',      'client',   'active', '#10b981', 'Nov 2024', owner_uuid),
  (ornanza_id,  'ornanza',       'Ornanza',         'Retail · Bijoux',          'client',   'draft',  '#a855f7', 'Mar 2025', owner_uuid),
  (solstice_id, 'solstice',      'Solstice Studio', 'Architecture · Intérieur', 'prospect', 'draft',  '#eab308', NULL,       owner_uuid),
  (kaia_id,     'kaia',          'Kaïa Foods',      'Agroalimentaire · Bio',    'prospect', 'draft',  '#84cc16', NULL,       owner_uuid),
  (novu_id,     'novu',          'Novu Paris',      'Mode · Prêt-à-porter',     'archived', 'paused', '#ec4899', 'Jan 2024', owner_uuid);

-- ─── Contacts (7 — un par client, extrait du champ contact de mock.ts) ────────
INSERT INTO contacts (client_id, name, role, email, phone, is_primary, owner_id) VALUES
  (brutus_id,   'Thomas Marin',   'Fondateur',          'thomas@brutus.club',       '+33 6 12 34 56 78', true, owner_uuid),
  (bloo_id,     'Aurélien Bloo',  'CEO',                'a.bloo@bloo-conseil.fr',   NULL,                true, owner_uuid),
  (forge_id,    'Marine Leroy',   'Co-fondatrice',      'marine@forge-smalo.fr',    '+33 6 98 76 54 32', true, owner_uuid),
  (ornanza_id,  'Clara Fontaine', 'Gérante',            'clara@ornanza.fr',         NULL,                true, owner_uuid),
  (solstice_id, 'Emma Duval',     'Directrice',         'emma@solstice-studio.fr',  NULL,                true, owner_uuid),
  (kaia_id,     'Romain Salis',   'Co-fondateur',       'r.salis@kaia-foods.fr',    NULL,                true, owner_uuid),
  (novu_id,     'Léa Chen',       'Directrice artistique', 'lea@novu-paris.fr',     NULL,                true, owner_uuid);

-- ─── Projects (9) ─────────────────────────────────────────────────────────────
INSERT INTO projects (id, client_id, name, type, status, description, progress, total_phases, last_activity, start_date, potential_amount, owner_id) VALUES
  (identite_id,   brutus_id,   'Identité de marque',     'brand',    'done',   'Contre-brief, plateforme de marque, système verbal et brandbook.',           5, 5, '28 nov 2024', 'Oct 2024',    NULL,   owner_uuid),
  (siteweb_id,    brutus_id,   'Site web',                'site',     'active', 'Architecture, contenus, maquettes et intégration Webflow.',                  2, 4, '3 mars 2025', 'Jan 2025',    NULL,   owner_uuid),
  (campagne_id,   brutus_id,   'Campagne de lancement',  'campaign', 'draft',  'Concept créatif et déclinaisons pour le lancement printemps.',               0, 3, '—',           'À planifier', 4500,   owner_uuid),
  (refonte_id,    bloo_id,     'Refonte de marque',      'brand',    'active', '10 ans d''existence — repositionnement, plateforme et refonte visuelle.',     3, 5, '22 oct 2024', 'Sep 2024',    NULL,   owner_uuid),
  (plateforme_id, forge_id,    'Plateforme de marque',   'brand',    'active', 'L''Atelier de la Durée — positionnement, essence et manifeste.',             2, 5, '12 déc 2024', 'Nov 2024',    NULL,   owner_uuid),
  (camprhum_id,   forge_id,    'Campagne Route du Rhum', 'campaign', 'draft',  'Campagne d''activation autour de la Route du Rhum 2026.',                    0, 3, '—',           '2026',        8000,   owner_uuid),
  (kickoff_id,    ornanza_id,  'Identité de marque',     'brand',    'draft',  'Kick-off et brief stratégique — bijoux intemporels haut de gamme.',           0, 5, '—',           'À planifier', 3500,   owner_uuid),
  (refinte_id,    solstice_id, 'Refonte identité',       'brand',    'draft',  'Repositionnement et identité visuelle pour agence d''architecture.',         0, 4, '—',           'À planifier', 6000,   owner_uuid),
  (packaging_id,  kaia_id,     'Packaging & marque',     'brand',    'draft',  'Identité visuelle et packaging pour gamme bio.',                              0, 5, '—',           'À planifier', 5200,   owner_uuid);

-- ─── Budget Products (10) ──────────────────────────────────────────────────────
INSERT INTO budget_products (id, project_id, name, total_amount, devis, acompte, avancement, solde, owner_id) VALUES
  -- Brutus — identité de marque
  (bp1_id,  identite_id,   'Contre-brief',              1000, '{"status":"paid","date":"1 oct 2024"}'::jsonb,   '{"amount":500,"date":"5 oct 2024","status":"paid"}'::jsonb,   NULL, '{"amount":500,"date":"10 nov 2024","status":"paid"}'::jsonb,  owner_uuid),
  (bp2_id,  identite_id,   'Plateforme de marque',      3000, '{"status":"paid","date":"1 oct 2024"}'::jsonb,   '{"amount":1500,"date":"5 oct 2024","status":"paid"}'::jsonb,  '{"amount":1000,"date":"10 nov 2024","status":"paid"}'::jsonb, '{"amount":500,"date":"18 nov 2024","status":"paid"}'::jsonb,  owner_uuid),
  (bp3_id,  identite_id,   'Brandbook',                 1500, '{"status":"paid","date":"15 oct 2024"}'::jsonb,  '{"amount":750,"date":"20 oct 2024","status":"paid"}'::jsonb,  NULL, '{"amount":750,"date":"28 nov 2024","status":"paid"}'::jsonb,  owner_uuid),
  -- Brutus — site web
  (bp4_id,  siteweb_id,    'Architecture + contenus',   2200, '{"status":"paid","date":"10 jan 2025"}'::jsonb,  '{"amount":1100,"date":"15 jan 2025","status":"paid"}'::jsonb, NULL, '{"amount":1100,"status":"pending"}'::jsonb,                  owner_uuid),
  (bp5_id,  siteweb_id,    'Maquettes + intégration Webflow', 1800, '{"status":"sent","date":"1 mars 2025"}'::jsonb, '{"amount":900,"status":"pending"}'::jsonb, NULL, '{"amount":900,"status":"pending"}'::jsonb, owner_uuid),
  -- Bloo Conseil — refonte de marque
  (bp6_id,  refonte_id,    'Brief stratégique',         1000, '{"status":"paid","date":"1 sep 2024"}'::jsonb,   '{"amount":500,"date":"5 sep 2024","status":"paid"}'::jsonb,   NULL, '{"amount":500,"date":"10 oct 2024","status":"paid"}'::jsonb,  owner_uuid),
  (bp7_id,  refonte_id,    'Plateforme de marque',      2500, '{"status":"paid","date":"1 sep 2024"}'::jsonb,   '{"amount":1250,"date":"5 sep 2024","status":"paid"}'::jsonb,  '{"amount":750,"date":"15 oct 2024","status":"paid"}'::jsonb, '{"amount":500,"status":"pending"}'::jsonb, owner_uuid),
  (bp8_id,  refonte_id,    'Système visuel',            1500, '{"status":"sent","date":"20 oct 2024"}'::jsonb,  '{"amount":750,"status":"pending"}'::jsonb,  NULL, '{"amount":750,"status":"pending"}'::jsonb, owner_uuid),
  -- Forge — plateforme de marque
  (bp9_id,  plateforme_id, 'Contre-brief',              1000, '{"status":"paid","date":"1 nov 2024"}'::jsonb,   '{"amount":500,"date":"5 nov 2024","status":"paid"}'::jsonb,   NULL, '{"amount":500,"date":"1 déc 2024","status":"paid"}'::jsonb,  owner_uuid),
  (bp10_id, plateforme_id, 'Plateforme de marque',      3500, '{"status":"paid","date":"5 nov 2024"}'::jsonb,   '{"amount":1750,"date":"10 nov 2024","status":"paid"}'::jsonb, '{"amount":1000,"status":"pending"}'::jsonb, '{"amount":750,"status":"pending"}'::jsonb, owner_uuid);

-- ─── Documents (9) ────────────────────────────────────────────────────────────
INSERT INTO documents (id, client_id, project_id, name, type, is_pinned, owner_id, updated_at) VALUES
  -- Docs globaux clients (project_id = NULL)
  (g1_id, brutus_id,   NULL,         'Plateforme de marque',      'platform', false, owner_uuid, '2024-11-18'),
  (g2_id, brutus_id,   NULL,         'Brandbook',                 'other',    false, owner_uuid, '2024-11-28'),
  (g3_id, bloo_id,     NULL,         'Plateforme de marque',      'platform', false, owner_uuid, '2024-10-20'),
  (g4_id, forge_id,    NULL,         'Plateforme de marque v1',   'platform', false, owner_uuid, '2024-12-12'),
  -- Docs projets
  (d1_id, brutus_id,   identite_id,  'Contre-brief',              'brief',    false, owner_uuid, '2024-11-10'),
  (d2_id, brutus_id,   siteweb_id,   'Architecture du site',      'site',     false, owner_uuid, '2025-01-20'),
  (d3_id, brutus_id,   siteweb_id,   'Contenus Home + Boutique',  'other',    false, owner_uuid, '2025-03-03'),
  (d4_id, bloo_id,     refonte_id,   'Brief stratégique',         'brief',    false, owner_uuid, '2024-10-05'),
  (d5_id, forge_id,    plateforme_id,'Contre-brief',               'brief',    false, owner_uuid, '2024-12-01');

END $$;
