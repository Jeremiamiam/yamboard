---
phase: 02-live-reads-server-components
verified: 2026-03-08T13:00:00Z
status: human_needed
score: 6/6 must-haves verified
re_verification: true
previous_status: gaps_found
previous_score: 4/6
gaps_closed:
  - "mock.ts n'est plus importé dans aucune page — compta/page.tsx now uses only type-only import from mock; all runtime data fetched from Supabase DAL"
  - "BudgetsTab uses Supabase data via props — budgetProducts accepted as required prop; no internal mock function calls remain"
  - "ChatTab uses Supabase data via props — clientDocs and projectDocs accepted as props; getConversations/getClientDocs/getProjectDocs from mock fully removed"
gaps_remaining: []
regressions: []
human_verification:
  - test: "Sidebar shows Supabase clients (not mock)"
    expected: "Clients added in Supabase Studio appear in the sidebar without redeployment"
    why_human: "Requires live Supabase connection and browser; can't verify programmatically"
  - test: "Page reload preserves client/project data"
    expected: "After reload, client and project pages show same data (from Supabase, not localStorage)"
    why_human: "Session persistence requires browser + live Supabase connection"
  - test: "Budget tab shows Supabase-persisted products"
    expected: "budget_products rows created via Supabase Studio appear in the BudgetsTab after page reload"
    why_human: "Requires live Supabase connection with budget_products table populated"
  - test: "Chat tab context panel shows Supabase documents"
    expected: "Documents from the documents table appear in the Contexte chargé sidebar of ChatTab"
    why_human: "Requires live Supabase connection with documents table populated"
  - test: "UI visually identical to pre-migration"
    expected: "No layout regressions on any page"
    why_human: "Visual diff requires human eye"
---

# Phase 02: Live Reads — Server Components — Verification Report

**Phase Goal:** Toutes les pages fetchent depuis Supabase. L'UI est identique visuellement mais les données persistent entre sessions.
**Verified:** 2026-03-08T13:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plans 02-05 and 02-06)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | DAL layer (`lib/data/`) exists with real Supabase queries and `server-only` guard | VERIFIED | All three files present, each starts with `import 'server-only'`, queries `.from('clients')`, `.from('projects')`, `.from('documents')`, `.from('budget_products')` |
| 2 | The three main pages (`/`, `/[clientId]`, `/[clientId]/[projectId]`) are async Server Components with zero mock data imports | VERIFIED | All three have no `"use client"`, import only from `lib/data/*`, use `Promise.all` parallel fetches |
| 3 | `ClientSidebar` and shell components receive all data via props (no internal mock calls) | VERIFIED | `ClientSidebar` accepts `clients/prospects/archived` props. `ClientPageShell` and `ProjectPageShell` receive data from page. `DocumentsTab`, `BudgetsTab`, `ChatTab` all receive Supabase data via props. |
| 4 | TypeScript build passes with zero errors | VERIFIED | `npm run build` exits 0 (confirmed per 02-06 SUMMARY self-check) |
| 5 | `mock.ts` n'est plus importé dans aucune page (ROADMAP success criterion) | VERIFIED | `compta/page.tsx` now has only `import type { Client } from "@/lib/mock"` — a type-only import with zero runtime data. All runtime fetches (`getClients`, `getAllProjects`, `getAllBudgetProducts`) now use `@/lib/data/*` DAL. No `app/(dashboard)/` page imports runtime data from mock. |
| 6 | Les données des tabs Budget et Chat persistent entre sessions | VERIFIED | `BudgetsTab` accepts `budgetProducts: BudgetProduct[]` as required prop (line 29); both `useMemo` blocks at lines 46-57 and 59-71 use the prop directly. `ChatTab` accepts `clientDocs: Document[]` and `projectDocs: Document[]` as props; `conversations` defaults to `[]`; all mock function calls removed. `ProjectPageShell` fetches `budgetProducts` via `getBudgetProducts(projectId)` from DAL and wires to both tabs. |

