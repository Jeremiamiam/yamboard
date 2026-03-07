# Architecture Patterns

**Project:** GET BRANDON — Web App
**Domain:** Streaming AI workflow orchestrator (multi-turn conversations producing structured JSON outputs)
**Researched:** 2026-02-25
**Confidence:** HIGH (Next.js streaming verified via official docs; Anthropic/Supabase patterns from current SDK docs + training knowledge)

---

## Recommended Architecture

### Overview

A Next.js App Router application with a clear separation between UI layer, API layer, and persistence layer. The streaming AI conversation is the core primitive — everything else (persistence, file uploads, wiki rendering) serves that primitive.

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER                                                        │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │ Project List │   │  Chat Interface  │   │  Wiki Viewer   │  │
│  │ (projects/)  │   │  ([id]/chat)     │   │  ([id]/wiki)   │  │
│  └──────┬───────┘   └────────┬─────────┘   └───────┬────────┘  │
│         │                   │                      │            │
└─────────┼───────────────────┼──────────────────────┼────────────┘
          │                   │                      │
          ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  NEXT.JS APP ROUTER — Route Handlers (Edge/Node)                │
│                                                                 │
│  POST /api/chat/[id]/stream    ← core: streams tokens via SSE  │
│  POST /api/projects            ← create project                │
│  POST /api/projects/[id]/files ← upload trigger / signed URL  │
│  GET  /api/projects/[id]/wiki  ← fetch wiki HTML               │
│  GET  /api/projects/[id]/outputs ← fetch JSON outputs          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
┌──────────────────────┐         ┌──────────────────────────┐
│  ANTHROPIC API       │         │  SUPABASE                │
│                      │         │                          │
│  claude-3-5-sonnet   │         │  PostgreSQL              │
│  (streaming SSE)     │         │  ├── projects            │
│                      │         │  ├── conversations       │
│  Messages API:       │         │  ├── messages            │
│  - system prompt     │         │  └── outputs             │
│    (workflow .md)    │         │                          │
│  - messages[]        │         │  Storage Buckets         │
│    (full history)    │         │  ├── inputs/ (PDFs etc.) │
│                      │         │  └── outputs/ (HTML wiki)│
└──────────────────────┘         └──────────────────────────┘
```

---

## Component Boundaries

### 1. UI Components (Client-Side)

| Component | File Path | Responsibility | Talks To |
|-----------|-----------|----------------|----------|
| ProjectList | `app/projects/page.tsx` | List all projects, create new | API /api/projects |
| ChatInterface | `app/projects/[id]/page.tsx` | Full chat UI, workflow selector, file upload zone | API /api/chat/[id]/stream |
| MessageList | `components/chat/MessageList.tsx` | Render conversation turns (user + agent messages) | Props from ChatInterface |
| StreamingMessage | `components/chat/StreamingMessage.tsx` | Renders a single agent message as tokens arrive | EventSource / ReadableStream |
| WorkflowSelector | `components/chat/WorkflowSelector.tsx` | Buttons to launch `/start`, `/platform`, etc. | ChatInterface state |
| FileUploadZone | `components/chat/FileUploadZone.tsx` | Drag/drop file upload, progress indicators | API /api/projects/[id]/files |
| WikiViewer | `app/projects/[id]/wiki/page.tsx` | Renders HTML wiki inline (iframe or dangerouslySetInnerHTML) | API /api/projects/[id]/wiki |
| OutputsPanel | `components/outputs/OutputsPanel.tsx` | Shows generated JSONs (CONTRE-BRIEF.json etc.) | API /api/projects/[id]/outputs |

### 2. API Route Handlers (Server-Side)

| Route | Method | Responsibility | Talks To |
|-------|--------|----------------|----------|
| `/api/chat/[id]/stream` | POST | Reconstruct message history, call Anthropic with streaming, pipe SSE to client, persist final message | Anthropic API + Supabase |
| `/api/projects` | GET/POST | List or create projects | Supabase |
| `/api/projects/[id]` | GET/PATCH | Get project details or update status | Supabase |
| `/api/projects/[id]/files` | POST | Get signed upload URL or receive file, store to Supabase Storage | Supabase Storage |
| `/api/projects/[id]/wiki` | GET | Fetch wiki HTML from Supabase Storage | Supabase Storage |
| `/api/projects/[id]/outputs` | GET | Fetch structured JSON outputs | Supabase |
| `/api/auth/[...nextauth]` | * | Session management (NextAuth or Supabase Auth) | Supabase Auth |

### 3. Persistence Layer (Supabase)

| Resource | Type | Responsibility |
|----------|------|----------------|
| `projects` table | PostgreSQL | Project metadata (name, client, workflow status, created_at) |
| `conversations` table | PostgreSQL | One conversation per workflow run, links to project |
| `messages` table | PostgreSQL | Individual message turns (role: user/assistant, content, tokens, created_at) |
| `outputs` table | PostgreSQL | Structured JSON outputs (type: CONTRE-BRIEF/PLATFORM/etc., content JSONB, version) |
| `inputs` bucket | Storage | Client files uploaded before workflow (PDFs, emails, transcriptions) |
| `outputs` bucket | Storage | Generated HTML wiki files |

### 4. Workflow System (Server-Side Logic)

| Module | File Path | Responsibility |
|--------|-----------|----------------|
| WorkflowLoader | `lib/workflows/loader.ts` | Load workflow markdown files (system prompts) by workflow type |
| WorkflowPrompts | `lib/workflows/prompts/` | Workflow .md files (start.md, platform.md, etc.) |
| AnthropicClient | `lib/anthropic/client.ts` | Thin wrapper around Anthropic SDK for streaming |
| MessageSerializer | `lib/anthropic/serializer.ts` | Convert DB messages to Anthropic API messages[] format |
| OutputExtractor | `lib/workflows/extractor.ts` | Parse JSON outputs from completed agent responses |

---

## Data Flow

### Core Flow: User sends a message in a workflow conversation

```
1. USER INPUT
   User types message or clicks workflow button
   ChatInterface → POST /api/chat/[id]/stream
   Body: { message: string, workflow: "start"|"platform"|..., conversationId?: string }

