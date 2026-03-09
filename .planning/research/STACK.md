# Technology Stack

**Project:** YamBoard — Agency Dashboard SaaS (Supabase backend milestone)
**Researched:** 2026-03-08
**Context:** Brownfield — Next.js 16 + Tailwind v4 UI shell exists. This document covers the Supabase integration layer only. Next.js and Tailwind are locked and not re-evaluated here.

---

## Recommended Stack

### Core Supabase Packages

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@supabase/supabase-js` | `^2.98.0` | Core JS client — DB queries, Storage, Auth | The base SDK; required by `@supabase/ssr`. Use 2.x — stable, well-maintained, currently at 2.98.0 as of 2026-03. |
| `@supabase/ssr` | `^0.9.0` | Cookie-based auth for SSR frameworks | Official replacement for the deprecated `@supabase/auth-helpers-nextjs`. Provides `createBrowserClient` and `createServerClient`. Required for App Router to persist sessions via HTTP-only cookies across Server Components, Route Handlers, Server Actions, and middleware. |

**Do NOT install:**
- `@supabase/auth-helpers-nextjs` — deprecated, replaced by `@supabase/ssr`
- `@supabase/auth-helpers-react` — same, deprecated

### Infrastructure (Supabase Platform)

| Service | Purpose | Why |
|---------|---------|-----|
| Supabase Auth | Email/password login + future invite flow | Built-in, no third-party auth service needed. Provides `auth.uid()` for RLS. Admin API (`inviteUserByEmail`) handles future collaborator onboarding without multi-tenant complexity. |
| Supabase Database (Postgres) | Persistent data for all entities | Full Postgres with RLS. The data model (clients → projects → products/docs) maps naturally to relational tables. |
| Supabase Storage | PDF and document file uploads | Integrated with Auth, RLS policies apply to `storage.objects` table directly — same pattern as DB RLS. Private buckets + signed URLs for secure access. |
| Supabase Realtime | NOT needed for v1 | Single-user tool. No collaborative features, no multi-session state. WebSocket connection overhead is unnecessary. Use standard fetch/server components for data loading. |

---

## Client Setup Patterns

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # server-only, never expose to browser
```

**Note on key naming:** Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). The publishable key is a newer Supabase format, but `ANON_KEY` is the stable convention used across all official docs and templates as of 2026-03. The `SUPABASE_SERVICE_ROLE_KEY` is required only for admin operations (e.g., `inviteUserByEmail`) in Server Actions.

### File Structure

```
dashboard/src/
  lib/
    supabase/
      client.ts        ← browser client (Client Components)
      server.ts        ← server client (Server Components, Server Actions, Route Handlers)
      middleware.ts    ← updateSession helper (called from root middleware.ts)
  middleware.ts        ← Next.js middleware root (calls updateSession)
```

### Browser Client — `src/lib/supabase/client.ts`

Used in Client Components (interactive UI, file upload widgets, etc.).

```typescript
'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**When to use:** Any `'use client'` component that needs to read/write data or access auth state. For file uploads from the browser, always use the browser client.

### Server Client — `src/lib/supabase/server.ts`

Used in Server Components, Server Actions, and Route Handlers.

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — cookies are read-only here,
            // but middleware handles the refresh, so this is safe to ignore.
          }
        },
      },
    }
  )
}
```

**When to use:** Server Components (data fetching for initial render), Server Actions (mutations), Route Handlers (`app/api/...`).

**Critical rule:** Always use `supabase.auth.getUser()` — never `supabase.auth.getSession()` — on the server side. `getSession()` does not re-validate the token against the Auth server; `getUser()` does. Using `getSession()` for auth checks is a security vulnerability.

### Middleware — `src/middleware.ts`

Required. Refreshes the Auth token on every request so Server Components always have a fresh session. Without this, tokens expire and users get logged out mid-session.

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: must call getUser() — this is what refreshes the session
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Why the matcher matters:** Without a matcher, middleware runs on every static asset request, adding latency to image/CSS/JS loads. The regex above skips Next.js internals and static files.

---

## Auth Flow — Solo User + Future Invite

### v1: Solo Owner (Email + Password)

The simplest valid setup. No magic links, no OAuth needed for v1.

1. Single login page: `app/login/page.tsx`
2. Server Action calls `supabase.auth.signInWithPassword({ email, password })`
3. Middleware refreshes token on every request
4. Protected routes check `supabase.auth.getUser()` in the layout or page
5. If no user → `redirect('/login')`

