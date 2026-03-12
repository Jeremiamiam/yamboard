# Phase 01: Foundation — Auth + Infrastructure + Schema — Research

**Researched:** 2026-03-08
**Domain:** Supabase Auth + Next.js 16 App Router SSR + PostgreSQL schema + RLS
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-1 | Login page (`/login`) avec email + mot de passe Supabase | `signInWithPassword` via Server Action; login page pattern documented below |
| AUTH-2 | Toutes les routes dashboard protégées (redirect `/login` si non authentifié) | Protected layout with `getUser()` + `redirect('/login')` |
| AUTH-3 | Middleware Next.js rafraîchit le token à chaque requête via `getUser()` | `middleware.ts` pattern with `createServerClient` + `getUser()` call |
| AUTH-4 | Logout fonctionnel | `supabase.auth.signOut()` in a Server Action |
| SEC-1 | RLS activé sur toutes les tables, politiques créées dans la même migration | RLS + policy in one migration file per table; pattern documented |
| SEC-2 | `WITH CHECK (auth.uid() = owner_id)` sur tous les INSERT/UPDATE | Explicit `WITH CHECK` clause required on all INSERT/UPDATE policies |
| SEC-3 | `getUser()` uniquement côté serveur (jamais `getSession()`) | `getSession()` is a verified security vulnerability on server; `getUser()` mandatory |
| SEC-4 | `SUPABASE_SERVICE_ROLE_KEY` jamais préfixé `NEXT_PUBLIC_`, `import 'server-only'` dans le client admin | `import 'server-only'` guard; no `NEXT_PUBLIC_` prefix on service role key |
| PERF-1 | Index sur `owner_id`, `client_id`, `project_id` sur toutes les tables | Indexes required for RLS policy columns; `003_indexes.sql` file |
| ARCH-6 | Scripts SQL dans `dashboard/supabase/migrations/` avec nommage séquentiel (`001_schema.sql`, etc.) | Manual execution in Supabase Studio SQL Editor in numeric order |
</phase_requirements>

---

## Summary

Phase 01 is pure infrastructure — no UI changes. The goal is a functional Supabase project with auth, schema, RLS, and seed data that the existing Next.js 16 UI can eventually be wired to. This phase has zero UI impact: the app continues to run on mock data after this phase completes; the infrastructure is simply in place and verified.

The existing project research (`.planning/research/`) has already verified the complete stack and patterns at HIGH confidence using official Supabase docs. This phase-level research consolidates those findings into the exact actions required for Plans 01-01 through 01-05, with specific file paths, SQL templates, and security validation procedures.

The dominant risk in this phase is auth security setup errors made in the first commit that become hard to audit later — specifically `getSession()` instead of `getUser()` in middleware, and missing `WITH CHECK` clauses on INSERT/UPDATE RLS policies. Both are non-negotiable from day one. Secondary risk is the directory structure for SQL migrations being inconsistent, which would require renaming/reordering before Phase 02 applies any changes.

**Primary recommendation:** Install packages, create the two client files + middleware in one commit, then create SQL migrations in sequence (001 → 004) with RLS + indexes in the same session. Run seed last. Verify via Supabase Studio before moving to Phase 02.

---

## Standard Stack

### Core Packages to Install

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `^2.98.0` | Base SDK for DB queries, Storage, Auth | Required by `@supabase/ssr`; all query/auth methods |
| `@supabase/ssr` | `^0.9.0` | Cookie-based auth for Next.js App Router | Official replacement for deprecated `@supabase/auth-helpers-nextjs`; handles `createBrowserClient` and `createServerClient` |

**Do NOT install:**
- `@supabase/auth-helpers-nextjs` — deprecated, will cause conflicts
- `@supabase/auth-helpers-react` — same deprecation

### Current `package.json` state (before this phase)

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

**After Plan 01-01:**
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

**Installation command (run from `dashboard/`):**
```bash
cd dashboard
npm install @supabase/supabase-js @supabase/ssr
```

### Environment Variables

