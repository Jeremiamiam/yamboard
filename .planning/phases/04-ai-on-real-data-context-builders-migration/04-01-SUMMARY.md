---
phase: 04-ai-on-real-data-context-builders-migration
plan: 01
subsystem: api
tags: [typescript, types, mock, migration, refactor]

# Dependency graph
requires:
  - phase: 03-live-writes-server-actions-file-upload
    provides: Server Actions, DAL, all components wired to Supabase
provides:
  - lib/types.ts with all shared types (Client, Project, Document, etc.) and UI config maps
  - Clean import boundary: types come from @/lib/types, runtime data stays in mock.ts
affects: [04-02, 04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [types-only module, no server-only in shared types file]

key-files:
  created:
    - dashboard/src/lib/types.ts
  modified:
    - dashboard/src/lib/data/clients.ts
    - dashboard/src/lib/data/projects.ts
    - dashboard/src/lib/data/documents.ts
    - dashboard/src/app/(dashboard)/actions/documents.ts
    - dashboard/src/app/(dashboard)/actions/clients.ts
    - dashboard/src/app/(dashboard)/actions/projects.ts
    - dashboard/src/hooks/useChat.ts
    - dashboard/src/components/ClientSidebar.tsx
    - dashboard/src/components/ProductDrawer.tsx
    - dashboard/src/components/ProjectPageShell.tsx
    - dashboard/src/components/ClientPageShell.tsx
    - dashboard/src/components/DocumentViewer.tsx
    - dashboard/src/components/AddDocForm.tsx
    - dashboard/src/components/tabs/ChatTab.tsx
    - dashboard/src/components/tabs/ClientChatTab.tsx
    - dashboard/src/components/tabs/BudgetsTab.tsx
    - dashboard/src/components/tabs/DocumentsTab.tsx
    - dashboard/src/app/(dashboard)/compta/page.tsx

key-decisions:
  - "lib/types.ts has no server-only import — used by both server and client components (DAL and UI)"
  - "PROJECT_TYPE_LABEL included in lib/types.ts alongside the other config maps — it is a static map, not runtime data"
  - "mock.ts kept intact — only type/config exports migrated; runtime arrays (CLIENTS, PROJECTS, etc.) stay until 04-05"
  - "context-builders.ts, ClientChatDrawer.tsx, ProduitsTab.tsx kept on @/lib/mock — they import runtime functions/arrays handled in later plans"

patterns-established:
  - "All type imports use @/lib/types, not @/lib/mock"
  - "Config maps (DOC_TYPE_LABEL, PAYMENT_STAGE_LABEL, PROJECT_STATUS_CONFIG, PROJECT_TYPE_LABEL, DOC_TYPE_COLOR) live in lib/types.ts"

requirements-completed: [AI-1, AI-2, AI-3, AI-4, AI-5, AI-6, ARCH-5]

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 04 Plan 01: Types Migration Summary

**lib/types.ts created with all shared types and UI config maps; 18 files migrated from @/lib/mock to @/lib/types with zero TypeScript errors**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T05:38:36Z
- **Completed:** 2026-03-09T05:46:00Z
- **Tasks:** 2
- **Files modified:** 19 (1 created + 18 updated)

## Accomplishments
- Created `dashboard/src/lib/types.ts` as the new home for all shared types and UI config maps
- Migrated 18 files from `@/lib/mock` to `@/lib/types` (DAL, Server Actions, hooks, components, tab components, pages)
- Build passes with zero TypeScript errors — clean separation of types from runtime mock data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/types.ts** - `fa7c473` (feat)
2. **Task 2: Migrate all type imports** - `1a3d4c3` (feat)

## Files Created/Modified
- `dashboard/src/lib/types.ts` - All type exports (Client, Project, Document, etc.) and UI config maps (DOC_TYPE_LABEL, DOC_TYPE_COLOR, PAYMENT_STAGE_LABEL, PROJECT_STATUS_CONFIG, PROJECT_TYPE_LABEL)
- `dashboard/src/lib/data/clients.ts` - Import from @/lib/types
- `dashboard/src/lib/data/projects.ts` - Import from @/lib/types
- `dashboard/src/lib/data/documents.ts` - Import from @/lib/types
- `dashboard/src/app/(dashboard)/actions/documents.ts` - Import from @/lib/types
- `dashboard/src/app/(dashboard)/actions/clients.ts` - Import from @/lib/types
- `dashboard/src/app/(dashboard)/actions/projects.ts` - Import from @/lib/types
- `dashboard/src/hooks/useChat.ts` - Import from @/lib/types
- `dashboard/src/components/ClientSidebar.tsx` - Import from @/lib/types
- `dashboard/src/components/ProductDrawer.tsx` - Import from @/lib/types
- `dashboard/src/components/ProjectPageShell.tsx` - Import from @/lib/types
- `dashboard/src/components/ClientPageShell.tsx` - Import from @/lib/types
- `dashboard/src/components/DocumentViewer.tsx` - Import from @/lib/types
- `dashboard/src/components/AddDocForm.tsx` - Import from @/lib/types
- `dashboard/src/components/tabs/ChatTab.tsx` - Import from @/lib/types
- `dashboard/src/components/tabs/ClientChatTab.tsx` - Import from @/lib/types
- `dashboard/src/components/tabs/BudgetsTab.tsx` - Import from @/lib/types
- `dashboard/src/components/tabs/DocumentsTab.tsx` - Import from @/lib/types
- `dashboard/src/app/(dashboard)/compta/page.tsx` - Import from @/lib/types

## Decisions Made
- `lib/types.ts` has no `import 'server-only'` — the file is used by both server components (DAL, Server Actions) and client components (all UI tabs and shells)
- `PROJECT_TYPE_LABEL` added to `lib/types.ts` despite not being explicitly listed in the plan — it is a static config map used alongside the other maps in `ProjectPageShell.tsx` and `ClientPageShell.tsx`
- Files with runtime function imports (`ClientChatDrawer.tsx` for `getClient`, `ProduitsTab.tsx` for `getBudgetProducts`, `context-builders.ts`) intentionally left on `@/lib/mock` — addressed in 04-05 and 04-02 respectively

## Deviations from Plan

None - plan executed exactly as written (plus `PROJECT_TYPE_LABEL` included in lib/types.ts proactively since it is used by the same components migrated in this plan).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `lib/types.ts` ready for 04-02 (context-builders refactor) and all subsequent plans
- All type imports unified under `@/lib/types`
- mock.ts still present — runtime arrays will be deleted in plan 04-05 after all consumers are migrated

---
*Phase: 04-ai-on-real-data-context-builders-migration*
*Completed: 2026-03-09*
