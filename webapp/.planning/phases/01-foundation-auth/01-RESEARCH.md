# Phase 1: Foundation + Auth - Research

**Researched:** 2026-02-25
**Domain:** Next.js 16 App Router + Supabase Auth SSR + Project CRUD
**Confidence:** MEDIUM-HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Utilisateur cible V0.1**
- Utilisateur unique (le propriétaire) — pas de gestion multi-users pour l'instant
- Pas besoin d'inscription, juste login avec credentials existants Supabase
- Multi-users différé à une version ultérieure

**Dashboard — layout projets**
- Liste simple (pas de cards ni table)
- Chaque ligne affiche : nom du projet + date + compteur texte "X/6 workflows"
- Ordre : dernier modifié en premier (le projet actif remonte automatiquement)
- État vide : message simple "Aucun projet." + bouton "Créer un projet"

**Création de projet**
- Modal depuis le dashboard (bouton "Nouveau projet")
- Champ unique obligatoire : nom du projet
- Après création → redirection automatique vers le projet créé
- Suppression possible : bouton supprimer + confirmation simple ("Vous êtes sûr ?")
- Renommage différé à V0.2

**Affichage progression workflows (vue projet)**
- Liste des 6 workflows GBD affichés dès Phase 1 (même si la plupart sont verrouillés)
- Pastille de statut par workflow : gris = disponible, vert = complété, verrou = bloqué par dépendance
- Les comportements réels (lancer, dépendances actives) arriveront en Phase 3
- Phase 1 pose uniquement la structure UI statique pour les workflows

