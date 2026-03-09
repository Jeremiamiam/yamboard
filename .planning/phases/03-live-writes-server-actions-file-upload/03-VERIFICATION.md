---
phase: 03-live-writes-server-actions-file-upload
verified: 2026-03-08T14:30:00Z
status: human_needed
score: 19/19 automated must-haves verified
re_verification: false
human_verification:
  - test: "Uploader un PDF dans l'onglet Documents d'un projet"
    expected: "Fichier visible dans Supabase Studio > Storage > bucket 'documents' avec le path {uid}/{clientId}/{timestamp}-{filename}"
    why_human: "createSignedUploadUrl + upload browser-side + saveDocumentRecord — circuit complet non testable sans Supabase live"
  - test: "Cliquer sur un document PDF dans la liste → DocumentViewer s'ouvre avec un iframe"
    expected: "getDocumentSignedUrl() est appelé, une signed URL TTL 1h est obtenue, le PDF s'affiche dans <iframe>"
    why_human: "Requiert un fichier réel en Storage Supabase + UI rendering"
  - test: "Supprimer un document PDF"
    expected: "La ligne DB est supprimée ET le fichier disparaît du bucket Storage (pas d'orphelin)"
    why_human: "deleteDocument() supprime Storage avant la row — requiert Storage live pour vérifier l'absence du fichier"
  - test: "Pinner un document depuis l'onglet Documents d'un projet"
    expected: "Le document apparaît dans la section Documents de marque au niveau client"
    why_human: "pinDocument() met is_pinned=true + revalidatePath — requiert UI live pour confirmer la visibilité au niveau client"
  - test: "Bucket 005_storage.sql exécuté dans Supabase Studio"
    expected: "Bucket 'documents' présent dans Supabase Storage avec public=false"
    why_human: "Migration manuelle — non exécutable automatiquement, requiert confirmation utilisateur"
---

# Phase 03: Live Writes — Server Actions + File Upload — Verification Report

