---
phase: 02-live-reads-server-components
verified: 2026-03-08T12:00:00Z
status: gaps_found
score: 4/6 must-haves verified
re_verification: false
gaps:
  - truth: "mock.ts n'est plus importé dans aucune page (ROADMAP success criterion)"
    status: failed
    reason: "compta/page.tsx imports CLIENTS, PROJECTS, getClients, getProjectBudgetSummary from @/lib/mock at runtime — not type-only imports"
    artifacts:
      - path: "dashboard/src/app/(dashboard)/compta/page.tsx"
        issue: "Imports runtime data (CLIENTS, PROJECTS, getClients, getProjectBudgetSummary) from @/lib/mock. Page was not in scope for any plan but is in app/(dashboard)/ — the ROADMAP success criterion covers it."
    missing:
      - "Migrate compta/page.tsx to use Supabase data (or explicitly mark as out-of-scope in ROADMAP)"

  - truth: "Les données du tab Budget persistent entre sessions"
    status: failed
    reason: "BudgetsTab.tsx calls getBudgetProducts() and getProjectBudgetSummary() from mock internally. Budget data shown is mock-only, not from Supabase."
    artifacts:
      - path: "dashboard/src/components/tabs/BudgetsTab.tsx"
        issue: "Calls getBudgetProducts(project.id) from @/lib/mock at lines 47 and 61. Plan 04 stated this component was 'props already clean' — that was incorrect."
    missing:
      - "BudgetsTab must receive budgetProducts as props (from ProjectPageShell which fetches via getBudgetProducts from lib/data/documents)"
      - "ProjectPageShell must include getBudgetProducts in its Promise.all fetch and pass result to BudgetsTab"

  - truth: "Les données du tab Chat persistent entre sessions"
    status: failed
    reason: "ChatTab.tsx calls getConversations(), getClientDocs(), getProjectDocs() from @/lib/mock internally. Chat context data is entirely mock-driven."
    artifacts:
      - path: "dashboard/src/components/tabs/ChatTab.tsx"
        issue: "Calls getConversations(project.id), getClientDocs(project.clientId), getProjectDocs(project.id) from @/lib/mock at lines 20-22."
    missing:
      - "ChatTab must receive clientDocs and projectDocs as props (same data already fetched by ProjectPageShell — just wire through)"
      - "getConversations is a mock-only helper — conversation persistence is a separate future concern, but docs context in chat must come from Supabase"
human_verification:
  - test: "Sidebar shows Supabase clients (not mock)"
    expected: "Clients added in Supabase Studio appear in the sidebar without redeployment"
    why_human: "Requires live Supabase connection and browser; can't verify programmatically"
  - test: "Page reload preserves client/project data"
    expected: "After reload, client and project pages show same data (from Supabase, not localStorage)"
    why_human: "Session persistence requires browser + live Supabase connection"
  - test: "UI visually identical to pre-migration"
    expected: "No layout regressions on any page"
    why_human: "Visual diff requires human eye"
---

# Phase 02: Live Reads — Server Components — Verification Report

**Phase Goal:** Toutes les pages fetchent depuis Supabase. L'UI est identique visuellement mais les données persistent entre sessions.
**Verified:** 2026-03-08T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | DAL layer (`lib/data/`) exists with real Supabase queries and `server-only` guard | VERIFIED | All three files present, each starts with `import 'server-only'`, queries `.from('clients')`, `.from('projects')`, `.from('documents')`, `.from('budget_products')` |
| 2 | The three main pages (`/`, `/[clientId]`, `/[clientId]/[projectId]`) are async Server Components with zero mock data imports | VERIFIED | All three have no `"use client"`, import only from `lib/data/*`, use `Promise.all` parallel fetches |
| 3 | `ClientSidebar` and shell components receive all data via props (no internal mock calls) | VERIFIED | `ClientSidebar` accepts `clients/prospects/archived` props. `ClientPageShell` and `ProjectPageShell` receive data from page. `DocumentsTab` receives `projectDocs`/`clientDocs` as props. |
| 4 | TypeScript build passes with zero errors | VERIFIED | `npm run build` exits 0; all three pages show as `ƒ (Dynamic)` in build output |
| 5 | `mock.ts` n'est plus importé dans aucune page (ROADMAP success criterion) | FAILED | `app/(dashboard)/compta/page.tsx` imports `CLIENTS`, `PROJECTS`, `getClients`, `getProjectBudgetSummary` from `@/lib/mock` — runtime data, not types |
| 6 | Les données des tabs Budget et Chat persistent entre sessions | FAILED | `BudgetsTab` calls `getBudgetProducts()` from mock internally (lines 47, 61). `ChatTab` calls `getConversations()`, `getClientDocs()`, `getProjectDocs()` from mock internally (lines 20-22). Neither tab shows Supabase data. |