```bash
# .env.local (never commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Rules:**
- `NEXT_PUBLIC_` prefix is safe ONLY for `URL` and `ANON_KEY` — they are meant to be public
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER have `NEXT_PUBLIC_` prefix
- `SUPABASE_SERVICE_ROLE_KEY` is not needed in Phase 01 (no admin operations yet); add it now to set the pattern

Create `.env.example` (committed to git with placeholder values) to document required vars.

---

## Architecture Patterns

### Recommended File Structure for This Phase

```
dashboard/
├── src/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts        ← browser client (Client Components)
│   │       └── server.ts        ← server client (Server Components, Server Actions, Route Handlers)
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx         ← NEW: login form page
│   │   └── (dashboard)/
│   │       └── layout.tsx       ← NEW: protected layout with getUser() guard
│   └── middleware.ts             ← NEW: auth token refresh on every request
└── supabase/
    └── migrations/
        ├── 001_schema.sql        ← 5 tables + owner_id columns
        ├── 002_rls.sql           ← ENABLE ROW LEVEL SECURITY + all policies
        ├── 003_indexes.sql       ← indexes on owner_id, client_id, project_id
        └── 004_seed.sql          ← mock data as INSERT statements
```

### Pattern 1: Browser Client (singleton)

**File:** `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**When to use:** Client Components that need auth state or file uploads. Never import this in Server Components.

**Critical rule:** `createBrowserClient` must be called at module level (or once), not inside a React render function. Calling it inside a component body creates multiple GoTrueClient instances and causes race conditions.

### Pattern 2: Server Client (per-request)

**File:** `src/lib/supabase/server.ts`

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
            // Server Component: cookies are read-only here.
            // Middleware handles the refresh — safe to ignore this error.
          }
        },
      },
    }
  )
}
```

**When to use:** Server Components, Server Actions, Route Handlers. Create per-request — never module-level singleton.

### Pattern 3: Middleware (token refresh)

**File:** `src/middleware.ts` (root of `dashboard/src/`, NOT inside `app/`)

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: getUser() — not getSession() — this is what actually refreshes the token
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Matcher explanation:** Excludes `/login` to prevent infinite redirect loops. Excludes Next.js internals and static assets to avoid latency on every image/CSS/JS load.

### Pattern 4: Protected Layout

**File:** `src/app/(dashboard)/layout.tsx` (route group, no URL segment)

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <>{children}</>
}
```

**Route group note:** The `(dashboard)` folder uses parentheses so it does not add a URL segment. All routes inside it are protected. The existing `app/layout.tsx` (root layout with providers) stays unchanged.

### Pattern 5: Login Page

**File:** `src/app/login/page.tsx`

Login requires a Client Component for the form (interactive) calling a Server Action for the auth logic.

