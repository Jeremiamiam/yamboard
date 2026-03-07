---
phase: 03-ui-workflow-dashboard
plan: "01"
subsystem: api
tags: [anthropic, system-prompts, workflows, typescript, routing]

# Dependency graph
requires:
  - phase: 02-core-streaming
    provides: /api/chat route with Anthropic streaming + persistence
provides:
  - src/lib/workflows/system-prompts.ts with WORKFLOW_ORDER, WORKFLOW_LABELS, WORKFLOW_UNLOCKS, GBD_GENERIC_PROMPT, WORKFLOW_SYSTEM_PROMPTS (5 workflows)
  - Extended /api/chat route that routes workflowSlug to per-workflow Anthropic system prompt
affects:
  - 03-02 and all subsequent Phase 3 plans (workflow UI reads WORKFLOW_ORDER, WORKFLOW_LABELS, WORKFLOW_UNLOCKS)
  - Future chat components that send workflowSlug in POST body

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Self-contained constants module (no imports) for single source of truth on workflow metadata
    - Lookup-based system prompt routing: WORKFLOW_SYSTEM_PROMPTS[workflowSlug] ?? GBD_GENERIC_PROMPT

key-files:
  created:
    - src/lib/workflows/system-prompts.ts
  modified:
    - src/app/api/chat/route.ts

key-decisions:
  - "WORKFLOW_SYSTEM_PROMPTS lookup with GBD_GENERIC_PROMPT fallback — workflowSlug is optional (backward-compatible)"
  - "system-prompts.ts has zero imports — pure constants module, safe to import from both server and client code"
  - "GBD_GENERIC_PROMPT moved verbatim from route.ts — same content, just relocated to canonical location"

patterns-established:
  - "Workflow state machine via WORKFLOW_UNLOCKS: Record<string, string | null> — completing a workflow unlocks its successor"
  - "WORKFLOW_ORDER array = single canonical source for UI ordering and iteration"

requirements-completed: [WF-01, WF-02, WF-03, WF-04, WF-05]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 3 Plan 01: Workflow System Prompts Summary

**Per-workflow Anthropic system prompts with state machine constants, plus /api/chat workflowSlug routing replacing the Phase 2 hardcoded generic prompt**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T21:58:33Z
- **Completed:** 2026-02-25T22:00:44Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `src/lib/workflows/system-prompts.ts` with all workflow constants (WORKFLOW_ORDER, WORKFLOW_LABELS, WORKFLOW_UNLOCKS, GBD_GENERIC_PROMPT, WORKFLOW_SYSTEM_PROMPTS with 5 full workflow prompts)
- Extended `/api/chat` route to extract `workflowSlug` from request body and select the correct Anthropic system prompt via lookup
- Removed Phase 2 inline `GBD_SYSTEM_PROMPT` constant from route.ts — now imported from canonical location

## Task Commits

Each task was committed atomically:

1. **Task 1: Create workflow system prompt constants** - `55a2f72` (feat)
2. **Task 2: Extend /api/chat route with workflowSlug routing** - `661a89c` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/lib/workflows/system-prompts.ts` — New file. Exports WORKFLOW_ORDER (6 slugs), WORKFLOW_LABELS (slug → display label), WORKFLOW_UNLOCKS (state machine: completing slug unlocks next), GBD_GENERIC_PROMPT (verbatim from route.ts), WORKFLOW_SYSTEM_PROMPTS (5 conversational workflow prompts: start, platform, campaign, site-standalone, wireframe)
- `src/app/api/chat/route.ts` — Import added, inline GBD_SYSTEM_PROMPT removed, workflowSlug extracted from body, systemPrompt resolved via lookup with fallback to GBD_GENERIC_PROMPT

## Decisions Made

- `workflowSlug` is optional in the POST body — if absent or unknown, route falls back to `GBD_GENERIC_PROMPT`, keeping backward compatibility with existing chat pages that don't pass a slug yet
- `system-prompts.ts` has zero imports — makes it safe to import from both server and client contexts without side effects
- GBD_GENERIC_PROMPT content is verbatim from the Phase 2 route.ts inline constant — no content changes, only relocation

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `WORKFLOW_SYSTEM_PROMPTS`, `WORKFLOW_ORDER`, `WORKFLOW_LABELS`, `WORKFLOW_UNLOCKS` are all importable by Phase 3 UI components
- `/api/chat` now routes per-workflow when `workflowSlug` is included in the POST body
- Phase 3 Plan 02 can proceed (workflow UI components reading the state machine constants)

## Self-Check: PASSED

- FOUND: src/lib/workflows/system-prompts.ts
- FOUND: src/app/api/chat/route.ts
- FOUND: .planning/phases/03-ui-workflow-dashboard/03-01-SUMMARY.md
- FOUND commit: 55a2f72 (Task 1)
- FOUND commit: 661a89c (Task 2)
- TypeScript: 0 errors

---
*Phase: 03-ui-workflow-dashboard*
*Completed: 2026-02-25*
