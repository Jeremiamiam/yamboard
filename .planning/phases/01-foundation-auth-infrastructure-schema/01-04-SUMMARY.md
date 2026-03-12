---
phase: 01-foundation-auth-infrastructure-schema
plan: "04"
subsystem: database
tags: [supabase, postgres, sql, seed, migrations]

# Dependency graph
requires:
  - phase: 01-02
    provides: "001_schema.sql, 002_rls.sql, 003_indexes.sql — database schema with all tables and RLS policies"
provides:
  - "004_seed.sql with all mock.ts data as SQL INSERTs: 7 clients, 7 contacts, 9 projects, 10 budget_products, 9 documents"
  - "DO $$ block pattern with local UUID variables for readable FK references"
  - "Complete dataset for end-to-end testing of Phase 02 DAL layer and UI"
affects:
  - "02-supabase-dal-migration — needs seed data for visual verification"
  - "03-auth — needs users table to run seed"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DO $$ DECLARE ... BEGIN ... END $$ block for UUID variable declarations in seed SQL"
    - "FK insertion order: clients → contacts → projects → budget_products → documents"
    - "Placeholder YOUR-AUTH-USER-UUID-HERE with inline instructions for manual replacement"

key-files:
  created:
    - "dashboard/supabase/migrations/004_seed.sql"
  modified: []

key-decisions:
  - "DO $$ block used instead of CTE or subqueries — keeps FK references readable as variable names"
  - "UUID placeholder pattern chosen over hardcoded test UUID — forces correct setup, avoids silent FK failures"
  - "is_pinned column defaulted to false in all documents — matches mock.ts which has no pinned docs"

patterns-established:
  - "Seed files use DO $$ DECLARE block to avoid subqueries in INSERT statements"
  - "FK order in seed: clients first (no deps), contacts+projects second (depend on clients), budget_products+documents last (depend on projects)"

requirements-completed:
  - ARCH-6

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 01 Plan 04: Seed Data Migration Summary

**004_seed.sql with DO $$ block translating all mock.ts data — 7 clients, 7 contacts, 9 projects, 10 budget_products, 9 documents — ready for Supabase Studio execution**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T09:57:20Z
- **Completed:** 2026-03-08T10:02:00Z
- **Tasks:** 1/1
- **Files modified:** 1

## Accomplishments

- Created 004_seed.sql with complete mock.ts dataset as executable SQL
- Used DO $$ DECLARE block with named UUID variables — all FK references are readable (identite_id, brutus_id, etc.)
- FK insertion order respects all foreign key constraints: clients first, then contacts and projects, then budget_products and documents
- Placeholder YOUR-AUTH-USER-UUID-HERE with clear instructions prevents silent UUID failures at execution time

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 004_seed.sql** - `e1f5ee9` (feat)

## Files Created/Modified

- `dashboard/supabase/migrations/004_seed.sql` - Complete seed migration: 7 clients, 7 contacts, 9 projects, 10 budget_products, 9 documents in a single DO $$ block

## Decisions Made

- DO $$ DECLARE block chosen over CTEs or subqueries — UUID variables declared once and reused, making INSERT statements self-documenting
- UUID placeholder pattern (not a hardcoded dev UUID) — forces user to retrieve their actual auth.users UUID before executing, preventing FK constraint failures

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Before executing 004_seed.sql in Supabase Studio:

1. Create an account in Supabase Dashboard > Authentication > Users (if not done yet)
2. Run `SELECT id FROM auth.users LIMIT 1;` in SQL Editor to get your UUID
3. Replace `YOUR-AUTH-USER-UUID-HERE` in 004_seed.sql with that UUID
4. Run 004_seed.sql in SQL Editor

After execution, verify in Table Editor:
- `SELECT COUNT(*) FROM clients;` → 7
- `SELECT COUNT(*) FROM contacts;` → 7
- `SELECT COUNT(*) FROM projects;` → 9
- `SELECT COUNT(*) FROM budget_products;` → 10
- `SELECT COUNT(*) FROM documents;` → 9

## Next Phase Readiness

- All 4 migration files (001-004) are present and sequentially numbered
- 004_seed.sql is ready for execution once auth user UUID is known
- Phase 03 (auth gate: login page, protected layout, middleware) can proceed — seed will be executed after auth is set up
- Phase 02 DAL layer has the full dataset it needs for visual end-to-end verification

---
*Phase: 01-foundation-auth-infrastructure-schema*
*Completed: 2026-03-08*