### Claude's Discretion
- Design exact de la page login (branding, couleurs, layout)
- Gestion des erreurs auth (messages d'erreur, UX)
- Stack technique (Next.js App Router, Supabase client, middleware de session)
- Schéma DB exact pour les projets et l'état des workflows

### Deferred Ideas (OUT OF SCOPE)
- Gestion multi-utilisateurs — version ultérieure
- Renommage de projet inline — V0.2
- Description/champs additionnels sur le projet — future phase
- Page login avec branding avancé — polish Phase 5
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Utilisateur peut se connecter avec email/mot de passe (Supabase Auth) | `signInWithPassword()` via `@supabase/ssr` browser client in login form component |
| AUTH-02 | Session persistée entre les rechargements de page (JWT refresh via middleware) | `proxy.ts` + `updateSession` using `getClaims()` — refreshes JWT on every request |
| AUTH-03 | Utilisateur non connecté est redirigé vers /login | Route protection logic in `proxy.ts` checking `getClaims()` result, redirect to `/login` |
| AUTH-04 | Pas d'inscription publique — 2 comptes créés manuellement dans Supabase | No signup page needed; accounts created via Supabase dashboard |
| PROJ-01 | Utilisateur peut créer un nouveau projet client avec un nom | Server Action + Supabase client insert into `projects` table |
| PROJ-02 | Utilisateur voit la liste de tous les projets (tableau de bord) | Server Component fetching from `projects` table, ordered by `updated_at DESC` |
| PROJ-03 | Utilisateur peut rouvrir un projet existant et reprendre la conversation | Dynamic route `/projects/[id]` reads project + workflow states from DB |
| PROJ-04 | Chaque projet affiche quels workflows ont été complétés | `workflow_states` table with status per workflow per project; static UI in Phase 1 |
</phase_requirements>

---

## Summary

This phase builds the authentication foundation and project management layer using Next.js 16 App Router with Supabase Auth SSR. The critical insight is that Next.js 16 (stable since October 2025) introduces the **`proxy.ts` file** as the successor to `middleware.ts` — the logic is identical but the filename and exported function name change. Supabase's `@supabase/ssr` package has been updated to support this pattern using `getClaims()` for JWT validation rather than the older `getSession()`.

The project uses Supabase for both auth and database. With only 2 hardcoded users and no multi-tenancy requirement, the RLS policy for projects is simple: all authenticated users can read/write all projects. The DB schema needs two tables: `projects` (id, name, created_at, updated_at) and `workflow_states` (project_id, workflow_slug, status). The workflow states table should be created in Phase 1 even though the UI for launching workflows arrives in Phase 3.

**Primary recommendation:** Use `npx create-next-app@latest` (gets Next.js 16 by default), install `@supabase/supabase-js @supabase/ssr`, and follow the `proxy.ts` pattern for session management. Keep the schema minimal — two tables, simple RLS policies.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.x (latest stable) | App Router, routing, Server Components | Official choice; version locked in STATE.md |
| react / react-dom | 19.2.x | UI rendering | Bundled with Next.js 16 |
| @supabase/supabase-js | latest | Supabase client (auth + DB queries) | Official Supabase JS client |
| @supabase/ssr | latest | Server-side auth helpers for Next.js | Replaces deprecated `@supabase/auth-helpers-nextjs` |
| typescript | 5.1+ | Type safety | Required by Next.js 16 minimum |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.x | Styling | Included in `create-next-app` default template |
| @types/node | latest | Node.js types | TypeScript support for server code |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | @supabase/auth-helpers-nextjs | auth-helpers is deprecated; SSR is the current standard |
| Supabase Auth | NextAuth.js / Auth.js | NextAuth adds complexity; Supabase Auth integrates natively with the DB |
| Server Actions (form submit) | Client-side API call | Server Actions are the Next.js 16 idiomatic pattern |
| proxy.ts | middleware.ts | `middleware.ts` is deprecated in Next.js 16 (still works, but produces warnings) |

**Installation:**
```bash
npx create-next-app@latest webapp --typescript --tailwind --app --src-dir
cd webapp
npm install @supabase/supabase-js @supabase/ssr
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Redirect to /dashboard or /login
│   ├── login/
│   │   └── page.tsx            # Login page (Client Component with form)
│   ├── dashboard/
│   │   └── page.tsx            # Project list (Server Component)
│   └── projects/
│       └── [id]/
│           └── page.tsx        # Project detail (Server Component)
├── components/
│   ├── login-form.tsx          # 'use client' — form with signInWithPassword
│   ├── create-project-modal.tsx # 'use client' — modal with form
│   └── workflow-status-list.tsx # Static workflow status display
├── lib/
│   └── supabase/
│       ├── client.ts           # createBrowserClient (Client Components)
│       ├── server.ts           # createServerClient (Server Components)
│       └── proxy.ts            # updateSession — used by proxy.ts at root
└── actions/
    └── projects.ts             # Server Actions: createProject, deleteProject
proxy.ts                        # Session refresh + route protection (root level)
```

### Pattern 1: Supabase Proxy (Session Refresh + Route Protection)

**What:** `proxy.ts` at the project root intercepts every request, refreshes the JWT via `getClaims()`, and redirects unauthenticated users to `/login`.

**When to use:** Always — it's the only way Server Components can receive a refreshed auth token.

**`proxy.ts` (root):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

**`src/lib/supabase/proxy.ts` (updateSession logic):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  // IMPORTANT: use getClaims() not getSession() — validates JWT locally
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // Protect all routes except /login and /auth/*
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### Pattern 2: Browser Client (Client Components)

**What:** `createBrowserClient` for Client Components that need to call Supabase directly (login form, sign out button).

```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Login form usage:**
```typescript
// src/components/login-form.tsx
"use client"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Display error to user
      return
    }
    router.push("/dashboard")
    router.refresh() // Force Server Components to re-render with new session
  }
  // ...
}
```

### Pattern 3: Server Client (Server Components)

**What:** `createServerClient` for Server Components, Route Handlers, and Server Actions that need authenticated Supabase access.

```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
            // Ignore — Server Component cannot set cookies;
            // proxy.ts handles token refresh
          }
        },
      },
    }
  )
}
```

### Pattern 4: Server Actions for Project CRUD

**What:** `'use server'` functions for create/delete project — called from Client Components, run on server.

```typescript
// src/actions/projects.ts
"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProject(name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .insert({ name })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/dashboard")
  redirect(`/projects/${data.id}`)
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  await supabase.from("projects").delete().eq("id", id)
  revalidatePath("/dashboard")
  redirect("/dashboard")
}
```

### Pattern 5: Database Schema

**What:** Minimal schema for Phase 1. Two tables. Simple RLS (all authenticated users access all rows — valid for 2-user internal tool).

```sql
-- projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update updated_at on project modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- workflow_states table (created in Phase 1, used actively in Phase 3)
CREATE TABLE workflow_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workflow_slug TEXT NOT NULL,  -- 'start', 'platform', 'campaign', 'site-standalone', 'wireframe'
  status TEXT NOT NULL DEFAULT 'locked', -- 'locked', 'available', 'completed'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, workflow_slug)
);

