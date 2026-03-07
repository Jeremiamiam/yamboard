---
phase: 03-ui-workflow-dashboard
plan: "04"
subsystem: ui
tags: [verification, testing, bugfix, supabase, workflow]

# Dependency graph
requires:
  - phase: 03-ui-workflow-dashboard
    provides: WorkflowLauncher, markWorkflowComplete Server Action, workflowSlug chat wiring
provides:
  - Phase 3 human-verified complete — all 6 WF requirements confirmed in browser
  - workflow_slug column on messages table — chat history scoped per workflow
  - redirect() on markWorkflowComplete — completion returns user to project page
affects: [04-file-upload-output-extraction]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "workflow_slug column on messages table — scopes chat history per workflow, prevents cross-contamination between sessions"
    - "redirect() inside Server Action — markWorkflowComplete redirects to project page after DB update"

key-files:
  created: []
  modified:
    - src/lib/supabase/messages.ts
    - src/actions/workflows.ts
    - src/app/api/chat/route.ts
    - src/hooks/use-chat-stream.ts

key-decisions:
  - "workflow_slug stored in messages table: each chat session scoped to one workflow, prevents shared history bug across workflow launches"
  - "redirect() added to markWorkflowComplete Server Action: UX improvement — user lands back on project page after marking complete"

patterns-established:
  - "Bug found during human testing → fixed in a single commit after checkpoint, documented in SUMMARY as post-checkpoint deviation"

requirements-completed: [WF-01, WF-02, WF-03, WF-04, WF-05, WF-06]

# Metrics
duration: ~15min (build check + human verification session + post-checkpoint bug fixes)
completed: 2026-02-25
---

# Phase 3 Plan 04: Build Check + Human Verification Summary

**Phase 3 human-verified complete — workflow launch, system prompt routing, completion unlock chain, and scoped chat history all confirmed in browser**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-25
- **Completed:** 2026-02-25
- **Tasks:** 2 (Task 1: build check, Task 2: human verification)
- **Files modified:** 4 (post-checkpoint bug fixes)

## Accomplishments

- Production build passed with 0 TypeScript errors before human verification
- Human tester confirmed all 5 browser tests: WorkflowLauncher UI, /start launch, /site-standalone launch, mark complete + unlock, locked workflow guards
- Two post-checkpoint bugs found and fixed: chat history cross-contamination across workflows, and missing redirect after mark complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Build and smoke-test** — `1ac9bd0` (docs — commit from prior agent session, build passed)
2. **Task 2: Human verification (post-checkpoint fixes)** — `19d2eec` (fix: scope chat history by workflow + redirect after markComplete)

**Plan metadata:** *(this summary commit)*

## Files Created/Modified

- `src/lib/supabase/messages.ts` — Added `workflow_slug` column to messages table migration; `loadMessages` and `persistMessage` now accept and filter by `workflowSlug`
- `src/actions/workflows.ts` — Added `redirect()` call after `markWorkflowComplete` DB update so the user is sent back to the project page
- `src/app/api/chat/route.ts` — Pass `workflowSlug` through to `persistMessage` so server-side persistence scopes to the current workflow
- `src/hooks/use-chat-stream.ts` — Pass `workflowSlug` through to `loadMessages` on mount so history loads only the current workflow's messages

## Decisions Made

- `workflow_slug` column added to messages table: each workflow launch now has its own isolated conversation history. Without this, opening /start and then /platform would show the same message thread — a confusing UX and functionally incorrect behavior.
- `redirect()` added to `markWorkflowComplete`: after clicking "Marquer comme terminé", the user is immediately taken back to the project page to see the updated workflow statuses. This is the natural next action in the UX flow.

## Deviations from Plan

### Post-Checkpoint Bug Fixes

These issues were discovered during human verification (Task 2) and fixed immediately after the checkpoint was approved.

**1. [Rule 1 - Bug] Chat history was shared across all workflows**
- **Found during:** Task 2 — human testing (Test 2, /start launch)
- **Issue:** All workflow chat sessions shared the same message history for a project. Opening /start then /platform showed all messages from both workflows merged in a single thread.
- **Fix:** Added `workflow_slug` column to `messages` table. `loadMessages` now filters by `workflowSlug` and `persistMessage` writes the slug alongside each message.
- **Files modified:** `src/lib/supabase/messages.ts`, `src/app/api/chat/route.ts`, `src/hooks/use-chat-stream.ts`
- **Verification:** Each workflow now shows only its own conversation history
- **Committed in:** `19d2eec` (post-checkpoint fix)

**2. [Rule 1 - Bug] "Marquer comme terminé" did not redirect after completion**
- **Found during:** Task 2 — human testing (Test 4, mark complete + unlock)
- **Issue:** Clicking "Marquer comme terminé" updated the DB correctly but left the user on the chat page with no feedback. User had to manually navigate back to see the unlocked workflow.
- **Fix:** Added `redirect(\`/projects/\${projectId}\`)` inside `markWorkflowComplete` Server Action after the DB update.
- **Files modified:** `src/actions/workflows.ts`
- **Verification:** Clicking the button now redirects to project page where /platform shows "Disponible"
- **Committed in:** `19d2eec` (post-checkpoint fix)

---

**Total deviations:** 2 post-checkpoint bug fixes (both Rule 1 — Bug)
**Impact on plan:** Both fixes were necessary for correct behavior. The chat history bug was a data isolation issue; the redirect was a missing UX flow step. No scope creep.

## Issues Encountered

None beyond the two bugs documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 3 complete. All 6 WF requirements (WF-01 through WF-06) verified in browser.
- Phase 4 (File Upload + Output Extraction) is ready to plan.
- Open concern before Phase 4: clarify whether GBD passes PDFs directly to Claude via Files API or extracts text upstream — impacts `documents` schema and upload logic.

---
*Phase: 03-ui-workflow-dashboard*
*Completed: 2026-02-25*
