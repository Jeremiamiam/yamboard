---
phase: 04-file-upload-output-extraction
plan: "02"
subsystem: ui
tags: [supabase-storage, file-upload, react, client-components, signed-url]

requires:
  - phase: 04-01
    provides: [project-files-bucket, signed-upload-url-api, file-delete-api]
provides:
  - file-uploader-component
  - file-list-component
  - project-files-section-component
  - files-list-api
  - project-page-files-section
affects: []

tech-stack:
  added: []
  patterns: [signed-url-client-direct-upload, stateful-client-wrapper-over-server-component, server-to-client-initial-data-hydration]

key-files:
  created:
    - src/components/file-uploader.tsx
    - src/components/file-list.tsx
    - src/components/project-files-section.tsx
  modified:
    - src/app/api/projects/[id]/files/route.ts
    - src/app/projects/[id]/page.tsx

key-decisions:
  - "ProjectFilesSection as stateful client wrapper — Server Component loads initial files, passes to client; client refreshes via GET /api after uploads/deletes"
  - "GET /api/projects/[id]/files maps paths at list-time so FileList has full delete paths without needing userId"
  - "File size displayed when available from Supabase metadata; gracefully absent otherwise"

patterns-established:
  - "Server Component hydrates client with initialFiles prop, client manages subsequent refreshes"
  - "Each delete tracks deleting state per path (Set<string>) to allow concurrent deletions"

requirements-completed: [UPLD-01, UPLD-03, UPLD-04]

duration: ~3min
completed: 2026-02-26
---

# Phase 4 Plan 02: File Upload UI Summary

**FileUploader + FileList + ProjectFilesSection client components integrated into project page — signed URL upload to Supabase Storage, file list with delete, persistent across page reload.**

## Performance

- **Duration:** ~3min
- **Started:** 2026-02-26T08:44:44Z
- **Completed:** 2026-02-26T08:47:30Z
- **Tasks:** 3/3 complete (Task 3 human verification: approved)
- **Files modified:** 5

## Accomplishments

- FileUploader component: file input for PDF/.txt/.md/.docx, POST to get signed URL, PUT directly to Supabase Storage
- FileList component: lists files with name + size, per-file delete with confirm dialog
- ProjectFilesSection wrapper: manages file state client-side, refreshes from GET API after upload/delete
- GET /api/projects/[id]/files: lists files from Storage with full paths for delete operations
- Project page updated with "Fichiers" section below "Outputs" — server hydrates initial files

## Task Commits

Each task was committed atomically:

1. **Task 1: FileUploader + FileList components** - `62f16f2` (feat)
2. **Task 2: Update project page with Files section** - `2f76d2c` (feat)

## Files Created/Modified

- `src/components/file-uploader.tsx` — Client component: file input, signed URL fetch, PUT to Storage, uploading state
- `src/components/file-list.tsx` — Client component: file rows with name/size, Supprimer button, empty state
- `src/components/project-files-section.tsx` — Stateful client wrapper: manages files array, calls refreshFiles() after upload/delete
- `src/app/api/projects/[id]/files/route.ts` — Added GET handler: lists Storage files with mapped full paths
- `src/app/projects/[id]/page.tsx` — Added initial file load (server-side), added Files section below Outputs

## Decisions Made

1. **ProjectFilesSection as stateful client wrapper** — Server Component passes `initialFiles` prop on first render. After upload/delete, client refreshes via GET /api to get updated list. This hybrid approach avoids full page re-render while keeping SSR benefits for initial load.
2. **GET /api maps paths at list-time** — The list endpoint returns `{ name, path, metadata }` where `path = ${userId}/${projectId}/${filename}`. This means FileList never needs to know the userId — the path comes pre-built from the server.
3. **Per-path deleting state** — `deletingPaths: Set<string>` allows disabling individual delete buttons independently, supporting concurrent deletes gracefully.

## Deviations from Plan

**1. [Rule 3 - Blocking] Project page already modified by plan 04-03**

- **Found during:** Task 2 (Update project page)
- **Issue:** The project page `src/app/projects/[id]/page.tsx` was already updated by plan 04-03 (which was executed before 04-02), adding the `WorkflowOutputs` component and `workflow_outputs` query. The plan template assumed a fresh project page.
- **Fix:** Additive integration — imported `ProjectFilesSection` alongside existing imports, added `initialFiles` loading after existing data fetches, appended Files section after Outputs section. Preserved all 04-03 work intact.
- **Files modified:** src/app/projects/[id]/page.tsx
- **Verification:** `npx tsc --noEmit` passes (0 errors), `npx next build` succeeds
- **Committed in:** 2f76d2c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking — out-of-order plan execution)
**Impact on plan:** Required careful integration instead of simple add. No scope creep. All planned functionality delivered.

## Issues Encountered

- Plan 04-02 was executed after plan 04-03 (out of order). Project page already had Outputs section. Handled additively without disrupting existing functionality.

## User Setup Required

None — no additional external service configuration required. Supabase Storage bucket and RLS policies were set up in plan 04-01.

## Next Phase Readiness

- All 5 verification criteria met (file-uploader, file-list, project-files-section, GET handler, Files section on page)
- TypeScript: 0 errors
- Build: passes
- Human verification approved — upload, persist, and delete flows confirmed working in browser

---
*Phase: 04-file-upload-output-extraction*
*Completed: 2026-02-26*
