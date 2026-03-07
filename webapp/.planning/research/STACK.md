# Technology Stack

**Project:** GET BRANDON — Web App
**Researched:** 2026-02-25
**Overall confidence:** MEDIUM-HIGH (based on knowledge through Aug 2025 + official docs at time of writing; version pins should be verified at project init)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (latest) | Full-stack React framework | App Router is stable, native support for streaming responses via `Response` + `ReadableStream`, Vercel-optimized. Pages Router is legacy — do not use. |
| React | 19.x | UI rendering | Ships with Next.js 15. Server Components reduce client bundle. |
| TypeScript | 5.x | Type safety | Non-negotiable for a multi-workflow orchestration app with structured JSON outputs. Catches shape mismatches between GBD JSON formats early. |
| Node.js | 20 LTS or 22 LTS | Runtime | Vercel Functions run on Node 20/22. Use 20 LTS for stability. |

### AI / Streaming

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@anthropic-ai/sdk` | `^0.30.0` | Anthropic API client with streaming | Official SDK. Supports `stream()` method returning an async iterable of `MessageStreamEvent`. Native SSE. No polling, no WebSocket complexity. |
| Vercel AI SDK (`ai`) | `^4.x` | Optional streaming helper | The Vercel AI SDK (`ai` package) provides `streamText()` with Anthropic provider and a standard `toDataStreamResponse()` helper. Use IF you want useChat() hook on client. Skip if you want direct SDK control (recommended here — see rationale below). |

**Streaming decision — use Anthropic SDK directly, not Vercel AI SDK:**

The workflows (start, platform, campaign, etc.) are long-running, multi-step, structured-output sessions. The Vercel AI SDK's `useChat` abstraction adds convenience for simple Q&A but introduces constraints (message format, token counting, history format) that fight against GBD's structured JSON output pattern. Direct SDK control is more appropriate.

### Database & Auth

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Cloud / `@supabase/supabase-js@^2.x` | PostgreSQL + auth + storage | Managed Postgres with row-level security, auth built-in, file storage, and a generous free tier. Single service covers all data needs. |
| `@supabase/ssr` | `^0.x` (currently `^0.5.x`) | Server-side Supabase client for App Router | Replaces deprecated `@supabase/auth-helpers-nextjs`. Required for cookie-based auth in Server Components and Route Handlers. |

**Do NOT use `@supabase/auth-helpers-nextjs` — deprecated since 2024. Use `@supabase/ssr` only.**

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | `^4.x` | Utility-first styling | v4 ships as a Vite/PostCSS plugin with zero config and CSS-first configuration. Ideal for a focused internal tool. No design system overhead. |
| `shadcn/ui` | Latest CLI | Component primitives | Not a package — it's a CLI that copies unstyled Radix UI components into your project. You own the code. Perfect for an internal tool: no version lock, no bundle bloat from unused components. Use for: Chat bubbles, dialogs, buttons, sidebar navigation. |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React built-ins (`useState`, `useReducer`, `useContext`) | (React 19) | UI state | Sufficient for a 2-user internal tool. No Redux/Zustand needed. Chat history lives in Server-side DB (Supabase), not in complex client state. |
| `nuqs` | `^2.x` | URL-based state (optional) | For persisting selected project / active workflow in URL params. Makes deep-linking and refresh-safe navigation trivial without a state library. |

### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react-hook-form` | `^7.x` | Form handling | Minimal re-renders, works with Server Actions. Used for project creation form (client name, folder name). |
| `zod` | `^3.x` | Schema validation | Validates GBD JSON outputs before writing to Supabase. Critical — the structured JSON outputs (CONTRE-BRIEF.json etc.) must match existing CLI format exactly. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | — | Deployment + Edge/Serverless Functions | Native Next.js deployment. `maxDuration` config on Route Handlers can be set to 800s on Pro plan — handles long GBD workflow sessions. Free tier max is 60s (insufficient for multi-minute workflows). |
| Supabase Storage | — | File uploads (client briefs, assets) | S3-compatible, integrated with Supabase auth RLS. Avoids a separate S3 setup. |