```typescript
// Server Action: src/app/login/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

**Login page note:** Keep the login page minimal — email + password form, no OAuth, no magic link. Solo usage. The existing UI design language (Tailwind dark/light themes) can be applied but this is Phase 01 infrastructure; visual polish is secondary.

---

## Schema SQL — 5 Tables

### File: `dashboard/supabase/migrations/001_schema.sql`

```sql
-- Enable UUID generation (Supabase includes this by default but explicit is safe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Clients ─────────────────────────────────────────────────
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT UNIQUE,
  name        TEXT NOT NULL,
  industry    TEXT,
  category    TEXT NOT NULL CHECK (category IN ('client', 'prospect', 'archived')),
  status      TEXT NOT NULL CHECK (status IN ('active', 'draft', 'paused')),
  color       TEXT,
  since       TEXT,
  owner_id    UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Contacts ─────────────────────────────────────────────────
CREATE TABLE contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT,
  email       TEXT,
  phone       TEXT,
  is_primary  BOOLEAN DEFAULT false,
  owner_id    UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Projects ─────────────────────────────────────────────────
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  type             TEXT CHECK (type IN ('brand', 'site', 'campaign', 'social', 'other')),
  status           TEXT CHECK (status IN ('active', 'done', 'paused', 'draft')),
  description      TEXT,
  progress         INT DEFAULT 0,
  total_phases     INT DEFAULT 1,
  last_activity    TEXT,
  start_date       TEXT,
  potential_amount NUMERIC,
  owner_id         UUID REFERENCES auth.users(id) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── Budget Products ──────────────────────────────────────────
CREATE TABLE budget_products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  devis        JSONB,
  acompte      JSONB,
  avancement   JSONB,
  solde        JSONB,
  owner_id     UUID REFERENCES auth.users(id) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Documents ───────────────────────────────────────────────
CREATE TABLE documents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  type                TEXT CHECK (type IN ('brief', 'platform', 'campaign', 'site', 'other')),
  content             TEXT,
  storage_path        TEXT,
  external_url        TEXT,
  is_pinned           BOOLEAN DEFAULT false,
  pinned_from_project UUID REFERENCES projects(id) ON DELETE SET NULL,
  owner_id            UUID REFERENCES auth.users(id) NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

**Design decisions reflected:**
- `owner_id` on ALL tables (not just `clients`) — enables direct RLS without joins on every table
- `contacts` has its own `owner_id` even though it's linked to `client` — avoids join-based RLS complexity
- `start_date` stored as `TEXT` (not `DATE`) to match mock data format ("Oct 2024", "À planifier")
- `budget_products` stores payment stages as `JSONB` — flexible, matches current `PaymentStage` type exactly
- `documents.is_pinned` + `pinned_from_project` — supports DOC-7 (project → client pinning)
- `slug` on `clients` — preserved from mock data; routes use UUID per REQUIREMENTS.md decision

### File: `dashboard/supabase/migrations/002_rls.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;

-- ─── Clients ─────────────────────────────────────────────────
CREATE POLICY "clients: owner select" ON clients
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "clients: owner insert" ON clients
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "clients: owner update" ON clients
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "clients: owner delete" ON clients
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- ─── Contacts ─────────────────────────────────────────────────
CREATE POLICY "contacts: owner select" ON contacts
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "contacts: owner insert" ON contacts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "contacts: owner update" ON contacts
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "contacts: owner delete" ON contacts
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- ─── Projects ─────────────────────────────────────────────────
CREATE POLICY "projects: owner select" ON projects
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "projects: owner insert" ON projects
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "projects: owner update" ON projects
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "projects: owner delete" ON projects
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- ─── Budget Products ──────────────────────────────────────────
CREATE POLICY "budget_products: owner select" ON budget_products
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "budget_products: owner insert" ON budget_products
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "budget_products: owner update" ON budget_products
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "budget_products: owner delete" ON budget_products
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- ─── Documents ───────────────────────────────────────────────
CREATE POLICY "documents: owner select" ON documents
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents: owner insert" ON documents
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents: owner update" ON documents
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents: owner delete" ON documents
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);
```

**RLS design rationale:**
- `(SELECT auth.uid())` subquery form (not `auth.uid()` directly) — evaluated once per query, not per row; official Supabase performance recommendation
- All 4 CRUD operations covered per table — no gap between SELECT/INSERT/UPDATE/DELETE
- `WITH CHECK` on INSERT and UPDATE — prevents `owner_id` spoofing (SEC-2)
- Direct `owner_id` check on all tables (no join-based policies) — simpler, faster, easier to audit

### File: `dashboard/supabase/migrations/003_indexes.sql`

```sql
-- Indexes for RLS policy columns (required for performance at any scale)
CREATE INDEX IF NOT EXISTS clients_owner_id_idx        ON clients(owner_id);
CREATE INDEX IF NOT EXISTS contacts_owner_id_idx       ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS contacts_client_id_idx      ON contacts(client_id);
CREATE INDEX IF NOT EXISTS projects_owner_id_idx       ON projects(owner_id);
CREATE INDEX IF NOT EXISTS projects_client_id_idx      ON projects(client_id);
CREATE INDEX IF NOT EXISTS budget_products_owner_id_idx ON budget_products(owner_id);
CREATE INDEX IF NOT EXISTS budget_products_project_id_idx ON budget_products(project_id);
CREATE INDEX IF NOT EXISTS documents_owner_id_idx      ON documents(owner_id);
CREATE INDEX IF NOT EXISTS documents_client_id_idx     ON documents(client_id);
CREATE INDEX IF NOT EXISTS documents_project_id_idx    ON documents(project_id);
```

### File: `dashboard/supabase/migrations/004_seed.sql`

The seed file translates all data from `src/lib/mock.ts` into SQL `INSERT` statements. Key constraints:

- All UUIDs generated with `uuid_generate_v4()` or explicit UUIDs — use explicit UUIDs so foreign keys can reference them without subqueries
- `owner_id` must be set to the actual authenticated user's UUID from Supabase Auth — **this value must be replaced** with the real user UUID after the first login
- Seed execution order: clients → contacts → projects → budget_products → documents (foreign key dependency order)

**Seed placeholder pattern:**
```sql
-- Replace this UUID with your actual auth.users id from Supabase Studio
-- SELECT id FROM auth.users LIMIT 1;
DO $$
DECLARE
  owner_uuid UUID := 'YOUR-AUTH-USER-UUID-HERE';
  -- client UUIDs
  brutus_id UUID := uuid_generate_v4();
  bloo_id UUID := uuid_generate_v4();
  -- ...
