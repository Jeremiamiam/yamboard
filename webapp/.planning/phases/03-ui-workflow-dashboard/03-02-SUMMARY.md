---
phase: 03-ui-workflow-dashboard
plan: "02"
subsystem: ui
tags: [next.js, react, tailwind, workflow, navigation]

requires:
  - phase: 03-01
    provides: WORKFLOW_ORDER, WORKFLOW_LABELS constants in @/lib/workflows/system-prompts
  - phase: 01-05
    provides: WorkflowStatusList pattern and workflow_states data shape

provides:
  - WorkflowLauncher 'use client' component with per-workflow Lancer buttons
  - Project page updated to use WorkflowLauncher instead of static WorkflowStatusList
  - Navigation from project page to chat?workflow=[slug] for available workflows

affects:
  - 03-03
  - 03-04

tech-stack:
  added: []
  patterns:
    - "'use client' component wrapping a Server Component page to add interactivity (router.push)"
    - "StatusBadge sub-component copied (not imported) from WorkflowStatusList — keeps components independently deployable"

key-files:
  created:
    - src/components/workflow-launcher.tsx
  modified:
    - src/app/projects/[id]/page.tsx

key-decisions:
  - "WorkflowLauncher is 'use client' (router.push) while project page remains a Server Component — RSC boundary at component level"
  - "StatusBadge duplicated into WorkflowLauncher (not shared) — WorkflowStatusList is not exported from workflow-status-list.tsx"
  - "Generic 'Ouvrir le chat' link removed — replaced by per-workflow Lancer buttons, enforcing workflow-scoped chat sessions"

patterns-established:
  - "Lancer button pattern: only rendered when status === 'available', uses router.push with ?workflow= query param"

requirements-completed:
  - WF-01
  - WF-02
  - WF-03
  - WF-04
  - WF-05
  - WF-06

duration: 1min
completed: 2026-02-25
---

# Phase 3 Plan 02: WorkflowLauncher Summary

**Interactive workflow list with per-workflow 'Lancer' buttons navigating to /projects/[id]/chat?workflow=[slug], replacing the static WorkflowStatusList**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-25T22:02:59Z
- **Completed:** 2026-02-25T22:03:48Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `WorkflowLauncher` 'use client' component with StatusBadge sub-component and conditional Lancer buttons
- Updated project page to replace WorkflowStatusList with WorkflowLauncher, passing projectId
- Removed generic "Ouvrir le chat" link and "Phase 3 placeholder" note from project page

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WorkflowLauncher component** - `5f0236f` (feat)
2. **Task 2: Update project page to use WorkflowLauncher** - `b10a552` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/workflow-launcher.tsx` - 'use client' component with StatusBadge, useRouter, and conditional Lancer buttons per workflow
- `src/app/projects/[id]/page.tsx` - Now imports WorkflowLauncher, passes projectId; generic chat link and placeholder note removed

## Decisions Made

- WorkflowLauncher is a 'use client' boundary so the project page (Server Component) can pass data while the launcher handles client-side navigation
- StatusBadge is duplicated into WorkflowLauncher because WorkflowStatusList does not export it — keeps each component independently correct
- Removing the generic "Ouvrir le chat" button enforces workflow-scoped sessions: users always launch a specific workflow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WorkflowLauncher live: clicking "Lancer" on any available workflow navigates to /projects/[id]/chat?workflow=[slug]
- Chat page (02-04) already reads ?workflow= query param and passes it to the API
- Ready for 03-03 (workflow state unlock logic after conversation completes)

---
*Phase: 03-ui-workflow-dashboard*
*Completed: 2026-02-25*