```typescript
// In a protected layout (e.g., app/(dashboard)/layout.tsx)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <>{children}</>
}
```

### v2: Collaborator Invite (Future)

Supabase provides `supabase.auth.admin.inviteUserByEmail(email, { redirectTo })` via the Admin API. This requires the `SUPABASE_SERVICE_ROLE_KEY` — call it only from a Server Action, never from a Client Component.

```typescript
// Server Action — invite flow (future)
import { createClient } from '@supabase/supabase-js'

// Admin client uses service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function inviteCollaborator(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  })
  // ...
}
```

**Note:** PKCE is not supported with `inviteUserByEmail` because the browser initiating the invite differs from the browser accepting it. The email link flow handles this automatically. No extra config needed.

**RLS consideration for future invite:** Add a `collaborators` table or `role` column on user metadata. RLS policies that currently use `auth.uid() = owner_id` can be extended with an `OR` clause or a helper function checking membership. Design the schema now to support this without a migration.

---

## Row Level Security Strategy

### Philosophy

Enable RLS on every table immediately. An unprotected table is a liability. RLS with no policies = deny all (secure default). Add policies that explicitly allow what is needed.

### v1: Single-Owner Pattern

Every table gets an `owner_id uuid` column referencing `auth.users(id)`. All policies check `auth.uid() = owner_id`.

```sql
-- Example: clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can select" ON clients
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "owner can insert" ON clients
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "owner can update" ON clients
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "owner can delete" ON clients
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);
```

**Why `(SELECT auth.uid())` instead of `auth.uid()` directly:** The subquery form forces evaluation once per query rather than once per row, which is a significant performance win on large tables. Official Supabase performance docs recommend this pattern.

### v2: Future Collaborator Extension

Design the schema to support this without breaking v1 RLS:

```sql
-- Future: collaborators junction table
CREATE TABLE collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  resource_type text,  -- 'client', 'project', etc.
  resource_id uuid,
  role text,           -- 'viewer', 'editor'
  created_at timestamptz DEFAULT now()
);

-- Extended policy example (v2 ready):
CREATE POLICY "owner or collaborator can select" ON clients
  FOR SELECT USING (
    (SELECT auth.uid()) = owner_id
    OR EXISTS (
      SELECT 1 FROM collaborators
      WHERE user_id = (SELECT auth.uid())
      AND resource_type = 'client'
      AND resource_id = clients.id
    )
  );
```

For v1, skip the `collaborators` table entirely but name the `owner_id` column consistently across all tables so the extension is additive, not a rewrite.

### Tables and RLS Summary

| Table | owner_id | Key Policies |
|-------|----------|-------------|
| `clients` | yes | CRUD for owner only |
| `projects` | yes (also `client_id`) | CRUD for owner only |
| `products` | yes (also `project_id`) | CRUD for owner only |
| `documents` | yes (also `client_id`, `project_id`) | CRUD for owner only |
| `contacts` | yes (also `client_id`) | CRUD for owner only |
| `billing_stages` | yes (also `product_id`) | CRUD for owner only |

---

## Storage — PDF and Document Uploads

### Bucket Setup

| Bucket | Type | Purpose |
|--------|------|---------|
| `documents` | Private | All PDF uploads (briefs, deliverables, brand platforms) |

Private buckets require RLS policies on `storage.objects`. Objects are never publicly accessible — access is always via signed URLs with expiration.

### Storage RLS Policies

```sql
-- Allow authenticated owner to upload
CREATE POLICY "owner can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Allow owner to read their files
CREATE POLICY "owner can read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Allow owner to delete their files
CREATE POLICY "owner can delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
```

**Folder convention:** Store files at `{user_id}/{client_id}/{project_id}/{filename}`. The RLS policy on the top-level folder (`foldername[1] = auth.uid()`) protects the entire tree.

### Upload Pattern — Client Component with Signed URL

For files over ~1MB (typical PDFs), avoid passing through a Server Action (body size limit). Use a two-step signed URL upload:

```typescript
// Step 1 (Server Action): Generate signed upload URL
export async function getUploadUrl(path: string) {
  const supabase = await createClient()  // server client
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(path)
  return data?.signedUrl
}

// Step 2 (Client Component): Upload directly to Supabase Storage
const signedUrl = await getUploadUrl(`${userId}/${clientId}/${projectId}/${file.name}`)
await fetch(signedUrl, { method: 'PUT', body: file })
```

### Reading Files — Signed Download URLs

Never use public URLs for private bucket files. Generate signed URLs with TTL:

