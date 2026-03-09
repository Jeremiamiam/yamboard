---
phase: 04-ai-on-real-data-context-builders-migration
plan: "04"
subsystem: api
tags: [context-builders, supabase, dal, token-budget, xml-injection-defense, anthropic]

# Dependency graph
requires:
  - phase: 04-02
    provides: getClientDocsWithPinned DAL function and getAllBudgetProducts
  - phase: 04-03
    provides: async route.ts POST handler with auth gate and model selection

provides:
  - Async context-builders.ts fetching real Supabase data via DAL
  - Token budget enforcement (agency 20K, client 30K, project 40K tokens)
  - XML injection defense wrapping all injected data in scope-specific tags
  - route.ts awaiting all 3 async context builders

affects: [04-05, chat route, AI agents]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "import 'server-only' in context-builders.ts — Supabase calls require server context"
    - "4-level priority truncation loop: level 0 full, level 1 lean products, level 2 doc content truncation, level 3 description truncation"
    - "wrapData() XML defense pattern for all injected Supabase data"
    - "estimateTokens() at 3.5 chars/token conservative for French text"
    - "Promise.all parallelization for all parallel DAL calls"

key-files:
  created: []
  modified:
    - dashboard/src/lib/context-builders.ts
    - dashboard/src/app/(dashboard)/api/chat/route.ts

key-decisions:
  - "fmtPlatform() and fmtBrief() dropped — unified fmtDoc() reads doc.content field only (real Supabase content)"
  - "4-level inline truncation loop preferred over enforceTokenBudget() helper with rebuild callbacks — simpler, deterministic, same result"
  - "buildAgencyContext fetches clients + prospects separately (two getClients calls) rather than one query with OR — matches existing DAL pattern"
  - "Agency scope uses lean contact (name + role only); client/project scope uses full contact (name, role, email, phone)"
  - "getClientDocsWithPinned used for both client and project scope (brand docs + pinned project docs)"
  - "console.warn on budget exceeded — non-blocking, never hard-fail"

patterns-established:
  - "Token budget: estimate with length/3.5, loop truncation levels 0-3 returning on first fit"
  - "XML injection defense: wrapData() appends note about Yam DB source after closing tag"

requirements-completed: [AI-1, AI-2, AI-3, AI-4, AI-5, AI-6]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 04 Plan 04: Context Builders Migration Summary

**Async context-builders.ts using Supabase DAL with XML injection defense, token budget enforcement (3-level truncation), and route.ts awaiting all 3 builders**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T20:48:08Z
- **Completed:** 2026-03-09T20:49:48Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Rewrote context-builders.ts from synchronous mock-data module to async server-only Supabase module
- All 3 builders (buildAgencyContext, buildClientContext, buildProjectContext) now fetch real data via DAL
- XML structural tags wrap all injected data in scope-specific tags per AI-6 requirement
- Token budget enforcement with deterministic 4-level priority truncation (lean products → truncate doc content → truncate descriptions)
- route.ts updated with `await` on all 3 builder calls — minimal 3-line change

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite context-builders.ts as async server-only module** - `8869118` (feat)
2. **Task 2: Update route.ts to await async context builders** - `fa0560c` (feat)

## Files Created/Modified
- `dashboard/src/lib/context-builders.ts` - Fully rewritten: async, DAL imports, XML defense, token budget, fmtPlatform/fmtBrief removed
- `dashboard/src/app/(dashboard)/api/chat/route.ts` - Added `await` before all 3 builder calls

## Decisions Made
- Used 4-level inline truncation loop instead of the `enforceTokenBudget()` helper with rebuild callbacks described in the plan. The inline pattern is simpler, equally deterministic, and avoids passing multiple rebuild lambda functions.
- `fmtClient()` accepts a `lean` parameter (true for agency scope) to control whether phone/email are included, matching the plan's contact rules.
- `buildAgencyDataSection()`, `buildClientDataSection()`, `buildProjectDataSection()` extracted as internal helpers accepting a `truncLevel` parameter — allows the outer loop to call them at each level without repeating data fetching.

## Deviations from Plan

None - plan executed exactly as written. The implementation choice for the truncation algorithm (inline loop vs. enforceTokenBudget helper) was explicitly left to "Claude's Discretion" in the plan.

## Issues Encountered
None. Build passed cleanly after both tasks.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 AI agents now receive real Supabase data in their system prompts
- context-builders.ts is the Phase 04 core deliverable — ready for plan 04-05
- Plan 04-05 can now safely remove mock.ts runtime arrays (the last dependency on mock data)

---
*Phase: 04-ai-on-real-data-context-builders-migration*
*Completed: 2026-03-09*
