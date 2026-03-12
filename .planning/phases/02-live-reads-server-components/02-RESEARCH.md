# Phase 02: Live Reads — Server Components - Research

**Researched:** 2026-03-08
**Domain:** Next.js 16 App Router Server Components + Supabase data access layer
**Confidence:** HIGH

---

## Summary

Phase 02 migrates all dashboard pages from synchronous mock data to async Supabase reads. The migration is a data layer swap — zero UI changes. The strategy is: introduce a DAL (`lib/data/`) as a thin indirection layer, then migrate each page from `"use client"` + mock imports to `async` Server Components that call DAL functions.

The key architectural insight is that all three pages (`/`, `/[clientId]`, `/[clientId]/[projectId]`) are currently `"use client"` components importing directly from `mock.ts`. Converting them to Server Components requires: (1) making pages `async` functions, (2) moving data fetching to the server, (3) passing data down as props to child Client Components that contain `useState`/hooks. The LocalProjects and ProjectOverrides context providers (in-memory client-side state) are NOT removed in this phase — that is Phase 03's cleanup task (ARCH-4).

The DAL layer is introduced first (02-01), wrapping mock data initially, then each page is migrated one by one to swap the DAL implementation from mock to Supabase. This approach ensures the app remains functional at every commit.

**Primary recommendation:** Build the DAL with exact TypeScript signatures matching mock helpers, then migrate pages by converting to `async` Server Components and pushing any interactive state down to dedicated `"use client"` leaf components.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLIENT-6 | Liste clients persistée et rechargée depuis Supabase | DAL `getClients()` queries `clients` table with `owner_id` RLS filter |
| PROJECT-5 | Voir tous les projets d'un client | DAL `getClientProjects()` queries `projects` table filtered by `client_id` |
| ARCH-1 | Couche DAL introduite avant migration — pas d'import mock direct dans les pages | 02-01 plan creates `lib/data/` layer; pages import only from DAL |
| ARCH-2 | Pages converties en Server Components async (data fetching côté serveur) | 02-02/03/04 convert pages to async Server Components |
| ARCH-3 | Composants UI restent inchangés — reçoivent les données via props | ClientSidebar, BudgetsTab, etc. keep their existing prop interfaces |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | `^0.9.0` | Server-side Supabase client (cookie-based auth) | Already installed — Phase 01 setup |
| `@supabase/supabase-js` | `^2.98.0` | Supabase JS client | Already installed |
| `next` | `^16.1.6` | App Router Server Components, `async` page components | Already installed |
| `server-only` | (npm package) | Prevents DAL from being imported in Client Components | Guard rails for SEC-4 compliance |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `import 'server-only'` | npm builtin | Marks `lib/data/*.ts` as server-only modules | Top of every DAL file — build-time error if imported client-side |

**Installation (only `server-only` is new):**
```bash
cd dashboard && npm install server-only
```

---

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/lib/
├── supabase/
│   ├── server.ts        # already exists — createClient() async
│   └── client.ts        # already exists — browser singleton
├── data/
│   ├── clients.ts       # DAL: getClients, getClient
│   ├── projects.ts      # DAL: getClientProjects, getProject
│   └── documents.ts     # DAL: getClientDocs, getProjectDocs, getBudgetProducts
└── mock.ts              # untouched during Phase 02 (deleted in Phase 04)
```

### Pattern 1: DAL Function Signature (wraps mock, then Supabase)

**What:** Each DAL file exports functions with identical signatures to the mock helpers they replace. In 02-01, the body calls mock. In 02-02/03/04, the body calls Supabase.

**When to use:** Always — this is the indirection that makes page migration incremental.

**02-01 initial shape (mock wrapper):**
```typescript
// dashboard/src/lib/data/clients.ts
import 'server-only'
import { CLIENTS } from '@/lib/mock'
import type { Client, ClientCategory } from '@/lib/mock'

export async function getClients(category: ClientCategory = 'client'): Promise<Client[]> {
  return CLIENTS.filter((c) => c.category === category)
}

export async function getClient(id: string): Promise<Client | null> {
  return CLIENTS.find((c) => c.id === id) ?? null
}
```

**02-02 Supabase implementation:**
```typescript
// dashboard/src/lib/data/clients.ts
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ClientCategory } from '@/lib/mock'

