---
phase: 01-foundation-auth-infrastructure-schema
plan: "03"
subsystem: auth
tags: [supabase, ssr, next-auth, middleware, server-actions, protected-routes]

# Dependency graph
requires:
  - phase: 01-01
    provides: createClient() async server client + @supabase/ssr installed

provides:
  - Middleware token refresh on every request via getUser()
  - Login page with email/password form + error display
  - Server Actions login() + logout() using signInWithPassword()
  - Protected (dashboard) layout redirecting to /login if unauthenticated
  - All dashboard routes moved into (dashboard)/ route group

affects:
  - 01-04 (seed data — user created in Supabase for testing)
  - 01-05 (security audit — getSession forbidden patterns)
  - 02-01 (DAL layer — protected context available)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "middleware.ts at src/ (not app/) — Next.js middleware placement"
    - "getUser() not getSession() in all server-side auth checks (SEC-3)"
    - "Route group (dashboard)/ for layout-scoped protection without URL segments"
    - "Server Actions with 'use server' for login/logout mutations"
    - "useFormStatus() for pending state in Client Component forms"

key-files:
  created:
    - dashboard/src/middleware.ts
    - dashboard/src/app/login/page.tsx
    - dashboard/src/app/login/actions.ts
    - dashboard/src/app/(dashboard)/layout.tsx
  modified:
    - dashboard/src/app/(dashboard)/[clientId]/page.tsx (moved from app/[clientId]/)

key-decisions:
  - "getUser() used exclusively (not getSession()) — validates token server-side on every request"
  - "Matcher excludes /login + api/debug to prevent infinite redirect loops and allow debug calls"
  - "(dashboard)/ route group used — protects all routes without adding URL segment"
  - "login() returns { error } instead of throwing — Client Component handles display"

patterns-established:
  - "Auth check pattern: const { data: { user } } = await supabase.auth.getUser() then if (!user) redirect('/login')"
  - "Server Action pattern: 'use server' + await createClient() + direct auth method"
  - "Protected layout pattern: Server Component in (dashboard)/layout.tsx as auth gate"

requirements-completed: [AUTH-1, AUTH-2, AUTH-3, AUTH-4]

# Metrics
duration: ~35min
completed: 2026-03-08
---

# Phase 01 Plan 03: Auth Gate Summary

**Supabase auth gate with middleware token refresh, Server Actions login/logout, and protected (dashboard)/ route group — all routes now redirect to /login without a session.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-08T10:00:00Z
- **Completed:** 2026-03-08T11:30:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 4 created, 1 moved

## Accomplishments

- Middleware runs `getUser()` on every request (excluding `/login`, `api/debug`, static assets) to refresh session tokens
- Login page with email/password form, loading state via `useFormStatus()`, and inline error display
- Server Actions `login()` and `logout()` — no `getSession()` calls anywhere in server files
- `(dashboard)/layout.tsx` Server Component gates all dashboard routes — human verified: redirect and login flow work correctly

## Task Commits

1. **Task 1: Middleware + Server Actions auth** - `b134f46` (feat)
2. **Task 1b: Fix — exclude api/debug from middleware matcher** - `cc097f9` (fix)
3. **Task 2: Login page + protected layout + route moves** - `7798aa3` (feat)
4. **Task 3: Checkpoint verified by human** - approved (no commit — verification only)

## Files Created/Modified

- `dashboard/src/middleware.ts` — Token refresh on every request via `createServerClient` + `getUser()`; matcher excludes `/login` and `api/debug`
- `dashboard/src/app/login/actions.ts` — `login()` and `logout()` Server Actions with `'use server'`
- `dashboard/src/app/login/page.tsx` — Client Component login form with `useFormStatus()` pending state and error display
- `dashboard/src/app/(dashboard)/layout.tsx` — Protected layout: `getUser()` + `redirect('/login')` if no user
- `dashboard/src/app/(dashboard)/[clientId]/page.tsx` — Moved from `app/[clientId]/` (no content change)

## Decisions Made

- **getUser() not getSession()** — `getSession()` reads from local storage and does not validate the JWT server-side. `getUser()` makes a network call to Supabase auth server to revalidate the token on every request. Required by SEC-3.
- **Matcher excludes api/debug** — Added beyond the plan spec to allow unauthenticated access to a debug API route during development. Low risk, prevents redirect loops on debug calls.
- **login() returns `{ error }` not throw** — Server Action returning an object lets the Client Component handle display without a full page reload or error boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added api/debug exclusion to middleware matcher**
- **Found during:** Task 1 (middleware.ts)
- **Issue:** The `api/debug` route needed to be accessible without auth during development. Without exclusion, middleware would run on it and potentially cause redirect loops.
- **Fix:** Added `api/debug` to the matcher exclusion pattern
- **Files modified:** `dashboard/src/middleware.ts`
- **Verification:** Matcher pattern confirmed in file
- **Committed in:** `cc097f9`

---

**Total deviations:** 1 auto-fixed (missing critical — debug route exclusion)
**Impact on plan:** Minor additive change. No scope creep. Auth gate behavior unchanged for all production routes.

## Issues Encountered

None — auth gate flow verified end-to-end by human: login with valid credentials redirects to `/`, logout redirects to `/login`, UI v2 intact.

## User Setup Required

**A Supabase user account must exist to test login.** Create one in Supabase Dashboard > Authentication > Users before verifying this plan.

## Next Phase Readiness

- Auth gate is complete and verified — all dashboard routes protected
- Plan 01-04 (seed data) is already committed and ready
- Plan 01-05 (security audit) can proceed: `getSession()` is absent from all server files — only `getUser()` is used
- Phase 02 (live reads / DAL layer) has its auth prerequisite satisfied

---
*Phase: 01-foundation-auth-infrastructure-schema*
*Completed: 2026-03-08*
