---
phase: 02-core-streaming
plan: 02
subsystem: api
tags: [anthropic-sdk, streaming, sse, supabase, nextjs, typescript]

# Dependency graph
requires:
  - phase: 02-core-streaming/02-01
    provides: "@anthropic-ai/sdk installed, persistMessage() helper, messages DB helpers"
  - phase: 01-foundation-auth
    provides: "createClient() server Supabase client with auth.getUser() pattern"
provides:
  - "POST /api/chat Route Handler with SSE streaming via Anthropic MessageStream"
  - "Node.js runtime with maxDuration=300 (5-minute workflow support, CHAT-03)"
  - "Auth guard on /api/chat before proxying to Anthropic (CHAT-02)"
  - "Server-side assistant message persistence after stream completes"
  - "Anti-buffering SSE headers (Content-Type, Cache-Control, X-Accel-Buffering)"
affects: [02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "anthropic.messages.stream() + toReadableStream() for SSE proxy pattern"
    - "stream.on('message') fires after message_stop — correct point to persist full assistant message"
    - "Fire-and-forget persistence in stream event listener (not awaited in main path)"
    - "Node.js Route Handler with maxDuration=300 for long-running Anthropic streams"

key-files:
  created:
    - src/app/api/chat/route.ts
  modified:
    - .env.local

key-decisions:
  - "stream.on('message') event used for persistence (not mid-stream) — fires after message_stop with complete content"
  - "runtime = 'nodejs' mandatory — Anthropic SDK incompatible with Edge runtime"
  - "dynamic = 'force-dynamic' required to prevent Next.js caching SSE responses"
  - "maxDuration = 300 matches longest GBD workflow duration (CHAT-03)"
  - "Fire-and-forget persistence pattern — errors logged but don't break stream"

patterns-established:
  - "SSE proxy pattern: anthropic.messages.stream() → toReadableStream() → new Response()"
  - "Auth-first pattern in Route Handlers: supabase.auth.getUser() before any business logic"

requirements-completed: [CHAT-02, CHAT-03]

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 2 Plan 02: POST /api/chat SSE Streaming Route Handler Summary

**Authenticated Node.js Route Handler proxying Anthropic MessageStream as SSE with 300s timeout and server-side message persistence after stream completion**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T21:25:00Z
- **Completed:** 2026-02-25T21:28:00Z
- **Tasks:** 1
- **Files modified:** 2 (route.ts created, .env.local updated)

## Accomplishments
- Created `src/app/api/chat/route.ts` with full SSE streaming via Anthropic SDK
- Auth guard validates session before proxying to Anthropic (no unauthenticated usage)
- `maxDuration = 300` enables 5-minute GBD workflows without Vercel timeout (CHAT-03)
- `stream.on("message")` persists complete assistant message to Supabase after stream ends
- Build passes with `/api/chat` listed as dynamic route (ƒ)
- TypeScript compiles without errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create POST /api/chat SSE streaming Route Handler** - `5057ba1` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/app/api/chat/route.ts` - SSE streaming Route Handler: auth guard, Anthropic stream proxy, server-side persistence
- `.env.local` - Added ANTHROPIC_API_KEY placeholder (user must replace with real key)

## Decisions Made
- Used `stream.on("message")` event (not "text" event) — fires once after `message_stop` with the complete assembled message. This is the correct point to persist — not mid-stream — per RESEARCH pitfall 4
- Fire-and-forget persistence: the `await persistMessage(...)` call is inside the event listener, not awaited in the main stream path. Errors are logged but don't kill the stream response
- `runtime = "nodejs"` is mandatory. Edge runtime would fail at import time due to Anthropic SDK dependencies
- `dynamic = "force-dynamic"` prevents Next.js from caching the streaming response (would break SSE)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled cleanly on first attempt. Build passed. Route appears correctly as dynamic (ƒ) in build output.

## User Setup Required

**ANTHROPIC_API_KEY must be set in `.env.local` before the route will work.**

The `.env.local` file currently has a placeholder:
```
ANTHROPIC_API_KEY=sk-ant-REPLACE_WITH_YOUR_KEY
```

Replace with your actual Anthropic API key from https://console.anthropic.com/settings/keys

Also ensure the Supabase `messages` table has been created (see 02-01-SUMMARY.md "User Setup Required" section for the SQL migration).

## Next Phase Readiness
- `/api/chat` is live and ready for integration in Plan 02-03 (ChatInput component) and 02-04 (ChatInterface + markdown rendering)
- `toReadableStream()` outputs Anthropic's SSE format — the client will need to parse these events (Plan 02-03)
- ANTHROPIC_API_KEY placeholder in .env.local must be replaced before live testing

---
*Phase: 02-core-streaming*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: src/app/api/chat/route.ts
- FOUND: .planning/phases/02-core-streaming/02-02-SUMMARY.md
- FOUND: commit 5057ba1 (Task 1)
