# Requirements — YamBoard v1.0

**Project:** YamBoard — Agency Dashboard (mock → Supabase migration)
**Milestone:** v1.0 — File Upload + Wiki + UI/UX *(repris depuis brownfield)*
**Last updated:** 2026-03-08

---

## Context

L'UI v2 (Next.js 16 + Tailwind v4) est entièrement construite avec des données mock dans `dashboard/`. L'objectif de ce milestone est de brancher cette UI sur un vrai backend Supabase, sans reconstruire l'interface. C'est une migration de couche de données, pas un nouveau projet.

---

## Functional Requirements

### Auth
- [ ] **AUTH-1** — Login page (`/login`) avec email + mot de passe Supabase
- [ ] **AUTH-2** — Toutes les routes dashboard protégées (redirect `/login` si non authentifié)
- [ ] **AUTH-3** — Middleware Next.js rafraîchit le token à chaque requête via `getUser()`
- [ ] **AUTH-4** — Logout fonctionnel

### Clients
- [x] **CLIENT-1** — Créer un nouveau client (nom, industrie, catégorie, couleur)
- [x] **CLIENT-2** — Éditer les infos d'un client existant
- [x] **CLIENT-3** — Archiver un client (passage en catégorie `archived`)
- [x] **CLIENT-4** — Supprimer un client (soft delete ou hard delete)
- [x] **CLIENT-5** — Passer un prospect en client actif (changement de `category`)
- [x] **CLIENT-6** — Liste clients persistée et rechargée depuis Supabase

### Projets
- [x] **PROJECT-1** — Créer un projet (nom, type, statut, description)
- [x] **PROJECT-2** — Éditer un projet existant
- [x] **PROJECT-3** — Fermer / archiver un projet
- [x] **PROJECT-4** — Supprimer un projet
- [x] **PROJECT-5** — Voir tous les projets d'un client

### Produits (Budget)
- [x] **PRODUCT-1** — Ajouter un produit dans un projet (nom, montant total)
- [x] **PRODUCT-2** — Éditer un produit
- [x] **PRODUCT-3** — Supprimer un produit
- [x] **PRODUCT-4** — Étapes de paiement par produit : Devis / Acompte / Avancement / Solde
- [x] **PRODUCT-5** — Chaque étape a un montant et un état (pending / paid)

### Documents
- [x] **DOC-1** — Ajouter un document note (texte libre) au niveau projet ou client
- [x] **DOC-2** — Ajouter un lien externe comme document
- [x] **DOC-3** — Uploader un PDF via Supabase Storage (signed URL upload — jamais via Server Action body)
- [x] **DOC-4** — Visionner un PDF (signed URL de lecture, TTL 1h)
- [x] **DOC-5** — Note libre sur chaque document (injectée dans le contexte agent)
- [x] **DOC-6** — Supprimer un document (+ fichier Storage si applicable)
- [x] **DOC-7** — Pinner un document projet → niveau client (visible dans contexte client)

### Contacts
- [x] **CONTACT-1** — Ajouter un contact à un client (nom, rôle, email, téléphone)
- [x] **CONTACT-2** — Éditer un contact
- [x] **CONTACT-3** — Supprimer un contact
- [x] **CONTACT-4** — Marquer un contact comme principal (`is_primary`)

### Agents IA
- [ ] **AI-1** — Contexte `agency` : noms + statuts + résumés projets de tous les clients (pas les docs complets)
- [ ] **AI-2** — Contexte `client` : projets + docs + contacts du client
- [ ] **AI-3** — Contexte `project` : projet + docs projet + docs client pinnés
- [ ] **AI-4** — Notes de documents injectées dans le contexte agent
- [ ] **AI-5** — Token budget par scope : agency ≤20K, client ≤30K, project ≤40K
- [ ] **AI-6** — Séparation structurelle XML entre instructions système et données injectées (anti-injection)

---

## Non-Functional Requirements

### Sécurité
- [x] **SEC-1** — RLS activé sur toutes les tables, politiques créées dans la même migration
- [x] **SEC-2** — `WITH CHECK (auth.uid() = owner_id)` sur tous les INSERT/UPDATE
- [x] **SEC-3** — `getUser()` uniquement côté serveur (jamais `getSession()`)
- [x] **SEC-4** — `SUPABASE_SERVICE_ROLE_KEY` jamais préfixé `NEXT_PUBLIC_`, `import 'server-only'` dans le client admin
- [x] **SEC-5** — Bucket Storage privé, accès uniquement via signed URLs

### Performance
- [x] **PERF-1** — Index sur `owner_id`, `client_id`, `project_id` sur toutes les tables
- [x] **PERF-2** — `revalidatePath()` après chaque Server Action mutation (pas de Realtime)
- [x] **PERF-3** — Upload PDF via signed URL (pas de proxy via Next.js)

### Architecture
- [x] **ARCH-1** — Couche DAL (`lib/data/*.ts`) introduite avant la migration — pas d'import mock direct dans les pages
- [x] **ARCH-2** — Pages converties en Server Components async (data fetching côté serveur)
- [x] **ARCH-3** — Composants UI (`'use client'`) restent inchangés — reçoivent les données via props
- [ ] **ARCH-4** — Supprimer `LocalProjects` et `ProjectOverrides` context providers après Phase 3
- [ ] **ARCH-5** — Supprimer `mock.ts` en fin de Phase 4
- [x] **ARCH-6** — Tous les scripts SQL (schéma, RLS, indexes, seed) rangés dans `dashboard/supabase/migrations/` avec nommage séquentiel (`001_schema.sql`, `002_rls.sql`, `003_seed.sql`, etc.) — exécution manuelle dans Supabase Studio SQL Editor dans l'ordre numérique

---

## Out of Scope (v1)

- Invite collaborateur (auth.admin.inviteUserByEmail — prévu v2)
- Portail client (vue client-facing)
- Dashboard facturation agrégé
- Versioning de documents / recherche full-text
- Supabase Realtime (usage solo — inutile)
- Génération automatique de factures PDF
- Mobile app
- Time tracking, Gantt, sprints, intégrations externes

---

## Resolved Decisions

| Question | Décision |
|----------|----------|
| UUID ou slug dans les URLs `[clientId]` ? | **UUID** — le `slug` existe en base mais les routes utilisent l'UUID pour simplifier les joins |
| `owner_id` ou `created_by` ? | **`owner_id`** — uniformisé sur toutes les tables |
| Realtime ? | **Non** — `revalidatePath()` suffisant pour usage solo |
| Bucket public ou privé ? | **Privé** — signed URLs uniquement |
| Schéma multi-user en v1 ? | **Non** — `owner_id` simple, migration additive en v2 |
| Client Supabase singleton ou par-requête ? | **Browser : singleton** | **Server : par-requête** (cookies request-scoped) |
