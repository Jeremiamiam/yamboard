---
phase: 03-ui-workflow-dashboard
plan: "03"
subsystem: ui
tags: [next.js, server-actions, supabase, react, workflows]

# Dependency graph
requires:
  - phase: 03-01
    provides: WORKFLOW_UNLOCKS state machine and system-prompts constants module
  - phase: 03-02
    provides: WorkflowLauncher navigating to /chat?workflow=slug
  - phase: 02-04
    provides: ChatInterface and useChatStream hook foundation
provides:
  - markWorkflowComplete Server Action (src/actions/workflows.ts)
  - useChatStream hook with workflowSlug param forwarded to /api/chat
  - ChatInterface with workflowSlug prop and "Marquer comme terminé" button
  - chat/page.tsx reading ?workflow searchParam and passing to ChatInterface
affects:
  - phase 03-04 (any further workflow enhancements)
  - phase 04 (document upload — will share chat context)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action bound args: markWorkflowComplete.bind(null, projectId, slug) — bound args precede _formData injected by Next.js"
    - "workflowSlug optional param threaded through hook → component → page without breaking backward compat"
    - "searchParams as Promise<{workflow?: string}> in Next.js 16 App Router page"

key-files:
  created:
    - src/actions/workflows.ts
  modified:
    - src/hooks/use-chat-stream.ts
    - src/components/chat-interface.tsx
    - src/app/projects/[id]/chat/page.tsx

key-decisions:
  - "markWorkflowComplete signature: (projectId, slug, _formData) — bound args before FormData, same pattern as deleteProject.bind"
  - "workflowSlug optional (workflowSlug?) across the chain — backward-compatible with generic chat sessions without ?workflow param"
  - "Marquer comme terminé button visible only when workflowSlug present AND messages.length > 0 — prevents premature completion"
  - "Button disabled while isStreaming — prevents race condition between stream commit and workflow state update"

patterns-established:
  - "Server Action bound form pattern: fn.bind(null, arg1, arg2) used as form action prop"
  - "Optional feature threading: add param as optional throughout the call chain to preserve existing behavior"

requirements-completed: [WF-01, WF-02, WF-03, WF-04, WF-05, WF-06]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 3 Plan 03: Chat-Workflow Wiring Summary

**workflowSlug threaded from URL ?workflow param through chat page → ChatInterface → useChatStream → /api/chat body, with markWorkflowComplete Server Action that sets workflow to 'completed' and unlocks successor in WORKFLOW_UNLOCKS chain**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T22:05:47Z
- **Completed:** 2026-02-25T22:07:56Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `src/actions/workflows.ts` with `markWorkflowComplete` Server Action — updates workflow_states to 'completed', unlocks next via WORKFLOW_UNLOCKS, revalidates project page
- Extended `useChatStream` to accept `workflowSlug?` and include it in every POST body to /api/chat
- Extended `ChatInterface` with `workflowSlug?` prop: dynamic subtitle, dynamic empty state, and "Marquer comme terminé" button (conditional + disabled-while-streaming)
- Updated `chat/page.tsx` to await `searchParams: Promise<{workflow?}>` and pass `workflowSlug` to `ChatInterface`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create markWorkflowComplete Server Action** - `9936176` (feat)
2. **Task 2: Extend useChatStream, ChatInterface, and chat page with workflowSlug** - `5e76677` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/actions/workflows.ts` - Server Action: markWorkflowComplete(projectId, slug, _formData) — marks workflow completed, unlocks successor, revalidates path
- `src/hooks/use-chat-stream.ts` - Added workflowSlug? param, included in fetch body, added to useCallback dep array
- `src/components/chat-interface.tsx` - Added workflowSlug? prop, useChatStream(projectId, workflowSlug), header subtitle, empty state, Marquer comme terminé button
- `src/app/projects/[id]/chat/page.tsx` - Added searchParams: Promise<{workflow?}>, awaited, workflowSlug passed to ChatInterface

## Decisions Made
- `markWorkflowComplete.bind(null, projectId, workflowSlug)` pattern for form action — consistent with existing `deleteProject.bind(null, id)` in projects.ts
- `workflowSlug?` optional throughout the chain — chat without ?workflow param still works unchanged (generic "Conversation GBD" mode)
- Button visibility condition: `workflowSlug && messages.length > 0` — ensures conversation has started before allowing completion
- Button disabled when `isStreaming` — prevents workflow state mutation while stream is in flight

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compiled with 0 errors on both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete workflow loop wired: WorkflowLauncher (03-02) navigates to /chat?workflow=X → chat page reads slug → ChatInterface shows context-aware UI → useChatStream sends slug to /api/chat → correct system prompt used (03-01) → user can mark complete → next workflow unlocked
- Ready for Phase 3 Plan 04 (dashboard/project overview enhancements) or Phase 4 (document upload)

---
*Phase: 03-ui-workflow-dashboard*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: src/actions/workflows.ts
- FOUND: src/hooks/use-chat-stream.ts
- FOUND: src/components/chat-interface.tsx
- FOUND: src/app/projects/[id]/chat/page.tsx
- FOUND commit: 9936176 (Task 1)
- FOUND commit: 5e76677 (Task 2)