2. STREAM HANDLER (Route Handler — Node runtime)
   a. Authenticate user (Supabase session check)
   b. Load conversation history from Supabase (all previous messages)
   c. Load workflow system prompt from lib/workflows/prompts/[workflow].md
   d. Persist user message to messages table immediately
   e. Call Anthropic API:
      anthropic.messages.stream({
        model: "claude-3-5-sonnet-20241022",
        system: workflowPrompt,
        messages: [...history, { role: "user", content: message }],
        max_tokens: 8096
      })
   f. Return ReadableStream to client (SSE format)
      - Each token chunk → write to stream
      - On completion → persist full assistant message to DB
      - On completion → run OutputExtractor (detect JSON blocks)
      - On completion → if JSON found, persist to outputs table

3. CLIENT RECEIVES STREAM
   fetch() with streaming reader (not EventSource — fetch is more flexible)
   StreamingMessage component reads chunks via ReadableStream
   Appends tokens to displayed message in real-time

4. STREAM COMPLETE
   a. Final message stored in DB (step 2f)
   b. Client state updated: full message now in MessageList
   c. If outputs were generated: OutputsPanel refreshes
   d. If wiki was generated: WikiViewer tab becomes available
```

### File Upload Flow

```
1. User drops PDF/file onto FileUploadZone
2. POST /api/projects/[id]/files
   - Server requests signed upload URL from Supabase Storage
   - Returns signed URL to client
3. Client uploads file directly to Supabase Storage using signed URL
   (bypasses Next.js server — avoids Vercel function size limits)
4. On upload success, client notifies server: file is ready
5. Server updates project record: inputs_uploaded = true
6. User can then trigger workflow with "--ready" equivalent
```

### Wiki Rendering Flow

```
1. OutputExtractor detects wiki HTML in assistant response
   (or: /wiki workflow run produces HTML output)
2. HTML stored in Supabase Storage: outputs/[project-id]/GBD-WIKI.html
3. WikiViewer page fetches HTML: GET /api/projects/[id]/wiki
4. Route Handler fetches from Storage, returns with content-type text/html
5. WikiViewer renders in sandboxed iframe (prevents script injection)
   <iframe srcDoc={wikiHtml} sandbox="allow-same-origin" />
   OR: renders via dangerouslySetInnerHTML with DOMPurify sanitization
```

---

## Database Schema

### `projects`
```sql
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,              -- client name e.g. "AcmeCorp"
  slug        TEXT NOT NULL UNIQUE,       -- url-safe: "acmecorp"
  status      TEXT NOT NULL DEFAULT 'created',
              -- created | inputs_ready | start_done | platform_done | campaign_done | complete
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `conversations`
```sql
CREATE TABLE conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workflow     TEXT NOT NULL,
               -- start | platform | campaign | site-standalone | wireframe | wiki
  status       TEXT NOT NULL DEFAULT 'active',
               -- active | completed | abandoned
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `messages`
```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  token_count     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_created
  ON messages(conversation_id, created_at);
