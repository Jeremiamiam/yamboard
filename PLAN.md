# Migration SPA — getBrandon Dashboard

## Principe
Passer de SSR (fetch serveur à chaque navigation) à SPA (cache client Zustand + localStorage).
Navigation instantanée, données en mémoire, revalidation en background.

## Architecture cible

```
App mount → loadData()
  1. Lire localStorage → afficher immédiatement (stale)
  2. Fetch Supabase browser client en background → mettre à jour store
  3. Sauvegarder en localStorage

Navigation = lecture du store Zustand → instantanée (0ms)

Mutation = optimistic update store → persist Supabase → invalidate cache
```

---

## Étape 1 — Store Zustand + cache localStorage

### Créer `src/lib/store.ts`
- Store Zustand avec toutes les données :
  - `clients: Client[]`, `projects: Project[]`, `documents: Document[]`, `budgetProducts: BudgetProduct[]`
  - `loading: boolean`, `loaded: boolean`
- Getters dérivés :
  - `getClient(id)`, `getClientProjects(clientId)`, `getClientDocs(clientId)`, `getProjectDocs(projectId)`, `getBudgetProducts(projectId)`, `getBudgetProductsForClient(clientId)`
  - `sidebarClients`, `sidebarProspects`, `sidebarArchived`

### Créer `src/lib/cache.ts`
- `CACHE_KEY = 'brandon_cache'`, `CACHE_TS_KEY = 'brandon_cache_ts'`
- `loadFromCache()` → parse localStorage, retourne les données ou null
- `saveToCache(data)` → stringify dans localStorage
- `invalidateCache()` → supprime le timestamp (force re-fetch au prochain loadData)

### `loadData()` dans le store :
1. `loadFromCache()` → si données, `set(cachedData)` immédiatement
2. Fetch browser Supabase client : clients (avec contacts), projects, documents (sans content), budget_products — en parallèle
3. `set(freshData)` + `saveToCache(freshData)`

---

## Étape 2 — Data fetching client-side

### Créer `src/lib/data/client-queries.ts` (browser Supabase)
Mêmes requêtes que les fichiers server actuels mais avec `createClient()` du browser :
- `fetchAllClients()` → clients + contacts join
- `fetchAllProjects()` → tous les projets
- `fetchAllDocuments()` → tous les docs (sans content)
- `fetchAllBudgetProducts()` → tous les budget_products

Tout est fetch en 4 requêtes parallèles au mount, pas de requête par page.

---

## Étape 3 — Mutations client-side

### Créer `src/lib/store/actions.ts`
Remplacer les server actions par des mutations directes via browser Supabase client.
Pattern pour chaque mutation :
```ts
// 1. Optimistic update du store
// 2. Persist vers Supabase (browser client)
// 3. Si erreur → rollback store
// 4. invalidateCache()
```

Actions à migrer :
- **Clients**: createClient, updateClient, archiveClient, deleteClient, convertProspect
- **Projects**: createProject, updateProject, deleteProject
- **Budget**: createBudgetProduct, updateBudgetProduct, deleteBudgetProduct, updatePaymentStage
- **Contacts**: createContact, updateContact, deleteContact

### Actions qui RESTENT server-side :
- `createSignedUploadUrl` (besoin de Storage server-side)
- `saveDocumentRecord` + `extractDocumentContent` (besoin de ANTHROPIC_API_KEY côté serveur)
- `getDocumentSignedUrl` (signed URL serveur)
- `createNote`, `createLink` → migrer côté client (pas besoin de clé serveur)
- `deleteDocument` → partie Storage reste server, partie DB migre client
- `pinDocument` → migrer côté client

---

## Étape 4 — Pages deviennent "use client"

### `src/app/(dashboard)/layout.tsx`
- Garde auth server-side (getUser + redirect)
- Retire SidebarLoader/Suspense
- Ajoute un `<StoreProvider>` qui trigger `loadData()` au mount
- Sidebar lit depuis le store

### `src/app/(dashboard)/page.tsx` (home)
- `"use client"` — lit premier client du store → `router.push`

### `src/app/(dashboard)/[clientId]/page.tsx`
- `"use client"` — lit clientId depuis params
- Utilise hooks : `useClient(id)`, `useClientProjects(id)`, etc.
- Passe les données à `<ClientPageShell>` (composant inchangé)

### `src/app/(dashboard)/[clientId]/[projectId]/page.tsx`
- `"use client"` — même pattern
- Hooks pour project, docs, budget

### `src/app/(dashboard)/compta/page.tsx`
- `"use client"` — lit tout depuis le store, calculs côté client

---

## Étape 5 — Composants sidebar + shell

### `src/components/ClientSidebar.tsx`
- Au lieu de recevoir `clients/prospects/archived` en props, lit depuis le store
- Les mutations (createClient, etc.) appellent le store au lieu des server actions

### `src/components/ClientPageShell.tsx`
- Continue de recevoir ses props (pas de changement)
- Ses mutations internes appellent le store

### `src/components/ProjectPageShell.tsx`
- Idem

---

## Étape 6 — Cleanup

- Supprimer `src/lib/data/clients.ts`, `projects.ts`, `documents.ts` (server-only)
- Supprimer `import 'server-only'` des fichiers conservés
- Supprimer les server actions migrées (garder documents server actions)
- Supprimer les `revalidatePath` partout
- Retirer les console.log `[perf]`

---

## Ordre d'implémentation

1. `src/lib/cache.ts` — utilitaires localStorage
2. `src/lib/data/client-queries.ts` — fetch browser
3. `src/lib/store.ts` — Zustand store + loadData + getters
4. `src/lib/store/actions.ts` — mutations optimistes
5. Layout → StoreProvider + trigger loadData
6. Pages → "use client" + hooks store
7. Sidebar → lecture store
8. Cleanup fichiers server-only

## Ce qui ne change PAS
- Auth (middleware + layout server check)
- Chat system (useChat, /api/chat)
- Types (`src/lib/types.ts`)
- UI des composants Shell/Tabs
- Document upload flow (server actions gardées)
- Routing Next.js

---

## UX refactoring (à faire)

| Fix | Impact | Effort |
|-----|--------|--------|
| Recherche sidebar | Fort (visible en permanence) | Faible |
| confirm() → confirmation inline | Fort (ressenti immédiat) | Faible |
| **Toast succès/erreur** | **Moyen-fort** | **Moyen** |

**Règle :** Chaque action (création, suppression, mise à jour, etc.) doit afficher un toast de succès ou d’erreur pour donner un retour immédiat à l’utilisateur.