```typescript
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl(`${userId}/${clientId}/${filename}`, 3600) // 1 hour TTL

// data.signedUrl is safe to render in an <iframe> or <a> for PDF viewing
```

**Security note:** RLS is evaluated at signed URL creation time, not at download time. Once issued, the signed URL is valid for its TTL regardless of subsequent permission changes. Keep TTLs short (1 hour) for sensitive documents.

---

## Supabase Realtime — Explicit Skip

**Decision: Do NOT integrate Supabase Realtime in v1.**

**Rationale:**
- YamBoard is a single-user tool. Realtime's value proposition is collaborative state sync (cursors, presence, live updates across multiple sessions).
- A single authenticated user refreshing a page gets fresh data from Server Components. No polling or WebSocket subscription is needed.
- Realtime adds persistent WebSocket connections, increasing infrastructure complexity and Supabase plan considerations unnecessarily.
- If a future milestone introduces multi-user collaboration, Realtime becomes relevant at that point.

**Alternative for "live-ish" UX:** Use Next.js Server Actions with `revalidatePath()` or `revalidateTag()` after mutations. This gives instant UI updates after any CRUD operation without Realtime.

---

## Installation

```bash
# Add to dashboard/
cd dashboard

# Core Supabase packages
npm install @supabase/supabase-js @supabase/ssr
```

**Current package.json state (existing):**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.78.0",
    "next": "^16.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

**After installation:**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.78.0",
    "@supabase/supabase-js": "^2.98.0",
    "@supabase/ssr": "^0.9.0",
    "next": "^16.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

No additional dev dependencies needed for Supabase.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Auth package | `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Deprecated. Official docs explicitly say to migrate away from it. The `@supabase/ssr` package is the current and maintained solution. |
| Auth provider | Supabase Auth | Clerk, Auth.js | Supabase Auth is already in the stack. Clerk adds external dependency and cost. Auth.js requires more custom integration with Supabase DB. No reason to add complexity. |
| File storage | Supabase Storage | Cloudflare R2, AWS S3 | Supabase Storage is included in the Supabase plan, integrated with Auth RLS, and requires zero additional configuration. R2/S3 would require separate auth for upload tokens. |
| Realtime | Skip | Supabase Realtime | Single-user tool. No collaborative features. Server Components + `revalidatePath` provides sufficient "live" experience after mutations. |
| Key naming | `ANON_KEY` | `PUBLISHABLE_KEY` | `PUBLISHABLE_KEY` is a newer Supabase format, not yet universally supported across all SDKs and docs. `ANON_KEY` is the stable, backward-compatible convention. |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Package versions | HIGH | Verified against npm as of 2026-03 (`@supabase/supabase-js` 2.98.0, `@supabase/ssr` 0.9.0) |
| `@supabase/ssr` as correct package | HIGH | Confirmed via official Supabase docs; `auth-helpers` deprecation confirmed |
| App Router client patterns | HIGH | Code patterns from official Supabase SSR docs; `getAll`/`setAll` only (no `get`/`set`/`remove`) |
| Middleware pattern | HIGH | Official Supabase docs; `getUser()` not `getSession()` for security confirmed in official security notes |
| RLS single-owner | HIGH | Standard Postgres RLS; `auth.uid()` helper is Supabase core functionality |
| Storage signed URL pattern | MEDIUM | Pattern confirmed in multiple official docs; specific TTL values are project-dependent |
| Invite flow future design | MEDIUM | `inviteUserByEmail` confirmed in Supabase JS reference; PKCE incompatibility confirmed in official note |
| Realtime skip decision | HIGH | Use case analysis — single user, no collaborative state needed |

---

## Sources

- [Setting up Server-Side Auth for Next.js — Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Creating a Supabase client for SSR — Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [AI Prompt: Bootstrap Next.js v16 app with Supabase Auth — Supabase Docs](https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth)
- [Row Level Security — Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage Access Control — Supabase Docs](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage Ownership — Supabase Docs](https://supabase.com/docs/guides/storage/security/ownership)
- [Storage Buckets — Supabase Docs](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [@supabase/ssr on npm](https://www.npmjs.com/package/@supabase/ssr)
- [@supabase/supabase-js on npm](https://www.npmjs.com/package/@supabase/supabase-js)
- [Migrating from Auth Helpers to SSR — Supabase Docs](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)
- [auth.admin.inviteUserByEmail — Supabase JS Reference](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Using Realtime with Next.js — Supabase Docs](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
