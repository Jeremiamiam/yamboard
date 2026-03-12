---
phase: 04-ai-on-real-data-context-builders-migration
plan: 03
subsystem: api
tags: [anthropic, claude-haiku, claude-opus, streaming, pdf-extraction, auth-gate, token-logging]

# Dependency graph
requires:
  - phase: 04-01
    provides: lib/types.ts shared types used across all phase 04 files
  - phase: 03-live-writes-server-actions-file-upload
    provides: saveDocumentRecord Server Action, Supabase auth pattern (getUser), storage pipeline
provides:
  - Auth-gated POST /api/chat route — 401 for unauthenticated requests
  - Per-scope model selection (Haiku for agency, Opus for client/project)
  - Token usage logging (input_tokens + output_tokens) after each chat response
  - PDF content extraction via Claude Haiku vision stored in documents.content
  - Plain text (txt/md) extraction stored in documents.content
affects:
  - 04-04 (async context builders — route.ts will be updated again)
  - 04-05 (context builders use documents.content for AI context injection)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Per-scope model map (MODEL_BY_SCOPE record) for multi-model routing
    - stream.finalMessage() called after for-await loop for token usage logging
    - Non-blocking extraction: try/catch wraps async side-effect after DB insert

key-files:
  created: []
  modified:
    - dashboard/src/app/(dashboard)/api/chat/route.ts
    - dashboard/src/app/(dashboard)/actions/documents.ts

key-decisions:
  - "MODEL_BY_SCOPE: agency uses Haiku (cost), client/project use Opus (quality)"
  - "finalMessage() called after for-await loop (not during) to access accumulated usage stats"
  - "PDF extraction uses base64 document block (more robust than URL approach)"
  - "extractDocumentContent wrapped in try/catch in saveDocumentRecord — extraction failure never blocks upload"
  - "max_tokens updated from 1024 to 4096 in chat route (aligned with research recommendation)"

patterns-established:
  - "MODEL_BY_SCOPE constant: Record<scope, model-string> for deterministic per-scope model routing"
  - "Non-blocking side-effects: try/catch around async work that should not block primary response"

requirements-completed: [AI-5, AI-6]

# Metrics
duration: 12min
completed: 2026-03-09
---

# Phase 04 Plan 03: Auth Gate, Model Selection, and Document Extraction Summary

**Secured chat route with per-scope model routing (Haiku/Opus), token usage logging via finalMessage(), and Claude Haiku PDF extraction pipeline writing to documents.content**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-09T20:45:00Z
- **Completed:** 2026-03-09T20:57:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Chat route now rejects unauthenticated requests with 401 (getUser() auth gate)
- Agency scope uses claude-haiku-4-5-20251001, client/project use claude-opus-4-6
- input_tokens and output_tokens logged to console after each chat response via stream.finalMessage()
- saveDocumentRecord now extracts text from PDFs via Claude Haiku vision and stores in documents.content
- txt/md uploads extract text directly (no Claude) and store in documents.content
- Extraction failure never blocks the upload — wrapped in try/catch with console.warn

## Task Commits

Each task was committed atomically:

1. **Task 1: Update route.ts — auth gate, model selection, finalMessage logging** - `5fa6d7e` (feat)
2. **Task 2: Extend saveDocumentRecord with PDF/txt content extraction** - `873de45` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `dashboard/src/app/(dashboard)/api/chat/route.ts` - Auth gate, MODEL_BY_SCOPE, finalMessage() logging, max_tokens 4096
- `dashboard/src/app/(dashboard)/actions/documents.ts` - Anthropic import, extractDocumentContent() helper, extraction call in saveDocumentRecord

## Decisions Made
- MODEL_BY_SCOPE uses Haiku for agency (cost efficiency) and Opus for client/project (quality requirement)
- stream.finalMessage() called after the for-await loop completes — not during iteration — to access the fully-accumulated usage object
- PDF extraction uses base64 document block type (more robust than URL-based access; avoids signed URL expiry issues)
- extractDocumentContent is a private (non-exported) helper — not part of the Server Actions public surface
- max_tokens updated from 1024 to 4096 in chat route to align with research recommendation

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None - both tasks compiled cleanly on first attempt, build green.

## User Setup Required
None - no external service configuration required. ANTHROPIC_API_KEY must already be set (established in prior phases).

## Next Phase Readiness
- Auth gate and model routing are in place for 04-04 (async context builders migration)
- documents.content now populated for PDF/txt uploads — context builders (04-04/04-05) can inject document text into AI prompts
- route.ts context builder calls remain synchronous — 04-04 will make them async

## Self-Check: PASSED

- FOUND: dashboard/src/app/(dashboard)/api/chat/route.ts
- FOUND: dashboard/src/app/(dashboard)/actions/documents.ts
- FOUND: .planning/phases/04-ai-on-real-data-context-builders-migration/04-03-SUMMARY.md
- FOUND: commit 5fa6d7e (Task 1)
- FOUND: commit 873de45 (Task 2)

---
*Phase: 04-ai-on-real-data-context-builders-migration*
*Completed: 2026-03-09*