-- RLS: enable and allow all authenticated users (internal tool, 2 users)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on projects"
  ON projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on workflow_states"
  ON workflow_states FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Note on workflow_states initial data:** When a project is created, insert 6 rows into `workflow_states` — one per workflow. The first workflow (`start`) should be `available`, all others `locked`. This can be done via a Supabase database function triggered on project insert, or within the `createProject` Server Action.

### Anti-Patterns to Avoid

- **Using `getSession()` in proxy/server code:** `getSession()` does not revalidate the JWT. Use `getClaims()` for proxy-side checks (local JWT validation), or `getUser()` for server-side definitive validation. The proxy docs explicitly warn against `getSession()`.
- **Using `middleware.ts` instead of `proxy.ts`:** Still works in Next.js 16 but is deprecated and shows warnings. Use `proxy.ts` with exported function named `proxy`.
- **Importing `@supabase/auth-helpers-nextjs`:** Deprecated package. Always import from `@supabase/ssr`.
- **Using `cookies()` synchronously:** In Next.js 16, `cookies()` (and `headers()`) are async — always `await cookies()`.
- **Setting cookies in Server Components:** Server Components cannot set cookies. The `setAll` in `server.ts` has a try/catch intentionally — token refresh is handled by `proxy.ts`, not Server Components.
- **Relying solely on proxy for authorization:** Proxy should only do optimistic checks (JWT validation). Database-level protection (RLS) is the real security layer.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session refresh / JWT rotation | Custom cookie management | `@supabase/ssr` with `proxy.ts` | Token rotation has subtle race conditions; library handles PKCE, refresh timing |
| Password hashing / auth | Custom auth system | Supabase Auth | Bcrypt, rate limiting, secure token generation — solved problems |
| DB migrations | Manual SQL in prod | Supabase migrations (`supabase db push`) or dashboard SQL editor | Schema versioning, rollback safety |
| Route protection | Custom JWT parsing | `getClaims()` from `@supabase/ssr` in proxy | JWT validation edge cases, expiry handling |
| Form state management | Custom reducer | `useActionState` (React 19 / Next.js 16) | Built-in pattern for Server Action forms |

**Key insight:** Auth is one of the highest-risk areas to custom-build. The combination of Supabase Auth + `@supabase/ssr` handles JWT rotation, cookie security (httpOnly, SameSite, Secure), PKCE flow, and token expiry — all proven pitfalls when implementing manually.

---

## Common Pitfalls

### Pitfall 1: middleware.ts vs proxy.ts in Next.js 16

**What goes wrong:** Creating `middleware.ts` as in Next.js 15 tutorials. The file still runs but logs deprecation warnings and may cause confusion when Supabase docs reference `proxy.ts`.

**Why it happens:** Majority of tutorials and Supabase docs (prior to late 2025) use `middleware.ts`. Next.js 16 (released October 2025) renamed it.

**How to avoid:** Always create `proxy.ts` at the project root with `export function proxy(request: NextRequest)` or `export default function proxy(...)`.

**Warning signs:** Console warnings about deprecated `middleware.ts` during `next dev`.

### Pitfall 2: Async APIs not awaited (Next.js 16 breaking change)

**What goes wrong:** Code like `const cookieStore = cookies()` (synchronous) throws errors in Next.js 16 because `cookies()`, `headers()`, and `draftMode()` are now fully async.

**Why it happens:** Was synchronous in Next.js 14; made async (with backward compat) in 15; backward compat removed in 16.

**How to avoid:** Always `const cookieStore = await cookies()` in server code. Run the codemod: `npx @next/codemod@canary upgrade latest` if migrating from 15.

**Warning signs:** Runtime error "cookies() should be awaited before using its value."

### Pitfall 3: getSession() in proxy code

