---
phase: 03-live-writes-server-actions-file-upload
plan: "02"
subsystem: api
tags: [supabase, server-actions, nextjs, projects, budget, payments]

# Dependency graph
requires:
  - phase: 03-live-writes-server-actions-file-upload
    provides: createSupabaseClient pattern, owner_id pattern, revalidatePath conventions (from 03-01)
provides:
  - createProject Server Action (INSERT projects, returns projectId)
  - updateProject Server Action (UPDATE with potentialAmount→potential_amount mapping)
  - deleteProject Server Action (cascade deletes budget_products)
  - createBudgetProduct Server Action (INSERT budget_products, revalidates /compta)
  - updateBudgetProduct Server Action (UPDATE name/total_amount)
  - deleteBudgetProduct Server Action (DELETE, fetches client_id before deletion)
  - updatePaymentStage Server Action (UPDATE JSONB column with dynamic stage key)
affects: [03-05-connect-server-actions, compta-page, project-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "client_id fetched before DELETE to preserve revalidatePath data"
    - "camelCase→snake_case mapping in update objects (potentialAmount→potential_amount)"
    - "Dynamic JSONB column update via computed property key { [stage]: value }"
    - "Supabase join result cast via 'unknown' before target type to satisfy TS compiler"

key-files:
  created:
    - dashboard/src/app/(dashboard)/actions/projects.ts
  modified: []

key-decisions:
  - "Supabase foreign key join projects(client_id) returns array type — cast via unknown to avoid TS overlap error"
  - "updateProject fetches client_id first to build both /[clientId] and /[clientId]/[projectId] revalidation paths"
  - "updatePaymentStage uses { [stage]: value } computed property key for JSONB column targeting"

patterns-established:
  - "Fetch parent row before mutation when revalidatePath needs parent IDs not available in mutation params"
  - "revalidatePath('/compta', 'page') second arg required for non-root paths"

requirements-completed: [PROJECT-1, PROJECT-2, PROJECT-3, PROJECT-4, PRODUCT-1, PRODUCT-2, PRODUCT-3, PRODUCT-4, PRODUCT-5, PERF-2]

# Metrics
duration: 8min
completed: 2026-03-08
---

# Phase 3 Plan 02: Projects + Budget Server Actions Summary

**7 Server Actions for projects and budget_products: full CRUD with JSONB payment stage updates and revalidatePath on both project and /compta pages**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-08T12:33:42Z
- **Completed:** 2026-03-08T12:41:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Full CRUD Server Actions for `projects` table (createProject, updateProject, deleteProject)
- Full CRUD Server Actions for `budget_products` table (createBudgetProduct, updateBudgetProduct, deleteBudgetProduct)
- `updatePaymentStage` with dynamic JSONB column targeting (devis/acompte/avancement/solde)
- `potentialAmount → potential_amount` camelCase→snake_case mapping in updateProject
- All budget mutations revalidate `/compta` page in addition to project page
- `deleteProject` and `createBudgetProduct`/`deleteBudgetProduct` fetch `client_id` before mutation for correct revalidatePath paths

## Task Commits

Each task was committed atomically:

1. **Task 1+2: createProject/updateProject/deleteProject + createBudgetProduct/updateBudgetProduct/deleteBudgetProduct/updatePaymentStage** - `6aa69ba` (feat)

**Plan metadata:** (docs commit — see state_updates below)

## Files Created/Modified
- `dashboard/src/app/(dashboard)/actions/projects.ts` - 7 Server Actions for projects table and budget_products table with 'use server' + 'server-only' guards

## Decisions Made
- Supabase's TypeScript infers `projects(client_id)` join as array type — cast through `unknown` before final target type to avoid TS2352 overlap error
- `updateProject` fetches `client_id` before updating so both the client page and project page can be revalidated
- Used `revalidatePath('/compta', 'page')` (with explicit `'page'` second argument) for non-root paths per Next.js 15 requirements

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript TS2352 error on Supabase nested join cast**
- **Found during:** Task 2 (budget_products functions)
- **Issue:** `(product.projects as { client_id: string } | null)` triggered TS2352 because Supabase infers the join as `{ client_id: any }[]` (array), which doesn't overlap with the singular object type
- **Fix:** Changed cast to `(product.projects as unknown as { client_id: string } | null)` in all 3 locations (updateBudgetProduct, deleteBudgetProduct, updatePaymentStage)
- **Files modified:** dashboard/src/app/(dashboard)/actions/projects.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `6aa69ba` (part of task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type casting bug)
**Impact on plan:** Necessary fix for TypeScript correctness. No scope creep.

## Issues Encountered
None beyond the TypeScript cast issue documented above.

## User Setup Required
None - no external service configuration required. Supabase tables (`projects`, `budget_products`) were created in Phase 01.

## Next Phase Readiness
- 03-02 complete: all 7 project + budget Server Actions ready
- 03-03 (document upload) and 03-04 (signed URLs) can proceed in parallel
- 03-05 will wire these actions into ClientPageShell / ProjectPageShell to replace LocalProjects context and useState

## Self-Check: PASSED
- `dashboard/src/app/(dashboard)/actions/projects.ts` — FOUND
- `.planning/phases/03-live-writes-server-actions-file-upload/03-02-SUMMARY.md` — FOUND
- Commit `6aa69ba` — FOUND

---
*Phase: 03-live-writes-server-actions-file-upload*
*Completed: 2026-03-08*