export async function getClients(category: ClientCategory = 'client') {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts(*)')
    .eq('category', category)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getClient(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}
```

### Pattern 2: Converting a "use client" page to an async Server Component

**What:** Remove `"use client"` directive, make the function `async`, use `await params` directly (Next.js 16 requires params to be awaited), fetch data via DAL, pass data as props to Client Component children.

**When to use:** Every page migration (02-02, 02-03, 02-04).

**Example — `app/(dashboard)/[clientId]/page.tsx` after migration:**
```typescript
// NO "use client" at top
import { notFound } from 'next/navigation'
import { getClient, getClientProjects, getClientDocs } from '@/lib/data/clients'
import { ClientPageShell } from '@/components/ClientPageShell' // "use client" wrapper

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const [client, projects, globalDocs] = await Promise.all([
    getClient(clientId),
    getClientProjects(clientId),
    getClientDocs(clientId),
  ])
  if (!client) notFound()

  return (
    <ClientPageShell
      client={client}
      projects={projects}
      globalDocs={globalDocs}
    />
  )
}
```

**Note:** In Next.js 16, `params` is a `Promise<{...}>` — must be `await`ed even in Server Components. The current pages already do `const { clientId } = use(params)` (React `use()` hook in Client Components). In Server Components, use `await params` directly.

### Pattern 3: ClientSidebar Migration

**What:** `ClientSidebar` is a `"use client"` component that currently calls `getClients(tab)` synchronously from mock. After migration, the sidebar cannot call async DAL functions directly. Two options:

**Option A — Keep sidebar as Client Component, fetch per-tab via Server Action / Route Handler (complex).**

**Option B — Pass all three client lists from the Server Component as props.**

**Recommendation: Option B.** The sidebar's parent page is now a Server Component; it can pre-fetch all three categories and pass them down.

```typescript
// In the server page:
const [clients, prospects, archived] = await Promise.all([
  getClients('client'),
  getClients('prospect'),
  getClients('archived'),
])

// Pass to layout/sidebar wrapper:
<ClientSidebar
  clients={clients}
  prospects={prospects}
  archived={archived}
/>
```

ClientSidebar keeps its tab-switching state internally but reads from props instead of calling mock.

**Alternative for home page redirect:** `app/(dashboard)/page.tsx` currently does:
```typescript
import { CLIENTS } from '@/lib/mock'
redirect(`/${CLIENTS[0].id}`)
```
After migration, this page becomes:
```typescript
import { getClients } from '@/lib/data/clients'
import { redirect } from 'next/navigation'

