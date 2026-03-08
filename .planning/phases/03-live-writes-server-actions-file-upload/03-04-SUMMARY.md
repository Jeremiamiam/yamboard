---
phase: 03-live-writes-server-actions-file-upload
plan: "04"
subsystem: api
tags: [server-actions, supabase, contacts, is_primary, revalidatepath]

requires:
  - phase: 01-foundation-auth-infrastructure-schema
    provides: contacts table schema with owner_id, is_primary boolean, client_id FK
  - phase: 03-live-writes-server-actions-file-upload
    provides: createSupabaseClient pattern and Server Action conventions from 03-01

provides:
  - createContact Server Action — INSERT into contacts with is_primary reset
  - updateContact Server Action — UPDATE contacts with is_primary reset and client_id fetch
  - deleteContact Server Action — DELETE contact with prior client_id fetch for revalidatePath

affects:
  - 03-05-projects-phase
  - 04-ai-context

tech-stack:
  added: []
  patterns:
    - "is_primary reset: UPDATE is_primary=false on all sibling contacts before INSERT/UPDATE with is_primary=true"
    - "pre-DELETE fetch: always fetch client_id before deleting contact to construct correct revalidatePath"
    - "defense-in-depth: .eq('owner_id', user.id) on all mutations even with RLS active"

key-files:
  created:
    - dashboard/src/app/(dashboard)/actions/contacts.ts
  modified: []

key-decisions:
  - "is_primary reset is handled in Server Action (no UNIQUE constraint in DB) — sequential UPDATE then INSERT/UPDATE pattern"
  - "updateContact always fetches client_id from DB (even when not changing is_primary) to build correct revalidatePath"
  - "deleteContact fetches client_id before deletion — avoids losing the FK reference needed for cache invalidation"

patterns-established:
  - "Pre-mutation fetch pattern: fetch parent FK before delete/update when needed for revalidatePath"
  - "is_primary reset: .update({ is_primary: false }).eq('client_id', clientId).eq('owner_id', userId) before any is_primary=true mutation"

requirements-completed: [CONTACT-1, CONTACT-2, CONTACT-3, CONTACT-4, PERF-2]

duration: 2min
completed: 2026-03-08
---

# Phase 03 Plan 04: Contacts Server Actions Summary

**Server Actions CRUD for contacts with is_primary reset logic — createContact, updateContact, deleteContact using Supabase, owner_id enforcement, and revalidatePath per client page**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-08T12:36:47Z
- **Completed:** 2026-03-08T12:38:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `createContact`: INSERT into contacts with full owner_id, conditional is_primary reset before insert
- `updateContact`: fetch client_id, conditional is_primary reset, UPDATE with defense-in-depth owner_id filter, revalidatePath with correct clientId
- `deleteContact`: fetch client_id before DELETE, revalidatePath with fetched clientId

## Task Commits

Each task was committed atomically:

1. **Task 1: Server Actions contacts (createContact, updateContact, deleteContact)** - `5347377` (feat)

**Plan metadata:** (docs commit — pending)

## Files Created/Modified
- `dashboard/src/app/(dashboard)/actions/contacts.ts` — 3 Server Actions: createContact, updateContact, deleteContact with is_primary reset and revalidatePath

## Decisions Made
- `updateContact` fetches `client_id` in all cases (not only when `isPrimary=true`) — avoids a second code path and ensures `revalidatePath` always has the correct clientId regardless of which fields are updated
- Error handling for the `existing` fetch returns early with the Supabase error message, consistent with other actions in the codebase

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Contact mutations are ready — UI components (sidebar contact section) can wire up these actions in Phase 04 or a future UI pass
- CONTACT-1..4 and PERF-2 requirements satisfied
- Plan 03-05 (projects actions) can proceed independently

---
*Phase: 03-live-writes-server-actions-file-upload*
*Completed: 2026-03-08*
