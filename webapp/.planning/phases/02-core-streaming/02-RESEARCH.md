# Phase 2: Core Streaming - Research

**Researched:** 2026-02-25
**Domain:** Next.js 16 App Router + Anthropic SDK streaming + Supabase chat persistence + SSE reconnection
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Apparence du fil de chat**
- Bulles alignées : messages utilisateur à droite, messages agent à gauche
- Largeur maximale centrée ≈ 700px
- Markdown rendu visuellement dans les réponses agent (gras, listes, code blocks)
- Pas de timestamp affiché sur les messages (Phase 2)

**Comportement du streaming**
- Indicateur de latence initiale : bulle agent avec points animés (...) avant le 1er token
- Auto-scroll vers le bas pendant la génération
- Pas de bouton stop (hors scope Phase 2)
- Input utilisateur désactivé (disabled) pendant le stream

**Déclenchement du workflow**
- Page dédiée `/projects/[id]/chat`
- Input texte libre — l'utilisateur tape n'importe quel message ou commande (/start, etc.)
- Tout message est transmis à l'agent GBD (pas de validation de commandes)
- Une seule conversation active par projet (pas de multi-sessions)

**Reconnexion SSE**
- Bannière discrète "Reconnexion..." qui disparaît une fois reconnecté
- Après reconnexion : historique rechargé depuis DB et affiché instantanément
- 3 tentatives avec backoff exponentiel (1s, 2s, 4s) avant d'arrêter
- Échec final : message d'erreur + bouton "Réessayer manuellement"

### Claude's Discretion
- Design exact des bulles (padding, border-radius, couleurs)
- Animation des points (...) pendant la latence
- Style exact de la bannière de reconnexion
- Gestion des erreurs HTTP (500, 429, etc.)

### Deferred Ideas (OUT OF SCOPE)
- Bouton stop pour interrompre un workflow — Phase 3+
- Sélecteur de workflow graphique avec dépendances visuelles — Phase 3
- Plusieurs sessions de conversation par projet — backlog
- Timestamps sur les messages — Phase 3+ ou polish
- Filtrage/recherche dans l'historique — backlog
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAT-01 | Interface de conversation avec messages alternés user/agent | Chat page `/projects/[id]/chat` with bubble layout; `messages` table in Supabase; Client Component with `useState` for local message state |
| CHAT-02 | Les réponses de l'agent s'affichent en streaming (token par token) | Route Handler `POST /api/chat` using `anthropic.messages.stream().toReadableStream()` piped as SSE; client reads via `fetch()` + `ReadableStream` reader loop |
| CHAT-03 | Le stream survit aux workflows longs (3-5 minutes) sans timeout | `export const maxDuration = 300` on route handler; Vercel Fluid Compute default is 300s on Hobby, 800s on Pro — no extra config needed |
| CHAT-04 | Indicateur visuel pendant la latence initiale (avant le premier token) | Optimistic `isStreaming` state in client; show animated dots bubble while `isStreaming && currentTokens === 0` |
| CHAT-05 | Reconnexion automatique si le stream SSE s'interrompt | Custom reconnect logic in hook: 3 attempts, backoff 1s/2s/4s; on reconnect reload full history from Supabase and re-display |
| CHAT-06 | Historique complet de la conversation persisté en DB et rechargé à la reprise | `messages` table (project_id, role, content, created_at); persist user message before stream, persist complete agent message after `message_stop`; load on page mount |
</phase_requirements>

---

## Summary

Phase 2 adds a live chat interface to the existing project detail page. The technical core is: (1) a Next.js Route Handler that proxies user messages to the Anthropic API and streams the response back as SSE, (2) a client-side React hook that reads the stream and updates UI incrementally, and (3) a Supabase `messages` table that persists the full conversation history for recovery and reconnection.

The architecture decision made in STATE.md — **direct Anthropic SDK, no Vercel AI SDK** — is well-supported. The Anthropic SDK's `messages.stream()` method returns a `MessageStream` with a `.toReadableStream()` method that produces a Web-standard `ReadableStream` suitable for direct use as a `Response` body in a Next.js Route Handler. This avoids any dependency on Vercel AI SDK while providing the same SSE streaming behavior.

