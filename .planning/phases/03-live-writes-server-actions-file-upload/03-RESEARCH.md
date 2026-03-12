# Phase 03: Live Writes — Server Actions + File Upload - Research

**Researched:** 2026-03-08
**Domain:** Next.js 16 Server Actions + Supabase write operations + Supabase Storage signed-URL upload
**Confidence:** HIGH

## Summary

Phase 03 transitions YamBoard from a read-only Supabase integration to a fully persistent CRUD application. The architecture is already established: `'use server'` actions in `app/login/actions.ts` provide the proven pattern. Every Server Action calls `createClient()` (async, cookie-scoped), performs a mutation with `owner_id` from `getUser()`, calls `revalidatePath()` on the relevant paths, and returns `{ error }` on failure — exactly the same shape used by the existing `login()` action.

The five plans decompose cleanly: four actions files (clients, projects+products, documents, contacts) and one cleanup plan removing the legacy in-memory context providers `LocalProjects` and `ProjectOverrides`. The UI Shell components already receive Supabase data via props — the mutation actions just need to be wired into the existing form handlers inside those Client Components, replacing the `setLocalProjects` / `setProjectOverrides` calls.

File upload is the only genuinely new technical domain. The required pattern is: Server Action generates a signed upload URL via `supabase.storage.from('documents').createSignedUploadUrl(path)`, returns it to the Client Component, the browser uploads the file directly to Supabase Storage (no Next.js body proxying), then a second Server Action saves the `storage_path` to the `documents` table. This satisfies DOC-3, PERF-3, and SEC-5 simultaneously.

**Primary recommendation:** Follow `app/login/actions.ts` as the canonical Server Action pattern. Use `supabase.storage.createSignedUploadUrl()` for PDF upload. Call `revalidatePath()` after every mutation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.98.0 (installed) | DB + Storage client | Already installed, all CRUD + Storage APIs |
| `@supabase/ssr` | ^0.9.0 (installed) | Cookie-scoped server client | Already installed, powers all DAL reads |
| `next` | ^16.1.6 (installed) | Server Actions + `revalidatePath` | Built-in, no extra dependency |
| `server-only` | ^0.0.1 (installed) | Guard actions files from client bundle | Already used in DAL |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React 19 `useActionState` | built-in | Pending state + error from Server Action | Forms that display inline errors / loading state |
| `revalidatePath` (Next.js) | built-in | Cache invalidation after mutations | After every INSERT / UPDATE / DELETE |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions | Route Handlers (`app/api/`) | Route Handlers require fetch() calls + manual auth; Server Actions use existing session cookie automatically |
| Signed upload URL | Upload via Server Action body | Server Action body hits 1MB Next.js body limit; signed URL goes direct to Storage (PERF-3) |
| `revalidatePath()` | Supabase Realtime | Realtime explicitly out of scope (solo usage) |

**Installation:** No new packages needed. All required libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/
│   ├── (dashboard)/
│   │   └── actions/          # NEW: mutations live here, co-located with dashboard
│   │       ├── clients.ts    # 03-01
│   │       ├── projects.ts   # 03-02
│   │       ├── documents.ts  # 03-03
│   │       └── contacts.ts   # 03-04
│   └── login/
│       └── actions.ts        # Existing pattern — canonical reference
├── lib/
│   ├── data/                 # Read-only DAL (Phase 02) — untouched
│   └── supabase/
│       ├── server.ts         # createClient() — already async, cookie-scoped
│       └── client.ts         # Browser singleton — used by upload fetch()
└── context/
    ├── LocalProjects.tsx     # DELETED in 03-05
    ├── ProjectOverrides.tsx  # DELETED in 03-05
    ├── ThemeContext.tsx       # KEPT
    └── ClientChatDrawer.tsx  # KEPT