```

### `outputs`
```sql
CREATE TABLE outputs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
               -- CONTRE-BRIEF | PLATFORM | CAMPAIGN | SITE | WIKI
  version      INTEGER NOT NULL DEFAULT 1,
  content      JSONB,                     -- NULL for HTML outputs (stored in Storage)
  storage_path TEXT,                      -- for HTML wiki: "outputs/{project_id}/GBD-WIKI.html"
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Supabase Storage Buckets
```
inputs/
  {project_id}/
    brief.pdf
    transcription.txt
    emails.eml
    ...

outputs/
  {project_id}/
    GBD-WIKI.html
    GBD-WIKI-v2.html    (versioned on regeneration)
```

---

## Streaming Implementation

### Route Handler Pattern (verified via Next.js docs)

```typescript
// app/api/chat/[id]/stream/route.ts
export const runtime = 'nodejs'  // NOT edge — need full Node.js for Anthropic SDK
export const maxDuration = 300   // 5 min — Vercel Pro supports up to 800s

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const { message, workflow, conversationId } = await request.json()

  // 1. Auth check
  // 2. Load history from Supabase
  // 3. Load workflow prompt
  // 4. Persist user message

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const anthropicStream = anthropic.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        system: workflowPrompt,
        messages: anthropicMessages,
        max_tokens: 8096,
      })

      for await (const event of anthropicStream) {
        if (event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta') {
          // Send token to client
          const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }
      }

      // Get full response after stream completes
      const finalMessage = await anthropicStream.finalMessage()
      const fullText = finalMessage.content[0].text

      // Persist to DB
      await persistAssistantMessage(conversationId, fullText)

      // Extract JSON outputs if present
      await extractAndPersistOutputs(projectId, workflow, fullText)

      // Signal completion
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

### Client Consumption Pattern

```typescript
// components/chat/useStreamingChat.ts
async function sendMessage(content: string) {
  const response = await fetch(`/api/chat/${projectId}/stream`, {
    method: 'POST',
    body: JSON.stringify({ message: content, workflow, conversationId }),
    headers: { 'Content-Type': 'application/json' },
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()!  // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        const { text } = JSON.parse(data)
        appendToCurrentMessage(text)
      }
    }
  }
}
```

---

## Workflow State Machine

Each project follows a state progression. The UI should reflect current state and only enable valid next steps.

```
created
  └── (user uploads files)
      └── inputs_ready
          └── (run /start workflow)
              └── start_done         ← CONTRE-BRIEF.json available
                  ├── (run /platform)
                  │   └── platform_done    ← PLATFORM.json available
                  │       ├── (run /campaign)
                  │       │   └── campaign_done
                  │       └── (run /site-standalone)
                  │           └── site_done
                  │               └── (run /wireframe)
                  │                   └── wireframe_done
                  └── (run /wiki at any point after start_done)
                      └── wiki_generated   ← GBD-WIKI.html available
