---
phase: 01-foundation-auth-infrastructure-schema
plan: "02"
subsystem: database
tags: [supabase, postgres, rls, sql, schema, migrations]

# Dependency graph
requires: []
provides:
  - "5-table Postgres schema (clients, contacts, projects, budget_products, documents) with owner_id on all tables"
  - "RLS enabled on all 5 tables with 20 policies (4 CRUD per table)"
  - "10 performance indexes on owner_id and foreign key columns"
affects:
  - 01-03-supabase-client-auth
  - 02-dal-layer
  - 03-crud-operations

# Tech tracking
tech-stack:
  added: [supabase-migrations, postgres-rls, uuid-ossp]
  patterns:
    - owner_id on every table (single-user RLS without joins)
    - "(SELECT auth.uid()) subquery form for RLS policy evaluation efficiency"
    - WITH CHECK on all INSERT and UPDATE policies
    - Sequential migration naming (001/002/003)

key-files:
  created:
    - dashboard/supabase/migrations/001_schema.sql
    - dashboard/supabase/migrations/002_rls.sql
    - dashboard/supabase/migrations/003_indexes.sql
  modified: []

key-decisions:
  - "owner_id on all 5 tables (not just clients) — enables direct RLS without join-based policies"
  - "start_date stored as TEXT — mock data uses non-parseable values like 'Oct 2024' and 'A planifier'"
  - "budget_products uses JSONB for payment stages — matches PaymentStage TypeScript type exactly"
  - "(SELECT auth.uid()) subquery form over auth.uid() — evaluated once per query, not once per row"
  - "documents.is_pinned + pinned_from_project — prepares DOC-7 pin feature without schema change later"

patterns-established:
  - "Migration pattern: 001_schema (tables) → 002_rls (security) → 003_indexes (performance)"
  - "RLS pattern: 4 policies per table (SELECT/INSERT/UPDATE/DELETE), owner_id column on every table"
  - "Index pattern: owner_id index + FK indexes on all tables with foreign keys"

requirements-completed: [SEC-1, SEC-2, PERF-1, ARCH-6]

# Metrics
duration: 1min
completed: 2026-03-08
---

# Phase 01 Plan 02: Database Schema + RLS + Indexes Summary

**3 SQL migration files establishing 5-table Postgres schema with per-table owner_id RLS (20 policies) and 10 performance indexes ready for Supabase Studio execution**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-08T09:53:01Z
- **Completed:** 2026-03-08T09:54:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created 5 tables (clients, contacts, projects, budget_products, documents) with owner_id on each — enables direct RLS without join-based policies
- Configured Row Level Security with 20 policies (4 CRUD operations per table), all INSERT/UPDATE policies include WITH CHECK using the optimized `(SELECT auth.uid())` subquery form
- Added 10 performance indexes covering every owner_id column (RLS evaluation) and all foreign key columns

## Task Commits

Each task was committed atomically:

1. **Task 1: Créer 001_schema.sql — 5 tables avec owner_id** - `f0bf11b` (feat)
2. **Task 2: Créer 002_rls.sql + 003_indexes.sql** - `e5c2cd0` (feat)

## Files Created/Modified
- `dashboard/supabase/migrations/001_schema.sql` - 5 tables with owner_id, UUID PKs, CHECK constraints, JSONB for payment stages
- `dashboard/supabase/migrations/002_rls.sql` - RLS enabled on all tables, 20 policies using `(SELECT auth.uid())` subquery form
- `dashboard/supabase/migrations/003_indexes.sql` - 10 indexes on owner_id + FK columns for query performance

## Decisions Made
- owner_id on all 5 tables (not just clients): avoids join-based RLS policies which are complex and error-prone
- start_date as TEXT: mock data contains strings like "Oct 2024" and "A planifier" which cannot be stored as SQL DATE
- budget_products JSONB fields (devis/acompte/avancement/solde): matches existing PaymentStage TypeScript type; avoids over-normalization for payment stages
- `(SELECT auth.uid())` form: official Supabase optimization — evaluated once per query statement, not once per row
- documents.is_pinned + pinned_from_project: schema-level preparation for DOC-7 (pin project doc to client level) — free to add now, costly to add after data migration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

**External service configuration required.** Execute these 3 files in Supabase Studio SQL Editor in order:

1. Open Supabase Studio > SQL Editor
2. Run `001_schema.sql` — creates 5 tables
3. Run `002_rls.sql` — enables RLS and creates 20 policies
4. Run `003_indexes.sql` — creates 10 performance indexes

Verify with:
```sql
-- Should return 20 rows (4 policies x 5 tables)
SELECT tablename, policyname FROM pg_policies ORDER BY tablename;

-- Should return 0 rows (no INSERT/UPDATE without WITH CHECK)
SELECT policyname, cmd FROM pg_policies WHERE cmd IN ('INSERT', 'UPDATE') AND with_check IS NULL;

-- Should return 10 rows
SELECT indexname FROM pg_indexes WHERE tablename IN ('clients','contacts','projects','budget_products','documents') ORDER BY tablename;
```

## Next Phase Readiness
- Schema, RLS, and indexes are fully defined — Phase 01-03 (Supabase client + auth) can proceed
- DAL layer (Phase 02) will build on these exact table/column names
- All RLS policies use owner_id consistently — auth.uid() mapping is the only remaining piece needed

---
*Phase: 01-foundation-auth-infrastructure-schema*
*Completed: 2026-03-08*
