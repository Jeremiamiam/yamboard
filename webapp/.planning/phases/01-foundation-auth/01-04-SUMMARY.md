---
phase: 01-foundation-auth
plan: 04
subsystem: database, ui
tags: [supabase, next.js, server-actions, rls, dashboard, react]

# Dependency graph
requires:
  - phase: 01-foundation-auth/01-02
    provides: Supabase server client (createClient) used by Server Actions and dashboard page
  - phase: 01-foundation-auth/01-03
    provides: signOut Server Action used in dashboard header

provides:
  - projects table with RLS (authenticated users can CRUD)
  - workflow_states table with RLS (cascade delete on project removal)
  - createProject Server Action (inserts project + 6 workflow_states rows)
  - deleteProject Server Action (removes project + cascades workflow_states)
  - /dashboard page with project list ordered by updated_at DESC
  - CreateProjectModal Client Component for project creation

affects:
  - 02-project-shell (project detail page will read workflow_states)
  - 03-workflows (workflow pages use workflow_states.status for lock/unlock logic)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Actions with revalidatePath + redirect for CRUD operations
    - deleteProject.bind(null, id) form action pattern (avoids inline "use server" in Server Components)
    - useTransition for async Server Action pending state in Client Components
    - Supabase relational select with nested workflow_states(status) in one query

key-files:
  created:
    - src/actions/projects.ts
    - src/app/dashboard/page.tsx
    - src/components/create-project-modal.tsx
  modified: []

key-decisions:
  - "deleteProject.bind(null, project.id) used for form action in Server Component (cleaner than inline use server)"
  - "INITIAL_WORKFLOW_STATES: start+site-standalone=available, platform+campaign+site+wireframe=locked (per GBD workflow dependency graph)"
  - "Dashboard fetches projects + workflow_states in a single relational Supabase query"

patterns-established:
  - "Server Action pattern: createClient() -> DB operation -> revalidatePath -> redirect"
  - "Form delete pattern: action={serverAction.bind(null, id)} with client-side confirm() guard"
  - "Project row: name, formatted date, completedCount/6 workflows count"

requirements-completed: [PROJ-01, PROJ-02]

# Metrics
duration: 5min
completed: 2026-02-25
---

# Phase 1 Plan 4: Dashboard + Project CRUD Summary

**Supabase projects/workflow_states tables with RLS, Server Actions for create/delete, and dashboard page with project list and CreateProjectModal**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-25T20:33:06Z
- **Completed:** 2026-02-25T20:38:00Z
- **Tasks:** 2 (Task 0 was human-action, already complete)
- **Files modified:** 3

## Accomplishments

- createProject Server Action: inserts project + initializes 6 workflow_states rows with correct initial lock/available statuses
- deleteProject Server Action: removes project, cascade deletes workflow_states via FK
- Dashboard page: server-rendered list of projects ordered by last-modified, with X/6 workflows count per row
- CreateProjectModal: client component with validation, useTransition pending state, redirects to /projects/[id] on success
- Empty state with "Aucun projet." message and Nouveau projet button

## Task Commits

Each task was committed atomically:

1. **Task 1: Create project Server Actions** - `d451f93` (feat)
2. **Task 2: Build dashboard page and CreateProjectModal** - `edecc58` (feat)

## Files Created/Modified

- `src/actions/projects.ts` - createProject (insert project + 6 workflow_states) and deleteProject Server Actions
- `src/app/dashboard/page.tsx` - Dashboard Server Component with project list, empty state, delete forms
- `src/components/create-project-modal.tsx` - Client Component modal for project name input and submission

## Decisions Made

- Used `deleteProject.bind(null, project.id)` as the form action instead of inline `"use server"` — cleaner and avoids TypeScript issues with inline server functions in JSX
- INITIAL_WORKFLOW_STATES defines start and site-standalone as "available" (entry points), all others "locked" — matches GBD workflow dependency graph from CONTEXT.md
- Dashboard fetches projects and workflow_states in a single Supabase relational query for efficiency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Task 0 (human-action, blocking): User manually ran SQL migration in Supabase Dashboard SQL Editor to create `projects` and `workflow_states` tables with RLS policies. Both tables confirmed to exist before Task 1 execution.

## Next Phase Readiness

- PROJ-01 (create project) and PROJ-02 (view project list) complete
- /dashboard route functional with project list and CRUD
- /projects/[id] route will 404 until Phase 02 (project shell) is built
- workflow_states rows initialized per project, ready for Phase 03 (workflow pages) to read/update lock status

---
*Phase: 01-foundation-auth*
*Completed: 2026-02-25*