BEGIN
  INSERT INTO clients (id, slug, name, industry, category, status, color, since, owner_id)
  VALUES
    (brutus_id, 'brutus', 'Brutus.club', 'E-commerce · Pet', 'client', 'active', '#f97316', 'Oct 2024', owner_uuid),
    (bloo_id, 'bloo-conseil', 'Bloo Conseil', 'Conseil · Cyber', 'client', 'active', '#3b82f6', 'Sep 2024', owner_uuid),
    -- ...
    ;
END $$;
```

**Full seed data to migrate from `mock.ts`:**
- 7 clients (4 active, 2 prospects, 1 archived)
- 9 projects across 5 clients
- 11 budget_products across 5 projects
- 9 documents (4 global client-level, 5 project-level)
- Contacts: 1 per client (from `client.contact` field in mock — split into `contacts` table)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management | Custom JWT parsing or cookie handling | `@supabase/ssr` `createServerClient` | Token refresh, cookie serialization, expiry handling are complex. SSR package handles all of it. |
| Protected route middleware | Manual cookie parsing in middleware | `supabase.auth.getUser()` in middleware | Validates token against Auth server; can't be faked with cookie spoofing. |
| Password hashing | bcrypt, argon2 | Supabase Auth built-in | Supabase handles password storage, hashing, rate limiting, and brute-force protection. |
| SQL migration runner | Custom migration system | Supabase Studio SQL Editor (manual) | Per ARCH-6: manual execution in Supabase Studio; no CLI tooling needed for this project. |
| RLS policies via application code | Application-level auth filters | PostgreSQL RLS | RLS enforced at DB level; application-level filters can be bypassed. |

---

## Common Pitfalls

### Pitfall 1: `getSession()` instead of `getUser()` in middleware
**What goes wrong:** `getSession()` reads the cookie without validating the token server-side. Spoofed cookies bypass all auth guards.
**How to avoid:** Use `getUser()` everywhere server-side. Zero exceptions. `getSession()` is only acceptable in `'use client'` components.
**Warning signs:** Any `getSession()` call in `middleware.ts`, Server Components, or Server Actions.
**Verification command:**
```bash
grep -r "getSession" dashboard/src --include="*.ts" --include="*.tsx" | grep -v "use client"
```
Zero results required.

### Pitfall 2: RLS enabled, no policies = silent DENY ALL
**What goes wrong:** `ENABLE ROW LEVEL SECURITY` with no policies blocks all access. Queries return empty arrays. SQL Editor bypasses this (superuser), masking the problem.
**How to avoid:** `002_rls.sql` must be run immediately after `001_schema.sql`. Never run schema without RLS policies in the same session.
**Warning signs:** Queries return empty after seed. SQL Editor shows data but app shows nothing.
**Check:** `SELECT tablename, policyname FROM pg_policies ORDER BY tablename;` — should list 4 policies per table (20 total).

### Pitfall 3: Missing `WITH CHECK` on INSERT/UPDATE
**What goes wrong:** INSERT policy with only `USING` allows a user to insert a row with any `owner_id`, including another user's UUID.
**How to avoid:** Template in `002_rls.sql` above includes `WITH CHECK` on all INSERT and UPDATE policies.
**Warning signs:** Any INSERT/UPDATE policy without `WITH CHECK` on a table with `owner_id`.
**Check:** `SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'clients';`

### Pitfall 4: Middleware infinite redirect loop
**What goes wrong:** Middleware redirects to `/login`, but `/login` itself triggers middleware, causing infinite 302 chain.
**How to avoid:** The matcher above explicitly excludes `/login` from middleware execution.
**Warning signs:** Browser console shows "redirected you too many times."

### Pitfall 5: Service role key exposure
**What goes wrong:** `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` prefix is bundled into client JS. Gives anyone superuser database access.
**How to avoid:** Never prefix with `NEXT_PUBLIC_`. Add `import 'server-only'` to any file that uses the service role key.
**Verification:**
```bash
# After build — if any output contains the service role key, it's exposed
grep -r "service_role" dashboard/.next/ 2>/dev/null
```

### Pitfall 6: Seed `owner_id` hardcoded wrong UUID
**What goes wrong:** Seed inserts data with a placeholder UUID instead of the real authenticated user's UUID. All data is invisible to the logged-in user (RLS filters it out).
**How to avoid:** Before running `004_seed.sql`, retrieve the actual user UUID from `SELECT id FROM auth.users LIMIT 1;` in Supabase Studio and replace the placeholder.
**Warning signs:** Login works but all tables appear empty in the app.

### Pitfall 7: Middleware in wrong location
**What goes wrong:** `middleware.ts` placed inside `app/` instead of at `dashboard/src/middleware.ts` (or `dashboard/middleware.ts` for older Next.js). Next.js ignores it silently.
**How to avoid:** File must be at `dashboard/src/middleware.ts` (with `src/` directory) or `dashboard/middleware.ts` (without `src/`). Since this project uses `src/`, place at `dashboard/src/middleware.ts`.
**Warning signs:** Token is never refreshed; users get logged out mid-session.

---

## Security Validation Checklist (Plan 01-05)

This is the explicit verification procedure for the security audit plan:

```
SEC-3 (getUser audit):
  grep -r "getSession" dashboard/src --include="*.ts" --include="*.tsx"
  → Zero results in non-client files required

