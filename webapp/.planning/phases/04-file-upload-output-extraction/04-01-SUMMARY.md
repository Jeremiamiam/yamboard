---
phase: 04-file-upload-output-extraction
plan: "01"
subsystem: storage
tags: [supabase-storage, file-upload, rls, api-routes]
dependency_graph:
  requires: []
  provides: [project-files-bucket, signed-upload-url-api, file-delete-api]
  affects: [04-02, 04-03]
tech_stack:
  added: [supabase-storage]
  patterns: [client-direct-upload, signed-url, defense-in-depth-ownership-check]
key_files:
  created:
    - supabase/migrations/20260226_project_files.sql
    - src/app/api/projects/[id]/files/route.ts
  modified: []
decisions:
  - "Client-direct-to-Storage via signed URL — avoids Vercel 4MB body limit and timeout risk"
  - "Path convention {user_id}/{project_id}/{filename} — first segment enables user-scoped RLS"
  - "Defense-in-depth path ownership check in DELETE (explicit + RLS both enforce)"
metrics:
  duration: "~1min"
  completed: 2026-02-26
---

# Phase 4 Plan 01: Supabase Storage Foundation Summary

Supabase Storage bucket `project-files` with user-scoped RLS policies and API routes for signed upload URL generation and file deletion — client uploads directly to Storage, bypassing the API route.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Supabase Storage bucket + RLS migration | 3b6f9e5 | supabase/migrations/20260226_project_files.sql |
| 2 | File upload + delete API routes | b26e975 | src/app/api/projects/[id]/files/route.ts |

## What Was Built

**Task 1 — SQL Migration (`supabase/migrations/20260226_project_files.sql`)**

Creates the `project-files` bucket (private) and three RLS policies on `storage.objects`:
- `project_files_select` — authenticated users can read their own files
- `project_files_insert` — authenticated users can upload their own files
- `project_files_delete` — authenticated users can delete their own files

All policies enforce `auth.uid()::text = (storage.foldername(name))[1]`, meaning the first path segment must match the user's ID. This is set at bucket creation level; no public access.

**Task 2 — API Route (`src/app/api/projects/[id]/files/route.ts`)**

- `POST /api/projects/[id]/files` — Auth guard → validates `filename` body param → builds path `{user_id}/{project_id}/{filename}` → calls `createSignedUploadUrl()` → returns `{ signedUrl, path, token }`. Client uses the signed URL to PUT the file directly to Supabase Storage.
- `DELETE /api/projects/[id]/files` — Auth guard → validates `path` body param → ownership check (`path.startsWith(user.id + '/')`) → calls `storage.remove([path])` → returns 204.

## Decisions Made

1. **Client-direct-to-Storage pattern** — The API route never proxies file content. It only returns a signed URL. This avoids Vercel's 4MB request body limit and any streaming timeout.
2. **Path convention `{user_id}/{project_id}/{filename}`** — First folder segment is `user_id`, which aligns with the RLS policy using `storage.foldername(name)[1]`. Allows simple policy enforcement without a metadata table join.
3. **Defense-in-depth ownership check in DELETE** — Explicit path prefix check (`path.startsWith(user.id + '/')`) in code before calling Storage. RLS independently enforces the same rule. Belt-and-suspenders approach makes intent clear.
4. **`runtime = "nodejs"`** — Consistent with existing API routes; Supabase SSR cookie handling requires Node.js runtime.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: supabase/migrations/20260226_project_files.sql
- FOUND: src/app/api/projects/[id]/files/route.ts
- FOUND commit: 3b6f9e5 (chore(04-01): add Supabase Storage project-files bucket migration)
- FOUND commit: b26e975 (feat(04-01): add file upload and delete API routes)
