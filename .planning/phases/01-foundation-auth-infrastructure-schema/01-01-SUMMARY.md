---
phase: 01-foundation-auth-infrastructure-schema
plan: "01"
subsystem: infra
tags: [supabase, nextjs, ssr, typescript, env]

# Dependency graph
requires: []
provides:
  - Browser Supabase client singleton via createBrowserClient (@supabase/ssr)
  - Per-request async server Supabase client via createServerClient + cookies()
  - Environment variable documentation (.env.example committed)
affects:
  - 01-03-PLAN.md (auth gate middleware needs server createClient)
  - 01-05-PLAN.md (security audit needs both clients)
  - 02-xx (DAL layer imports server createClient)
  - 03-xx (Server Actions use server createClient)

# Tech tracking
tech-stack:
  added:
    - "@supabase/supabase-js@^2.98.0"
    - "@supabase/ssr@^0.9.0"
  patterns:
    - "Browser client: factory function (not module-level singleton) to avoid multiple GoTrueClient instances"
    - "Server client: async factory per-request using await cookies() — never singleton"
    - "Cookie handling: getAll/setAll only — no individual get/set/remove methods"

key-files:
  created:
    - dashboard/src/lib/supabase/client.ts
    - dashboard/src/lib/supabase/server.ts
    - dashboard/.env.example
  modified:
    - dashboard/package.json
    - dashboard/package-lock.json
    - dashboard/.env.local

key-decisions:
  - "Used NEXT_PUBLIC_SUPABASE_ANON_KEY (not PUBLISHABLE_KEY) — anon key is the correct @supabase/ssr variable name"
  - "server.ts is async — required for await cookies() in Next.js 15/16 App Router"
  - "cookieStore.set() inside setAll() is correct — it is the Next.js cookieStore API call, not a deprecated Supabase method"
  - "SUPABASE_SERVICE_ROLE_KEY never prefixed NEXT_PUBLIC_ — server-only, SEC-4 compliant"

patterns-established:
  - "Pattern 1: All server-side Supabase access goes through dashboard/src/lib/supabase/server.ts createClient()"
  - "Pattern 2: All client-side Supabase access goes through dashboard/src/lib/supabase/client.ts createClient()"
  - "Pattern 3: .env.local is not committed; .env.example is committed with placeholders"

requirements-completed: [SEC-3, SEC-4, ARCH-6]

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 01 Plan 01: Install Supabase Packages + Clients Summary

**@supabase/ssr browser and server client factories installed and wired with getAll/setAll cookies for Next.js 16 App Router**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T09:53:20Z
- **Completed:** 2026-03-08T09:54:57Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed @supabase/supabase-js@^2.98.0 and @supabase/ssr@^0.9.0 into dashboard/package.json dependencies
- Created dashboard/src/lib/supabase/client.ts — browser factory using createBrowserClient
- Created dashboard/src/lib/supabase/server.ts — async per-request server factory using createServerClient with getAll/setAll cookie pattern
- Created dashboard/.env.example with correct variable names and comments (committed)
- Updated dashboard/.env.local with NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY variable names

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Supabase packages** - `19403f9` (chore)
2. **Task 2: Create Supabase clients + env files** - `e335c3d` (feat)

**Plan metadata:** (to be committed with this SUMMARY)

## Files Created/Modified
- `dashboard/src/lib/supabase/client.ts` - Browser Supabase client factory via createBrowserClient
- `dashboard/src/lib/supabase/server.ts` - Async server Supabase client factory with getAll/setAll cookies
- `dashboard/.env.example` - Committed placeholder env documentation for all required variables
- `dashboard/package.json` - Added @supabase/supabase-js and @supabase/ssr to dependencies
- `dashboard/.env.local` - Updated to use NEXT_PUBLIC_SUPABASE_ANON_KEY (was PUBLISHABLE_KEY)

## Decisions Made
- Used `NEXT_PUBLIC_SUPABASE_ANON_KEY` throughout — the correct variable name for @supabase/ssr (the pre-existing `.env.local` used `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` which was updated for consistency)
- `server.ts` is `async` — required by Next.js 15/16 App Router since `cookies()` returns a Promise
- `cookieStore.set()` inside `setAll()` is the correct Next.js cookieStore API pattern; the plan's grep warning is a false positive on the method name
- `SUPABASE_SERVICE_ROLE_KEY` remains server-only, never prefixed with `NEXT_PUBLIC_` — SEC-4 compliant

## Deviations from Plan

None — plan executed exactly as written. The `.env.local` variable name update (PUBLISHABLE_KEY → ANON_KEY) was a normalization to match the @supabase/ssr expected variable names already documented in `.env.local.example`.

## Issues Encountered
- Pre-existing `.env.local` used `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead of `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Updated to match @supabase/ssr expectations and plan spec. The Supabase URL was already correct.
- `SUPABASE_SERVICE_ROLE_KEY` was empty in `.env.local` — left as placeholder value requiring user to fill in from Supabase Dashboard.

## User Setup Required
The following environment variables in `dashboard/.env.local` need real values before auth will work:

1. `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Dashboard > Settings > API > anon/public key
2. `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard > Settings > API > service_role key

## Next Phase Readiness
- Supabase client infrastructure is complete. Plans 01-02 (schema), 01-03 (auth gate), 01-04 (seed), 01-05 (security audit) can all import from `dashboard/src/lib/supabase/server.ts` and `client.ts`.
- Real Supabase credentials must be added to `.env.local` before the app can connect to Supabase.

---
*Phase: 01-foundation-auth-infrastructure-schema*
*Completed: 2026-03-08*