**What goes wrong:** Using `supabase.auth.getSession()` in `proxy.ts` / `updateSession()`. The function doesn't revalidate the JWT against Supabase's server, so a revoked or expired session may appear valid.

**Why it happens:** `getSession()` reads from the cookie without verification. Many older tutorials use it.

**How to avoid:** Use `getClaims()` (validates JWT signature locally) in `proxy.ts`. Use `getUser()` in Route Handlers or Server Actions where you need to verify the user exists in Supabase's system.

**Warning signs:** Users remain logged in after password change or account deletion.

### Pitfall 4: updated_at not auto-updating on project modification

**What goes wrong:** The dashboard sort order ("dernier modifié en premier") breaks because `updated_at` only reflects the INSERT time.

**Why it happens:** PostgreSQL doesn't auto-update timestamps — you must add a trigger.

**How to avoid:** Create the `update_updated_at_column` trigger on the `projects` table (see schema above). Also update `updated_at` manually in `workflow_states` updates if the project's `updated_at` needs to reflect workflow activity.

**Warning signs:** Active projects don't sort to the top; `updated_at = created_at` always.

### Pitfall 5: Missing router.refresh() after login

**What goes wrong:** After `signInWithPassword()` succeeds and `router.push('/dashboard')` is called, the Server Components on `/dashboard` still render as if the user is unauthenticated (empty project list, redirect loop).

**Why it happens:** Next.js client-side navigation reuses the Server Component cache. The auth cookie exists but the RSC payload is stale.

**How to avoid:** Call `router.refresh()` immediately after `router.push('/dashboard')` in the login form handler. This forces Server Components to re-render with the new auth state.

**Warning signs:** Blank dashboard, redirect loop between `/login` and `/dashboard`.

### Pitfall 6: RLS blocks project creation

**What goes wrong:** `INSERT` into `projects` fails silently or returns a permission error, even though the user is authenticated.

**Why it happens:** RLS is enabled but only a `SELECT` policy exists, or the policy uses `auth.uid() = user_id` but the projects table has no `user_id` column (intentional for this 2-user tool).

**How to avoid:** Use `FOR ALL` policy with `USING (true) WITH CHECK (true)` scoped to `authenticated` role. Verify with Supabase dashboard → Table Editor → RLS tab.

**Warning signs:** `supabase.from('projects').insert(...)` returns error code `42501`.

---

## Code Examples

Verified patterns from official sources:

### Sign In with Email/Password (Client Component)
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password",
})
if (error) {
  console.error("Login failed:", error.message)
} else {
  router.push("/dashboard")
  router.refresh()
}
```

### Sign Out (Server Action)
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
"use server"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
```

### Fetch Projects (Server Component)
```typescript
// Dashboard page — Server Component
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      updated_at,
      workflow_states(status)
    `)
    .order("updated_at", { ascending: false })

  // Count completed workflows per project
  const projectsWithCount = projects?.map((p) => ({
    ...p,
    completedCount: p.workflow_states.filter(w => w.status === "completed").length,
  }))

  return (/* render list */)
}
```

### Create Project with Workflow States Init (Server Action)
```typescript
"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const WORKFLOWS = [
  { slug: "start",           status: "available" },
  { slug: "platform",        status: "locked" },
  { slug: "campaign",        status: "locked" },
  { slug: "site-standalone", status: "available" },  // independent
  { slug: "wireframe",       status: "locked" },
]

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name })
    .select()
    .single()

  if (error || !project) throw error

  // Initialize workflow states
  await supabase.from("workflow_states").insert(
    WORKFLOWS.map((w) => ({
      project_id: project.id,
      workflow_slug: w.slug,
      status: w.status,
    }))
  )

  revalidatePath("/dashboard")
  redirect(`/projects/${project.id}`)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 (Oct 2025) | Must rename file and function |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | Mid 2024 | Different import paths; auth-helpers deprecated |