**Phase Goal:** Implémenter les Server Actions (mutations live) pour clients, projets, contacts et documents. Câbler les mutations dans les composants shell. Supprimer les context providers legacy LocalProjects et ProjectOverrides.
**Verified:** 2026-03-08T14:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Créer un client depuis l'UI persiste dans Supabase | ? HUMAN | `createClient` Server Action existe et est câblée dans `ClientSidebar`; persistence DB requiert test live |
| 2  | Archiver un client change sa category à 'archived' | VERIFIED | `archiveClient()` → `.update({ category: 'archived' satisfies ClientCategory })` + `revalidatePath('/')` |
| 3  | Supprimer un client supprime la ligne en base | VERIFIED | `deleteClient()` → `.delete().eq('id').eq('owner_id')` |
| 4  | Convertir un prospect change sa category à 'client' | VERIFIED | `convertProspect()` → `.update({ category: 'client' satisfies ClientCategory })` |
| 5  | Bucket Storage 'documents' est privé (pas d'accès public) | VERIFIED | `005_storage.sql`: `INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)` |
| 6  | revalidatePath() est appelé après chaque mutation client | VERIFIED | Présent dans les 5 fonctions de `clients.ts` |
| 7  | Créer un projet depuis l'UI persiste dans Supabase | ? HUMAN | `createProject` câblé dans `ClientPageShell.handleAddMission`; persistence DB requiert test live |
| 8  | Éditer un projet met à jour les champs en base | VERIFIED | `updateProject()` mappe `potentialAmount → potential_amount`, `.update(dbUpdates).eq('owner_id')` |
| 9  | Supprimer un projet supprime la ligne (cascade) | VERIFIED | `deleteProject()` fetch `client_id` avant, `.delete().eq('owner_id')`, revalidate '/' + '/[clientId]' |
| 10 | Ajouter un produit budget persiste en base | VERIFIED | `createBudgetProduct()` INSERT + revalidatePath '/[clientId]/[projectId]' + '/compta' |
| 11 | Mettre à jour une étape de paiement persiste en JSONB | VERIFIED | `updatePaymentStage()` → `.update({ [stage]: value })` dynamique |
| 12 | revalidatePath() appelé après chaque mutation projet/produit | VERIFIED | Présent dans les 7 fonctions de `projects.ts` |
| 13 | Créer une note texte persiste dans la table documents | VERIFIED | `createNote()` INSERT avec `storage_path: null, content: params.content` |
| 14 | L'upload PDF passe par une signed URL | VERIFIED | `createSignedUploadUrl()` retourne `{ signedUrl, path }` — jamais les bytes; `saveDocumentRecord()` step 2 séparé |
| 15 | Visionner un PDF génère une signed URL TTL 1h | VERIFIED | `getDocumentSignedUrl()` → `createSignedUrl(storagePath, 3600)` |
| 16 | Supprimer un document supprime aussi le fichier Storage | VERIFIED | `deleteDocument()`: fetch → `storage.remove([doc.storage_path])` → DELETE row (ordre correct) |
| 17 | Pinner un document met is_pinned = true | VERIFIED | `pinDocument()` → `.update({ is_pinned: true, pinned_from_project: fromProjectId })` |
| 18 | LocalProjectsProvider et ProjectOverridesProvider supprimés de layout.tsx | VERIFIED | `layout.tsx` contient uniquement `ThemeProvider` + `ClientChatDrawerProvider` + `ClientChatDrawer` |
| 19 | LocalProjects.tsx et ProjectOverrides.tsx supprimés du dépôt | VERIFIED | `test ! -f` vérifié: les deux fichiers sont absents; aucune référence résiduelle dans `dashboard/src/` |
| 20 | ClientPageShell appelle createProject() Server Action | VERIFIED | `handleAddMission()` → `createProject({ clientId, name })` dans `startMissionTransition` |
| 21 | ClientPageShell appelle createNote() Server Action | VERIFIED | `handleAddDoc()` → `createNote({ clientId, name, type, content })` dans `startDocTransition` |
| 22 | ProjectPageShell redirige si project prop est null | VERIFIED | `if (!propProject) { redirect(\`/${clientId}\`) }` — appel inline avant le reste du rendu |
| 23 | BudgetsTab appelle createBudgetProduct() Server Action | VERIFIED | `handleAddProduct()` → `createBudgetProduct({ projectId: project.id, name, totalAmount: amount })` |
| 24 | BudgetsTab appelle updateProject() pour potential_amount | VERIFIED | `handlePotentielBlur()` → `updateProject(project.id, { potentialAmount: potentiel })` sur `onBlur` |
| 25 | npm run build / tsc passe sans erreur TypeScript | VERIFIED | `cd dashboard && npx tsc --noEmit` → exit 0, aucun output |

**Score:** 19/19 automated + 6 human-needed items (upload/Storage/pin circuit complet)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `dashboard/supabase/migrations/005_storage.sql` | Bucket privé + 3 RLS policies | VERIFIED | `INSERT INTO storage.buckets … public = false` + 3 policies owner-scoped |
| `dashboard/src/app/(dashboard)/actions/clients.ts` | 5 Server Actions CRUD clients | VERIFIED | `createClient`, `updateClient`, `archiveClient`, `deleteClient`, `convertProspect` — 158 lignes, `'use server'` + `import 'server-only'` |
| `dashboard/src/app/(dashboard)/actions/projects.ts` | 7 Server Actions projets + budget | VERIFIED | `createProject`, `updateProject`, `deleteProject`, `createBudgetProduct`, `updateBudgetProduct`, `deleteBudgetProduct`, `updatePaymentStage` — 326 lignes |
| `dashboard/src/app/(dashboard)/actions/documents.ts` | 7 Server Actions documents + Storage | VERIFIED | `createNote`, `createLink`, `createSignedUploadUrl`, `saveDocumentRecord`, `getDocumentSignedUrl`, `deleteDocument`, `pinDocument` — 282 lignes |
| `dashboard/src/app/(dashboard)/actions/contacts.ts` | 3 Server Actions contacts | VERIFIED | `createContact`, `updateContact`, `deleteContact` — 197 lignes, gestion `is_primary` reset |
| `dashboard/src/components/ClientPageShell.tsx` | Shell sans LocalProjects, avec Server Actions | VERIFIED | Importe `createProject` et `createNote`; pas de `useLocalProjects`; `useTransition` sur les deux boutons |
| `dashboard/src/components/ProjectPageShell.tsx` | Shell avec redirect guard | VERIFIED | `redirect(\`/${clientId}\`)` si `!propProject`; pas de `useLocalProjects`; `BudgetsTab` sans props localProducts |
| `dashboard/src/components/tabs/BudgetsTab.tsx` | BudgetsTab sans useProjectOverrides | VERIFIED | Importe `createBudgetProduct` + `updateProject`; `potentiel` en `useState`; `handlePotentielBlur` onBlur |
| `dashboard/src/components/DocumentViewer.tsx` | Affichage PDF via signed URL | VERIFIED | Importe `getDocumentSignedUrl`; `useEffect` sur `doc.storagePath`; `<iframe src={pdfUrl}>` quand `pdfUrl` est défini |
| `dashboard/src/app/layout.tsx` | Sans LocalProjectsProvider / ProjectOverridesProvider | VERIFIED | Contient uniquement `ThemeProvider`, `ClientChatDrawerProvider`, `ClientChatDrawer` |
| `dashboard/src/context/LocalProjects.tsx` | DOIT ETRE ABSENT | VERIFIED | Fichier absent; aucune référence résiduelle |
| `dashboard/src/context/ProjectOverrides.tsx` | DOIT ETRE ABSENT | VERIFIED | Fichier absent; aucune référence résiduelle |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `actions/clients.ts` | `supabase.from('clients')` | `createSupabaseClient()` | WIRED | Pattern `supabase.from('clients')` présent dans les 5 fonctions |
| `005_storage.sql` | `storage.buckets` | `INSERT INTO storage.buckets` | WIRED | `VALUES ('documents', 'documents', false)` |
| `actions/projects.ts` | `supabase.from('projects')` | `createSupabaseClient()` | WIRED | Pattern présent dans les 3 fonctions projet |
| `actions/projects.ts` | `supabase.from('budget_products')` | `createSupabaseClient()` | WIRED | Pattern présent dans les 4 fonctions budget |
| `actions/documents.ts createSignedUploadUrl` | `supabase.storage.from('documents').createSignedUploadUrl` | Server Action → browser reçoit signedUrl | WIRED | `supabase.storage.from('documents').createSignedUploadUrl(path)` |
| `DocumentViewer.tsx` | `actions/documents.ts getDocumentSignedUrl` | `import { getDocumentSignedUrl }` | WIRED | Importé et appelé dans `useEffect` sur `doc?.storagePath` |
| `actions/contacts.ts` | `supabase.from('contacts')` | `createSupabaseClient()` | WIRED | Pattern présent dans les 3 fonctions |
| `updateContact (is_primary=true)` | `supabase.from('contacts').update({ is_primary: false })` | reset avant UPDATE | WIRED | Pattern `is_primary.*false` présent dans `createContact` et `updateContact` |
| `ClientPageShell.handleAddMission` | `actions/projects.ts createProject` | `startMissionTransition` | WIRED | `await createProject({ clientId, name })` |
| `BudgetsTab.potentiel onBlur` | `actions/projects.ts updateProject` | `handlePotentielBlur` | WIRED | `await updateProject(project.id, { potentialAmount: potentiel })` |

---

## Anti-Patterns Found

Aucun anti-pattern trouvé dans les fichiers modifiés:
- Aucun `TODO / FIXME / PLACEHOLDER` dans les actions ou composants modifiés
- Aucun `return null` / `return {}` comme implémentation factice
- Aucun handler vide (`() => {}` ou `console.log` only)
- Aucune référence résiduelle à `LocalProjects` ou `ProjectOverrides` dans le codebase

---

## Human Verification Required

### 1. Upload PDF complet (circuit 2-step)

**Test:** Se connecter → naviguer vers un projet → onglet Documents → ajouter un document PDF → sélectionner un fichier PDF → soumettre
**Expected:** (1) `createSignedUploadUrl` génère une URL d'upload Supabase Storage; (2) le browser uploade le fichier directement; (3) `saveDocumentRecord` crée la row DB avec `storage_path` défini; (4) le fichier apparaît dans Supabase Studio > Storage > bucket `documents` avec le path `{uid}/{clientId}/{timestamp}-{filename}`
**Why human:** Circuit complet avec Supabase Storage live — impossible à vérifier sans bucket existant et session authentifiée.

### 2. Affichage PDF dans DocumentViewer

**Test:** Cliquer sur un document PDF dans la liste (après upload réussi)
**Expected:** `getDocumentSignedUrl()` est appelé au montage du composant, une URL signée TTL 1h est obtenue, le PDF s'affiche dans un `<iframe>` (pas de message d'erreur ni contenu générique)
**Why human:** Requiert un fichier réel en Storage Supabase + rendu visuel.

