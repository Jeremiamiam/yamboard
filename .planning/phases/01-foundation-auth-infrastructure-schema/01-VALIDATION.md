---
phase: 1
slug: foundation-auth-infrastructure-schema
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Phase 01 is pure infrastructure (SQL + file creation) |
| **Config file** | none — no test framework needed for this phase |
| **Quick run command** | `ls dashboard/supabase/migrations/` |
| **Full suite command** | Manual verification checklist in Plan 01-05 |
| **Estimated runtime** | ~5 minutes (manual SQL + browser checks) |

---

## Sampling Rate

- **After every task commit:** Run `ls dashboard/supabase/migrations/` to confirm files created
- **After every plan wave:** Execute SQL in Supabase Studio SQL Editor, verify output
- **Before `/gsd:verify-work`:** Full manual checklist must be green
- **Max feedback latency:** ~5 minutes per verification step

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01 | 01-01 | 1 | ARCH-6 | file-check | `ls dashboard/src/lib/supabase/` | ❌ Wave 0 | ⬜ pending |
| 01-02 | 01-02 | 1 | SEC-1, SEC-2, PERF-1, ARCH-6 | sql-verify | `SELECT tablename FROM pg_policies;` in Studio | ❌ manual SQL | ⬜ pending |
| 01-03 | 01-03 | 2 | AUTH-1, AUTH-2, AUTH-3, AUTH-4 | manual-e2e | `npm run dev` + browser | ❌ manual | ⬜ pending |
| 01-04 | 01-04 | 2 | ARCH-6 | file-check | `ls dashboard/supabase/migrations/004_seed.sql` | ❌ manual | ⬜ pending |
| 01-05 | 01-05 | 3 | SEC-1, SEC-2, SEC-3, SEC-4 | grep-audit + sql-verify | `grep -r "getSession" dashboard/src --include="*.ts"` | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No Wave 0 test file creation needed — Phase 01 produces SQL migration files and infrastructure configuration, not testable application functions. All validation is manual via Supabase Studio and browser testing.

*Existing infrastructure covers all phase requirements via manual verification commands.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login page renders + submits | AUTH-1 | No E2E framework | `npm run dev`, navigate to `/login`, submit valid credentials |
| Unauth redirect to `/login` | AUTH-2 | No E2E framework | Visit `http://localhost:3000/` while logged out — must redirect |
| Token refresh on every request | AUTH-3 | Middleware internals | Check console logs during navigation — no "session expired" errors |
| Logout clears session | AUTH-4 | No E2E framework | Click logout, verify redirect to `/login`, verify `/` redirects |
| RLS enabled on all 5 tables | SEC-1 | Database inspection | Run in Studio: `SELECT tablename, policyname FROM pg_policies ORDER BY tablename;` |
| WITH CHECK on all INSERT/UPDATE | SEC-2 | Database inspection | Run in Studio: `SELECT policyname, cmd, with_check FROM pg_policies WHERE cmd IN ('INSERT','UPDATE') AND with_check IS NULL;` — must return 0 rows |
| No getSession() server-side | SEC-3 | Grep audit | `grep -r "getSession" dashboard/src --include="*.ts" --include="*.tsx"` — must return 0 results |
| SERVICE_ROLE_KEY never NEXT_PUBLIC | SEC-4 | Grep audit | `grep -r "NEXT_PUBLIC_SUPABASE_SERVICE" dashboard/` — must return 0 results |
| Indexes on RLS columns | PERF-1 | Database inspection | Run in Studio: `SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('clients','contacts','projects','budget_products','documents') ORDER BY tablename;` |
| Migration files sequential naming | ARCH-6 | File check | `ls dashboard/supabase/migrations/` — must show 001_, 002_, 003_, 004_ files |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