Long-duration streaming (3-5 minutes) is now handled automatically by Vercel's Fluid Compute, which defaults to 300s on Hobby plans — no additional configuration beyond `export const maxDuration = 300` is required. Reconnection must be built manually (no native EventSource with POST), but the 3-attempt exponential backoff pattern (1s/2s/4s) is simple to implement with a custom hook. Markdown rendering with `react-markdown` requires the `@tailwindcss/typography` plugin due to Tailwind v4's preflight reset stripping semantic element styles.

**Primary recommendation:** Route Handler with `anthropic.messages.stream().toReadableStream()` → SSE Response → client fetch + ReadableStream reader → `useState` accumulation → `react-markdown` render. Persist messages to Supabase synchronously (user message before, agent message after stream completes).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | `^0.78.0` | Anthropic API client with streaming | Official SDK; `messages.stream()` returns MessageStream with `.toReadableStream()` |
| `react-markdown` | `^9.x` | Render markdown in agent bubbles | Industry standard; TypeScript built-in; works with Tailwind typography plugin |
| `@tailwindcss/typography` | `^0.5.x` | Style markdown output via `prose` class | Required to restore element styles stripped by Tailwind v4 preflight |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `remark-gfm` | `^4.x` | GitHub Flavored Markdown (tables, strikethrough) | Used with `react-markdown` for GBD workflow output which includes tables/lists |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct Anthropic SDK | Vercel AI SDK | STATE.md locked decision: direct SDK; Vercel AI SDK adds abstraction layer and dependency on Vercel-specific hooks |
| `react-markdown` | `streamdown` | streamdown handles partial markdown during streaming more gracefully; consider for Phase 3 if flickering is observed |
| Custom SSE hook | `EventSource` | `EventSource` only supports GET — POST required to send message content; must use `fetch()` |

**Installation:**
```bash
npm install @anthropic-ai/sdk react-markdown remark-gfm
npm install -D @tailwindcss/typography
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # SSE streaming Route Handler
│   └── projects/
│       └── [id]/
│           ├── page.tsx           # existing project detail
│           └── chat/
│               └── page.tsx       # new chat page (Phase 2)
├── components/
│   ├── chat-interface.tsx         # 'use client' — main chat UI
│   ├── message-bubble.tsx         # individual message with react-markdown
│   └── reconnection-banner.tsx    # reconnection status UI
├── hooks/
│   └── use-chat-stream.ts         # custom hook for stream management
└── lib/
    └── supabase/
        └── messages.ts            # DB helpers for message persistence
```

### Pattern 1: Route Handler SSE Streaming
**What:** POST route handler that receives `{projectId, message, history}`, calls Anthropic API, and returns streaming SSE response.
**When to use:** Every user message submission.

```typescript
// Source: Anthropic SDK helpers.md + Next.js Route Segment Config docs
// app/api/chat/route.ts

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"       // REQUIRED: Edge runtime incompatible with Anthropic SDK
export const dynamic = "force-dynamic" // Prevent caching of streaming response
export const maxDuration = 300         // 5 minutes — matches Vercel Fluid Compute default

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const { projectId, message, history } = await request.json()

  // Auth check via Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  // Build messages array from history + new message
  const messages = [
    ...history,   // [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
    { role: "user", content: message }
  ]

  // Create stream — messages.stream() returns MessageStream with .toReadableStream()
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 64000,   // Sonnet 4.6 supports 64K output tokens
    system: GBD_SYSTEM_PROMPT,  // workflow instructions injected here
    messages,
  })

  return new Response(stream.toReadableStream(), {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  })
}
```

### Pattern 2: Client-Side Stream Hook
**What:** Custom hook that POSTs a message, reads the SSE stream token by token, and manages reconnection state.
**When to use:** Called from `ChatInterface` component on form submit.

