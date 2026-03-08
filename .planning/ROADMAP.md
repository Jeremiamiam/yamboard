# Roadmap — YamBoard v1.0

**Milestone:** v1.0 — Supabase Backend Migration
**Working directory:** `dashboard/` (Next.js 16 app, UI shell existante)
**Last updated:** 2026-03-08

---

## Milestone Goal

Brancher l'UI v2 existante (`dashboard/`) sur un vrai backend Supabase. Remplacer toutes les données mock par des données persistées, sécurisées et réelles. Activer les agents IA sur les vraies données. Supprimer `mock.ts` en fin de milestone.

---

## Phase 01 — Foundation: Auth + Infrastructure + Schema

**Goal:** Supabase fonctionnel avec auth, schéma, RLS et données seed. Aucun changement UI.

**Plans:** 5/5 plans complete

Plans:
- [x] 01-01-PLAN.md — Install Supabase packages + clients browser/server + env vars
- [x] 01-02-PLAN.md — Schema SQL : 5 tables + RLS + indexes (001_schema.sql, 002_rls.sql, 003_indexes.sql)
- [x] 01-03-PLAN.md — Auth gate : login page, protected layout, middleware token refresh
- [x] 01-04-PLAN.md — Seed data : toutes les données mock.ts → 004_seed.sql
- [ ] 01-05-PLAN.md — Validation sécurité : audit getSession→getUser, WITH CHECK, service role key isolation

**Success criteria:**
- [x] `npm run dev` fonctionne avec Supabase connecté
- [x] Login/logout fonctionne (email + mot de passe)
- [x] Toutes les routes redirigent vers `/login` si non authentifié
- [ ] Toutes les tables existent avec RLS activé et politiques créées
- [ ] Données seed visibles dans Supabase Studio
- [ ] Scripts SQL dans `dashboard/supabase/migrations/` exécutables dans l'ordre dans Supabase Studio

**Dependencies:** Aucune — phase de démarrage

---

## Phase 02 — Live Reads: Server Components

**Goal:** Toutes les pages fetchent depuis Supabase. L'UI est identique visuellement mais les données persistent entre sessions.

**Plans:**
- `02-01` — DAL layer : créer `lib/data/clients.ts`, `lib/data/projects.ts`, `lib/data/documents.ts` (initialement wrappent encore le mock)
- `02-02` — Migrer `app/page.tsx` et `ClientSidebar` : lire la liste clients depuis Supabase
- `02-03` — Migrer `app/[clientId]/page.tsx` : client + projets + docs depuis Supabase
- `02-04` — Migrer `app/[clientId]/[projectId]/page.tsx` : projet + produits + docs depuis Supabase

**Success criteria:**
- [ ] Créer un client dans Supabase Studio → visible dans la sidebar sans code deploy
- [ ] Recharger la page conserve les données
- [ ] `mock.ts` n'est plus importé dans aucune page
- [ ] UI visuellement identique à avant la migration

**Dependencies:** Phase 01 complète

---

## Phase 03 — Live Writes: Server Actions + File Upload

**Goal:** CRUD complet (clients, projets, produits, documents, contacts) + upload PDF. Suppression des context providers legacy.

**Plans:**
- `03-01` — Server Actions clients : createClient, updateClient, archiveClient, deleteClient, convertProspect
- `03-02` — Server Actions projets + produits : CRUD complet + billing stages (Devis/Acompte/Avancement/Solde)
- `03-03` — Server Actions documents : createNote, createLink, createSignedUploadUrl + saveDocumentRecord, deleteDocument, pinDocument
- `03-04` — Server Actions contacts : createContact, updateContact, deleteContact
- `03-05` — Cleanup : supprimer LocalProjects + ProjectOverrides context providers

**Success criteria:**
- [ ] Créer un client depuis l'UI → persiste en BDD
- [ ] Uploader un PDF → visible dans Supabase Storage, accessible via signed URL
- [ ] Pinner un document → visible au niveau client
- [ ] `LocalProjects` et `ProjectOverrides` supprimés, aucune régression UI
- [ ] `revalidatePath()` appelé après chaque mutation → données fraîches sans reload manuel

**Dependencies:** Phase 02 complète

---

## Phase 04 — AI on Real Data: Context Builders Migration

**Goal:** Les 3 agents IA (agency / client / project) utilisent les vraies données Supabase. `mock.ts` supprimé.

**Plans:**
- `04-01` — Research : token budget calibration + stratégie d'injection des notes de documents
- `04-02` — Migrer `lib/context-builders.ts` : buildAgencyContext, buildClientContext, buildProjectContext → async Supabase queries
- `04-03` — Token budgets + défense prompt injection : XML-tags structurels, truncation strategy, logging `input_tokens`
- `04-04` — Supprimer `mock.ts` + `lib/doc-content.ts` + validation end-to-end

**Success criteria:**
- [ ] Les 3 scopes IA répondent avec les vraies données (clients, projets, billing, documents)
- [ ] Aucun context ne dépasse son token budget (agency ≤20K, client ≤30K, project ≤40K)
- [ ] Test d'injection : une note malicieuse n'override pas les instructions système
- [ ] `mock.ts` supprimé, aucune importation restante
- [ ] `input_tokens` loggé dans chaque réponse Anthropic

**Dependencies:** Phase 03 complète (documents réels uploadés requis pour contexte significatif)

---

## Summary

| Phase | Goal | Plans | Status |
|-------|------|-------|--------|
| 01 — Foundation | 5/5 | Complete   | 2026-03-08 |
| 02 — Live Reads | Server Components | 4 | planned |
| 03 — Live Writes | CRUD + File Upload | 5 | planned |
| 04 — AI on Real Data | Context builders + mock.ts delete | 4 | planned |

**Total:** 18 plans

---

## Migration Dependency Chain

```
Phase 01: Auth + Schema
    ↓
Phase 02: Live Reads (Server Components)
    ↓
Phase 03: Live Writes (Server Actions + Storage)
    ↓
Phase 04: AI Context Builders (mock.ts deleted)
```

Chaque phase laisse l'app fonctionnelle. Aucune phase ne casse l'UI. La suppression de `mock.ts` est l'acte final de Phase 04 — marker de complétion du milestone.
