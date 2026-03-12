---
phase: 02-live-reads-server-components
plan: "02"
subsystem: database
tags: [supabase, server-components, dal, react, typescript]

# Dependency graph
requires:
  - phase: 02-01
    provides: DAL layer at lib/data/ with mock wrappers and server-only guards
provides:
  - lib/data/clients.ts with real Supabase queries (getClients, getClient)
  - app/(dashboard)/page.tsx as async Server Component redirecting to first live client UUID
  - ClientSidebar accepting clients/prospects/archived as props (no mock runtime call)
affects: [02-03, 02-04, ClientSidebar callers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "toClient() mapping function normalises Supabase rows to Client type — picks is_primary contact or first"
    - "Server Component calls DAL async function, passes results as props to Client Component"
    - "Interim pattern: existing 'use client' pages use synchronous mock getClients() to satisfy new props signature until 02-03/02-04 migration"

key-files:
  created: []
  modified:
    - dashboard/src/lib/data/clients.ts
    - dashboard/src/app/(dashboard)/page.tsx
    - dashboard/src/components/ClientSidebar.tsx
    - dashboard/src/app/(dashboard)/[clientId]/page.tsx
    - dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx
    - dashboard/src/app/(dashboard)/compta/page.tsx

key-decisions:
  - "ClientSidebar refactored to props interface — all three categories (client/prospect/archived) passed from parent to avoid async calls inside Client Component"
  - "compta/page.tsx was an undocumented third caller of ClientSidebar — fixed inline (Rule 3 blocking issue)"
  - "Interim callers (clientId, projectId, compta pages) use synchronous mock getClients() until 02-03/02-04 migrate those pages to Server Components"

patterns-established:
  - "toClient() pattern: row mapping function handles nullable fields and contact join normalization"
  - "Props-down pattern: Server Component fetches data and passes all category arrays to sidebar Client Component"

requirements-completed:
  - CLIENT-6
  - ARCH-2
  - ARCH-3

# Metrics
duration: 12min
completed: 2026-03-08
---

# Phase 02 Plan 02: Client List Live Reads Summary

**Real Supabase client queries replace mock wrapper in clients.ts, home page becomes async Server Component redirecting to first live UUID, and ClientSidebar migrated to props-based data flow**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-08T11:15:00Z
- **Completed:** 2026-03-08T11:27:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- `lib/data/clients.ts` now queries Supabase directly with `toClient()` contact normalization
- `app/(dashboard)/page.tsx` is an async Server Component — fetches first client and redirects to live UUID (falls back to `/onboarding` if no clients)
- `ClientSidebar` refactored from internal mock call to receiving `clients`, `prospects`, `archived` as props
- All three callers (`[clientId]/page.tsx`, `[clientId]/[projectId]/page.tsx`, `compta/page.tsx`) updated with interim mock props
- TypeScript build passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace mock wrapper in clients.ts with real Supabase queries** - `5920851` (feat)
2. **Task 2: Convert page.tsx to async Server Component + update ClientSidebar props** - `f904dee` (feat)

## Files Created/Modified
- `dashboard/src/lib/data/clients.ts` - Real Supabase queries with toClient() mapping and contact join
- `dashboard/src/app/(dashboard)/page.tsx` - Async Server Component, redirects to first client UUID
- `dashboard/src/components/ClientSidebar.tsx` - Accepts clients/prospects/archived props, no mock runtime import
- `dashboard/src/app/(dashboard)/[clientId]/page.tsx` - Added getClients import + interim props to ClientSidebar
- `dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx` - Added getClients import + interim props
- `dashboard/src/app/(dashboard)/compta/page.tsx` - Added interim props to ClientSidebar

## Decisions Made
- `ClientSidebar` receives all three category arrays as props rather than a single `tab`-filtered array — this allows the parent Server Component to fetch all three in parallel in 02-03/02-04 and avoids refetching on tab switch
- `compta/page.tsx` was not mentioned in the plan but is a valid caller that needed the same fix — treated as Rule 3 (blocking)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] compta/page.tsx ClientSidebar missing required props**
- **Found during:** Task 2 (build verification after ClientSidebar prop signature change)
- **Issue:** `compta/page.tsx` uses `<ClientSidebar />` without props — plan only mentioned `[clientId]` and `[clientId]/[projectId]` pages as callers
- **Fix:** Added `getClients` import from mock and passed `clients/prospects/archived` props using interim mock calls
- **Files modified:** `dashboard/src/app/(dashboard)/compta/page.tsx`
- **Verification:** `npm run build` exits 0 with zero TypeScript errors
- **Committed in:** `f904dee` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required fix — build would fail without it. No scope creep.

## Issues Encountered
None beyond the undocumented `compta/page.tsx` caller.

## User Setup Required
None — no external service configuration required. Supabase credentials were configured in phase 01.

## Next Phase Readiness
- CLIENT-6, ARCH-2, ARCH-3 requirements satisfied
- `lib/data/clients.ts` provides real Supabase reads — sidebar will show live clients when connected to Supabase
- 02-03 can now migrate `[clientId]/page.tsx` to async Server Component using real DAL queries
- 02-04 can migrate `[clientId]/[projectId]/page.tsx` similarly
- Interim mock props in callers are safe and explicitly expected — no technical debt beyond planned migration

---
*Phase: 02-live-reads-server-components*
*Completed: 2026-03-08*