```typescript
// Source: MDN ReadableStream + Upstash SSE blog pattern
// hooks/use-chat-stream.ts

"use client"
import { useState, useRef, useCallback } from "react"

type Message = { role: "user" | "assistant"; content: string }

export function useChatStream(projectId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [reconnectStatus, setReconnectStatus] = useState<"idle" | "reconnecting" | "failed">("idle")
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (userMessage: string) => {
    setIsStreaming(true)
    setStreamingContent("")

    const userMsg: Message = { role: "user", content: userMessage }
    const history = messages  // snapshot before adding

    setMessages(prev => [...prev, userMsg])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: userMessage, history }),
        signal: abortRef.current?.signal,
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!response.body) throw new Error("No response body")

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      let accumulated = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        // Parse SSE data lines — toReadableStream() emits raw SSE text
        const lines = value.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "content_block_delta" && data.delta?.type === "text_delta") {
                accumulated += data.delta.text
                setStreamingContent(accumulated)
              }
            } catch { /* ignore parse errors on non-JSON lines */ }
          }
        }
      }

      // Stream complete — commit to messages
      setMessages(prev => [...prev, { role: "assistant", content: accumulated }])
      setStreamingContent("")
    } catch (err) {
      // Reconnection handled separately — see reconnect pattern
      throw err
    } finally {
      setIsStreaming(false)
    }
  }, [messages, projectId])

  return { messages, setMessages, isStreaming, streamingContent, sendMessage, reconnectStatus }
}
```

### Pattern 3: Reconnection with Exponential Backoff
**What:** On stream error, attempt to reconnect up to 3 times with 1s/2s/4s delays. On success, reload full history from DB.
**When to use:** Wrapped around `sendMessage` failure in the hook.

```typescript
// Reconnection logic — inline in hook or separate utility
const MAX_ATTEMPTS = 3
const BACKOFF_DELAYS = [1000, 2000, 4000] // ms

async function withReconnect(fn: () => Promise<void>, onReconnecting: () => void, onFailed: () => void) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      await fn()
      return
    } catch (err) {
      if (attempt < MAX_ATTEMPTS - 1) {
        onReconnecting()
        await new Promise(res => setTimeout(res, BACKOFF_DELAYS[attempt]))
      } else {
        onFailed()
      }
    }
  }
}
```

### Pattern 4: Supabase Messages Schema
**What:** Persist every message to a `messages` table for history retrieval.

```sql
-- Migration: create messages table
create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Index for fast history retrieval
create index messages_project_id_created_at on messages(project_id, created_at asc);

-- RLS: same as projects — all authenticated users can read/write
alter table messages enable row level security;
create policy "authenticated users can manage messages"
  on messages for all
  using (auth.role() = 'authenticated');
```

### Pattern 5: Markdown Rendering with Tailwind v4
**What:** Render agent responses with markdown. Tailwind v4's preflight strips semantic element styles — `@tailwindcss/typography` restores them.

```typescript
// components/message-bubble.tsx
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function AgentBubble({ content }: { content: string }) {
  return (
    <div className="max-w-[560px] rounded-2xl px-4 py-3 bg-white border border-gray-200 self-start">
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
```

```css
/* globals.css — Tailwind v4 plugin registration */
@plugin "@tailwindcss/typography";
```

### Anti-Patterns to Avoid

