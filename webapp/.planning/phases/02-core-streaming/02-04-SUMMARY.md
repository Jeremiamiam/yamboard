---
phase: 02-core-streaming
plan: 04
subsystem: ui
tags: [react, nextjs, tailwind, react-markdown, remark-gfm, streaming, sse]

# Dependency graph
requires:
  - phase: 02-core-streaming
    provides: useChatStream hook with SSE reading, isStreaming flag, reconnection backoff
  - phase: 02-core-streaming
    provides: /api/chat route handler with Anthropic streaming
provides:
  - MessageBubble component (user right/blue, assistant left/white with markdown)
  - TypingIndicator component (3 staggered bounce dots for pre-first-token latency)
  - ReconnectionBanner component (idle=hidden, reconnecting=yellow pulse, failed=red+retry)
  - ChatInterface client component orchestrating useChatStream + all message rendering
  - /projects/[id]/chat page (Server Component, auth-guarded, renders ChatInterface)
  - "Ouvrir le chat" link on project detail page
affects:
  - 03-workflow-triggers
  - 04-file-upload

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component (chat page) renders Client Component (ChatInterface) — clean RSC boundary
    - displayMessages array merges committed messages with live streamingContent for token-by-token display
    - h-screen flex flex-col outer + flex-1 overflow-y-auto messages = fixed viewport chat layout

key-files:
  created:
    - src/components/message-bubble.tsx
    - src/components/typing-indicator.tsx
    - src/components/reconnection-banner.tsx
    - src/components/chat-interface.tsx
    - src/app/projects/[id]/chat/page.tsx
  modified:
    - src/app/projects/[id]/page.tsx

key-decisions:
  - "displayMessages merges committed messages[] + streamingContent string — single array for unified rendering"
  - "TypingIndicator shows only when isStreaming && !streamingContent — strictly pre-first-token"
  - "ReconnectionBanner is fixed overlay, z-50 — non-intrusive, dismisses itself when status returns to idle"
  - "ChatInterface h-screen layout: outer div fixed viewport, messages area flex-1 overflow-y-auto for scrollable chat"

patterns-established:
  - "Chat layout: h-screen flex flex-col wrapper with border-b header, flex-1 overflow-y-auto body, border-t footer"
  - "Streaming bubble: spread committed messages then conditionally append {role:assistant, content:streamingContent}"
  - "Auto-scroll: useEffect on [messages, streamingContent] triggers scrollIntoView({behavior:smooth})"

requirements-completed: [CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06]

# Metrics
duration: 5min
completed: 2026-02-25
---

# Phase 2 Plan 04: Chat UI Summary

**4 chat UI components + /projects/[id]/chat page wiring useChatStream to token-by-token rendering with markdown, typing indicator, reconnection banner, and auto-scroll**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-25T21:26:53Z
- **Completed:** 2026-02-25T21:32:00Z
- **Tasks:** 3 of 3 (Task 3 human-verify: APPROVED 2026-02-25)
- **Files modified:** 6

## Accomplishments
- MessageBubble renders user messages (right, blue) and agent messages (left, white) with react-markdown + remark-gfm for rich markdown output
- TypingIndicator shows 3 staggered animate-bounce dots during pre-first-token latency (isStreaming && !streamingContent)
- ReconnectionBanner fixed overlay: idle=hidden, reconnecting=yellow pulse dot, failed=red with manual retry button
- ChatInterface orchestrates useChatStream, auto-scrolls on new content, disables input during stream, merges committed + streaming messages into unified display array
- /projects/[id]/chat page is a Server Component with auth guard + project validation that renders ChatInterface as the client boundary
- "Ouvrir le chat" button added to /projects/[id]/page.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MessageBubble, TypingIndicator, ReconnectionBanner components** - `8439089` (feat)
2. **Task 2: Create ChatInterface and /projects/[id]/chat page** - `b2a291a` (feat)
3. **Task 3: Human verification** - awaiting checkpoint approval

## Files Created/Modified
- `src/components/message-bubble.tsx` - User (right/blue) vs assistant (left/white) with ReactMarkdown
- `src/components/typing-indicator.tsx` - 3 staggered bounce dots, aria-label for accessibility
- `src/components/reconnection-banner.tsx` - Fixed overlay banner tied to ReconnectStatus type from useChatStream
- `src/components/chat-interface.tsx` - Main client component: useChatStream wiring, auto-scroll, disabled input, display message merge
- `src/app/projects/[id]/chat/page.tsx` - Server Component chat page with auth redirect + notFound guard
- `src/app/projects/[id]/page.tsx` - Added "Ouvrir le chat" Link button

## Decisions Made
- `displayMessages` merges committed `messages[]` + live `streamingContent` string into a single array — avoids duplicating render logic for streaming vs committed bubbles
- TypingIndicator strictly shown only when `isStreaming && !streamingContent` — disappears the instant first token arrives
- ReconnectionBanner uses `fixed top-4 left-1/2 -translate-x-1/2` for non-intrusive overlay positioning
- `h-screen flex flex-col` on chat page outer div with `flex-1 overflow-y-auto` on messages area — ensures chat fills viewport with scrollable thread

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**SSE parsing bug (human-verify): Anthropic SDK `toReadableStream()` emits raw NDJSON, not SSE**
- **Symptom:** Empty agent bubble — tokens visible in Network tab but not rendered in UI
- **Root cause:** `use-chat-stream.ts` filtered lines with `if (!line.startsWith("data: ")) continue` but `toReadableStream()` emits raw newline-delimited JSON without `data: ` prefix
- **Fix:** Changed parsing to handle both formats — if line starts with `data: ` strip prefix, otherwise parse as raw JSON
- **File:** `src/hooks/use-chat-stream.ts` (for loop in `attemptStream`)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 CHAT requirements (CHAT-01 to CHAT-06) verified by human 2026-02-25
- Phase 2 complete — Phase 3 (UI Workflow + Dashboard) ready to plan
- ANTHROPIC_API_KEY confirmed working in .env.local

## Self-Check: PASSED

- FOUND: src/components/message-bubble.tsx
- FOUND: src/components/typing-indicator.tsx
- FOUND: src/components/reconnection-banner.tsx
- FOUND: src/components/chat-interface.tsx
- FOUND: src/app/projects/[id]/chat/page.tsx
- FOUND commit 8439089 (Task 1)
- FOUND commit b2a291a (Task 2)
- FOUND commit 1ac9bd0 (metadata/docs)

---
*Phase: 02-core-streaming*
*Completed: 2026-02-25*
