---
phase: 03
slug: live-writes-server-actions-file-upload
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already configured in dashboard/) |
| **Config file** | `dashboard/vitest.config.ts` |
| **Quick run command** | `cd dashboard && npx vitest run --reporter=verbose 2>&1 \| tail -20` |
| **Full suite command** | `cd dashboard && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd dashboard && npx vitest run --reporter=verbose 2>&1 | tail -20`
- **After every plan wave:** Run `cd dashboard && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CRUD-1 | unit | `cd dashboard && npx vitest run actions/clients` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CRUD-1 | unit | `cd dashboard && npx vitest run actions/clients` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | CRUD-2 | unit | `cd dashboard && npx vitest run actions/projects` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | CRUD-2 | unit | `cd dashboard && npx vitest run actions/projects` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | DOC-3 | unit | `cd dashboard && npx vitest run actions/documents` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | DOC-3 | manual | — | — | ⬜ pending |
| 03-04-01 | 04 | 1 | CRUD-3 | unit | `cd dashboard && npx vitest run actions/contacts` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 3 | ARCH-4 | build | `cd dashboard && npx tsc --noEmit` | ✅ | ⬜ pending |
| 03-05-02 | 05 | 3 | ARCH-4 | build | `cd dashboard && npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `dashboard/src/app/(dashboard)/actions/__tests__/clients.test.ts` — stubs for createClient, updateClient, archiveClient, deleteClient, convertProspect
- [ ] `dashboard/src/app/(dashboard)/actions/__tests__/projects.test.ts` — stubs for createProject, updateProject, deleteProject + billing stages
- [ ] `dashboard/src/app/(dashboard)/actions/__tests__/documents.test.ts` — stubs for createNote, createLink, createSignedUploadUrl, saveDocumentRecord, deleteDocument, pinDocument
- [ ] `dashboard/src/app/(dashboard)/actions/__tests__/contacts.test.ts` — stubs for createContact, updateContact, deleteContact
- [ ] `dashboard/src/app/(dashboard)/actions/__tests__/setup.ts` — shared Supabase mock (mock `createClient()`, mock `revalidatePath`)

*All test files are Wave 0 — they must exist before the actions themselves are written.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF upload → visible in Supabase Storage | DOC-3, PERF-3 | Requires live Supabase Storage bucket; cannot mock signed-URL round-trip in unit tests | 1. Open app 2. Navigate to a project's Documents tab 3. Upload a PDF 4. Open Supabase Studio → Storage → documents bucket → confirm file present 5. Click file link in UI → confirm PDF opens via signed URL |
| Pinned document → visible at client level | DOC-4 | Requires live DB + UI rendering | 1. Pin a document 2. Navigate to client overview 3. Confirm pinned document appears in pinned section |
| `LocalProjects` provider removed, no UI regression | ARCH-4 | Full UI smoke test | 1. Create project, add billing stage 2. Navigate all project tabs 3. Confirm no React context errors in console |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
