---
phase: 03-live-writes-server-actions-file-upload
plan: "05"
subsystem: ui
tags: [server-actions, react, next.js, supabase, context-cleanup]

# Dependency graph
requires:
  - phase: 03-live-writes-server-actions-file-upload
    provides: createProject, updateProject, createBudgetProduct, createNote, createLink Server Actions
  - phase: 02-live-reads-server-components
    provides: ClientPageShell, ProjectPageShell, BudgetsTab receiving Supabase data as props

provides:
  - ClientPageShell wired to createProject + createNote Server Actions (no local state)
  - ProjectPageShell redirects to /{clientId} if project prop is null
  - BudgetsTab wired to createBudgetProduct + updateProject Server Actions
  - LocalProjects.tsx and ProjectOverrides.tsx deleted
  - layout.tsx cleaned (no legacy providers)

affects:
  - phase-04-ai-pipeline
  - any future phase adding project or document creation UI

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useTransition wraps Server Action calls in Client Components for pending states
    - onBlur pattern for persisting numeric field changes (potentialAmount) via updateProject
    - redirect() from next/navigation used in Client Component to guard against null project prop

key-files:
  created: []
  modified:
    - dashboard/src/components/ClientPageShell.tsx
    - dashboard/src/components/ProjectPageShell.tsx
    - dashboard/src/components/tabs/BudgetsTab.tsx
    - dashboard/src/app/layout.tsx
  deleted:
    - dashboard/src/context/LocalProjects.tsx
    - dashboard/src/context/ProjectOverrides.tsx

key-decisions:
  - "useTransition used in ClientPageShell and BudgetsTab for Server Action pending states — provides visual feedback without blocking UI"
  - "potentialAmount persisted onBlur (not onChange) to avoid Server Action call on every keystroke"
  - "redirect() called inline in ProjectPageShell function body (not inside useEffect) — works correctly in Client Components for navigation guards"
  - "BudgetsTab localProducts/onAddProduct props removed entirely — BudgetsTab now self-contained with direct Server Action calls"

patterns-established:
  - "Server Action wiring pattern: import action, useTransition, call in startTransition async callback, handle result.error inline"
  - "Numeric field persistence pattern: local useState for optimistic display + Server Action call on blur"

requirements-completed:
  - ARCH-4

# Metrics
duration: 24min
completed: 2026-03-08
---

# Phase 03 Plan 05: Server Actions Wiring + Legacy Context Removal Summary

**createProject/createNote/createBudgetProduct/updateProject Server Actions wired into shells; LocalProjects and ProjectOverrides contexts deleted; Phase 03 ARCH-4 closed**

## Performance

- **Duration:** ~24 min
- **Started:** 2026-03-08T13:39:23Z
- **Completed:** 2026-03-08T14:03:00Z
- **Tasks:** 2 of 2 (checkpoint:human-verify pending)
- **Files modified:** 4 modified, 2 deleted

## Accomplishments

- `ClientPageShell.tsx`: removed `useLocalProjects`, `localDocs` state, and `localProjects` merge; `handleAddMission` now calls `createProject()` Server Action; `handleAddDoc` now calls `createNote()` Server Action; `useTransition` provides pending state on both buttons
- `ProjectPageShell.tsx`: removed `useLocalProjects` fallback, `localProducts` state, and `handleAddProduct`; added `redirect(clientId)` guard if `propProject` is null; `BudgetsTab` no longer receives `localProducts`/`onAddProduct` props
- `BudgetsTab.tsx`: removed `useProjectOverrides`; `potentialAmount` stored in local `useState` initialized from `project.potentialAmount`, persisted via `updateProject` on `onBlur`; `handleAddProduct` calls `createBudgetProduct()` Server Action; `useTransition` provides pending state
- `LocalProjects.tsx` and `ProjectOverrides.tsx` deleted from repository
- `layout.tsx` cleaned: `LocalProjectsProvider` and `ProjectOverridesProvider` removed, `ThemeProvider` and `ClientChatDrawer` intact
- TypeScript compiles with exit 0; zero residual imports of deleted contexts

## Task Commits

1. **Task 1: Wire Server Actions in ClientPageShell + ProjectPageShell + BudgetsTab** — `2ee8feb` (feat)
2. **Task 2: Delete LocalProjects + ProjectOverrides contexts, clean layout.tsx** — `bc51d34` (feat)

## Files Created/Modified

- `dashboard/src/components/ClientPageShell.tsx` — Server Actions wired; local state removed
- `dashboard/src/components/ProjectPageShell.tsx` — useLocalProjects removed; redirect guard added; BudgetsTab props cleaned
- `dashboard/src/components/tabs/BudgetsTab.tsx` — useProjectOverrides removed; updateProject onBlur; createBudgetProduct on submit
- `dashboard/src/app/layout.tsx` — LocalProjectsProvider + ProjectOverridesProvider removed
- `dashboard/src/context/LocalProjects.tsx` — DELETED
- `dashboard/src/context/ProjectOverrides.tsx` — DELETED

## Decisions Made

- `useTransition` chosen over raw async calls in event handlers — provides `isPending` state for button loading indicators without blocking the UI thread
- `potentialAmount` persisted on `onBlur` rather than `onChange` to avoid one Server Action call per keystroke
- `redirect()` called inline in the component function body (before hooks) — this is valid in Next.js Client Components as `redirect()` throws a special exception that Next.js catches
- `BudgetsTab` `localProducts` and `onAddProduct` props removed entirely since BudgetsTab now calls Server Actions directly — cleaner API, no prop drilling needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compiled cleanly on first attempt for both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 03 write layer fully complete: all Server Actions wired, all legacy context providers removed
- `npm run build` should pass (TypeScript confirmed; full Next.js build not run — human-verify checkpoint covers this)
- Phase 04 (AI pipeline) can proceed: clean component tree, no legacy state management

---
*Phase: 03-live-writes-server-actions-file-upload*
*Completed: 2026-03-08*