### 3. Suppression document PDF — pas d'orphelin Storage

**Test:** Supprimer un document PDF depuis l'UI
**Expected:** La ligne DB disparaît de la liste ET le fichier est absent du bucket Supabase Studio (ordre: Storage supprimé avant la row DB)
**Why human:** Vérifier l'absence d'un fichier dans Storage requiert Supabase Studio live.

### 4. Pin document → visible au niveau client

**Test:** Depuis l'onglet Documents d'un projet, pinner un document
**Expected:** Le document apparaît dans la section "Documents de marque" de la page client (niveau supérieur), `is_pinned = true` en base
**Why human:** Requiert UI live + navigation entre pages pour vérifier la visibilité au niveau client.

### 5. Exécution manuelle de 005_storage.sql

**Test:** Exécuter `dashboard/supabase/migrations/005_storage.sql` dans Supabase Studio > SQL Editor
**Expected:** Bucket `documents` créé avec `public = false`; 3 policies RLS visibles dans Storage > Policies
**Why human:** Migration manuelle — le fichier existe et est correct, mais son exécution n'est pas automatisée.

### 6. Zéro erreur React console après suppression des providers

**Test:** Naviguer tous les onglets (Produits, Chat, Documents) d'un projet; créer un projet; modifier le potentiel
**Expected:** Aucune erreur "must be used within Provider" dans la console navigateur
**Why human:** Régression UI sur le tree React complet requiert navigation manuelle.

---

## Gaps Summary

Aucun gap fonctionnel détecté. Tous les artefacts existent, sont substantiels (non-stubs), et sont correctement câblés:

- Les 4 fichiers d'actions sont complets avec authentification (`getUser()`), défense en profondeur (`.eq('owner_id')`), et `revalidatePath()` systématiques
- `LocalProjects.tsx` et `ProjectOverrides.tsx` supprimés, aucune référence résiduelle
- `layout.tsx` ne contient plus aucun provider legacy
- TypeScript compile avec exit 0

Les 5 items `human_needed` concernent exclusivement le circuit d'upload PDF et les comportements UI visuels qui requièrent Supabase Storage live et un navigateur.

---

*Verified: 2026-03-08T14:30:00Z*
*Verifier: Claude (gsd-verifier)*