**Score:** 4/6 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `dashboard/src/lib/data/clients.ts` | `getClients()`, `getClient()` — Supabase queries | VERIFIED | Queries `clients` table with `contacts(*)` join, `toClient()` mapping, `server-only` guard |
| `dashboard/src/lib/data/projects.ts` | `getClientProjects()`, `getProject()` — Supabase queries | VERIFIED | Queries `projects` table, `toProject()` mapping, `server-only` guard |
| `dashboard/src/lib/data/documents.ts` | `getClientDocs()`, `getProjectDocs()`, `getBudgetProducts()` — Supabase queries | VERIFIED | Queries `documents` and `budget_products` tables, type mapping present, `server-only` guard |
| `dashboard/src/app/(dashboard)/page.tsx` | Async Server Component — redirects to first Supabase client | VERIFIED | `export default async function Home()`, imports only from `lib/data/clients`, redirects to `/onboarding` if no clients |
| `dashboard/src/app/(dashboard)/[clientId]/page.tsx` | Async Server Component — fetches client + projects + docs | VERIFIED | `export default async function ClientPage`, `Promise.all` with 6 parallel fetches, `notFound()` guard, UUID validation |
| `dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx` | Async Server Component — fetches project + all sidebar data | VERIFIED | `export default async function ProjectPage`, `Promise.all` with 7 parallel fetches, `project.clientId !== clientId` guard |
| `dashboard/src/components/ClientPageShell.tsx` | "use client" shell — all hooks and rendering | VERIFIED | `"use client"`, props-based, preserves `useLocalProjects`, `useClientChatDrawer`, all state |
| `dashboard/src/components/ProjectPageShell.tsx` | "use client" shell — tab state, hooks, rendering | VERIFIED | `"use client"`, props-based, tab switching, `useEffect` for hash-based init |
| `dashboard/src/components/tabs/DocumentsTab.tsx` | Receives `projectDocs`/`clientDocs` as props | VERIFIED | Props `projectDocs: Document[]` and `clientDocs: Document[]` present, no internal mock data calls |
| `dashboard/src/app/(dashboard)/compta/page.tsx` | Should have no mock data imports (per ROADMAP) | FAILED | Imports `CLIENTS`, `PROJECTS`, `getClients`, `getProjectBudgetSummary` from `@/lib/mock` — runtime data |
| `dashboard/src/components/tabs/BudgetsTab.tsx` | Budget data from Supabase via props | FAILED | Calls `getBudgetProducts(project.id)` from `@/lib/mock` internally at lines 47 and 61 |
| `dashboard/src/components/tabs/ChatTab.tsx` | Chat context docs from Supabase via props | FAILED | Calls `getConversations()`, `getClientDocs()`, `getProjectDocs()` from `@/lib/mock` internally |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(dashboard)/page.tsx` | `lib/data/clients.ts` | `import { getClients } from '@/lib/data/clients'` | WIRED | Confirmed in file line 3 |
| `app/(dashboard)/[clientId]/page.tsx` | `lib/data/clients.ts` + `lib/data/projects.ts` + `lib/data/documents.ts` | `Promise.all` with all DAL functions | WIRED | All 6 fetches verified |
| `app/(dashboard)/[clientId]/[projectId]/page.tsx` | `lib/data/*` | `Promise.all` with 7 fetches | WIRED | All 7 fetches verified |
| `[clientId]/page.tsx` → `ClientPageShell` | Props: `client`, `projects`, `globalDocs`, `clients`, `prospects`, `archived` | `<ClientPageShell ... />` | WIRED | All 7 props passed |
| `[clientId]/[projectId]/page.tsx` → `ProjectPageShell` | Props: full set including `projectDocs`, `clientDocs` | `<ProjectPageShell ... />` | WIRED | All 9 props passed |
| `ProjectPageShell` → `BudgetsTab` | `projectDocs` budget data flowing through | NOT_WIRED | `BudgetsTab` ignores `localProducts` from shell for existing data; calls `getBudgetProducts` from mock internally for Supabase data — Supabase `getBudgetProducts` result never reaches `BudgetsTab` |
| `ClientSidebar` | Props API | `clients`, `prospects`, `archived` props | WIRED | New prop-based API confirmed in `ClientSidebar.tsx` lines 14-22 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| ARCH-1 | 02-01 | DAL layer `lib/data/*.ts` introduced, no direct mock import in pages | SATISFIED | `lib/data/` exists; the three main pages import only from `lib/data/`. Note: `compta/page.tsx` violates the "no page" part. |
| CLIENT-6 | 02-02 | Liste clients persistée et rechargée depuis Supabase | SATISFIED (with caveat) | `getClients()` queries Supabase. Requires human verification to confirm live data appears. |
| PROJECT-5 | 02-03 | Voir tous les projets d'un client (from Supabase) | SATISFIED (with caveat) | `getClientProjects()` queries Supabase. Requires human verification. |
| ARCH-2 | 02-02, 02-03, 02-04 | Pages converties en Server Components async | SATISFIED for 3 pages | `/`, `[clientId]/page.tsx`, `[clientId]/[projectId]/page.tsx` confirmed. `compta/page.tsx` remains "use client" with mock. |
| ARCH-3 | 02-02, 02-03, 02-04 | Composants UI restent inchangés — reçoivent données via props | PARTIAL | `ClientSidebar`, `ClientPageShell`, `ProjectPageShell`, `DocumentsTab` correctly prop-based. `BudgetsTab` and `ChatTab` still fetch from mock internally — not receiving Supabase data via props. |

**Orphaned requirements check:** ARCH-1 also appears in plan 02-01 which is phase 02. No orphaned IDs detected.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/tabs/BudgetsTab.tsx` | 47, 61 | `getBudgetProducts(project.id)` called from `@/lib/mock` | Blocker | Budget tab shows mock data, not Supabase data — goal "données persistent" not met for this tab |
| `src/components/tabs/ChatTab.tsx` | 20-22 | `getConversations()`, `getClientDocs()`, `getProjectDocs()` from `@/lib/mock` | Blocker | Chat tab context is entirely mock — not from Supabase |
| `src/components/tabs/ChatTab.tsx` | 20 | `getConversations()` — no Supabase equivalent | Warning | Conversations are mock-only; no DAL function or Supabase table for this exists in phase 02 scope |
| `src/app/(dashboard)/compta/page.tsx` | 6-12 | Imports `CLIENTS`, `PROJECTS`, `getClients`, `getProjectBudgetSummary` from `@/lib/mock` | Blocker | Violates ROADMAP success criterion "mock.ts n'est plus importé dans aucune page" |
| `src/components/ClientChatDrawer.tsx` | 5, 13 | `getClient()` from `@/lib/mock` | Warning | Chat drawer client lookup uses mock data — not a page but affects UX consistency |

---

## Human Verification Required

### 1. Sidebar Shows Real Supabase Clients

**Test:** Login, then add a new client in Supabase Studio. Reload the app without redeploying.
**Expected:** The new client appears in the sidebar immediately after reload.
**Why human:** Requires live Supabase connection + browser.

### 2. Page Reload Preserves Data

**Test:** Load `/[some-client-uuid]`, note projects shown, reload the page.
**Expected:** Same projects appear after reload (data comes from Supabase, not localStorage).
**Why human:** Session persistence verification requires browser + live Supabase.

### 3. UI Visually Identical

**Test:** Compare all migrated pages visually against screenshots or the original mock-based UI.
**Expected:** No layout regressions — headers, cards, sidebar, tabs all render correctly.
**Why human:** Visual diff requires human eye.

---

## Gaps Summary

Three gaps block full goal achievement:

**Gap 1 — `compta/page.tsx` not migrated** (Blocker for ROADMAP success criterion 3):
The ROADMAP success criterion states "mock.ts n'est plus importé dans aucune page." The `compta` page inside `app/(dashboard)/` was not in scope for any of the four plans. It imports runtime data (`CLIENTS`, `PROJECTS`, `getClients`, `getProjectBudgetSummary`) from mock. This is the most concrete, cleanly-scoped gap — the page must be migrated or explicitly excluded from the criterion.

**Gap 2 — `BudgetsTab` uses mock for budget data** (Blocker for goal "données persistent"):
Plan 04 assumed `BudgetsTab` was "props already clean" — this was incorrect. The tab calls `getBudgetProducts(project.id)` from mock to populate the budget display. The DAL already has `getBudgetProducts()` in `lib/data/documents.ts` that queries Supabase. The fix is: pass `budgetProducts` as a prop from `ProjectPageShell` (which already fetches it via DAL) through to `BudgetsTab`.

**Gap 3 — `ChatTab` uses mock for context docs** (Blocker for goal "données persistent"):
`ChatTab` calls `getClientDocs` and `getProjectDocs` from mock to build its agent context. `ProjectPageShell` already holds `projectDocs` and `clientDocs` from Supabase — they just need to be passed down as props to `ChatTab`. The `getConversations()` call is a separate concern (no Supabase table for conversations yet), but the doc context at minimum must come from Supabase.

**Root cause:** Plans 02-03 and 02-04 scoped the "props already clean" assumption without verifying the actual source of truth inside the tab components. The extraction pattern (Server Component → Shell → Tab via props) was correctly applied to `DocumentsTab` but missed `BudgetsTab` and `ChatTab`.

---

_Verified: 2026-03-08T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
