---
phase: 04-file-upload-output-extraction
plan: "04"
subsystem: ui
tags: [supabase, output-display, json-download, server-component, client-component]

# Dependency graph
requires:
  - phase: 04-03
    provides: workflow_outputs table + persistOutput helper
  - phase: 03-ui-workflow-dashboard
    provides: project page server component pattern
provides:
  - WorkflowOutputs client component with JSON download capability
  - GET /api/projects/[id]/outputs — returns workflow_outputs list
  - Project page updated with server-loaded Outputs section
affects: [05-wiki, 06-download-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-loaded initialOutputs passed to client component, client-side Blob/createObjectURL download]

key-files:
  created:
    - src/app/api/projects/[id]/outputs/route.ts
    - src/components/workflow-outputs.tsx
  modified:
    - src/app/projects/[id]/page.tsx

key-decisions:
  - "Outputs are loaded server-side (Server Component) and passed as initialOutputs — avoids extra client fetch, data always fresh on navigation"
  - "Client-side download via createObjectURL/Blob — no server round-trip needed for JSON download"
  - "E2E verification deferred — approved on build check (0 TS errors, next build succeeds); E2E unblocks when Anthropic Files API injection is implemented"

requirements-completed: [OUTP-02, OUTP-03]

# Metrics
duration: ~15min
completed: 2026-02-26
---

# Phase 4 Plan 04: Workflow Outputs UI Summary

**WorkflowOutputs client component with server-loaded data and client-side JSON download via Blob/createObjectURL**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-26T08:44:43Z
- **Completed:** 2026-02-26T09:09:31Z
- **Tasks:** 3 (2 auto + 1 checkpoint — approved)
- **Files modified:** 3

## Accomplishments

- Created `GET /api/projects/[id]/outputs` — returns auth-guarded list of `workflow_outputs` for the project, ordered by date desc
- Created `WorkflowOutputs` client component: displays each output with workflow label (via `WORKFLOW_LABELS`), formatted date, "Télécharger JSON" download button
- Implemented client-side JSON download: `createObjectURL(new Blob([JSON.stringify(output_json, null, 2)]))` — produces `{slug}-output.json` file
- Empty state message: "Aucun output disponible — complétez un workflow pour voir les résultats ici"
- Updated project page (`/projects/[id]/page.tsx`) to query `workflow_outputs` server-side and render `WorkflowOutputs` in an Outputs section below Workflows

## Task Commits

Each task was committed atomically:

1. **Task 1: Outputs API route + WorkflowOutputs component** - `5988c93` (feat)
2. **Task 2: Update project page with Outputs section** - `d061ed5` (feat)

3. **Task 3: Human verification checkpoint** - `1bd17d7` (docs) — approved on build check; E2E deferred

## Files Created/Modified

- `src/app/api/projects/[id]/outputs/route.ts` — GET handler, Supabase auth guard, returns `{ outputs: [...] }`
- `src/components/workflow-outputs.tsx` — "use client" component, WorkflowOutput type, download handler, empty state, Tailwind styling
- `src/app/projects/[id]/page.tsx` — added `workflow_outputs` fetch + `initialOutputs`, `WorkflowOutputs` import, Outputs section in JSX

## Decisions Made

- Outputs loaded server-side in Server Component and passed as `initialOutputs` — consistent with `workflowStates` pattern from Phase 1; avoids extra client-side fetch; always fresh on navigation
- Client-side download avoids any server round-trip for JSON retrieval

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

**E2E test deferred:** End-to-end verification of output display/download (Task 3 manual steps 4-6) cannot be completed until uploaded files are injected into workflow prompts via Anthropic Files API (planned future phase). Without file injection, workflows do not produce JSON outputs in `workflow_outputs`. Human verification approved on build check basis (0 TypeScript errors, `next build` succeeds). E2E unblocks when Anthropic Files API injection is implemented.

## Build Verification

- `npx tsc --noEmit` — 0 errors
- `npx next build` — succeeded, `/api/projects/[id]/outputs` route present in build output

## Self-Check

- [x] `src/app/api/projects/[id]/outputs/route.ts` — created
- [x] `src/components/workflow-outputs.tsx` — created
- [x] `src/app/projects/[id]/page.tsx` — modified with Outputs section
- [x] Commit `5988c93` — Task 1
- [x] Commit `d061ed5` — Task 2
- [x] Task 3 checkpoint — approved 2026-02-26

## Self-Check: PASSED

---
*Phase: 04-file-upload-output-extraction*
*Completed: 2026-02-26*