export default async function Home() {
  const clients = await getClients('client')
  const first = clients[0]
  if (first) redirect(`/${first.id}`)
  redirect('/onboarding') // fallback if no clients
}
```

### Pattern 4: Type Mapping — Supabase vs Mock

**What:** The Supabase schema uses snake_case columns; the mock types use camelCase. The DAL must map between them.

| Mock field | Supabase column | DAL mapping needed |
|------------|----------------|--------------------|
| `clientId` | `client_id` | Yes |
| `projectId` | `project_id` | Yes |
| `totalPhases` | `total_phases` | Yes |
| `lastActivity` | `last_activity` | Yes |
| `startDate` | `start_date` | Yes |
| `potentialAmount` | `potential_amount` | Yes |
| `totalAmount` | `total_amount` | Yes |
| `is_pinned` | `is_pinned` | Direct (same) |
| `storage_path` | `storage_path` | Direct (same) |

**Two approaches:**

**Option A:** Keep existing mock TypeScript types, add a mapping function in the DAL.
**Option B:** Generate Supabase types with `npx supabase gen types typescript` and use those directly, updating UI props accordingly.

**Recommendation for Phase 02:** Use Option A — mapping in DAL. This preserves all existing UI component prop types (zero UI changes). Option B deferred to Phase 03 cleanup or beyond.

```typescript
// DAL mapping example:
function toProject(row: SupabaseProjectRow): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    type: row.type as ProjectType,
    status: row.status as ProjectStatus,
    description: row.description ?? '',
    progress: row.progress ?? 0,
    totalPhases: row.total_phases ?? 1,
    lastActivity: row.last_activity ?? '—',
    startDate: row.start_date ?? '—',
    potentialAmount: row.potential_amount ?? undefined,
  }
}
```

### Anti-Patterns to Avoid

- **Importing mock.ts in pages after migration:** Pages should import ONLY from `lib/data/` — never from `lib/mock` directly. Mock stays alive only for DAL internal use during 02-01, then is replaced.
- **Calling `createClient()` in a Client Component:** `lib/supabase/server.ts` uses `cookies()` — only works server-side. Client Components use `lib/supabase/client.ts`.
- **Using `getSession()` instead of `getUser()`:** SEC-3 requirement — already enforced in Phase 01. DAL must call `getUser()` if it needs the current user identity, or rely on RLS (which uses the authenticated session automatically with `@supabase/ssr`).
- **Forgetting `server-only` import:** Without it, a developer can accidentally import a DAL function from a Client Component. The build will succeed but cookies will not be available and queries will fail at runtime.
- **Parallel fetch without Promise.all:** Each `createClient()` call reads cookies. Use `Promise.all` to run independent queries concurrently.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth-aware server queries | Custom auth header injection | `@supabase/ssr` createClient + RLS | RLS automatically filters by `auth.uid()` — no manual `where owner_id =` needed in most cases |
| Type-safe DB queries | String SQL concatenation | Supabase JS `.from().select().eq()` builder | Type-safe, injection-safe, composable |
| Session handling in server | Manual cookie parsing | `createClient()` from `lib/supabase/server.ts` (Phase 01 result) | Already handles cookie read/write lifecycle |
| camelCase/snake_case conversion | Generic transform utility | Explicit per-type mapping in DAL | Explicit is safer — catches field renames at compile time |

---

## Common Pitfalls

### Pitfall 1: ClientSidebar reads clients synchronously from mock — will break if just removing mock import

**What goes wrong:** ClientSidebar calls `getClients(tab)` synchronously on every tab switch. The function is synchronous in mock; async in DAL. Client Components cannot `await` at render time.

**Why it happens:** The sidebar needs different data per tab, but the Server Component renders once.

**How to avoid:** Pre-fetch all three categories in the Server Component (parent), pass as props to sidebar. Sidebar switches tabs by filtering locally from props — no additional fetch needed.

**Warning signs:** TypeScript error "cannot use await in a non-async function" inside ClientSidebar, or runtime error "Objects are not valid as a React child" (Promise returned instead of data).

### Pitfall 2: Pages are "use client" — cannot be directly converted to async Server Components if they contain hooks

**What goes wrong:** `[clientId]/page.tsx` and `[projectId]/page.tsx` are `"use client"` with `useState`, `useEffect`, context hooks. Removing `"use client"` breaks all of these immediately.

**Why it happens:** Data fetching and interaction are currently mixed in the same component.

**How to avoid:** Extract interactive parts into a separate `"use client"` shell component (e.g., `ClientPageShell.tsx`). The Server Component page fetches data and renders the shell with data as props. The shell handles all hooks/state.

**Warning signs:** "useState can only be called in a Client Component" error after removing `"use client"`.

### Pitfall 3: UUID vs slug mismatch in routes

**What goes wrong:** Mock clients use string slugs as IDs (`"brutus"`, `"bloo-conseil"`). Supabase clients use UUIDs. The route `/[clientId]` currently uses slug IDs from mock. After migration, all links must use the Supabase UUID.

**Why it happens:** The seed SQL was written to match mock data but generates new UUIDs. The mock `id` values are not preserved.

**How to avoid:** The `clients` table has a `slug` column (from the schema). DAL `getClient(id)` must query by `id` (UUID). Navigation links in the sidebar generate hrefs from `client.id` — this will automatically use the UUID after migration. The seed data assigns UUIDs, so the first page load after migration will redirect to a UUID-based URL.

**Warning signs:** 404 on `notFound()` because the UUID in the URL doesn't match the legacy slug.

### Pitfall 4: `contact` field on Client — schema mismatch

**What goes wrong:** Mock's `Client` type has a nested `contact: { name, role, email, phone? }` inline object. The Supabase schema stores contacts in a separate `contacts` table with a `client_id` FK.

**Why it happens:** Schema was designed for proper normalization; mock was a flat structure.

**How to avoid:** In the DAL, use `select('*, contacts(*)')` to join contacts. In the mapping function, pick the `is_primary = true` contact (or first contact) to populate the `contact` field expected by UI components.

```typescript
function toClient(row: SupabaseClientWithContacts): Client {
  const primaryContact = row.contacts?.find(c => c.is_primary) ?? row.contacts?.[0]
  return {
    id: row.id,
    name: row.name,
    industry: row.industry ?? '',
    category: row.category as ClientCategory,
    status: row.status as ClientStatus,
    contact: primaryContact ? {
      name: primaryContact.name,
      role: primaryContact.role ?? '',
      email: primaryContact.email ?? '',
      phone: primaryContact.phone ?? undefined,
    } : { name: '—', role: '—', email: '—' },
    color: row.color ?? '#71717a',
    since: row.since ?? undefined,
  }
}
```

**Warning signs:** TypeScript error on `client.contact.name` after migration because `contact` is undefined.

### Pitfall 5: `documents` table lacks a `size` column

**What goes wrong:** Mock's `Document` type has a `size: string` field (e.g., "87 Ko"). The Supabase `documents` table has `storage_path` and `content` but no `size` column.

**Why it happens:** `size` was display metadata in the mock; the real file size comes from Supabase Storage metadata or must be computed from content length.

**How to avoid:** In Phase 02, derive `size` from `content` (word count or char count) for notes, or return `"—"` for documents without content. Phase 03 (real file uploads) will handle actual storage sizes.

```typescript
function toDocument(row: SupabaseDocRow): Document {
  const size = row.content
    ? `~${row.content.split(/\s+/).filter(Boolean).length} mots`
    : row.storage_path ? '—' : '—'
  return {
    id: row.id,
    clientId: row.client_id,
    projectId: row.project_id ?? undefined,
    name: row.name,
    type: row.type as Document['type'],
    updatedAt: new Date(row.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    size,
    content: row.content ?? undefined,
  }
}
```

---

## Code Examples

### DAL: getClientProjects (final Supabase implementation)
```typescript
// dashboard/src/lib/data/projects.ts
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Project, ProjectType, ProjectStatus } from '@/lib/mock'

