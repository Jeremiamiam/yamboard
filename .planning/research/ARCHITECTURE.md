# Architecture Patterns

**Project:** YamBoard — mock.ts to Supabase migration
**Researched:** 2026-03-08
**Confidence:** HIGH (Supabase official docs + Next.js official docs + community verification)

---

## Recommended Architecture

The migration does NOT change the UI layer. It replaces the data layer underneath the existing components. The App Router architecture stays intact: pages and layouts remain as-is. What changes is where data comes from — from static arrays in `mock.ts` to async queries against Supabase.

### High-Level View

```
Browser
  └── Client Components ("use client")
        ├── Interactive UI: tabs, drawers, forms, DocumentViewer
        ├── Calls Server Actions for mutations (CRUD)
        └── Reads initial data from Server Component props (passed down)

Server (Next.js)
  ├── Server Components (default — layouts, pages)
  │     ├── createClient() from lib/supabase/server.ts
  │     ├── async/await Supabase queries
  │     └── Pass data as props to Client Components
  ├── Server Actions (lib/actions/*.ts)
  │     ├── createClient() from lib/supabase/server.ts
  │     ├── INSERT / UPDATE / DELETE
  │     └── revalidatePath() to refresh server component cache
  ├── Route Handlers (app/api/chat/route.ts — existing)
  │     └── createClient() from lib/supabase/server.ts
  │           (builds agent context from real DB instead of mock arrays)
  └── middleware.ts (root)
        └── Refreshes Supabase auth tokens via cookies

Supabase (Postgres + Storage + Auth)
  ├── DB: clients, projects, products, documents, contacts, payment_stages
  ├── Storage: documents bucket (PDFs, files)
  └── Auth: single user (agency owner), invite-only for future collaborator
```

### Component Boundaries

| Component | Type | Responsibility | Communicates With |
|-----------|------|---------------|-------------------|
| `app/layout.tsx` | Server | Providers, auth session check | Children via props |
| `app/page.tsx` | Server | Redirect to first client | Supabase (fetch first client ID) |
| `app/[clientId]/page.tsx` | Server | Fetch client + projects + docs | ClientPage Client Component |
| `app/[clientId]/[projectId]/page.tsx` | Server | Fetch project + products + docs | ProjectPage Client Component |
| `ClientSidebar` | Client | Navigation, client list display | Server component passes client list |
| `DocumentViewer` | Client | Slide-over, note editing | Server Action to save note |
| `ClientChatDrawer` | Client | Chat UI, streaming | `/api/chat` route handler |
| `tabs/DocumentsTab` | Client | Doc list, upload trigger | Server Action for upload |
| `tabs/BudgetsTab` | Client | Payment stages display | Server Action for mutations |
| `lib/supabase/server.ts` | Utility | createClient for server | Used by Server Components + Actions |
| `lib/supabase/client.ts` | Utility | createBrowserClient | Used by Client Components (rare) |
| `lib/actions/*.ts` | Server Actions | All DB mutations | Supabase server client + revalidatePath |
| `lib/context-builders.ts` | Server utility | Build agent prompts from DB | Called from `/api/chat/route.ts` |

---

## Supabase Client Setup

Two client files are required. This is the official `@supabase/ssr` pattern.

