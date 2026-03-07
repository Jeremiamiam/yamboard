---
phase: 01-foundation-auth
plan: 03
subsystem: auth
tags: [next.js, supabase, auth, login, server-actions, client-components]

# Dependency graph
requires:
  - phase: 01-foundation-auth/01-02
    provides: Supabase browser/server clients + proxy.ts session middleware

provides:
  - Login page at /login (Server Component shell + Client Component form)
  - signInWithPassword login flow with router.refresh() for RSC cache invalidation
  - Root / redirect to /dashboard
  - signOut Server Action for dashboard use

affects: [01-04-dashboard — uses signOut action; proxy.ts redirects unauthenticated users to /login now that the page exists]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useRouter + router.push + router.refresh() after signInWithPassword — required to invalidate stale RSC cache"
    - "Server Component page wrapping a Client Component form — keeps page statically renderable"
    - "'use server' directive in actions/auth.ts for signOut Server Action"
    - "form action={signOut} pattern — will be used in dashboard (Plan 04)"

key-files:
  created:
    - src/app/login/page.tsx
    - src/components/login-form.tsx
    - src/actions/auth.ts
  modified:
    - src/app/page.tsx

key-decisions:
  - "router.refresh() called after router.push('/dashboard') — forces Server Components to re-render with new session cookie, without it dashboard renders as unauthenticated"
  - "No signup link anywhere in the UI — AUTH-04 compliance (2 hardcoded accounts only)"
  - "signOut action placed in src/actions/auth.ts — will be imported directly as form action in dashboard"

patterns-established:
  - "Login form: client-side signInWithPassword (not server action) — simpler pattern, Supabase handles session cookie automatically"
  - "signOut: server action pattern with redirect — consistent with Next.js App Router best practices"

requirements-completed: [AUTH-01, AUTH-04]

# Metrics
duration: ~2min
completed: 2026-02-25
---

# Phase 01 Plan 03: Login Page + Auth Flow Summary

**Login page with email/password form (signInWithPassword + router.refresh()), root redirect, and signOut Server Action — completes AUTH-01 and AUTH-04**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-25T20:00:14Z
- **Completed:** 2026-02-25T20:01:59Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `src/app/page.tsx` — root route redirects to /dashboard (proxy enforces auth check)
- Created `src/app/login/page.tsx` — Server Component wrapper with "GET BRANDON" heading and LoginForm
- Created `src/components/login-form.tsx` — Client Component with controlled email/password inputs, signInWithPassword call, router.push + router.refresh() on success, French error message on failure
- Created `src/actions/auth.ts` — signOut Server Action that signs out via server Supabase client and redirects to /login

## Task Commits

Each task was committed atomically:

1. **Task 1: Build login page and LoginForm component** - `1126eef` (feat)
2. **Task 2: Create signOut Server Action** - `0acf2ec` (feat)

## Files Created/Modified

- `src/app/page.tsx` — Root route: `redirect("/dashboard")`
- `src/app/login/page.tsx` — Server Component shell, imports LoginForm, renders "GET BRANDON" heading
- `src/components/login-form.tsx` — Client Component with controlled form, signInWithPassword, router.refresh() on success, no signup link
- `src/actions/auth.ts` — "use server" Server Action: signOut() calls supabase.auth.signOut() then redirects to /login

## Decisions Made

- `router.refresh()` is called after `router.push("/dashboard")` — this is mandatory to force Server Components to re-render with the new session cookie. Without it, the dashboard renders as unauthenticated due to stale RSC cache.
- Login form uses client-side `signInWithPassword` directly (not a Server Action) — Supabase SSR handles the session cookie automatically via the browser client.
- No signup link anywhere in the UI — AUTH-04 compliance. The app has 2 hardcoded Supabase accounts, no public registration.
- `signOut` is a Server Action (not client-side) — consistent with Next.js App Router best practices for mutations that modify server state.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED

- FOUND: src/app/page.tsx
- FOUND: src/app/login/page.tsx
- FOUND: src/components/login-form.tsx
- FOUND: src/actions/auth.ts
- FOUND commit: 1126eef
- FOUND commit: 0acf2ec
- `npx tsc --noEmit` passes with no errors

## Next Phase Readiness

- Login flow complete. Unauthenticated users hitting any route are redirected to /login by proxy.ts.
- On successful login, `router.push("/dashboard") + router.refresh()` navigates to dashboard with fresh session.
- `signOut` action ready to import in dashboard: `import { signOut } from "@/actions/auth"` then `<form action={signOut}><button type="submit">Sign out</button></form>`.
- Plan 04 (dashboard) can now build on top of this complete auth foundation.

---
*Phase: 01-foundation-auth*
*Completed: 2026-02-25*