export async function getClientProjects(clientId: string): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toProject)
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (error) return null
  return toProject(data)
}

function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    name: row.name as string,
    type: (row.type as ProjectType) ?? 'other',
    status: (row.status as ProjectStatus) ?? 'draft',
    description: (row.description as string) ?? '',
    progress: (row.progress as number) ?? 0,
    totalPhases: (row.total_phases as number) ?? 1,
    lastActivity: (row.last_activity as string) ?? '—',
    startDate: (row.start_date as string) ?? '—',
    potentialAmount: row.potential_amount != null ? Number(row.potential_amount) : undefined,
  }
}
```

### DAL: getBudgetProducts
```typescript
// dashboard/src/lib/data/documents.ts (budget section)
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { BudgetProduct, PaymentStage } from '@/lib/mock'

export async function getBudgetProducts(projectId: string): Promise<BudgetProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_products')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    totalAmount: Number(row.total_amount),
    devis: row.devis as PaymentStage | undefined,
    acompte: row.acompte as PaymentStage | undefined,
    avancement: row.avancement as PaymentStage | undefined,
    solde: row.solde as PaymentStage | undefined,
  }))
}
```

### Async Server Component page (minimal shape)
```typescript
// app/(dashboard)/[clientId]/[projectId]/page.tsx
import { notFound } from 'next/navigation'
import { getClient } from '@/lib/data/clients'
import { getProject } from '@/lib/data/projects'
import { ProjectPageShell } from '@/components/ProjectPageShell'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params
  const [client, project] = await Promise.all([
    getClient(clientId),
    getProject(projectId),
  ])
  if (!client || !project || project.clientId !== clientId) notFound()
  return <ProjectPageShell client={client} project={project} />
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `use(params)` in Client Component | `await params` in Server Component | Next.js 15+ | `params` is now a Promise in App Router |
| `getSession()` | `getUser()` | `@supabase/ssr` v0.x guidance | `getUser()` validates JWT server-side; `getSession()` reads from cookie without validation |
| Direct Supabase import in pages | DAL layer (`lib/data/`) | ARCH-1 requirement | Decouples data source from presentation |

---

## Open Questions

1. **TypeScript types for Supabase rows**
   - What we know: No generated types exist yet (`supabase gen types` not run).
   - What's unclear: Whether to use `Record<string, unknown>` casts in DAL or generate proper types.
   - Recommendation: Use explicit `Record<string, unknown>` with casts in Phase 02 (safe, fast). Running `npx supabase gen types typescript` is a Phase 03+ improvement.

2. **Error handling strategy in DAL**
   - What we know: Supabase queries can fail (network, RLS denial, missing row).
   - What's unclear: Should DAL throw, return null, or return `{ data, error }` tuple?
   - Recommendation: DAL functions `throw` on unexpected errors; return `null` on "not found" (`.single()` with no row). Pages use `notFound()` when DAL returns null. This matches the existing mock pattern (null = not found).

