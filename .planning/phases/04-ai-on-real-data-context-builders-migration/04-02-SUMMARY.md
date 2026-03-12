---
phase: 04-ai-on-real-data-context-builders-migration
plan: 02
subsystem: database
tags: [supabase, dal, documents, typescript]

# Dependency graph
requires:
  - phase: 04-01
    provides: lib/types.ts with shared Document type including storagePath field
provides:
  - getClientDocsWithPinned(clientId) function using PostgREST .or() filter
  - storagePath field in toDocument mapper for PDF re-extraction path
affects: [04-03-context-builders, 04-04-pdf-extraction]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PostgREST .or('project_id.is.null,is_pinned.eq.true') for client-level AI context scope"
    - "Separate DAL functions for UI vs AI scope — getClientDocs (UI) stays unchanged, getClientDocsWithPinned (AI) added"

key-files:
  created: []
  modified:
    - "dashboard/src/lib/data/documents.ts"

key-decisions:
  - "getClientDocs unchanged — UI doc list preserves project_id IS NULL behavior; new function added for AI scope"
  - "Single .or() filter in one round-trip rather than union of two queries"
  - "storagePath mapped from storage_path column for PDF re-extraction in plan 04-04"

patterns-established:
  - "DAL variants for different scope requirements: UI functions and AI-context functions coexist in same file"

requirements-completed: [AI-2, AI-3, AI-4]

# Metrics
duration: 15min
completed: 2026-03-09
---

# Phase 04 Plan 02: Documents DAL Extension Summary

**getClientDocsWithPinned() added to lib/data/documents.ts using PostgREST .or() filter, plus storagePath field wired in toDocument mapper**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-09T21:30:00Z
- **Completed:** 2026-03-09T21:45:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `storagePath: (row.storage_path as string | null) ?? undefined` to `toDocument` mapper
- Added `getClientDocsWithPinned(clientId)` using `.or('project_id.is.null,is_pinned.eq.true')` for AI context scopes
- Kept `getClientDocs` unchanged — UI document list still uses `project_id IS NULL` only
- Build passes clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Add storagePath to toDocument mapper + add getClientDocsWithPinned function** - `12523f0` (feat)

**Plan metadata:** (docs: see final commit)

## Files Created/Modified
- `dashboard/src/lib/data/documents.ts` - Added storagePath to mapper + new getClientDocsWithPinned export

## Decisions Made
- Kept `getClientDocs` entirely unchanged — correctness of UI document list depends on `project_id IS NULL` filter
- New `getClientDocsWithPinned` uses `.or()` PostgREST filter for single round-trip covering both `project_id IS NULL` and `is_pinned = true` cases
- Placed new function immediately after `getClientDocs` for logical grouping

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Stale `.next/lock` file from a previous build process blocked first build attempt. Removed the lock file and re-ran build successfully.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `getClientDocsWithPinned` ready for consumption by context builders in plan 04-03
- `storagePath` field available in `Document` type for PDF extraction pipeline in plan 04-04
- No blockers

---
*Phase: 04-ai-on-real-data-context-builders-migration*
*Completed: 2026-03-09*
