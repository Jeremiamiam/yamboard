---
phase: 01-foundation-auth
plan: 05
subsystem: ui
tags: [next.js, supabase, server-component, async-params, workflow-status, badge]

# Dependency graph
requires:
  - phase: 01-foundation-auth/01-04
    provides: Project CRUD (createProject, deleteProject, workflow_states table) and dashboard page

provides:
  - Project detail page at /projects/[id] with workflow status list
  - WorkflowStatusList component with available/completed/locked badges
  - DeleteProjectButton client component extracted from dashboard Server Component
  - Full Phase 1 human verification (all 17 scenarios passed)

affects: [02-core-streaming, 03-ui-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "async params in Next.js 16 Server Components: const { id } = await params"
    - "Single relational Supabase query: select with nested workflow_states(workflow_slug, status)"
    - "Client component extraction pattern: onClick handlers in separate 'use client' files"

key-files:
  created:
    - src/app/projects/[id]/page.tsx
    - src/components/workflow-status-list.tsx
    - src/components/delete-project-button.tsx
  modified:
    - src/app/dashboard/page.tsx

key-decisions:
  - "WorkflowStatusList is a pure display component (no 'use client') — renders server-side"
  - "WORKFLOW_ORDER array enforces consistent display order regardless of DB insertion order"
  - "stateMap lookup with ?? 'locked' fallback — any workflow not in DB defaults to locked"
  - "DeleteProjectButton extracted to 'use client' component to avoid passing event handlers to Server Component props"

patterns-established:
  - "Status badge pattern: inline-flex span with conditional className per status variant"
  - "Workflow slug → display label mapping via WORKFLOW_LABELS Record"
  - "Server Component with await params fetches relational data then passes typed props to child"

requirements-completed: [AUTH-02, AUTH-03, PROJ-03, PROJ-04]

# Metrics
duration: ~15min
completed: 2026-02-25
---

# Phase 1 Plan 05: Project Detail + Phase 1 Verification Summary

**Project detail page with 6-workflow status badges (available/completed/locked) and full Phase 1 human verification of auth + CRUD flow**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-25
- **Completed:** 2026-02-25
- **Tasks:** 2 (Task 1: auto, Task 2: checkpoint:human-verify — approved)
- **Files modified:** 4

## Accomplishments

- Project detail page at `/projects/[id]` — Server Component fetching project name and workflow states from Supabase
- `WorkflowStatusList` component displaying 6 workflows in fixed order with grey/green/lock badges
- `DeleteProjectButton` client component extracted to fix event handler in Server Component error
- All 17 Phase 1 verification scenarios passed (AUTH-01 through AUTH-04, PROJ-01 through PROJ-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build project detail page and WorkflowStatusList component** - `c865ebc` (feat)
2. **Bug fix: Extract DeleteProjectButton as client component** - `4609494` (fix)
3. **Task 2: human-verify checkpoint** - approved by user (no code commit)

## Files Created/Modified

- `src/app/projects/[id]/page.tsx` - Server Component: fetches project + workflow_states, renders detail page with header and WorkflowStatusList
- `src/components/workflow-status-list.tsx` - Static workflow status display: 6 workflows in order with StatusBadge (available/completed/locked)
- `src/components/delete-project-button.tsx` - Client component with onClick confirm dialog calling deleteProject Server Action
- `src/app/dashboard/page.tsx` - Updated to import and use DeleteProjectButton instead of inline form with onClick

## Decisions Made

- `WorkflowStatusList` is a pure Server Component (no `use client`) — all rendering is static, no interactivity needed at this stage
- `WORKFLOW_ORDER = ["start", "platform", "campaign", "site-standalone", "site", "wireframe"]` — fixed order ensures UI consistency regardless of DB row order
- Fallback `?? "locked"` in stateMap lookup — missing workflow entries default to locked, safe for partial data
- `DeleteProjectButton` extracted as `use client` component to separate event handler (onClick confirm) from Server Component dashboard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Extracted DeleteProjectButton to fix "Event handlers cannot be passed to Client Component props" error**
- **Found during:** Task 1 (after building project detail page and running dev server)
- **Issue:** `dashboard/page.tsx` is a Server Component but contained an `onClick` handler inline in a `<form>` element — Next.js 16 throws an error when event handlers are used in Server Components
- **Fix:** Created `src/components/delete-project-button.tsx` with `"use client"` directive, moved the confirm dialog `onClick` and form submission logic into it. Updated `dashboard/page.tsx` to import and render `<DeleteProjectButton projectId={project.id} />`
- **Files modified:** `src/components/delete-project-button.tsx` (created), `src/app/dashboard/page.tsx` (modified)
- **Verification:** TypeScript compiles without errors; delete button works with confirmation dialog
- **Committed in:** `4609494` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Auto-fix essential for correctness — Server Components cannot have event handlers. No scope creep.

## Issues Encountered

None beyond the auto-fixed bug above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 fully complete: login, session persistence, redirect guard, dashboard CRUD, project detail + workflow status
- All 8 Phase 1 requirements (AUTH-01 through AUTH-04, PROJ-01 through PROJ-04) verified by human tester
- Workflow status structure (available/completed/locked) is in place for Phase 3 launch buttons
- Ready to proceed to Phase 2: Core Streaming (Anthropic Route Handler + SSE)

---
*Phase: 01-foundation-auth*
*Completed: 2026-02-25*
