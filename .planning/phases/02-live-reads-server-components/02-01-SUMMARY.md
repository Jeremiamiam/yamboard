---
phase: 02-live-reads-server-components
plan: 01
subsystem: database
tags: [dal, server-only, typescript, mock, data-access-layer]

# Dependency graph
requires:
  - phase: 01-foundation-auth-infrastructure-schema
    provides: Supabase client helpers and auth infrastructure that DAL will eventually call
provides:
  - dashboard/src/lib/data/clients.ts — getClients(), getClient() async wrappers
  - dashboard/src/lib/data/projects.ts — getClientProjects(), getProject() async wrappers
  - dashboard/src/lib/data/documents.ts — getClientDocs(), getProjectDocs(), getBudgetProducts() async wrappers
affects:
  - 02-02-page-migration (clients page)
  - 02-03-page-migration (client detail page)
  - 02-04-page-migration (project detail page)

# Tech tracking
tech-stack:
  added: [server-only@0.0.1]
  patterns:
    - "DAL wrapping: async wrappers over sync mock data — identical signatures to future Supabase queries"
    - "server-only guard: import 'server-only' as first statement in all DAL files prevents Client Component import"

key-files:
  created:
    - dashboard/src/lib/data/clients.ts
    - dashboard/src/lib/data/projects.ts
    - dashboard/src/lib/data/documents.ts
  modified:
    - dashboard/package.json
    - dashboard/package-lock.json
    - dashboard/src/app/api/debug/route.ts

key-decisions:
  - "DAL wraps mock arrays (CLIENTS, PROJECTS, DOCUMENTS, BUDGET_PRODUCTS) directly — not the helper functions — to maintain explicit ownership of filtering logic"
  - "getClient() and getProject() return null (not undefined) — aligns with Supabase query result pattern for plan 02-02/03/04 swap-in"
  - "getClients() default parameter category='client' — mirrors mock.ts helper default"

patterns-established:
  - "DAL pattern: import 'server-only' first, then typed imports from mock, async functions returning Promise<T | null>"
  - "Null over undefined for not-found returns in DAL — consistent with Supabase .single() null returns"

requirements-completed: [ARCH-1]

# Metrics
duration: 6min
completed: 2026-03-08
---

# Phase 02 Plan 01: DAL Layer Summary

**Three async DAL files at lib/data/ wrapping mock arrays behind server-only boundaries, enabling incremental page migration without direct mock imports**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-08T11:08:17Z
- **Completed:** 2026-03-08T11:14:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed `server-only` npm package — enforces build-time error if DAL files imported from Client Components (SEC-4)
- Created `dashboard/src/lib/data/clients.ts` with `getClients()` and `getClient()` as async Promise-returning functions
- Created `dashboard/src/lib/data/projects.ts` with `getClientProjects()` and `getProject()` as async wrappers
- Created `dashboard/src/lib/data/documents.ts` with `getClientDocs()`, `getProjectDocs()`, `getBudgetProducts()` as async wrappers
- TypeScript build passes with zero errors after fixing pre-existing type error in debug/route.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Install server-only package** - `0cc1b50` (chore)
2. **Task 2: Create DAL clients.ts, projects.ts, documents.ts** - `a812215` (feat)

## Files Created/Modified
- `dashboard/src/lib/data/clients.ts` - Async DAL for client data (getClients, getClient)
- `dashboard/src/lib/data/projects.ts` - Async DAL for project data (getClientProjects, getProject)
- `dashboard/src/lib/data/documents.ts` - Async DAL for documents and budget products
- `dashboard/package.json` - Added server-only dependency
- `dashboard/package-lock.json` - Lock file updated
- `dashboard/src/app/api/debug/route.ts` - Fixed pre-existing TypeScript type error

## Decisions Made
- DAL imports raw arrays (CLIENTS, PROJECTS, DOCUMENTS, BUDGET_PRODUCTS) rather than the mock helper functions — makes the filtering logic explicit and easier to replace with Supabase queries in plans 02-02/03/04
- `getClient()` and `getProject()` return `null` instead of `undefined` (using `?? null`) — matches the Supabase `.single()` null-on-not-found pattern, making future swap trivial
- Default parameter `category='client'` preserved in `getClients()` to match existing mock helper behaviour

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error in pre-existing debug/route.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** `user.email` typed as `string | undefined` but `checks` record typed as `Record<string, string | boolean>` — TypeScript build failed
- **Fix:** Changed `user ? user.email : 'non connecté'` to `user ? (user.email ?? 'non connecté') : 'non connecté'`
- **Files modified:** dashboard/src/app/api/debug/route.ts
- **Verification:** npm run build exits 0 with no TypeScript errors
- **Committed in:** a812215 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - pre-existing type bug blocking build)
**Impact on plan:** Fix necessary for build verification to succeed. Debug route functionality unchanged — email still displayed, just with safe fallback.

## Issues Encountered
None — plan executed cleanly. The debug/route.ts type error was pre-existing from Phase 01 and blocked build verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DAL layer complete — plans 02-02, 02-03, 02-04 can now migrate pages to import from `lib/data/` instead of `lib/mock` directly
- Pages currently still import from mock directly (4 import sites in src/app/) — that is correct at this stage, migration happens in 02-02/03/04
- Build is clean with zero TypeScript errors

---
*Phase: 02-live-reads-server-components*
*Completed: 2026-03-08*