```

### Pattern 1: Standard Server Action (mutations)
**What:** `'use server'` file, `createClient()` + `getUser()`, mutation, `revalidatePath()`, return `{ error }` or `{ data }`
**When to use:** Every INSERT / UPDATE / DELETE on clients, projects, budget_products, documents, contacts

```typescript
// Reference: dashboard/src/app/login/actions.ts (established pattern)
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClient_action(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('clients')
    .insert({
      name: formData.get('name') as string,
      industry: formData.get('industry') as string,
      category: 'client',
      status: 'active',
      color: formData.get('color') as string,
      owner_id: user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/[clientId]', 'layout')
  return { error: null }
}
```

### Pattern 2: Signed Upload URL (PDF)
**What:** Server Action generates signed upload URL → Client uploads file directly → Server Action saves record
**When to use:** DOC-3 — any PDF upload. Never pass file bytes through Server Action body.

```typescript
// Step 1: Server Action — generate upload URL
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createSignedUploadUrl(
  clientId: string,
  filename: string
): Promise<{ signedUrl: string; path: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const path = `${user.id}/${clientId}/${Date.now()}-${filename}`
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(path)

  if (error || !data) return { error: error?.message ?? 'Upload URL failed' }
  return { signedUrl: data.signedUrl, path }
}

// Step 2: Client — PUT file directly to Storage
// fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': 'application/pdf' } })

// Step 3: Server Action — save document record with storage_path
export async function saveDocumentRecord(params: {
  clientId: string
  projectId?: string
  name: string
  type: Document['type']
  storagePath: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('documents')
    .insert({
      client_id: params.clientId,
      project_id: params.projectId ?? null,
      name: params.name,
      type: params.type,
      storage_path: params.storagePath,
      owner_id: user.id,
    })

  if (error) return { error: error.message }
  revalidatePath(`/${params.clientId}`)
  return { error: null }
}
```

### Pattern 3: Signed Read URL (PDF viewer)
**What:** When DocumentViewer opens a PDF doc, fetch a signed READ URL with TTL
**When to use:** DOC-4 — rendering a PDF stored in private bucket

```typescript
// Server Action to generate read URL
export async function getDocumentSignedUrl(storagePath: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600) // 1h TTL — DOC-4

  if (error || !data) return { error: error?.message ?? 'Read URL failed' }
  return { signedUrl: data.signedUrl }
}
```

### Pattern 4: archiveClient / convertProspect
**What:** UPDATE `category` field — no new row, no cascade effects
**When to use:** CLIENT-3 (archive), CLIENT-5 (convert prospect)

```typescript
export async function archiveClient(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('clients')
    .update({ category: 'archived' })
    .eq('id', clientId)
    .eq('owner_id', user.id) // defense-in-depth (RLS already enforces this)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}
```

### Pattern 5: deleteDocument with Storage cleanup
**What:** DELETE document row + delete Storage file if `storage_path` is set
**When to use:** DOC-6 — always delete Storage object before the DB row to avoid orphaned files

```typescript
export async function deleteDocument(documentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Fetch storage_path first
  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path, client_id, project_id')
    .eq('id', documentId)
    .eq('owner_id', user.id)
    .single()

  // Delete Storage file if applicable
  if (doc?.storage_path) {
    await supabase.storage.from('documents').remove([doc.storage_path])
  }

  // Delete DB row
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/${doc?.client_id}`)
  return { error: null }
}
```

### Pattern 6: pinDocument
**What:** UPDATE `is_pinned = true` and `pinned_from_project` on a document row
**When to use:** DOC-7 — promotes a project doc to be visible at client level

```typescript
export async function pinDocument(documentId: string, fromProjectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('documents')
    .update({ is_pinned: true, pinned_from_project: fromProjectId })
    .eq('id', documentId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  // Revalidate both client and project pages
  revalidatePath('/[clientId]', 'page')
  return { error: null }
}
```

### Pattern 7: Wiring actions into Client Components (cleanup migration)
**What:** Replace `addProject(project)` / `setPotentialAmount()` calls with Server Action calls
**When to use:** 03-05 — after actions are in place, the ClientPageShell and BudgetsTab handlers switch to calling Server Actions

```typescript
// Before (LocalProjects context):
addProject(project)

// After (Server Action):
const result = await createProject_action(formData)
if (result.error) setError(result.error)
// revalidatePath() in the action causes the Server Component to re-render with new data
```

### Anti-Patterns to Avoid
- **Never proxy file bytes through a Server Action body:** Next.js enforces a request body size limit; use `createSignedUploadUrl()` instead.
- **Never call `revalidatePath()` before the mutation completes:** Always call after the Supabase operation succeeds.
- **Never omit `.eq('owner_id', user.id)` on updates/deletes:** RLS protects at the DB level, but explicit `.eq('owner_id', user.id)` prevents stale data from being modified in edge cases.
- **Never import from `'@/lib/data/*'` inside Server Actions:** DAL is for reads only. Actions use `createClient()` directly.
- **Never use `getSession()` in Server Actions:** Use `getUser()` exclusively (SEC-3 — already established).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSRF protection | Custom token validation | Next.js Server Actions (built-in) | Actions are POST-only + Next.js validates origin automatically |
| File upload UI | Custom XMLHttpRequest wrapper | Native `fetch()` PUT to signed URL | Supabase Storage returns the signed URL; `fetch()` with `body: file` is all that's needed |
| Signed URL expiry | Custom TTL tracking | Supabase `expiresIn` param | Built into `createSignedUrl(path, seconds)` |
| Owner check | Custom middleware | RLS policies (already in 002_rls.sql) | All 5 tables have `owner_id` policies; defense-in-depth with `.eq('owner_id', user.id)` is optional |
| Optimistic updates | Complex client state | `revalidatePath()` + Server Component re-render | Usage is solo — no concurrency conflicts; round-trip is acceptable |

**Key insight:** Server Actions + `revalidatePath()` eliminate the need for client-side state management for mutations in a solo-usage app. The legacy context providers exist only because there was no persistence layer; Phase 03 deletes the problem by deleting the workaround.

## Common Pitfalls

### Pitfall 1: Forgetting `owner_id` on INSERT
**What goes wrong:** RLS blocks the insert with a policy violation error (returned as Supabase error, not thrown).
**Why it happens:** `WITH CHECK (auth.uid() = owner_id)` in 002_rls.sql means any INSERT without `owner_id` or with a mismatched `owner_id` fails silently if the caller doesn't check `error`.
**How to avoid:** Always call `getUser()` first, always include `owner_id: user.id` in every INSERT payload.
**Warning signs:** `{ error: 'new row violates row-level security policy' }` returned from action.

### Pitfall 2: `revalidatePath()` path mismatch
**What goes wrong:** Data appears stale in UI after mutation because `revalidatePath('/')` invalidates only the root, not `/(dashboard)/[clientId]`.
**Why it happens:** Next.js route groups `(dashboard)` are transparent to `revalidatePath()` — the actual URL is `/[clientId]`, not `/(dashboard)/[clientId]`.
**How to avoid:** Use the URL as seen in the browser: `revalidatePath('/')`, `revalidatePath('/[clientId]', 'page')`, `revalidatePath('/[clientId]/[projectId]', 'page')`.
**Warning signs:** After creating a client, the sidebar doesn't show the new client until manual reload.

### Pitfall 3: Race condition between Storage upload and DB record
**What goes wrong:** The browser uploads the file to Storage, then the tab closes before `saveDocumentRecord()` is called — orphaned Storage file with no DB record.
**Why it happens:** Two-step upload protocol with no transaction.
**How to avoid:** Accept this as a known limitation for v1 (solo usage, rare). If it occurs, the file is visible in Supabase Storage dashboard and can be deleted manually. Consider future improvement: create DB record first with `status: 'pending'`, update to `status: 'ready'` after upload.
**Warning signs:** Files in Storage bucket with no corresponding `documents` row.

### Pitfall 4: Signed upload URL single-use constraint
**What goes wrong:** User tries to re-upload or retry with the same signed upload URL — Supabase returns a 400.
**Why it happens:** `createSignedUploadUrl()` returns a single-use token.
**How to avoid:** If upload fails in the browser, call `createSignedUploadUrl()` again to get a fresh URL. Do not cache signed upload URLs on the client.
**Warning signs:** Second upload attempt to same URL returns 400/403.

### Pitfall 5: LocalProjects removal breaks `getProject()` fallback in ProjectPageShell
**What goes wrong:** After removing `useLocalProjects`, `ProjectPageShell` loses the `getLocalProject()` fallback at line 58. If `project` prop is null (invalid UUID in URL), the shell renders nothing with no error.
**Why it happens:** The Phase 02 comment says "Fallback to local project if not found in server data (Phase 02 acceptable)". In Phase 03, locally-created projects now persist in Supabase, so the fallback is no longer needed — but the null check path must still handle the case where the URL contains a genuinely invalid UUID.
**How to avoid:** Replace `project ?? getLocalProject(projectId, clientId)` with a proper 404 redirect. The `getProject()` DAL already returns `null` for unknown IDs; `ProjectPageShell` should redirect to `/${clientId}` if `project` is null.

### Pitfall 6: ProjectOverrides removal breaks potentialAmount editing in BudgetsTab
**What goes wrong:** `BudgetsTab` currently calls `useProjectOverrides()` to read/set `potentialAmount` inline. After removing `ProjectOverridesProvider`, the field has no write path.
**Why it happens:** `potential_amount` lives in the `projects` table, but editing it in the UI was done via in-memory context only. Phase 02 STATE.md note: "potential editing restored in Phase 03 via Server Actions".
**How to avoid:** In 03-02, add `updateProject()` Server Action that can update `potential_amount`. Wire the potentiel input in `BudgetsTab` to call this action directly instead of `setPotentialAmount()`. Remove `useProjectOverrides` import from `BudgetsTab` in 03-05.

### Pitfall 7: `is_primary` contact constraint
**What goes wrong:** Multiple contacts marked `is_primary: true` for the same client — `toClient()` in the DAL arbitrarily picks the first one.
**Why it happens:** No unique constraint on `(client_id, is_primary)` in the schema.
**How to avoid:** In `createContact()` and `updateContact()` Server Actions, if `is_primary: true` is being set, first UPDATE all other contacts for the same `client_id` to `is_primary: false`, then INSERT/UPDATE the target row. Do this in a single Supabase transaction using `rpc()` or accept two sequential operations (acceptable for solo usage).

## Code Examples

Verified patterns from official sources:

### Storage bucket — createSignedUploadUrl
```typescript
// Source: @supabase/supabase-js storage API
const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUploadUrl('path/to/file.pdf')
// data.signedUrl — use for PUT upload from browser
// data.path — store in documents.storage_path
```

### Storage bucket — createSignedUrl (read)
```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl('path/to/file.pdf', 3600) // TTL in seconds
// data.signedUrl — use in <iframe src> or window.open()
```

### Storage bucket — remove
```typescript
const { error } = await supabase.storage
  .from('documents')
  .remove(['path/to/file.pdf']) // array of paths
```

### revalidatePath — correct paths for this app
```typescript
import { revalidatePath } from 'next/cache'

// After client mutations (create/update/archive/delete):
revalidatePath('/')                           // root redirect + sidebar
revalidatePath('/[clientId]', 'page')         // client page

// After project mutations:
revalidatePath('/[clientId]', 'page')         // client page (project card list)
revalidatePath('/[clientId]/[projectId]', 'page') // project page

// After document mutations:
revalidatePath('/[clientId]', 'page')
revalidatePath('/[clientId]/[projectId]', 'page')

// After contact mutations:
revalidatePath('/[clientId]', 'page')

// After budget_products mutations:
revalidatePath('/[clientId]/[projectId]', 'page')
revalidatePath('/compta', 'page')
```

### Storage bucket setup requirement (migration)
```sql
-- Must be run in Supabase Studio before Phase 03 uploads work
-- Creates private bucket (SEC-5)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- RLS for storage objects
CREATE POLICY "storage: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage: owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```
Note: Storage bucket creation and RLS require a new migration file `005_storage.sql`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useState` + context for client-side mutations | Server Actions + `revalidatePath()` | Next.js 13.4 (stable) | Phase 03: all write operations go through Server Actions |
| Upload via server body (`multer`, etc.) | Signed upload URL direct to object storage | Standard since Supabase Storage launch | PERF-3: no Next.js body limit issues |
| `LocalProjectsProvider` + `ProjectOverridesProvider` | Deleted — Supabase is the source of truth | Phase 03 | ARCH-4 satisfied |
| `localDocs` / `localProducts` useState arrays | DAL reads from Supabase + `revalidatePath()` | Phase 03 | All doc/product UI state becomes server-owned |

**Deprecated/outdated (to remove in this phase):**
- `LocalProjectsProvider` + `useLocalProjects`: replaced by `createProject()` Server Action
- `ProjectOverridesProvider` + `useProjectOverrides`: replaced by `updateProject()` Server Action
- `localDocs` state in `ClientPageShell` and `DocumentsTab`: replaced by `createNote()` Server Action + revalidation
- `localProducts` state in `ProjectPageShell` and `BudgetsTab`: replaced by `createBudgetProduct()` Server Action + revalidation
- `handleAddProject()` / `handleAddDoc()` / `handleAddProduct()` local handlers: each becomes a Server Action call

## Open Questions

1. **Storage bucket RLS — path convention**
   - What we know: The standard pattern for owner-scoped Storage is to prefix path with `uid/`. Our createSignedUploadUrl pattern uses `${user.id}/${clientId}/${filename}`.
   - What's unclear: Whether Supabase's `storage.foldername(name)[1]` correctly extracts the first path segment as `uid` for the RLS policy. Need to verify against Supabase Storage docs.
   - Recommendation: Test with a single upload before wiring the full UI. The migration `005_storage.sql` should be verified manually in Supabase Studio before 03-03.

2. **DocumentViewer — PDF rendering for Storage files**
   - What we know: `DocumentViewer.tsx` exists but currently displays text content only.
   - What's unclear: Whether DocumentViewer needs to be updated to accept a `signedUrl` prop for PDF rendering (via `<iframe>` or `<embed>`), and whether that is in scope for Phase 03 or Phase 04.
   - Recommendation: In scope for 03-03 (`getDocumentSignedUrl` action). DocumentViewer should be updated to render a PDF `<iframe>` when `doc.storage_path` is set.

## Validation Architecture

No test framework is configured in this project (no jest.config, vitest.config, pytest.ini, or `__tests__` directories found). Config has no `workflow.nyquist_validation: false` key — but given zero test infrastructure and the brownfield migration context, validation is manual browser-based.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — no automated test suite configured |
| Config file | none |
| Quick run command | `npm run build` (TypeScript compile pass is the gating check) |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLIENT-1 | Create client persists in DB | manual | n/a | n/a |
| CLIENT-2/3/4/5 | Edit/archive/delete/convert | manual | n/a | n/a |
| PROJECT-1..4 | CRUD projects | manual | n/a | n/a |
| PRODUCT-1..5 | CRUD budget products + stages | manual | n/a | n/a |
| DOC-1 | Create note | manual | n/a | n/a |
| DOC-2 | Create link | manual | n/a | n/a |
| DOC-3 | Upload PDF via signed URL | manual | n/a | n/a |
| DOC-4 | View PDF signed URL | manual | n/a | n/a |
| DOC-6 | Delete document | manual | n/a | n/a |
| DOC-7 | Pin document | manual | n/a | n/a |
| CONTACT-1..4 | CRUD contacts | manual | n/a | n/a |
| ARCH-4 | LocalProjects + ProjectOverrides removed | TypeScript | `npm run build` | ✅ |
| PERF-2 | revalidatePath after every mutation | code review | n/a | n/a |
| PERF-3 | Upload via signed URL (no proxy) | manual | n/a | n/a |
| SEC-5 | Private bucket + signed URLs | manual (Supabase Studio) | n/a | n/a |

### Sampling Rate
- **Per task commit:** `npm run build` — catches TypeScript errors in actions files
- **Per wave merge:** `npm run build` + manual browser smoke test (create one entity, verify persists on reload)
- **Phase gate:** All success criteria manually verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `dashboard/supabase/migrations/005_storage.sql` — Storage bucket creation + RLS policies (required before 03-03 uploads work)
- [ ] Manual: confirm Storage bucket `documents` exists in Supabase Studio before running upload actions

## Sources

### Primary (HIGH confidence)
- Codebase audit: `dashboard/src/app/login/actions.ts` — canonical Server Action pattern for this project
- Codebase audit: `dashboard/supabase/migrations/001_schema.sql` — table structure, `storage_path` and `is_pinned` columns confirmed on `documents`
- Codebase audit: `dashboard/supabase/migrations/002_rls.sql` — RLS policies use `(SELECT auth.uid()) = owner_id` (single-eval form)
- Codebase audit: `dashboard/src/context/LocalProjects.tsx` + `ProjectOverrides.tsx` — exact API surface that must be replaced
- Codebase audit: `dashboard/src/components/ClientPageShell.tsx` + `ProjectPageShell.tsx` + `BudgetsTab.tsx` — all mutation points identified

### Secondary (MEDIUM confidence)
- Next.js 16 App Router docs — `revalidatePath()` API, route group URL transparency
- Supabase Storage docs — `createSignedUploadUrl()` single-use constraint, `createSignedUrl()` TTL param

### Tertiary (LOW confidence)
- Storage RLS path convention (`storage.foldername`) — needs manual verification against current Supabase Storage RLS docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages installed, no new dependencies
- Architecture: HIGH — patterns are direct extrapolations of existing `login/actions.ts` pattern
- Pitfalls: HIGH for common ones (owner_id, revalidatePath paths), MEDIUM for Storage RLS path convention
- File upload pattern: MEDIUM — core API is stable, Storage RLS path detail needs verification

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (Supabase Storage API is stable; Next.js revalidatePath stable since 13.4)
