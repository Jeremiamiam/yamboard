---
phase: 02
slug: live-reads-server-components
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via Next.js) + manual browser verification |
| **Config file** | dashboard/package.json (scripts) |
| **Quick run command** | `cd dashboard && npm run build 2>&1 | tail -5` |
| **Full suite command** | `cd dashboard && npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd dashboard && npm run build 2>&1 | tail -5`
- **After every plan wave:** Run `cd dashboard && npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DAL-clients | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DAL-projects | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | DAL-documents | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | page-clients | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | sidebar-live | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | page-client-detail | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | page-project-detail | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (Next.js build + lint validates TypeScript correctness and import integrity).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Client created in Supabase Studio appears in sidebar | Live Reads goal | Requires real Supabase connection + browser | 1. Add client in Studio 2. Reload app 3. Verify sidebar shows new client |
| Reload preserves data | Live Reads goal | Session persistence requires browser | 1. Load page 2. Reload 3. Confirm same data shown |
| UI visually identical | No regression | Visual diff requires human eye | Compare all pages before/after migration |
| mock.ts no longer imported | Cleanup goal | Static analysis | `grep -r "mock" dashboard/src/app/` returns no matches |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