SEC-2 (WITH CHECK audit):
  SELECT policyname, cmd, with_check
  FROM pg_policies
  WHERE cmd IN ('INSERT', 'UPDATE') AND with_check IS NULL;
  → Zero results required

SEC-4 (service role key isolation):
  grep -r "SERVICE_ROLE" dashboard/src --include="*.ts" --include="*.tsx"
  → Results only in server-only files (never 'use client')
  grep -r "NEXT_PUBLIC_SUPABASE_SERVICE" dashboard/ → Zero results required

SEC-1 (RLS coverage):
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies
  );
  → Zero results required (every table has at least one policy)

ARCH-6 (migration file presence):
  ls dashboard/supabase/migrations/
  → 001_schema.sql 002_rls.sql 003_indexes.sql 004_seed.sql
```

---

## Code Examples

### Verified: Auth with `getUser()` in protected layout
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
```

### Verified: signInWithPassword Server Action
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/')
}
```

### Verified: RLS policy with performance-optimized `auth.uid()` subquery
```sql
-- Source: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
-- (SELECT auth.uid()) evaluated once per query, not once per row
CREATE POLICY "owner_only" ON clients
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);
```

### Verified: JSONB payment stage query
```sql
-- Reading a payment stage from budget_products
SELECT id, name, total_amount,
  acompte->>'status' AS acompte_status,
  (acompte->>'amount')::numeric AS acompte_amount
FROM budget_products
WHERE project_id = $1;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023, official deprecation | auth-helpers is unmaintained; SSR package is the only correct choice |
| `getSession()` on server | `getUser()` on server | Always a vulnerability, officially documented 2024 | Critical security fix |
| `get`/`set`/`remove` cookie methods in SSR client | `getAll`/`setAll` only | `@supabase/ssr` 0.x | Old methods cause session issues; use only `getAll`/`setAll` |
| Single global Supabase client | Per-request server client | App Router requirement | Singleton leaks cookies/sessions between requests |

**Deprecated/outdated patterns to avoid:**
- `createServerComponentClient()` — from old `auth-helpers`, not from `@supabase/ssr`
- `createRouteHandlerClient()` — same, deprecated
- `createMiddlewareClient()` — same, deprecated
- `supabase.auth.getSession()` in any server-side code

---

## Open Questions

1. **Route group structure for protected layout**
   - What we know: The existing `app/layout.tsx` (root layout) wraps all providers. A `(dashboard)` route group can add auth protection without changing URLs.
   - What's unclear: Whether existing pages need to be moved into the `(dashboard)` folder or if the root layout can serve as the auth guard.
   - Recommendation: Use `app/(dashboard)/layout.tsx` as the protected layout. Move existing pages (`[clientId]/`, `api/`, `compta/`) into `(dashboard)/`. The root `layout.tsx` keeps its providers but no auth check.

2. **`start_date` column type: TEXT vs DATE**
   - What we know: Mock data uses strings like "Oct 2024", "À planifier", "2026". These are not parseable as SQL `DATE`.
   - What's unclear: Whether Phase 02 or 03 needs actual date arithmetic on this field.
   - Recommendation: Keep `start_date TEXT` for now. If date-based sorting is needed in Phase 03, add a `start_date_parsed DATE` column via an additive migration. Do not block Phase 01 on this.

3. **Seed `owner_id` UUID — timing**
   - What we know: `004_seed.sql` requires the real authenticated user UUID to be inserted. The user must exist in `auth.users` before the seed can run.
   - What's unclear: Whether to create the Supabase user account before writing the seed file, or use a dynamic `DO $$ ... END $$` block that queries `auth.users`.
   - Recommendation: Use a `DO $$ ... END $$` block with `SELECT id FROM auth.users LIMIT 1` to avoid hardcoding. Create the Supabase Auth user account first (in Supabase Studio > Authentication > Users) before running the seed.