**`src/lib/supabase/server.ts`** — used in Server Components, Server Actions, Route Handlers:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies can't be set, middleware handles it
          }
        },
      },
    }
  );
}
```

**`src/lib/supabase/client.ts`** — used only in Client Components needing live subscriptions:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`middleware.ts`** (root of `dashboard/`) — refreshes auth tokens:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — required, do not remove
  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## Data Fetching Patterns

### Pattern 1: Server Component Page Fetch (primary pattern)

Pages become async server components. They fetch data and pass it down as props to existing client components.

**What:** Convert page.tsx files from `"use client"` to async Server Components. Fetch data server-side. Pass typed props to the existing UI client components.

**Before (current mock pattern):**
```typescript
// app/[clientId]/page.tsx  — currently "use client"
"use client";
const client = getClient(clientId);  // sync, from mock array
const projects = getClientProjects(clientId);
```

**After (server component pattern):**
```typescript
// app/[clientId]/page.tsx  — no "use client" directive
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: projects }, { data: docs }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single(),
    supabase.from("projects").select("*").eq("client_id", clientId),
    supabase.from("documents").select("*").eq("client_id", clientId),
  ]);

  if (!client) notFound();

  // Pass to existing client component (renamed to ClientPageContent)
  return <ClientPageContent client={client} projects={projects ?? []} docs={docs ?? []} />;
}
```

**When:** All page-level data fetching. This is the primary pattern for this project.

### Pattern 2: Server Actions for Mutations (replaces local state)

**What:** Replace client-side `useState` mutation patterns (current `handleAddDoc`, `handleAddMission`) with Server Actions that write to Supabase then call `revalidatePath`.

```typescript
// lib/actions/documents.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDocument(formData: FormData) {
  const supabase = await createClient();
  const clientId = formData.get("clientId") as string;

  const { error } = await supabase.from("documents").insert({
    client_id: clientId,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    content: formData.get("content") as string,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/${clientId}`);
}
```

**When:** All CREATE, UPDATE, DELETE operations. Called from Client Components with `import { createDocument } from "@/lib/actions/documents"`.

### Pattern 3: Route Handler with Real DB (context-builders migration)

The `/api/chat/route.ts` already works as a Route Handler. The only change needed is replacing the `buildAgencyContext()`, `buildClientContext()`, `buildProjectContext()` functions to query Supabase instead of reading from mock arrays.

```typescript
// lib/context-builders.ts — after migration
import { createClient } from "@/lib/supabase/server";

export async function buildClientContext(clientId: string): Promise<string> {
  const supabase = await createClient();

  const [{ data: client }, { data: projects }, { data: docs }] = await Promise.all([
    supabase.from("clients").select("*, contacts(*)").eq("id", clientId).single(),
    supabase.from("projects").select("*, budget_products(*)").eq("client_id", clientId),
    supabase.from("documents").select("*").eq("client_id", clientId),
  ]);

  // Same formatting logic as today — just data from DB not mock
  return buildPromptFromData(client, projects, docs);
}
```

**When:** The context builders are called from the Route Handler. Since route handlers run on the server, the server Supabase client works here directly.

### Pattern 4: Client Component with Server Action (for file upload)

PDF uploads cannot go through Server Actions due to the 1MB body limit. Use signed upload URLs instead: Server Action generates the URL, client-side code uploads directly to Supabase Storage.

```typescript
// Server Action — generates signed upload URL
"use server";
export async function getUploadUrl(filename: string, clientId: string) {
  const supabase = await createClient();
  const path = `${clientId}/${Date.now()}-${filename}`;
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { signedUrl: data.signedUrl, path };
}

// Client Component — uploads directly to Storage
async function handleFileUpload(file: File) {
  const { signedUrl, path } = await getUploadUrl(file.name, clientId);
  await fetch(signedUrl, { method: "PUT", body: file });
  await saveDocumentRecord({ path, clientId, name: file.name });
}
```

---

## Supabase Schema

The schema mirrors the 4-level hierarchy in PROJECT.md: agency (implicit, single owner) → clients → projects → products.

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Clients ─────────────────────────────────────────────────
create table clients (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique,                   -- human-readable ID ("brutus", "bloo-conseil")
  name        text not null,
  industry    text,
  category    text not null check (category in ('client', 'prospect', 'archived')),
  status      text not null check (status in ('active', 'draft', 'paused')),
  color       text,
  since       text,
  owner_id    uuid references auth.users(id) not null,
  created_at  timestamptz default now()
);

-- ─── Contacts ─────────────────────────────────────────────────
create table contacts (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid references clients(id) on delete cascade not null,
  name        text not null,
  role        text,
  email       text,
  phone       text,
  is_primary  boolean default false,
  created_at  timestamptz default now()
);

-- ─── Projects ─────────────────────────────────────────────────
create table projects (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid references clients(id) on delete cascade not null,
  name            text not null,
  type            text check (type in ('brand', 'site', 'campaign', 'social', 'other')),
  status          text check (status in ('active', 'done', 'paused', 'draft')),
  description     text,
  progress        int default 0,
  total_phases    int default 1,
  last_activity   text,
  start_date      date,
  potential_amount numeric,
  created_at      timestamptz default now()
);

-- ─── Budget Products ──────────────────────────────────────────
create table budget_products (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade not null,
  name            text not null,
  total_amount    numeric default 0,
  -- Payment stages stored as jsonb for flexibility
  devis           jsonb,   -- { amount, date, status }
  acompte         jsonb,
  avancement      jsonb,
  solde           jsonb,
  created_at      timestamptz default now()
);

-- ─── Documents ───────────────────────────────────────────────
create table documents (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid references clients(id) on delete cascade not null,
  project_id    uuid references projects(id) on delete cascade,  -- null = client-level doc
  name          text not null,
  type          text check (type in ('brief', 'platform', 'campaign', 'site', 'other')),
  content       text,              -- free-text note injected into agent context
  storage_path  text,              -- path in Supabase Storage (PDFs)
  external_url  text,              -- external link
  is_pinned     boolean default false,  -- pinned from project to client level
  pinned_from_project uuid references projects(id),
  updated_at    timestamptz default now(),
  created_at    timestamptz default now()
);
```

### Row Level Security (RLS) — Solo User Pattern

Since this is a single-owner dashboard, RLS policy is simple: every row is owned by the authenticated user via `owner_id` or via the parent table join.

```sql
-- Enable RLS on all tables
alter table clients enable row level security;
alter table contacts enable row level security;
alter table projects enable row level security;
alter table budget_products enable row level security;
alter table documents enable row level security;

-- Clients: direct owner_id check
create policy "owner_only" on clients
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Contacts: ownership via parent client
create policy "owner_only" on contacts
  for all using (
    exists (
      select 1 from clients
      where clients.id = contacts.client_id
      and clients.owner_id = auth.uid()
    )
  );

-- Projects: same pattern
create policy "owner_only" on projects
  for all using (
    exists (
      select 1 from clients
      where clients.id = projects.client_id
      and clients.owner_id = auth.uid()
    )
  );

-- Budget products + Documents: ownership via project or client
-- (same pattern — skip for brevity, follow projects model)
```

### Storage Buckets

```
documents/          — private bucket (requires signed URL to access)
  {client_id}/      — organized by client
    {timestamp}-{filename}
```

---

## Migration Path: mock.ts to Supabase

The migration is designed to be incremental. Each phase replaces one layer of the data stack while leaving the UI untouched.

### Phase Dependencies

```
[Auth setup] → [Schema + seed] → [Read (pages as server components)] → [Write (server actions)] → [File upload] → [Context builders from DB]
```

### Step-by-Step Migration Order

**Step 1: Supabase infrastructure** (no UI changes)
- Install `@supabase/ssr` and `@supabase/supabase-js`
- Create `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`
- Add `middleware.ts` for auth token refresh
- Create Supabase project, configure env vars

**Step 2: Schema + seed data** (no UI changes)
- Run SQL to create tables and RLS policies
- Seed with current mock data (clients, projects, products, documents)
- This makes mock.ts data available in real DB before UI migration

**Step 3: Migrate reads — convert pages to Server Components**
- `app/page.tsx`: replace `CLIENTS[0].id` with DB query for first client
- `app/[clientId]/page.tsx`: replace `getClient()`, `getClientProjects()`, `getClientDocs()` with Supabase queries. Extract the UI JSX into `ClientPageContent` Client Component.
- `app/[clientId]/[projectId]/page.tsx`: same pattern
- `GlobalNav` / `ClientSidebar`: receive client list as props from server instead of importing from mock

At this point mock.ts is fully replaced for reads. The UI should look identical.

**Step 4: Migrate writes — server actions**
- Create `src/lib/actions/clients.ts`, `projects.ts`, `documents.ts`, `products.ts`
- Replace `useState` mutation handlers (`handleAddDoc`, `handleAddMission`) with Server Action calls
- Remove `LocalProjects`, `ProjectOverrides` React contexts — they exist only because there was no backend

**Step 5: File/PDF upload**
- Add signed upload URL server action
- Wire up file input in DocumentsTab to use upload flow
- Store `storage_path` in documents table

**Step 6: Migrate context-builders.ts**
- Convert `buildAgencyContext`, `buildClientContext`, `buildProjectContext` to async functions that query Supabase
- Update `/api/chat/route.ts` to `await` these async calls
- mock.ts can now be deleted entirely

### The "Dark Swap" Technique

Each page migration can be done with a feature flag (env var `NEXT_PUBLIC_USE_SUPABASE=true`) so you can switch between mock and real DB without code deploys during development:

```typescript
// app/[clientId]/page.tsx
const client = process.env.NEXT_PUBLIC_USE_SUPABASE === "true"
  ? await fetchClientFromDB(clientId)
  : getClientFromMock(clientId);
```

This is optional but reduces risk during the transition. Remove it once the DB is stable.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Supabase Client in Client Components for Data Fetching
**What:** Importing `createBrowserClient` in a Client Component to fetch a list of clients/projects on mount.
**Why bad:** Exposes query logic to browser, bypasses RSC caching, requires extra round-trips, and complicates auth token handling.
**Instead:** Fetch in Server Component, pass as props. Only use browser client for realtime subscriptions.

### Anti-Pattern 2: `getSession()` for Auth Checks in Server Components
**What:** Using `supabase.auth.getSession()` to check if user is logged in inside a Server Component.
**Why bad:** Not guaranteed to revalidate the token — can return stale session data.
**Instead:** Always use `supabase.auth.getUser()` in Server Components. It hits the Supabase Auth server every time.

### Anti-Pattern 3: Single Global Supabase Client
**What:** Creating one module-level Supabase client and reusing it across requests.
**Why bad:** The client must be created per-request in Next.js (to bind to the request's cookies). A singleton leaks session state between requests.
**Instead:** Call `createClient()` inside each server component/action/route handler.

### Anti-Pattern 4: Server Action File Uploads (large files)
**What:** Streaming a PDF through a Server Action body.
**Why bad:** Next.js imposes a ~1MB default body limit on Server Actions.
**Instead:** Generate a signed upload URL via Server Action, upload directly from browser to Supabase Storage.

### Anti-Pattern 5: Keeping Context Providers for Local State That Should Be Server State
**What:** `LocalProjectsProvider`, `ProjectOverridesProvider` were necessary without a backend. Keeping them after DB migration.
**Why bad:** Creates two sources of truth — DB state and in-memory React state diverge.
**Instead:** Delete these providers after Step 4 migration. Server Components + `revalidatePath` handle state refresh.

### Anti-Pattern 6: Mixing Mock and Real Data Without a Clear Cutover Plan
**What:** Having some pages read from mock.ts and others from DB simultaneously in production.
**Why bad:** Context builders will mix data sources — agent gets inconsistent context. Documents added via DB won't appear in mock-based agent context.
**Instead:** Migrate reads fully (Step 3) before activating writes (Step 4). Migrate context-builders last (Step 6) as a single atomic swap.

---

## File Structure After Migration

```
dashboard/src/
├── app/
│   ├── layout.tsx              — Server Component (remove LocalProjects/ProjectOverrides providers)
│   ├── page.tsx                — Server Component (DB query for first client)
│   ├── [clientId]/
│   │   ├── page.tsx            — Server Component (async, fetches from DB)
│   │   └── [projectId]/
│   │       └── page.tsx        — Server Component (async, fetches from DB)
│   └── api/
│       └── chat/
│           └── route.ts        — Route Handler (unchanged, context-builders go async)
├── components/                 — All unchanged ("use client" stays, data arrives as props)
├── context/
│   ├── ThemeContext.tsx         — Keep
│   ├── ClientChatDrawer.tsx     — Keep
│   ├── LocalProjects.tsx        — DELETE after Step 4
│   └── ProjectOverrides.tsx     — DELETE after Step 4
├── lib/
│   ├── mock.ts                  — DELETE after Step 6
│   ├── doc-content.ts           — Keep initially, migrate to DB documents table
│   ├── context-builders.ts      — Migrate to async Supabase queries (Step 6)
│   ├── supabase/
│   │   ├── server.ts            — NEW: createClient for server
│   │   └── client.ts            — NEW: createBrowserClient
│   └── actions/
│       ├── clients.ts           — NEW: CRUD for clients
│       ├── projects.ts          — NEW: CRUD for projects
│       ├── documents.ts         — NEW: CRUD + upload URL for documents
│       └── products.ts          — NEW: CRUD for budget products
└── middleware.ts                — NEW: auth token refresh
```

---

## Scalability Considerations

| Concern | At solo use (now) | At collaborator invite | At multi-client future |
|---------|-------------------|----------------------|------------------------|
| Auth | Single Supabase user, email/password | Invite second user, share `owner_id` or add `team_id` | Full multi-tenant, RLS on `team_id` |
| RLS | `owner_id = auth.uid()` per table | Share owner or add role column | Team-based policies |
| Agent context | Full context per request | Add user filter to context | Per-team context scoping |
| Storage | Single bucket, client-scoped paths | Same bucket, access control via signed URLs | Bucket-per-team or path-based ACL |
| DB queries | No indexes needed at this scale | Add index on `client_id`, `project_id` | Add index on `owner_id`, `team_id` |

---

## Sources

- [Creating a Supabase client for SSR — Official Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — HIGH confidence
- [Setting up Server-Side Auth for Next.js — Official Docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH confidence
- [Supabase Row Level Security — Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Next.js Server and Client Components — Official Docs](https://nextjs.org/docs/app/getting-started/server-and-client-components) — HIGH confidence
- [Next.js Server Actions and Mutations — Official Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — HIGH confidence
- [Signed URL file uploads with Next.js and Supabase](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0) — MEDIUM confidence (community, verified against official storage docs)
- [Supabase Storage uploadToSignedUrl API](https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl) — HIGH confidence
- [Using React Query with Next.js App Router and Supabase Cache Helpers](https://supabase.com/blog/react-query-nextjs-app-router-cache-helpers) — MEDIUM confidence (official blog, slightly older but patterns are stable)
