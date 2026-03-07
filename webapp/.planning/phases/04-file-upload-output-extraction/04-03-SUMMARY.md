---
phase: 04-file-upload-output-extraction
plan: "03"
subsystem: database
tags: [supabase, jsonb, rls, output-extraction, postgres]

# Dependency graph
requires:
  - phase: 02-core-streaming
    provides: chat route with stream.on("message") callback pattern
  - phase: 03-ui-workflow-dashboard
    provides: workflowSlug passed through chat API
provides:
  - workflow_outputs table in Supabase with JSONB storage and RLS
  - extractJsonOutput() helper to parse ```json...``` code blocks from assistant text
  - persistOutput() helper to insert parsed JSON into workflow_outputs table
  - chat route extended to auto-extract and save JSON outputs after workflow stream completion
affects: [05-wiki, 06-download-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget output persistence, non-fatal error isolation for secondary persistence, RLS via EXISTS subquery on projects join]

key-files:
  created:
    - supabase/migrations/20260226_workflow_outputs.sql
    - src/lib/supabase/outputs.ts
  modified:
    - src/app/api/chat/route.ts

key-decisions:
  - "Output persistence is non-fatal — errors are logged but do not break the chat stream"
  - "workflowSlug guard ensures non-workflow chats are never affected"
  - "CREATE POLICY without IF NOT EXISTS — PostgreSQL does not support that syntax"
  - "supabase/ directory created at project root (was not previously present)"

patterns-established:
  - "Secondary persistence pattern: primary (messages) persists first, secondary (outputs) runs after inside same callback with independent try/catch"
  - "extractJsonOutput uses regex /```json\\s*\\n([\\s\\S]*?)\\n```/ — only delimited blocks, plain text is ignored"

requirements-completed: [OUTP-01]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 4 Plan 03: Workflow Output Extraction Summary

**workflow_outputs JSONB table with RLS + automatic JSON extraction from chat stream on workflow completion**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-26T08:41:14Z
- **Completed:** 2026-02-26T08:43:17Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `workflow_outputs` table with JSONB column, project FK with CASCADE, index, and 2 RLS policies (SELECT + INSERT) scoped to project ownership
- Implemented `extractJsonOutput()` — extracts first `` ```json...``` `` block from assistant text via regex; returns null if absent
- Implemented `persistOutput()` — validates JSON, inserts parsed object into `workflow_outputs` via Supabase client
- Extended chat route: after each workflow stream completes, JSON output is auto-extracted and persisted without blocking the SSE response

## Task Commits

Each task was committed atomically:

1. **Task 1: workflow_outputs table migration + DB helper** - `efb5c59` (feat)
2. **Task 2: Wire output extraction into chat route** - `b30472d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `supabase/migrations/20260226_workflow_outputs.sql` - CREATE TABLE workflow_outputs with id, project_id FK, workflow_slug, output_json JSONB, created_at, index, and 2 RLS policies
- `src/lib/supabase/outputs.ts` - exports `extractJsonOutput(text): string | null` and `persistOutput(projectId, workflowSlug, jsonString, supabase): Promise<void>`
- `src/app/api/chat/route.ts` - added import + output extraction block inside `stream.on("message")` callback after message persistence

## Decisions Made

- Output persistence is non-fatal: errors in `persistOutput` are caught and logged, the chat stream is unaffected
- The `workflowSlug` guard is inside the already-truthy `assistantContent` block — non-workflow chats never trigger extraction
- `CREATE POLICY` without `IF NOT EXISTS` per PostgreSQL constraint (documented in MEMORY.md)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created supabase/ directory**
- **Found during:** Task 1 (migration file creation)
- **Issue:** `supabase/migrations/` directory did not exist — no prior Supabase migration infrastructure in project
- **Fix:** Created `supabase/migrations/` directory before writing migration file
- **Files modified:** directory only (no source files)
- **Verification:** File written successfully, git tracks it
- **Committed in:** `efb5c59` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing directory)
**Impact on plan:** Minimal infrastructure creation required. No scope creep.

## Issues Encountered

None — TypeScript compiled with 0 errors on both tasks.

## User Setup Required

**SQL migration must be applied manually to Supabase.**

The file `supabase/migrations/20260226_workflow_outputs.sql` must be run in the Supabase SQL editor (or via Supabase CLI) to create the `workflow_outputs` table and policies in the production/staging database.

## Next Phase Readiness

- `workflow_outputs` table migration ready to run in Supabase dashboard
- Outputs are now auto-saved server-side when any workflow assistant response contains a `` ```json...``` `` block
- Phase 4 Plan 04 (file upload) can proceed — output infrastructure is closed
- Wiki integration (Phase 5) can query `workflow_outputs` by `project_id` and `workflow_slug`

---
*Phase: 04-file-upload-output-extraction*
*Completed: 2026-02-26*
