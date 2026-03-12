---
phase: 03-live-writes-server-actions-file-upload
plan: "01"
subsystem: database
tags: [supabase, storage, server-actions, rls, next.js]

# Dependency graph
requires:
  - phase: 01-foundation-auth-infrastructure-schema
    provides: clients table with owner_id, RLS policies, createClient() supabase server utility
  - phase: 02-live-reads-server-components
    provides: DAL layer, ClientCategory/ClientStatus types in mock.ts

provides:
  - Private Supabase Storage bucket 'documents' with RLS policies (SEC-5)
  - Server Actions CRUD layer for clients: createClient, updateClient, archiveClient, deleteClient, convertProspect

affects:
  - 03-02 (projects Server Actions will follow this exact pattern)
  - 03-03 (document upload actions depend on the Storage bucket this creates)
  - Any component needing to mutate client data

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action pattern: 'use server' + import 'server-only' + getUser() auth gate + mutation + revalidatePath()"
    - "Supabase import aliased: createClient as createSupabaseClient to avoid name collision with local action"
    - "defense-in-depth: .eq('owner_id', user.id) on all UPDATE/DELETE even with RLS active"
    - "Storage path convention: {uid}/{clientId}/{filename} — first folder segment = uid for RLS foldername() check"

key-files:
  created:
    - dashboard/supabase/migrations/005_storage.sql
    - dashboard/src/app/(dashboard)/actions/clients.ts
  modified: []

key-decisions:
  - "Storage migration is manual-only (no supabase db push) — file delivered for user to run in SQL Editor"
  - "revalidatePath('/') called after all mutations; updateClient also revalidates '/[clientId]'"
  - "satisfies ClientCategory used for literal type narrowing on category string assignments"

patterns-established:
  - "Server Action file: 'use server' + import 'server-only' at top, then imports"
  - "Auth gate: const { data: { user }, error: authError } = await supabase.auth.getUser() — return early if authError || !user"
  - "Mutation flow: getUser → mutation.eq('owner_id', user.id) → revalidatePath → return { error: null }"

requirements-completed: [CLIENT-1, CLIENT-2, CLIENT-3, CLIENT-4, CLIENT-5, SEC-5, PERF-2]

# Metrics
duration: 8min
completed: 2026-03-08
---

# Phase 03 Plan 01: Storage Bucket + Client Server Actions Summary

**Private 'documents' Storage bucket with owner-scoped RLS policies, plus 5 Server Actions (createClient / updateClient / archiveClient / deleteClient / convertProspect) following the getUser() → mutation → revalidatePath() canonical pattern**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-08T12:30:49Z
- **Completed:** 2026-03-08T12:38:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created private Supabase Storage bucket migration with 3 owner-scoped RLS policies (SEC-5)
- Implemented 5 Server Actions for full client CRUD, all with auth gates, owner_id enforcement, and revalidatePath
- TypeScript compiles without errors (npx tsc --noEmit passes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration Storage — bucket privé + RLS policies** - `94787c4` (feat)
2. **Task 2: Server Actions clients** - `465e027` (feat)

## Files Created/Modified
- `dashboard/supabase/migrations/005_storage.sql` - Private bucket INSERT + 3 RLS policies (upload/read/delete scoped to path {uid}/...)
- `dashboard/src/app/(dashboard)/actions/clients.ts` - 5 exported Server Actions with 'use server', auth gate, owner_id, revalidatePath

## Decisions Made
- Storage migration is manual-only — no CLI execution. File delivered as SQL to run in Supabase Studio SQL Editor before PDF uploads are used.
- `createClient as createSupabaseClient` import alias avoids name collision with the exported `createClient` action.
- `satisfies ClientCategory` used for literal type narrowing when assigning 'archived' or 'client' to category field.
- `updateClient` calls `revalidatePath('/')` AND `revalidatePath(\`/${clientId}\`)` — sidebar and detail page both invalidated.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Storage bucket requires manual execution.** Before using PDF upload features, run `dashboard/supabase/migrations/005_storage.sql` in Supabase Studio > SQL Editor. This creates the private 'documents' bucket and the 3 owner-scoped RLS policies.

## Next Phase Readiness
- Client write layer is complete — UI forms can now call these actions to persist data
- Storage bucket infrastructure ready for 03-03 (document upload Server Actions)
- Pattern established for 03-02 (projects Server Actions follow identical structure)

---
*Phase: 03-live-writes-server-actions-file-upload*
*Completed: 2026-03-08*

## Self-Check: PASSED

- FOUND: dashboard/supabase/migrations/005_storage.sql
- FOUND: dashboard/src/app/(dashboard)/actions/clients.ts
- FOUND: .planning/phases/03-live-writes-server-actions-file-upload/03-01-SUMMARY.md
- FOUND: commit 94787c4
- FOUND: commit 465e027