---

## Architecture: Streaming in Next.js App Router

### The Pattern: Route Handler + ReadableStream

Do NOT use Server Actions for streaming. Server Actions do not support streaming responses. Use Route Handlers (`app/api/*/route.ts`).

```typescript
// app/api/workflow/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 800; // Vercel Pro: up to 800s

export async function POST(req: Request) {
  // 1. Auth check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { workflowType, projectId, messages } = await req.json();

  const client = new Anthropic();

  // 2. Create a ReadableStream that pipes Anthropic SSE → client
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const anthropicStream = client.messages.stream({
          model: 'claude-opus-4-5',
          max_tokens: 8192,
          messages,
          system: buildSystemPrompt(workflowType),
        });

        for await (const event of anthropicStream) {
          // Stream text deltas as SSE
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const data = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }

        // Signal completion
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client-Side Consumption

```typescript
// components/chat/ChatInput.tsx (Client Component)
'use client';

async function sendMessage(content: string) {
  const response = await fetch('/api/workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowType, projectId, messages }),
  });

  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.replace('data: ', '');
      if (data === '[DONE]') break;
      const { text } = JSON.parse(data);
      // Append text to current message in state
      setCurrentMessage(prev => prev + text);
    }
  }
}
```

### Why This Pattern (Not Vercel AI SDK useChat)

| Concern | Vercel AI SDK `useChat` | Direct SDK approach |
|---------|------------------------|---------------------|
| Long-running sessions (5+ min) | Works but opinion on message format | Full control over timeout/keepalive |
| Structured JSON output detection | Requires custom parsing outside the hook | Parse stream events directly |
| Multiple workflow phases in one session | `useChat` history format fights GBD convention | Raw messages array, map to Anthropic format directly |
| Debugging | Black box | Transparent event loop |

---

## Supabase Auth: 2 Fixed Users, No Public Signup

### Setup

Supabase Email Auth is enabled but **disable public signup in the Supabase dashboard** (Authentication > Settings > "Enable email signups" → OFF).

Create the 2 users manually in the Supabase Dashboard or via the admin API:

```bash
# One-time setup via Supabase CLI or dashboard
supabase auth admin create-user --email jeremy@agenceyam.com --password [strong-password]
supabase auth admin create-user --email [associe]@agenceyam.com --password [strong-password]
```

### Server-Side Auth Pattern (App Router)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Database Schema (Supabase PostgreSQL)

```sql
-- Projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text not null,
  folder_name text not null unique, -- matches CLI folder convention
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workflow sessions table
create table workflow_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  workflow_type text not null, -- 'start' | 'platform' | 'campaign' | 'site-standalone' | 'wireframe'
  status text not null default 'active', -- 'active' | 'complete' | 'error'
  messages jsonb not null default '[]',
  output_json jsonb, -- final structured output (CONTRE-BRIEF.json etc.)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security — only authenticated users can access (no per-user isolation needed for 2-user team)
alter table projects enable row level security;
alter table workflow_sessions enable row level security;

create policy "Authenticated users can do everything" on projects
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything" on workflow_sessions
  for all using (auth.role() = 'authenticated');
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 App Router | Remix, SvelteKit | Next.js is the Vercel native choice; best Supabase + Anthropic SDK integrations, largest ecosystem |
| Streaming approach | Direct Anthropic SDK | Vercel AI SDK `useChat` | GBD structured workflows fight against `useChat` message format conventions |
| Styling | Tailwind v4 + shadcn/ui | Chakra UI, MUI | Tailwind v4 has zero-config setup; shadcn gives owned components; MUI/Chakra add bundle weight without value for 2-user internal tool |
| Auth | Supabase built-in (email, no signup) | NextAuth.js, Auth.js | Supabase is already in the stack; no reason to add a second auth system |
| State | React built-ins | Zustand, Redux | Overkill. DB is source of truth. 2 users. No need for global state manager. |
| DB client | Supabase JS client | Prisma | Supabase client includes RLS, storage, auth in one. Prisma would need separate auth/storage setup. |
| Realtime | Not needed v1 | Supabase Realtime / WebSocket | Only 2 users, not collaborating simultaneously. SSE stream per session is enough. |