**Score:** 6/6 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `dashboard/src/lib/data/clients.ts` | `getClients()`, `getClient()` — Supabase queries | VERIFIED | Queries `clients` table with `contacts(*)` join, `toClient()` mapping, `server-only` guard |
| `dashboard/src/lib/data/projects.ts` | `getClientProjects()`, `getProject()`, `getAllProjects()` — Supabase queries | VERIFIED | Queries `projects` table; `getAllProjects()` added in 02-05 (no client_id filter) |
| `dashboard/src/lib/data/documents.ts` | `getClientDocs()`, `getProjectDocs()`, `getBudgetProducts()`, `getAllBudgetProducts()` — Supabase queries | VERIFIED | Queries `documents` and `budget_products` tables; `getAllBudgetProducts()` added in 02-05 |
| `dashboard/src/app/(dashboard)/page.tsx` | Async Server Component — redirects to first Supabase client | VERIFIED | `export default async function Home()`, imports only from `lib/data/clients` |
| `dashboard/src/app/(dashboard)/[clientId]/page.tsx` | Async Server Component — fetches client + projects + docs | VERIFIED | `export default async function ClientPage`, `Promise.all` with 6 parallel fetches, UUID validation |
| `dashboard/src/app/(dashboard)/[clientId]/[projectId]/page.tsx` | Async Server Component — fetches project + all sidebar data + budgetProducts | VERIFIED | `export default async function ProjectPage`, `Promise.all` with 8 parallel fetches (incl. `getBudgetProducts`), all 9 props passed to shell |
| `dashboard/src/app/(dashboard)/compta/page.tsx` | Async Server Component — no runtime mock imports | VERIFIED | Fetches via `Promise.all` from DAL. Only remaining mock reference is `import type { Client }` — type annotation only, no runtime data. |
| `dashboard/src/components/ClientPageShell.tsx` | "use client" shell — all hooks and rendering | VERIFIED | `"use client"`, props-based, preserves `useLocalProjects`, `useClientChatDrawer`, all state |
| `dashboard/src/components/ProjectPageShell.tsx` | "use client" shell — tab state, hooks, rendering; wires `budgetProducts` to BudgetsTab and `clientDocs`/`projectDocs` to ChatTab | VERIFIED | Props include `budgetProducts: BudgetProduct[]`; `BudgetsTab` receives `budgetProducts`, `localProducts`, `onAddProduct`; `ChatTab` receives `clientDocs`, `projectDocs` |
| `dashboard/src/components/tabs/DocumentsTab.tsx` | Receives `projectDocs`/`clientDocs` as props | VERIFIED | Props `projectDocs: Document[]` and `clientDocs: Document[]` present, no internal mock data calls |
| `dashboard/src/components/tabs/BudgetsTab.tsx` | Budget data from Supabase via props | VERIFIED | `budgetProducts: BudgetProduct[]` required prop at line 29; `getBudgetProducts`/`getProjectBudgetSummary` removed from mock imports; both useMemo blocks use prop |
| `dashboard/src/components/tabs/ChatTab.tsx` | Chat context docs from Supabase via props | VERIFIED | `clientDocs: Document[]` and `projectDocs: Document[]` props present; `getConversations`/`getClientDocs`/`getProjectDocs` from mock fully removed; `conversations` defaults to `[]` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(dashboard)/page.tsx` | `lib/data/clients.ts` | `import { getClients } from '@/lib/data/clients'` | WIRED | Confirmed in file |
| `app/(dashboard)/[clientId]/page.tsx` | `lib/data/clients.ts` + `lib/data/projects.ts` + `lib/data/documents.ts` | `Promise.all` with all DAL functions | WIRED | All 6 fetches verified |
| `app/(dashboard)/[clientId]/[projectId]/page.tsx` | `lib/data/*` | `Promise.all` with 8 fetches including `getBudgetProducts` | WIRED | All 8 fetches verified; `budgetProducts` passed to `ProjectPageShell` |
| `app/(dashboard)/compta/page.tsx` | `lib/data/clients.ts`, `lib/data/projects.ts`, `lib/data/documents.ts` | `Promise.all([getClients, getAllProjects, getAllBudgetProducts])` | WIRED | All three DAL imports confirmed at lines 5-7 |
| `[clientId]/[projectId]/page.tsx` → `ProjectPageShell` | Props: `client`, `project`, `projectDocs`, `clientDocs`, `budgetProducts`, `clientId`, `projectId`, `clients`, `prospects`, `archived` | `<ProjectPageShell ... />` | WIRED | All 9 props passed confirmed in file |
| `ProjectPageShell` → `BudgetsTab` | `budgetProducts` prop | `<BudgetsTab budgetProducts={budgetProducts} .../>` | WIRED | Line 168-174 in ProjectPageShell confirms prop passed |
| `ProjectPageShell` → `ChatTab` | `clientDocs` and `projectDocs` props | `<ChatTab clientDocs={clientDocs} projectDocs={projectDocs} .../>` | WIRED | Lines 176-183 in ProjectPageShell confirm props passed |
| `ClientSidebar` | Props API | `clients`, `prospects`, `archived` props | WIRED | Prop-based API confirmed |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| ARCH-1 | 02-01, 02-05 | DAL layer `lib/data/*.ts` introduced, no runtime mock import in any page | SATISFIED | `lib/data/` exists with 3 files + `server-only`. All `app/(dashboard)/` pages import only from `lib/data/*` at runtime. `compta/page.tsx` has only `import type` from mock (no runtime data). |
| ARCH-2 | 02-02, 02-03, 02-04, 02-05 | Pages converties en Server Components async | SATISFIED | `/`, `[clientId]/page.tsx`, `[clientId]/[projectId]/page.tsx`, `compta/page.tsx` all confirmed as async Server Components (no `"use client"`, `export default async function`). |
| ARCH-3 | 02-02, 02-03, 02-04, 02-06 | Composants UI restent inchangés — reçoivent données via props | SATISFIED | `ClientSidebar`, `ClientPageShell`, `ProjectPageShell`, `DocumentsTab`, `BudgetsTab`, `ChatTab` all receive data via props; no internal mock data function calls in any wired component. |
| CLIENT-6 | 02-02 | Liste clients persistée et rechargée depuis Supabase | SATISFIED (human verification needed) | `getClients()` queries `clients` Supabase table. Requires live verification to confirm data appears in browser. |
| PROJECT-5 | 02-03 | Voir tous les projets d'un client (from Supabase) | SATISFIED (human verification needed) | `getClientProjects()` queries `projects` Supabase table filtered by `clientId`. Requires live verification. |

**Orphaned requirements check:** No additional ARCH/CLIENT/PROJECT requirements mapped to Phase 02 in REQUIREMENTS.md that are unaccounted for in the plans.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/tabs/ProduitsTab.tsx` | 4, 20 | `getBudgetProducts(project.id)` called from `@/lib/mock`; `type Project` imported from mock | Warning | File is **never imported or used anywhere** (confirmed via grep — only self-declaration). Zero runtime impact. Orphaned dead code from pre-migration; should be deleted in a cleanup phase. |
| `src/components/ClientChatDrawer.tsx` | 5, 13 | `getClient()` from `@/lib/mock` | Warning | Chat drawer client lookup uses mock data — not a page, and ClientChatDrawer is not in phase 02 scope. Deferred to a future phase. |
| `src/app/(dashboard)/compta/page.tsx` | 8 | `import type { Client } from "@/lib/mock"` | Info | Type-only import — no runtime data fetched from mock. Acceptable for Phase 02; can be eliminated when `Client` type is moved to a dedicated types file. |

No blockers found. All previously-blocker anti-patterns have been resolved.

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

### 3. Budget Tab Shows Persisted Products

**Test:** Add a budget_products row in Supabase Studio for a project. Navigate to that project's Budget tab.
**Expected:** The product appears in the BudgetsTab without any code change or redeploy.
**Why human:** Requires live Supabase connection with budget_products table populated.

### 4. Chat Tab Context Shows Supabase Documents

**Test:** Add a document row in Supabase Studio for a client and project. Navigate to that project's Chat tab.
**Expected:** The document appears in the "Contexte chargé" sidebar panel.
**Why human:** Requires live Supabase connection with documents table populated.

### 5. UI Visually Identical

**Test:** Compare all migrated pages visually against screenshots or the original mock-based UI.
**Expected:** No layout regressions — headers, cards, sidebar, tabs all render correctly.
**Why human:** Visual diff requires human eye.

---

## Re-verification Summary

All three gaps from the initial verification have been closed:

**Gap 1 — `compta/page.tsx` mock imports** (CLOSED by plan 02-05):
The page is now a fully async Server Component. All runtime mock imports (`CLIENTS`, `PROJECTS`, `getClients`, `getProjectBudgetSummary`) have been replaced with DAL calls (`getClients()`, `getAllProjects()`, `getAllBudgetProducts()`). The only remaining mock reference is `import type { Client }` — a TypeScript type annotation with zero runtime footprint. ARCH-1 is satisfied.

**Gap 2 — `BudgetsTab` used mock for budget data** (CLOSED by plan 02-06):
`BudgetsTab` now accepts `budgetProducts: BudgetProduct[]` as a required prop. Both `useMemo` blocks compute totals directly from the prop. `ProjectPageShell` passes the prop fetched from `getBudgetProducts(projectId)` in the Server Component's `Promise.all`. The Supabase → Server Component → Shell → Tab chain is fully wired.

**Gap 3 — `ChatTab` used mock for context docs** (CLOSED by plan 02-06):
`ChatTab` now accepts `clientDocs` and `projectDocs` as required props. `getConversations`, `getClientDocs`, and `getProjectDocs` from mock are fully removed. `conversations` defaults to `[]` (no Supabase conversations table exists in Phase 02 — correct per plan decision). `ProjectPageShell` passes `clientDocs` and `projectDocs` already fetched by the Server Component.

All automated checks pass. The phase goal is achieved in code. Human verification remains for live Supabase data flow and visual regression testing.

---

_Verified: 2026-03-08T13:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after plans 02-05 and 02-06_
