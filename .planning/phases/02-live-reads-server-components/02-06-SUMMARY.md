---
phase: 02-live-reads-server-components
plan: 06
subsystem: ui
tags: [next.js, react, server-components, supabase, typescript, props]

# Dependency graph
requires:
  - phase: 02-live-reads-server-components/02-04
    provides: DocumentsTab prop extraction pattern + ProjectPageShell + [projectId]/page.tsx async Server Component
  - phase: 02-live-reads-server-components/02-01
    provides: DAL layer (lib/data/documents.ts) including getBudgetProducts()
provides:
  - BudgetsTab accepts budgetProducts: BudgetProduct[] as required prop — no internal mock calls
  - ChatTab accepts clientDocs: Document[] and projectDocs: Document[] as required props — no internal mock calls
  - ProjectPageShell wires budgetProducts, clientDocs, projectDocs to the correct tab components
  - [projectId]/page.tsx fetches budgetProducts in Promise.all (8 parallel fetches) and passes to shell
affects: [phase-03-write-operations, any plans that modify BudgetsTab or ChatTab]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prop extraction: Server Component fetches, passes down via shell to leaf tab component"
    - "conversations defaults to [] in Phase 02 (no Supabase table yet) — UI renders empty state correctly"
    - "8-item Promise.all in Server Component for maximum parallel data fetching"

key-files:
  created: []
  modified:
    - dashboard/src/components/tabs/BudgetsTab.tsx
    - dashboard/src/components/tabs/ChatTab.tsx
    - dashboard/src/components/ProjectPageShell.tsx
    - dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx

key-decisions:
  - "conversations in ChatTab defaults to [] in Phase 02 — no Supabase conversations table yet; empty state renders correctly"
  - "budgetProducts fetched in parallel with other 7 items via Promise.all — no sequential overhead"

patterns-established:
  - "Tab components receive Supabase data as props — never call mock or DAL functions internally"
  - "ProjectPageShell is the distribution layer: receives all data from server, fans out to tab components"

requirements-completed: [ARCH-3]

# Metrics
duration: 10min
completed: 2026-03-08
---

# Phase 02 Plan 06: BudgetsTab + ChatTab Prop Extraction Summary

**BudgetsTab and ChatTab wired to receive Supabase data via props, eliminating all internal mock data calls — ARCH-3 fully satisfied**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-08T12:00:00Z
- **Completed:** 2026-03-08T12:10:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- BudgetsTab: `getBudgetProducts`/`getProjectBudgetSummary` imports removed from mock; `budgetProducts: BudgetProduct[]` required prop added; both useMemo blocks now use prop directly
- ChatTab: `getConversations`/`getClientDocs`/`getProjectDocs` imports removed from mock; `clientDocs: Document[]` and `projectDocs: Document[]` props added; conversations defaults to `[]`
- ProjectPageShell: `BudgetProduct` type imported; `budgetProducts` added to Props type and destructuring; both BudgetsTab and ChatTab receive correct props
- [projectId]/page.tsx: `getBudgetProducts` added to DAL import and Promise.all (now 8 parallel fetches); `budgetProducts` passed to ProjectPageShell

## Task Commits

Each task was committed atomically:

1. **Task 1: Update BudgetsTab and ChatTab to accept data as props** - `0e8cf14` (feat)
2. **Task 2: Wire budgetProducts through Server Component → ProjectPageShell → BudgetsTab + ChatTab** - `cb374bd` (feat)

## Files Created/Modified
- `dashboard/src/components/tabs/BudgetsTab.tsx` - Removed mock imports; added budgetProducts prop; both useMemos use prop
- `dashboard/src/components/tabs/ChatTab.tsx` - Removed mock imports; added clientDocs/projectDocs props; conversations = []
- `dashboard/src/components/ProjectPageShell.tsx` - Added BudgetProduct type; added budgetProducts prop; passes to BudgetsTab and ChatTab
- `dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx` - Added getBudgetProducts to Promise.all; passes budgetProducts to shell

## Decisions Made
- `conversations` defaults to `[]` in ChatTab for Phase 02 — no Supabase conversations table exists yet; the UI renders "Aucune conversation." which is correct and Phase 03 will not require this to be wired (out of scope)
- `getBudgetProducts(projectId)` placed as 5th item in Promise.all to maintain alphabetical/logical grouping after the four primary entity fetches

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ARCH-3 is now fully satisfied: all three tabs (Documents, Budget, Chat) receive Supabase data via props from Server Component
- Phase 03 (write operations) is unblocked for Budget and Chat features
- Budget tab now shows persisted `budget_products` rows from Supabase; Chat context docs sourced from `documents` table

## Self-Check: PASSED

- FOUND: dashboard/src/components/tabs/BudgetsTab.tsx
- FOUND: dashboard/src/components/tabs/ChatTab.tsx
- FOUND: dashboard/src/components/ProjectPageShell.tsx
- FOUND: dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx
- FOUND: .planning/phases/02-live-reads-server-components/02-06-SUMMARY.md
- FOUND commit: 0e8cf14 (Task 1)
- FOUND commit: cb374bd (Task 2)
- npm run build: exits 0

---
*Phase: 02-live-reads-server-components*
*Completed: 2026-03-08*
