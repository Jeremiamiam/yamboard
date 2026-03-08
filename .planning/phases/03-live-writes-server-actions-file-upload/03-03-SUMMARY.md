---
phase: 03-live-writes-server-actions-file-upload
plan: "03"
subsystem: api
tags: [supabase, storage, server-actions, pdf, signed-url, documents]

# Dependency graph
requires:
  - phase: 03-01
    provides: Storage bucket 'documents' migration (005_storage.sql) must be executed in Supabase Studio before PDF uploads work
provides:
  - 7 Server Actions for document CRUD: createNote, createLink, createSignedUploadUrl, saveDocumentRecord, getDocumentSignedUrl, deleteDocument, pinDocument
  - 2-step PDF upload pattern via signed URL (no file bytes through Server Action body)
  - PDF viewer in DocumentViewer via signed URL (TTL 1h iframe)
  - storagePath field on Document type
affects:
  - 03-04 (project Server Actions — same pattern)
  - 04-context-ai (documents are primary AI context source — storage_path needed for PDF ingestion)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "2-step PDF upload: createSignedUploadUrl (Server Action) → browser uploads to Supabase Storage signed URL → saveDocumentRecord (Server Action)"
    - "deleteDocument order: fetch row → remove Storage → delete DB row (prevents orphaned files)"
    - "getDocumentSignedUrl TTL 1h for DocumentViewer iframe rendering"
    - "storagePath optional field on Document type — null for notes/links, set for PDFs"

key-files:
  created:
    - dashboard/src/app/(dashboard)/actions/documents.ts
  modified:
    - dashboard/src/components/DocumentViewer.tsx
    - dashboard/src/lib/mock.ts

key-decisions:
  - "2-step PDF upload pattern: Server Action never receives file bytes — only generates signed URL, browser uploads directly to Supabase Storage"
  - "deleteDocument removes Storage file before DB row to prevent orphaned files in bucket"
  - "storagePath added as optional field to Document type in mock.ts — clean approach vs local cast"
  - "DocumentViewer pdfUrl state resets on doc change to prevent stale PDF rendering"

patterns-established:
  - "Server Action auth guard: getUser() + early return { error: 'Not authenticated' } on every function"
  - "defense-in-depth: .eq('owner_id', user.id) on all mutations even with RLS active"
  - "revalidatePath called with 'page' segment type for explicit cache invalidation"

requirements-completed: [DOC-1, DOC-2, DOC-3, DOC-4, DOC-5, DOC-6, DOC-7, SEC-5, PERF-3]

# Metrics
duration: 8min
completed: 2026-03-08
---

# Phase 03 Plan 03: Documents Server Actions Summary

**7 Server Actions (CRUD + Storage) for documents with 2-step PDF upload via Supabase signed URL and DocumentViewer iframe rendering**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-08T12:39:02Z
- **Completed:** 2026-03-08T12:47:00Z
- **Tasks:** 2/2 code tasks complete (Task 3 = human-verify checkpoint pending user approval)
- **Files modified:** 3

## Accomplishments
- Created `actions/documents.ts` with all 7 Server Actions — createNote, createLink, createSignedUploadUrl, saveDocumentRecord, getDocumentSignedUrl, deleteDocument, pinDocument
- Implemented 2-step PDF upload: Server Action returns signed URL, browser uploads directly to Supabase Storage (PERF-3 + SEC-5 compliant — file bytes never pass through the Server Action body)
- Updated `DocumentViewer.tsx` to display PDFs via signed URL in an `<iframe>` when `doc.storagePath` is defined
- Added `storagePath?: string` field to Document type in `mock.ts`
- TypeScript compiles clean throughout

## Task Commits

Each task was committed atomically:

1. **Task 1: Server Actions documents (7 functions)** - `c1a6c35` (feat)
2. **Task 2: Mettre à jour DocumentViewer pour afficher les PDFs via signed URL** - `90d0cc5` (feat)

**Plan metadata:** (docs commit — see state_updates below)

## Files Created/Modified
- `dashboard/src/app/(dashboard)/actions/documents.ts` - 7 Server Actions for document CRUD + Storage operations
- `dashboard/src/components/DocumentViewer.tsx` - Added useState/useEffect for PDF signed URL + iframe rendering
- `dashboard/src/lib/mock.ts` - Added `storagePath?: string` to Document type

## Decisions Made
- 2-step PDF upload pattern: Server Action generates signed URL only; browser PUT directly to Supabase Storage. This satisfies PERF-3 (no large file through function body) and SEC-5 (private bucket, signed URLs only).
- `deleteDocument` sequence: fetch row → remove Storage → delete DB row. Storage removal precedes DB deletion to prevent orphaned files if the DB delete fails.
- Added `storagePath` as optional field on the `Document` type in `mock.ts` rather than using a local cast — cleaner typing across the codebase.
- `pdfUrl` state resets to `null` when `doc.storagePath` changes, preventing stale PDF display when switching between documents.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Manual step required before PDF uploads work:** Execute `005_storage.sql` (created in plan 03-01) in Supabase Studio SQL Editor to create the `documents` Storage bucket with RLS policies.

## Next Phase Readiness
- Documents Server Actions ready for use by UI components (upload forms, delete buttons, pin actions)
- DocumentViewer ready to display PDFs from Supabase Storage
- `getDocumentSignedUrl` available for Phase 04 AI context pipeline if PDF content extraction is needed
- Checkpoint Task 3 requires human verification of the full upload/view/delete flow before proceeding

---
*Phase: 03-live-writes-server-actions-file-upload*
*Completed: 2026-03-08*