---

## Validation Architecture

Config has `workflow.nyquist_validation` absent — treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — this project has no test setup |
| Config file | None — Wave 0 gap |
| Quick run command | N/A — manual verification via Supabase Studio |
| Full suite command | N/A |

**Note:** Phase 01 is pure infrastructure (SQL + file creation). There are no application logic functions to unit test. Validation is manual via Supabase Studio SQL queries and browser-based auth flow testing.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-1 | Login page renders, submits credentials, redirects on success | manual-e2e | `npm run dev` + browser test | ❌ Wave 0 — no test file |
| AUTH-2 | Unauthenticated request to `/` redirects to `/login` | manual-e2e | `curl -I http://localhost:3000/` | ❌ manual |
| AUTH-3 | Token refresh on every request (middleware fires) | manual-smoke | Check middleware console logs | ❌ manual |
| AUTH-4 | Logout clears session, redirects to `/login` | manual-e2e | Browser test | ❌ manual |
| SEC-1 | RLS enabled on all 5 tables with policies | sql-verify | `SELECT tablename, policyname FROM pg_policies;` in Studio | ❌ manual SQL |
| SEC-2 | WITH CHECK on all INSERT/UPDATE | sql-verify | `SELECT policyname, cmd, with_check FROM pg_policies WHERE cmd IN ('INSERT','UPDATE') AND with_check IS NULL;` | ❌ manual SQL |
| SEC-3 | No getSession() in server-side code | grep-audit | `grep -r "getSession" dashboard/src --include="*.ts"` | ❌ manual grep |
| SEC-4 | SERVICE_ROLE_KEY never in NEXT_PUBLIC | grep-audit | `grep -r "NEXT_PUBLIC_SUPABASE_SERVICE" dashboard/` | ❌ manual grep |
| PERF-1 | Indexes on all RLS columns | sql-verify | `SELECT indexname FROM pg_indexes WHERE tablename IN ('clients','contacts','projects','budget_products','documents');` | ❌ manual SQL |
| ARCH-6 | Migration files in correct directory with sequential naming | file-check | `ls dashboard/supabase/migrations/` | ❌ manual |

### Wave 0 Gaps

All validation for Phase 01 is manual — no automated test infrastructure is needed for this phase since it produces SQL files and infrastructure configuration, not testable application functions. The manual verification commands above are the test suite for Phase 01.

- No Wave 0 test file creation needed
- Verification checklist in Plan 01-05 covers all security requirements

*(If a test framework is introduced in a later phase, it can be scaffolded then. Phase 01 has no testable pure functions.)*

---

## Sources

### Primary (HIGH confidence)
- [Supabase: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — auth patterns, middleware, protected layout, login Server Action
- [Supabase: Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `createServerClient`, `createBrowserClient`, `getAll`/`setAll` pattern
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy syntax, `WITH CHECK`, `auth.uid()`
- [Supabase: RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — `(SELECT auth.uid())` subquery optimization
- [Supabase: Migrating from Auth Helpers to SSR](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers) — confirms `auth-helpers` deprecation
- [npm: @supabase/supabase-js](https://www.npmjs.com/package/@supabase/supabase-js) — version 2.98.0 confirmed
- [npm: @supabase/ssr](https://www.npmjs.com/package/@supabase/ssr) — version 0.9.0 confirmed

### Secondary (MEDIUM confidence)
- [Supabase GitHub Discussion: Multiple GoTrueClient instances](https://github.com/orgs/supabase/discussions/37755) — browser client singleton requirement
- Existing project research: `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` — HIGH confidence, already verified against official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified on npm as of 2026-03; packages confirmed via official Supabase migration guide
- Auth patterns: HIGH — code patterns verbatim from official Supabase SSR docs
- Schema SQL: HIGH — PostgreSQL standard syntax; `owner_id` column design from official Supabase RLS guide
- RLS policies: HIGH — `(SELECT auth.uid())` form confirmed in performance docs; `WITH CHECK` requirement confirmed in security docs
- Seed data structure: HIGH — direct translation of `mock.ts` data; no ambiguity
- Pitfalls: HIGH — sourced from official Supabase security docs and verified project research

**Research date:** 2026-03-08
**Valid until:** 2026-06-08 (stable ecosystem — Supabase v2 is stable; `@supabase/ssr` 0.x patterns documented and not changing rapidly)