- **Using `EventSource` for streaming chat**: `EventSource` is GET-only. Can't send message content. Must use `fetch()` with `ReadableStream`.
- **Piping stream through `edge` runtime**: Anthropic SDK requires Node.js runtime. Must declare `export const runtime = "nodejs"` (or omit — it's the default) and never set `runtime = "edge"`.
- **Streaming without `force-dynamic`**: Next.js may try to cache Route Handler responses. Always add `export const dynamic = "force-dynamic"` on streaming routes.
- **Persisting message before stream completes**: Don't insert the assistant message mid-stream. Persist only after `message_stop` event (or `reader.done`). Partial messages create broken history.
- **Sending full conversation history from client**: Keep the history state in the hook and pass it with each request — the Anthropic API is stateless. Without this, every message starts a fresh context.
- **Not handling SSE parse failures**: `toReadableStream()` emits raw SSE text including `event:`, `data:`, empty lines, and ping events. Always wrap JSON.parse in try-catch.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming API integration | Custom fetch + stream parser | `anthropic.messages.stream()` | Handles retries, event accumulation, TypeScript types, error events, `finalMessage()` |
| Markdown rendering | Manual HTML generation | `react-markdown` + `remark-gfm` | XSS safe, handles all CommonMark edge cases, code block nesting, nested lists |
| Markdown styling | Custom CSS for h1/h2/li/code | `@tailwindcss/typography` `prose` class | Handles 20+ elements including nested structures, code blocks, blockquotes |
| SSE text parsing | String splitting on `data:` | `TextDecoderStream` + line splitting (or `EventSourceParserStream`) | Handles chunked delivery where a single `read()` may contain partial SSE lines |

**Key insight:** The Anthropic SDK's `messages.stream()` is not just a thin wrapper — it accumulates events, handles reconnection internally to the API, and provides typed access to all event types. The `.toReadableStream()` method produces a spec-compliant ReadableStream that Next.js Route Handlers accept directly as a Response body.

---

## Common Pitfalls

### Pitfall 1: Vercel Timeout Without Fluid Compute
**What goes wrong:** Stream works locally but times out after 10-60s on Vercel.
**Why it happens:** If Fluid Compute is disabled (older projects), default timeout is 10s (Hobby) or 15s (Pro). GBD workflows run 3-5 minutes.
**How to avoid:** Verify Fluid Compute is enabled (default for new projects). Set `export const maxDuration = 300` in the route handler. On Pro plan, can go up to 800s.
**Warning signs:** 504 errors in Vercel logs at exactly 10s or 60s boundaries.

**Verified limits (as of 2026-02-25, Vercel docs):**
- Fluid Compute ON (default): Hobby = 300s max, Pro = 800s max
- Fluid Compute OFF: Hobby = 60s max, Pro = 300s max

### Pitfall 2: SSE Buffering / Proxy Chunking
**What goes wrong:** Tokens arrive in bulk instead of streaming — looks like no streaming.
**Why it happens:** Some proxies (nginx, Vercel Edge Network, corporate proxies) buffer SSE responses. The `Cache-Control: no-cache, no-transform` header prevents transform buffering. `X-Accel-Buffering: no` is needed for nginx.
**How to avoid:** Include all three SSE headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`. Vercel handles this automatically for `text/event-stream` responses.
**Warning signs:** Tokens appear all at once after a delay rather than one by one.

### Pitfall 3: Conversation History Not Passed
**What goes wrong:** Agent responds without any memory of previous messages.
**Why it happens:** Anthropic API is fully stateless — no server-side session. Every request must include the full `messages` array.
**How to avoid:** Store the conversation in React state (or load from DB) and include it as `history` in every POST request. The route handler prepends it before calling the API.
**Warning signs:** Agent answers "As we discussed..." but then asks for information already given.

### Pitfall 4: Race Condition on Message Persistence
**What goes wrong:** Duplicate messages in DB on reconnection.
**Why it happens:** User message is persisted before stream starts. If stream fails and reconnects, user message is inserted again.
**How to avoid:** Insert user message with an idempotency key (use a client-generated UUID passed in the request). Check for existing message before inserting. Or: insert optimistically and use `ON CONFLICT DO NOTHING` with a unique constraint on `(project_id, content, created_at)` — though timestamp collision is unlikely.
**Warning signs:** Conversation history shows duplicate user messages after reconnection.

### Pitfall 5: `toReadableStream()` SSE Format
**What goes wrong:** Client can't parse the streamed data — sees empty or garbled content.
**Why it happens:** `toReadableStream()` emits Anthropic's raw SSE wire format, not plain text tokens. Each chunk contains `event: content_block_delta\ndata: {...}\n\n`. Client must parse these SSE frames, not treat the stream as raw text.
**How to avoid:** Client-side reader must split on `\n`, detect `data: ` prefix, JSON.parse the payload, and check `delta.type === "text_delta"`. Ignore `ping`, `message_start`, `message_delta`, `message_stop` events for UI purposes (but use `message_stop` to know the stream is complete).
**Warning signs:** `streamingContent` stays empty while network tab shows data arriving.

### Pitfall 6: Tailwind v4 Preflight Stripping Markdown Styles
**What goes wrong:** `react-markdown` output looks like unstyled plain text — no bold, no heading sizes, no list bullets.
**Why it happens:** Tailwind v4's preflight CSS resets all semantic HTML element styles to browser defaults (which are then zero'd by Tailwind's base layer).
**How to avoid:** Install `@tailwindcss/typography`, add `@plugin "@tailwindcss/typography"` in `globals.css`, and wrap ReactMarkdown output in a `<div className="prose prose-sm">`.
**Warning signs:** Markdown content in development looks correct (browser may have own styles) but in production or after a hard cache clear, all formatting disappears.

---

## Code Examples

Verified patterns from official sources:

### Route Handler — Complete SSE Setup
```typescript
// Source: Anthropic SDK helpers.md, Next.js Route Segment Config docs, Vercel duration docs
// app/api/chat/route.ts

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const anthropic = new Anthropic()  // reads ANTHROPIC_API_KEY from env automatically

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { projectId, message, history } = await request.json()

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",  // latest Sonnet as of 2026-02-25
    max_tokens: 8192,
    messages: [...history, { role: "user", content: message }],
  })

  return new Response(stream.toReadableStream(), {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  })
}
```

### Client Stream Reader — Token Accumulation
```typescript
// Source: MDN ReadableStream.pipeThrough(), Upstash SSE blog
const response = await fetch("/api/chat", { method: "POST", body: ... })
const reader = response.body!
  .pipeThrough(new TextDecoderStream())
  .getReader()