```

### State in DB
The `projects.status` column tracks coarse state. Fine-grained state comes from querying `outputs` table for presence of specific output types.

---

## Multi-Turn Conversation Strategy

The key architectural decision: **pass full message history to Anthropic on every turn**.

**Why:** Anthropic's API is stateless. Each call must include the complete conversation context. This is correct for workflows that evolve over multiple exchanges.

**History reconstruction:**
```typescript
// lib/anthropic/serializer.ts
export function toAnthropicMessages(dbMessages: Message[]): MessageParam[] {
  return dbMessages
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
}
```

**Token budget concern:** Long conversations accumulate tokens. At ~200k context window for Claude 3.5 Sonnet, a full brand strategy workflow (multi-hour session) may approach limits. Mitigation: implement conversation summarization checkpoint after each workflow phase completes (store summary, start new conversation with summary as context prefix).

---

## HTML Wiki Rendering

Two options, recommendation: **sandboxed iframe**.

```typescript
// components/wiki/WikiViewer.tsx
export function WikiViewer({ html }: { html: string }) {
  return (
    <iframe
      srcDoc={html}
      sandbox="allow-same-origin allow-scripts"  // allow-scripts only if wiki has interactive elements
      className="w-full h-full border-0"
      title="GBD Wiki"
    />
  )
}
```

**Why iframe over dangerouslySetInnerHTML:**
- Isolates wiki CSS from app CSS (wiki has its own styling)
- Prevents script injection without DOMPurify dependency
- Faithfully replicates existing GBD-WIKI.html rendering behavior
- No CSS conflicts between wiki styles and app styles

**Delivery:** Wiki HTML served from Supabase Storage via signed URL or through Route Handler proxy. For v1 (2 internal users), direct signed URLs from client are acceptable.

---

## Suggested Build Order

Dependencies flow bottom-up. Build foundations before features.

### Phase 1: Data Foundation
1. Supabase project setup — tables, RLS policies, storage buckets
2. Auth setup — Supabase Auth with email/password for 2 fixed users
3. `/api/projects` CRUD — list, create, get project

**Why first:** Everything depends on being able to create and retrieve projects. Auth gates all routes. No streaming without a project to attach it to.

### Phase 2: Core Streaming
1. `WorkflowLoader` — load .md files as system prompts
2. `MessageSerializer` — convert DB messages to Anthropic format
3. `/api/chat/[id]/stream` Route Handler — streaming SSE implementation
4. `useStreamingChat` hook — client-side stream consumption
5. Basic `ChatInterface` — input field + streaming message display

**Why second:** This is the highest-risk component (streaming + Vercel timeouts). Prove it works before building UI polish.

### Phase 3: UI Polish + Workflow Selector
1. `WorkflowSelector` component — buttons for each workflow
2. `MessageList` — proper chat bubble rendering with markdown
3. Project state tracking — UI reflects workflow progress
4. `OutputsPanel` — show available JSON outputs

### Phase 4: File Upload
1. Supabase Storage signed URL generation endpoint
2. `FileUploadZone` component — drag/drop, progress
3. Project status update to `inputs_ready` on upload complete

**Why after streaming:** File upload is needed for /start workflow but is standalone and lower complexity than streaming.

### Phase 5: Wiki Viewer
1. Wiki HTML storage in Supabase Storage (triggered from OutputExtractor)
2. `/api/projects/[id]/wiki` Route Handler
3. `WikiViewer` component with iframe rendering

**Why last:** Wiki is read-only output. Depends on at least one successful /start + /wiki workflow run.

---

## Critical Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Streaming transport | SSE via `ReadableStream` in Route Handler | Native Next.js support; no WebSocket infrastructure needed |
| Runtime for stream route | `nodejs` (not `edge`) | Anthropic SDK requires Node.js APIs; edge runtime lacks them |
| Message history | Full history on every Anthropic call | Stateless API; correct for multi-turn workflows |
| File upload path | Client → Supabase Storage (signed URL) | Avoids 4.5MB Vercel function body limit; faster uploads |
| Wiki rendering | iframe with srcDoc | CSS isolation; faithful to existing GBD-WIKI.html format |
| Auth system | Supabase Auth (email/password) | Integrated with DB; no separate auth service; simple for 2 users |
| Workflow prompts | .md files loaded at runtime | Matches existing CLI architecture; easy to iterate prompts |
| Output extraction | Server-side after stream completes | Reliable; client never needs to parse AI output |

---

## Scalability Considerations

This is an internal tool for 2 users. These are **non-requirements for v1** but noted for awareness.

| Concern | At 2 users (v1) | At 10 users | At 50+ users |
|---------|----------------|-------------|--------------|
| Concurrent streams | Fine (2 max) | Fine (Vercel scales) | May need stream rate limiting |
| Supabase connection pool | Fine | Fine | Need connection pooler (PgBouncer) |
| Token costs | Low | Monitor | Implement token budget per project |
| Context window | Single conversation | Consider summarization | Mandatory summarization checkpoints |
| Storage | Negligible | Fine | Consider lifecycle policies |

---

## Sources

- Next.js Route Handlers official docs: https://nextjs.org/docs/app/api-reference/file-conventions/route (verified 2026-02-24, version 16.1.6)
- Next.js streaming example: official docs show `ReadableStream` pattern for LLM streaming
- Anthropic SDK streaming: `messages.stream()` with async iterator (HIGH confidence — core SDK feature, stable since SDK v0.20+)
- Supabase Storage signed URLs: standard pattern for client-side direct upload (MEDIUM confidence — pattern stable across Supabase versions)
- Vercel function timeout: `maxDuration = 300` for Pro plan (MEDIUM confidence — verify current Vercel pricing tier)
- iframe srcDoc for HTML isolation: standard browser API, stable (HIGH confidence)