3. **LocalProjects context during transition**
   - What we know: `[clientId]/page.tsx` merges mock projects with `LocalProjects` context. After migration to Server Component, the page can no longer call `useLocalProjects()`.
   - What's unclear: Can local projects (in-memory, Phase 02 has no real writes) be dropped or must they be preserved?
   - Recommendation: In Phase 02, drop `LocalProjects` merging in page — the data now comes from Supabase (which includes seed data). The `LocalProjects` context provider itself is removed in Phase 03 (ARCH-4). For Phase 02, the "add mission" form becomes non-functional (acceptable — Phase 03 adds Server Actions).

---

## Validation Architecture

> `workflow.nyquist_validation` key is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — this is a Next.js app with no test runner configured |
| Config file | None — Wave 0 of Phase 02 must establish validation strategy |
| Quick run command | `cd dashboard && npm run build` (TypeScript compile + Next.js build check) |
| Full suite command | `cd dashboard && npm run build && npm run dev` (then manual browser smoke test) |

**No automated test framework (Jest, Vitest, Playwright) is installed.** Phase 02 validation is: TypeScript builds without errors + manual browser smoke tests. This is consistent with the brownfield migration context and solo-developer usage.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Infrastructure |
|--------|----------|-----------|-------------------|----------------|
| CLIENT-6 | Client list loads from Supabase | smoke (manual) | `npm run build` (compile check) | Wave 0: none needed |
| PROJECT-5 | Project list loads for client | smoke (manual) | `npm run build` | Wave 0: none needed |
| ARCH-1 | No `mock.ts` import in pages | static grep | `grep -r "from.*lib/mock" dashboard/src/app/` returns 0 | Wave 0: none needed |
| ARCH-2 | Pages are async Server Components | static check | `grep -rL "use client" dashboard/src/app/(dashboard)/` | Wave 0: none needed |
| ARCH-3 | UI unchanged | visual (manual) | Screenshot comparison (manual) | Wave 0: none needed |

### Key Validation Commands (non-automated)

```bash
# 1. TypeScript compiles cleanly
cd dashboard && npm run build

# 2. No mock.ts import in pages (should return empty after migration)
grep -r "from \"@/lib/mock\"" dashboard/src/app/

# 3. Verify DAL files have server-only guard
grep -r "import 'server-only'" dashboard/src/lib/data/

# 4. Confirm pages lost "use client" directive
grep -rL "use client" dashboard/src/app/(dashboard)/*/page.tsx

# 5. Manual smoke: create client in Supabase Studio → reload → visible in sidebar
```

### Sampling Rate
- **Per task commit:** `cd dashboard && npm run build`
- **Per wave merge:** Build + manual browser test of all three routes
- **Phase gate:** Build green + all three pages load with real data + mock.ts not imported in any page

### Wave 0 Gaps
- [ ] No test framework installed — acceptable for Phase 02 (build + grep + manual validation is sufficient)
- [ ] Consider adding `package.json` script `"check": "tsc --noEmit"` for faster type-only checks without full Next build

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `dashboard/src/app/(dashboard)/` — all three page files read
- Direct code inspection: `dashboard/src/lib/supabase/server.ts` — createClient pattern confirmed
- Direct code inspection: `dashboard/supabase/migrations/001_schema.sql` — full schema with all columns
- Direct code inspection: `dashboard/src/lib/mock.ts` — all types and helper signatures
- Direct code inspection: `dashboard/src/components/ClientSidebar.tsx` — mock import location
- Direct code inspection: `dashboard/src/context/LocalProjects.tsx` — client-side state pattern

### Secondary (MEDIUM confidence)
- Next.js 16 App Router: `params` is `Promise<{...}>` — confirmed via existing page code using `use(params)` (React hook for Promises)
- `server-only` npm package: standard Next.js pattern for guarding server modules (well-documented convention)

### Tertiary (LOW confidence — no verification needed, patterns are stable)
- `Promise.all` for parallel Supabase queries: standard JavaScript, not library-specific
- Supabase RLS automatic filtering: `@supabase/ssr` passes auth cookies to server client, RLS `auth.uid()` resolves automatically

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions known
- Architecture: HIGH — full codebase read, migration path clearly identified
- Pitfalls: HIGH — identified from direct code inspection (type mismatches, contact normalization, size field gap)
- Schema mapping: HIGH — both mock types and SQL schema read directly

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable stack — Supabase + Next.js APIs unlikely to change)
