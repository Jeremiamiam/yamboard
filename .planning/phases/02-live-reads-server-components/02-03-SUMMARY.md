---
phase: 02-live-reads-server-components
plan: 03
subsystem: ui
tags: [next.js, supabase, server-components, react, typescript]

# Dependency graph
requires:
  - phase: 02-01
    provides: DAL layer with server-only imports and Supabase client setup
  - phase: 01-foundation-auth-infrastructure-schema
    provides: Supabase schema with projects/documents tables and RLS policies
provides:
  - lib/data/projects.ts with real Supabase queries (getClientProjects, getProject)
  - lib/data/documents.ts with real Supabase queries (getClientDocs, getProjectDocs, getBudgetProducts)
  - ClientPageShell.tsx client component with all hooks/state/rendering
  - "[clientId]/page.tsx async Server Component with Promise.all parallel fetches"
affects:
  - 02-04
  - 02-05

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server/Client split: page.tsx fetches, ClientPageShell renders"
    - "Promise.all for parallel Supabase fetches in Server Component"
    - "toProject()/toDocument() mappers from Supabase row to typed domain objects"

key-files:
  created:
    - dashboard/src/components/ClientPageShell.tsx
  modified:
    - dashboard/src/lib/data/projects.ts
    - dashboard/src/lib/data/documents.ts
    - dashboard/src/app/(dashboard)/[clientId]/page.tsx
    - dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx
    - dashboard/src/app/(dashboard)/compta/page.tsx

key-decisions:
  - "ClientPageShell receives clients/prospects/archived from Server Component — sidebar data is parallel-fetched server-side, not loaded in client component"
  - "localProjects merge kept in ClientPageShell (Phase 02 only) — propProjects from Supabase + localProjects from context"
  - "[projectId]/page.tsx and compta/page.tsx keep interim mock calls for ClientSidebar props until 02-04 migration"

patterns-established:
  - "Pattern: async Server Component page with Promise.all + Client Component shell receiving all data as props"
  - "Pattern: toX() mapper function converts Supabase row (Record<string, unknown>) to typed domain object"

requirements-completed: [PROJECT-5, ARCH-2, ARCH-3]

# Metrics
duration: 6min
completed: 2026-03-08
---

# Phase 02 Plan 03: Client Page Server Component Migration Summary

**[clientId]/page.tsx migrated to async Server Component using Promise.all with Supabase DAL; all hooks/state extracted to ClientPageShell client component**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-08T11:09:00Z
- **Completed:** 2026-03-08T11:15:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- projects.ts and documents.ts now query Supabase directly with type-safe row mappers
- [clientId]/page.tsx is a pure async Server Component — no "use client", no mock imports
- ClientPageShell.tsx holds all interactive state (useState, useLocalProjects, useClientChatDrawer, forms) and receives data as props
- getBudgetProducts() maps budget_products table with full PaymentStage typing

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace mock wrappers in projects.ts and documents.ts with Supabase queries** - `a98b6b6` (feat)
2. **Task 2: Extract ClientPageShell and convert [clientId]/page.tsx to async Server Component** - `86e6380` (feat)

## Files Created/Modified
- `dashboard/src/lib/data/projects.ts` - Supabase queries with toProject() mapper
- `dashboard/src/lib/data/documents.ts` - Supabase queries with toDocument() mapper and getBudgetProducts()
- `dashboard/src/components/ClientPageShell.tsx` - Client Component with all rendering logic, hooks, and forms
- `dashboard/src/app/(dashboard)/[clientId]/page.tsx` - Async Server Component, Promise.all parallel fetches
- `dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx` - Interim fix: mock props for ClientSidebar + DocumentsTab
- `dashboard/src/app/(dashboard)/compta/page.tsx` - Interim fix: mock props for ClientSidebar

## Decisions Made
- ClientPageShell receives `clients`, `prospects`, `archived` from Server Component rather than fetching in the client — avoids async calls inside client components and delivers sidebar data with zero extra round trips.
- `localProjects` merge preserved in Phase 02 (propProjects from Supabase + localProjects from context) — Phase 03 will persist addProject to Supabase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ClientSidebar missing required props in [projectId]/page.tsx**
- **Found during:** Task 1 (build verification)
- **Issue:** ClientSidebar now requires `clients`/`prospects`/`archived` props (updated in a prior partial execution of 02-02), but `[projectId]/page.tsx` still called `<ClientSidebar />` without props
- **Fix:** Added `getClients` import from mock and passed interim mock props to ClientSidebar
- **Files modified:** `dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx`
- **Verification:** Build passed after fix
- **Committed in:** a98b6b6 (Task 1 commit)

**2. [Rule 3 - Blocking] ClientSidebar missing required props in compta/page.tsx**
- **Found during:** Task 1 (build verification — second pass)
- **Issue:** compta/page.tsx also called `<ClientSidebar />` without required props
- **Fix:** Added `getClients` import from mock and passed interim mock props to ClientSidebar
- **Files modified:** `dashboard/src/app/(dashboard)/compta/page.tsx`
- **Verification:** Build passed after fix
- **Committed in:** a98b6b6 (Task 1 commit)

**3. [Rule 3 - Blocking] DocumentsTab missing required props in [projectId]/page.tsx**
- **Found during:** Task 2 (build verification)
- **Issue:** DocumentsTab now requires `projectDocs` and `clientDocs` props but [projectId]/page.tsx passed none
- **Fix:** Added `DOCUMENTS` import from mock and passed filtered arrays as interim props
- **Files modified:** `dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx`
- **Verification:** Build passed after fix
- **Committed in:** 86e6380 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking)
**Impact on plan:** All three fixes are interim mock props for pages not yet migrated (02-04 will replace them). No scope creep — build correctness maintained throughout migration.

## Issues Encountered
- ClientPageShell.tsx and [clientId]/page.tsx were already partially migrated from a prior session; confirmed correct state by reading files before any write.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 02-04 will migrate [projectId]/page.tsx and remove remaining mock imports from that page
- Once 02-04 completes, all mock data imports will be removed from page-level files
- compta/page.tsx mock props will also need cleanup in a future plan

---
*Phase: 02-live-reads-server-components*
*Completed: 2026-03-08*