| `cookies()` synchronous | `await cookies()` | Next.js 16 (breaking) | Async APIs mandatory |
| `supabase.auth.getSession()` in server | `getClaims()` or `getUser()` | 2024 Supabase security update | Security: getSession doesn't revalidate JWT |
| `createMiddlewareClient` | `createServerClient` in proxy | @supabase/ssr release | Different API |
| `params` synchronous | `await params` | Next.js 16 (breaking) | All dynamic route params are async |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not use.
- `createMiddlewareClient`, `createServerComponentClient`, `createClientComponentClient`: All replaced by `createServerClient` / `createBrowserClient` from `@supabase/ssr`.
- `supabase.auth.getSession()` in server code: Security risk — use `getClaims()` or `getUser()`.

---

## Open Questions

1. **getClaims() vs getUser() in proxy — which does Supabase currently recommend?**
   - What we know: `getClaims()` validates JWT locally (fast, no network call). `getUser()` validates with Supabase's server (slower, definitive). Search results mention both. Supabase's latest docs mention `getClaims()` for proxy use.
   - What's unclear: Whether `@supabase/ssr` latest version exposes `getClaims()` or if it still uses `getUser()` in the internal `updateSession` template. Some fetched docs showed `getUser()` in the middleware pattern, others showed `getClaims()`.
   - Recommendation: Use `getUser()` in proxy if `getClaims()` is not available in the installed `@supabase/ssr` version. Check at implementation time: `supabase.auth.getUser()` is the safe fallback per older official Supabase middleware examples. Ping the Supabase docs for the current template.

2. **workflow_states `site-standalone` independence logic**
   - What we know: Per CONTEXT.md, `/site-standalone` is independent (not dependent on `/start`), and `/wireframe` depends on `/site-standalone`. The other chain is `/start` → `/platform` → `/campaign`.
   - What's unclear: Should `site-standalone` start as `available` alongside `start`, or should `start` be a prerequisite?
   - Recommendation: Based on CONTEXT.md "indépendant", initialize `site-standalone` as `available` from project creation. Two parallel chains: `[start → platform → campaign]` and `[site-standalone → wireframe]`.

3. **Next.js 16 version compatibility with @supabase/ssr**
   - What we know: Supabase docs were last updated very recently (search result showed "updated within last 24 hours") and reference Next.js 16 patterns. The `@supabase/ssr` package supports the `proxy.ts` pattern.
   - What's unclear: Exact minimum version of `@supabase/ssr` for Next.js 16 / React 19.2 compatibility.
   - Recommendation: Use `npm install @supabase/ssr@latest` at setup time. If issues arise, check Supabase GitHub releases.

---

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/blog/next-16 — Next.js 16 release notes; `proxy.ts` rename, breaking changes, async APIs
- https://nextjs.org/docs/app/guides/upgrading/version-16 — Complete upgrade guide; breaking changes list
- https://nextjs.org/docs/app/getting-started/proxy — Official Next.js 16 proxy documentation
- https://supabase.com/docs/guides/auth/server-side/creating-a-client — Supabase SSR client patterns (updated 2025/2026)
- https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth — Supabase AI prompt for Next.js 16 auth bootstrap

### Secondary (MEDIUM confidence)
- https://supabase.com/docs/guides/auth/server-side/nextjs — Server-side auth setup guide
- https://supabase.com/docs/guides/auth/quickstarts/nextjs — Quickstart guide
- https://supabase.com/docs/guides/auth/server-side/advanced-guide — Security details on getClaims vs getUser
- https://supabase.com/docs/guides/database/postgres/row-level-security — RLS documentation

### Tertiary (LOW confidence)
- Search result summaries about `updateSession` + `getClaims` implementation details — exact code not verified against running template

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js 16 and @supabase/ssr confirmed via official docs
- Architecture: HIGH — proxy.ts pattern confirmed via official Next.js 16 docs + Supabase docs
- DB schema: MEDIUM — Schema design is custom; RLS policy pattern confirmed via Supabase docs
- getClaims() vs getUser() in proxy: LOW-MEDIUM — conflicting signals across docs; `getUser()` is the safe fallback

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (30 days — stable stack but Supabase docs update frequently)

**Key discovery:** Next.js 16 was released October 2025. `middleware.ts` is now `proxy.ts`. This is a breaking naming change that affects all Supabase auth tutorials written before Oct 2025. The `@supabase/ssr` package has been updated to support this. Node.js 20.9+ is now the minimum — verify local environment before setup.