let accumulated = ""
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  // Parse SSE lines
  for (const line of value.split("\n")) {
    if (!line.startsWith("data: ")) continue
    try {
      const event = JSON.parse(line.slice(6))
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        accumulated += event.delta.text
        setStreamingContent(accumulated)
      }
    } catch { /* skip non-JSON lines (ping, event: lines) */ }
  }
}
```

### Messages Table — Supabase Persist + Load
```typescript
// Source: Supabase JS docs
// lib/supabase/messages.ts

export async function loadMessages(projectId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from("messages")
    .select("role, content")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
  return data ?? []
}

export async function persistMessage(
  projectId: string,
  role: "user" | "assistant",
  content: string,
  supabase: SupabaseClient
) {
  await supabase.from("messages").insert({ project_id: projectId, role, content })
}
```

### Animated Typing Indicator (loading dots)
```typescript
// Tailwind CSS — no external dependency needed
// components/typing-indicator.tsx
export function TypingIndicator() {
  return (
    <div className="max-w-[560px] rounded-2xl px-4 py-3 bg-white border border-gray-200 self-start">
      <div className="flex gap-1 items-center h-5">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vercel AI SDK `useChat` hook | Direct Anthropic SDK + custom hook | STATE.md locked decision | More control; no Vercel dependency; matches project's direct-SDK approach |
| `middleware.ts` | `proxy.ts` | Next.js 16 (Oct 2025) | Already implemented in Phase 1 — no change needed |
| `EventSource` for SSE | `fetch()` + `ReadableStream` reader | SSE limitations always existed | POST required to send message body; EventSource is GET-only |
| `maxDuration = 60` with Vercel Pro | `maxDuration = 300` with Fluid Compute on any plan | Vercel Fluid Compute launch (2025) | Hobby plan now supports 300s by default — streaming workflows work without Pro upgrade |
| `getSession()` Supabase | `getClaims()` Supabase | `@supabase/ssr 0.8.0` | Already implemented in Phase 1 |

**Deprecated/outdated:**
- `AnthropicStream` (Vercel AI SDK v4 removed it): Replaced by direct SDK `stream.toReadableStream()`.
- `experimental_ppr = true` in route config: Removed in Next.js 16 (Next.js docs confirmed).
- Edge runtime for Anthropic: SDK explicitly incompatible with Edge runtime — use Node.js only.

---

## Open Questions

1. **GBD workflow system prompt injection**
   - What we know: The Route Handler must inject GBD workflow instructions as the `system` prompt for the Anthropic API call. The SOURCES/workflows/ directory contains the workflow markdown files.
   - What's unclear: Where exactly to load the system prompt from — hardcoded string, file read at runtime, or Supabase? How to select the right workflow instruction based on the user's message.
   - Recommendation: For Phase 2, inject a generic "you are GBD" system prompt. The specific workflow selection is deferred to Phase 3. Read the prompt from a constant in the route handler for simplicity.

2. **Conversation history size management**
   - What we know: GBD workflows can run 3-5 minutes with many back-and-forth messages. Full history is passed with every request.
   - What's unclear: At what point does the history exceed the 200K token context window? Claude Sonnet 4.6 supports up to 64K output tokens.
   - Recommendation: For Phase 2, pass full history without truncation. Add token counting and truncation in Phase 3+ if needed. Monitor via Anthropic API usage field in `message_delta` events.

3. **Persist-before-stream vs persist-after-stream for user messages**
   - What we know: User message must be in DB before stream starts so reconnection can reload it. Agent message must wait until stream completes.
   - What's unclear: Should the user message persist happen in the route handler (server-side) or in the client hook (client-side via Supabase browser client)?
   - Recommendation: Persist user message from the client (browser Supabase client) before calling the route handler. Persist agent message from the route handler after stream completes via a second Supabase call. This avoids a second round-trip and keeps the route handler as the single source of truth for agent messages.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` — skipping this section.

---

## Sources

### Primary (HIGH confidence)
- Anthropic API docs (platform.claude.com/docs/en/api/messages-streaming) — SSE event types, streaming examples, TypeScript patterns
- Anthropic SDK helpers.md (github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md) — MessageStream class, toReadableStream(), event handlers
- Next.js Route Segment Config docs (nextjs.org/docs/app/api-reference/file-conventions/route-segment-config, version 16.1.6, updated 2026-02-24) — maxDuration, runtime, dynamic options
- Vercel Functions Duration docs (vercel.com/docs/functions/configuring-functions/duration) — Fluid Compute limits: Hobby 300s, Pro 800s
- Anthropic Models Overview (platform.claude.com/docs/en/about-claude/models/overview) — claude-sonnet-4-6 confirmed current, 64K output tokens

### Secondary (MEDIUM confidence)
- Upstash SSE blog (upstash.com/blog/sse-streaming-llm-responses) — SSE headers, ReadableStream pattern, `force-dynamic` requirement
- MDN ReadableStream.pipeThrough (developer.mozilla.org) — `pipeThrough(new TextDecoderStream())` for client-side SSE reading
- GitHub Tailwind CSS discussion #17645 — Tailwind v4 + react-markdown incompatibility; fix via `@tailwindcss/typography` plugin

### Tertiary (LOW confidence)
- None — all claims verified with official sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against npm registry (@anthropic-ai/sdk 0.78.0, react-markdown), official Anthropic docs, official Vercel docs
- Architecture: HIGH — Route Handler + SSE pattern confirmed by official Next.js and Anthropic docs; MessageStream.toReadableStream() confirmed in SDK helpers.md
- Pitfalls: HIGH — timeout confirmed in Vercel docs; SSE buffering headers from MDN + Upstash; Tailwind v4 issue from official Tailwind GitHub discussion
- Model IDs: HIGH — confirmed directly from Anthropic's models overview page (date: 2026-02-25); claude-sonnet-4-6 is current latest

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (30 days — stable APIs, but Anthropic releases models frequently; re-check model IDs before implementation)