---

## Installation

```bash
# Create Next.js app
npx create-next-app@latest brandon-web --typescript --tailwind --app --src-dir

# Anthropic SDK
npm install @anthropic-ai/sdk

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Optional URL state
npm install nuqs

# shadcn/ui (interactive CLI — run after project creation)
npx shadcn@latest init
# Then add components as needed:
npx shadcn@latest add button input textarea dialog sidebar
```

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
ANTHROPIC_API_KEY=[your-key]  # server-side only, never expose to client
```

---

## Vercel Configuration

```json
// vercel.json (for long-running Route Handlers on Pro plan)
{
  "functions": {
    "app/api/workflow/route.ts": {
      "maxDuration": 800
    }
  }
}
```

**Critical:** Vercel Hobby plan caps function duration at 60 seconds. GBD workflows take several minutes. **You must be on Vercel Pro** ($20/mo) or use self-hosted / Vercel's Fluid Compute (check 2026 pricing). Alternative: deploy the Route Handler as an Edge Function with streaming — Edge Functions have no timeout limit for streaming responses on Vercel.

**Edge Function consideration for long streaming:**

```typescript
// app/api/workflow/route.ts
export const runtime = 'edge'; // No timeout limit for streaming responses
// Note: Edge runtime has no Node.js APIs — Anthropic SDK works in Edge runtime
```

Using `export const runtime = 'edge'` on a streaming Route Handler removes the timeout concern entirely. The Anthropic SDK v0.29+ supports the Edge runtime. This is the recommended approach for this project.

---

## What NOT to Use

| Library | Reason to Avoid |
|---------|----------------|
| `@supabase/auth-helpers-nextjs` | Deprecated since 2024. Use `@supabase/ssr` |
| Vercel AI SDK `useChat` for GBD workflows | Structured output + multi-phase workflows fight the abstraction |
| Pages Router | Legacy. App Router is the current standard and required for streaming |
| Redux / Zustand | Overkill for 2-user internal tool with DB as source of truth |
| WebSockets (custom) | SSE via ReadableStream is simpler, stateless, sufficient for unidirectional streaming |
| Socket.io | Same as above — overkill for SSE use case |
| `next-auth` v4 | Being replaced by Auth.js v5; unnecessary since Supabase auth covers the need |
| Prisma | Adds ORM abstraction layer over Supabase's own client; fight two systems to get RLS + storage |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Next.js 15 + App Router streaming | HIGH | Stable, well-documented pattern as of Aug 2025 |
| Anthropic SDK streaming in Edge runtime | MEDIUM | SDK supported Edge runtime as of v0.29; verify current version at init |
| `@supabase/ssr` for App Router auth | HIGH | Official Supabase recommendation since 2024, replaces auth-helpers |
| Tailwind v4 stability | MEDIUM | v4 was in active release in 2025; verify stable release at project init |
| Vercel Edge runtime timeout behavior | MEDIUM | Verify current Vercel docs — Edge streaming behavior may have changed in 2026 |
| shadcn/ui compatibility with Next.js 15 | HIGH | shadcn tracks Next.js closely |

---

## Sources

- Anthropic SDK: https://github.com/anthropic-ai/anthropic-sdk-typescript (knowledge cutoff Aug 2025)
- Supabase SSR docs: https://supabase.com/docs/guides/auth/server-side/nextjs
- Next.js Route Handlers streaming: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
- Vercel function duration limits: https://vercel.com/docs/functions/runtimes#max-duration
- shadcn/ui: https://ui.shadcn.com/docs/installation/next
- Confidence: MEDIUM overall — versions should be verified at project init with `npm info [package] version`
