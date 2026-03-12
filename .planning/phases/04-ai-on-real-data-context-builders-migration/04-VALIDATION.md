---
phase: 04
slug: ai-on-real-data-context-builders-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — `npm run build` (TypeScript compile) is the primary automated check |
| **Config file** | `dashboard/tsconfig.json` |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` + manual browser smoke tests |
| **Estimated runtime** | ~30 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual browser smoke test of each chat scope
- **Before `/gsd:verify-work`:** Full suite must be green + all 3 chat scopes respond with real data
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-02-01 | 02 | 1 | AI-1 | manual | `npm run build` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 1 | AI-2 | manual | `npm run build` | ✅ | ⬜ pending |
| 04-02-03 | 02 | 1 | AI-3 | manual | `npm run build` | ✅ | ⬜ pending |
| 04-02-04 | 02 | 1 | AI-4 | manual | `npm run build` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 2 | AI-5 | manual | `npm run build` + console.warn check | ✅ | ⬜ pending |
| 04-03-02 | 03 | 2 | AI-6 | manual smoke | Browser chat with injection note | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 3 | ARCH-5 | automated | `npm run build` (TypeScript compile) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Manual test plan document for AI-1 through AI-6 browser smoke tests

*No test framework setup required — project uses TypeScript compile + browser verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agency context includes all non-archived clients | AI-1 | No test framework | Build + open agency chat, verify client list appears |
| Client context includes pinned project docs | AI-2 | No test framework | Open client chat, verify project docs appear |
| Project context uses only client-pinned docs | AI-3 | No test framework | Open project chat, verify only pinned docs visible |
| Doc notes appear in agent context | AI-4 | No test framework | Add test note to doc, open chat, verify note referenced |
| No context exceeds token budget | AI-5 | Runtime value | Check console.warn for token budget warnings |
| Malicious note does not override system instructions | AI-6 | Security smoke test | Add note with "ignore previous instructions", verify agent stays on topic |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
