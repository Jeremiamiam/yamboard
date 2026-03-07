# Roadmap: GET BRANDON — Web App

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 (shipped 2026-02-26) · [Archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 File Upload + Wiki + UI/UX** — Phases 4-6 (shipped 2026-02-27)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) — SHIPPED 2026-02-26</summary>

- [x] Phase 1: Foundation + Auth (5/5 plans) — completed 2026-02-25
- [x] Phase 2: Core Streaming (4/4 plans) — completed 2026-02-25
- [x] Phase 3: UI Workflow + Dashboard (4/4 plans) — completed 2026-02-25

</details>

### ✅ v1.1 File Upload + Wiki + UI/UX (Shipped 2026-02-27)

**Milestone Goal:** Compléter la boucle de production GBD — fichiers in/out gérés dans l'interface, wiki consultable, et une UI professionnelle digne d'un outil d'agence.

- [x] **Phase 4: File Upload + Output Extraction** — Upload client vers Supabase Storage, extraction et persistance des JSON outputs
- [x] **Phase 5: Wiki Native Page** — Page wiki /projects/[id]/wiki, sections par workflow, TL;DR, scroll-spy (completed 2026-02-27)
- [x] **Phase 6: UI/UX Redesign** — Design system Tailwind, redesign composants dashboard/chat/nav, états UX (completed 2026-02-27)

## Phase Details

### Phase 4: File Upload + Output Extraction
**Goal**: L'utilisateur peut uploader des fichiers clients dans un projet et accéder aux JSON outputs produits par chaque workflow
**Depends on**: Phase 3
**Requirements**: UPLD-01, UPLD-02, UPLD-03, UPLD-04, OUTP-01, OUTP-02, OUTP-03
**Success Criteria** (what must be TRUE):
  1. User can upload one or more files (PDF, .txt, .md, .docx) from the project page and they appear in a file list
  2. Uploaded files persist in Supabase Storage associated to the project and survive page reload
  3. User can delete an uploaded file and it disappears from the list immediately
  4. After a workflow completes, the JSON output is visible as a downloadable item on the project page
  5. User can click to download the JSON output file for any completed workflow
**Plans**: 5 plans

Plans:
- [x] 04-01-PLAN.md — Supabase Storage bucket + RLS migration + upload/delete API routes
- [x] 04-02-PLAN.md — File upload UI (FileUploader + FileList + ProjectFilesSection) on project page
- [x] 04-03-PLAN.md — workflow_outputs DB table + JSON output extraction in chat route
- [x] 04-04-PLAN.md — WorkflowOutputs component + download button on project page
- [x] 04-05-PLAN.md — Build check + full Phase 4 human verification

### Phase 5: Wiki Native Page
**Goal**: L'utilisateur peut consulter une page wiki structurée par projet, reflétant le contenu des workflows complétés
**Depends on**: Phase 4
**Requirements**: WIKI-01, WIKI-02, WIKI-03, WIKI-04
**Success Criteria** (what must be TRUE):
  1. User can navigate to /projects/[id]/wiki and see a dedicated wiki page for the project
  2. Only sections corresponding to completed workflows are visible (Contre-brief, Plateforme, Campagne, Site)
  3. Each section displays a TL;DR summary and the structured content derived from the workflow's JSON output
  4. Scrolling the page highlights the matching section in the sidebar (scroll-spy navigation)
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md — Wiki page Server Component + WikiSection + WikiSidebar components + project page wiki link
- [x] 05-02-PLAN.md — WikiNav client component with IntersectionObserver scroll-spy
- [x] 05-03-PLAN.md — Build check + full Phase 5 human verification

### Phase 6: UI/UX Redesign
**Goal**: L'application adopte un design neutre professionnel cohérent avec un système de design Tailwind et des états UX complets
**Depends on**: Phase 5
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04
**Success Criteria** (what must be TRUE):
  1. The app uses a consistent visual language (palette, typography, spacing) applied uniformly across all pages
  2. Dashboard, workflow cards and navigation are visually improved — information hierarchy is clear at a glance
  3. The chat interface has redesigned message bubbles, a clear header and a clean footer input area
  4. All interactive states are covered: loading skeletons or spinners, error messages, success feedback, and empty states
**Plans**: 5 plans

Plans:
- [x] 06-01-PLAN.md — Design tokens (globals.css @theme inline palette + radius) + root layout polish
- [x] 06-02-PLAN.md — Dashboard + project page + workflow-launcher redesign (cards, progress bars, status hierarchy)
- [x] 06-03-PLAN.md — Chat interface redesign (header nav, message bubbles, footer input area)
- [x] 06-04-PLAN.md — UX states (loading spinners, error alerts, empty states) + login page + wiki sections
- [x] 06-05-PLAN.md — Build gate + full Phase 6 human verification

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation + Auth | v1.0 | 5/5 | Complete | 2026-02-25 |
| 2. Core Streaming | v1.0 | 4/4 | Complete | 2026-02-25 |
| 3. UI Workflow + Dashboard | v1.0 | 4/4 | Complete | 2026-02-25 |
| 4. File Upload + Output Extraction | v1.1 | 5/5 | Complete | 2026-02-26 |
| 5. Wiki Native Page | v1.1 | 3/3 | Complete | 2026-02-27 |
| 6. UI/UX Redesign | v1.1 | 5/5 | Complete | 2026-02-27 |
