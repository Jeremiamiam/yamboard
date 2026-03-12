---
phase: 02-live-reads-server-components
plan: 05
subsystem: ui
tags: [nextjs, supabase, server-components, dal, compta]

# Dependency graph
requires:
  - phase: 02-live-reads-server-components
    provides: "getClients() DAL function and Server Component pattern from 02-01/02-02/02-03/02-04"
provides:
  - "getAllProjects() — queries all projects across all clients, no client_id filter"
  - "getAllBudgetProducts() — queries all budget_products rows, no project_id filter"
  - "compta/page.tsx as async Server Component — fetches from Supabase, no mock imports at runtime"
affects:
  - 02-06
  - 03-live-writes

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getAllX() DAL pattern — global query without entity-scoped filter, follows same row-mapper as scoped variant"
    - "Budget summarization inline in Server Component — reduces per-client totals from allBudgetProducts array"

key-files:
  created: []
  modified:
    - dashboard/src/lib/data/projects.ts
    - dashboard/src/lib/data/documents.ts
    - dashboard/src/app/(dashboard)/compta/page.tsx

key-decisions:
  - "useProjectOverrides removed from compta — project.potentialAmount from Supabase used directly; potential editing restored in Phase 03 via Server Actions"
  - "Budget summarization inlined in Server Component — grouping by clientId/projectId via Array.filter rather than a dedicated helper"

patterns-established:
  - "getAllX() pattern: global DAL query without entity filter — mirrors scoped variant (getClientProjects, getBudgetProducts) with .eq() clause removed"

requirements-completed: [ARCH-1, ARCH-2]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 02 Plan 05: Compta Page Server Component Migration Summary

**compta/page.tsx converted from "use client" + mock imports to async Server Component fetching clients, projects, and budget_products from Supabase — satisfying ARCH-1 (zero runtime mock imports in any page)**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-08T12:01:13Z
- **Completed:** 2026-03-08T12:04:05Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `getAllProjects()` to `lib/data/projects.ts` — returns all projects across all clients, no client_id filter
- Added `getAllBudgetProducts()` to `lib/data/documents.ts` — returns all budget_products rows, no project_id filter
- Converted `compta/page.tsx` to async Server Component: removes "use client", all @/lib/mock runtime imports, and useProjectOverrides; computes budget totals server-side from Supabase data
- Zero runtime mock imports remain in any `app/(dashboard)/` page — ARCH-1 fully satisfied

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getAllProjects() and getAllBudgetProducts() to DAL** - `156eeb9` (feat)
2. **Task 2: Convert compta/page.tsx to async Server Component** - `a01d02e` (feat)

## Files Created/Modified
- `dashboard/src/lib/data/projects.ts` - Added `getAllProjects()` — all projects, no client_id filter
- `dashboard/src/lib/data/documents.ts` - Added `getAllBudgetProducts()` — all budget_products, no project_id filter
- `dashboard/src/app/(dashboard)/compta/page.tsx` - Converted to async Server Component; fetches via Promise.all; inline budget summarization

## Decisions Made
- `useProjectOverrides` removed entirely for Phase 02 — `project.potentialAmount` from Supabase used directly. Potential amount editing will be restored in Phase 03 via Server Actions (write operations phase).
- Budget summarization logic inlined in the Server Component using `Array.filter` grouping — avoids a separate helper function, keeps the computation co-located with the fetch.

## Deviations from Plan

None - plan executed exactly as written. The `ProjectPageShell`/`BudgetsTab` `budgetProducts` prop wire-up was already committed in a prior session (commit `cb374bd` — plan 02-06 executed before 02-05).

## Issues Encountered
The build was already passing before Task 1 execution began (the `budgetProducts` prop bug from plan 02-04 had been fixed in commit `cb374bd` by plan 02-06 which ran first). Both plan tasks executed cleanly with no issues.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All `app/(dashboard)/` pages are now async Server Components with Supabase data fetching
- Zero runtime `@/lib/mock` imports in any page file
- ARCH-1 and ARCH-2 requirements fully satisfied
- Phase 03 (write operations via Server Actions) can proceed

---
*Phase: 02-live-reads-server-components*
*Completed: 2026-03-08*
