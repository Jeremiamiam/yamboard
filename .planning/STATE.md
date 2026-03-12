---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-09T21:20:33.616Z"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 21
  completed_plans: 21
---

# Project State

**Project:** YamBoard
**Milestone:** v1.0 — Supabase Backend Migration
**Last updated:** 2026-03-08

## Current Phase
Phase 04 in progress — plan 04-03 complete

## Current Position
04-03 complete. Chat route secured with getUser() auth gate (401). MODEL_BY_SCOPE constant routes agency to Haiku, client/project to Opus. stream.finalMessage() logs token usage after each response. saveDocumentRecord extended with extractDocumentContent() helper: txt/md via direct text(), PDF via Claude Haiku vision base64 — non-blocking. Next: 04-04 (async context builders).

## Status
Phase 04 in progress (3/5 plans). Chat route secured and model-aware. Document content extraction pipeline live. documents.content populated for PDF/txt uploads — ready for context injection in 04-05.

## Decisions

| Decision | Rationale |
|----------|-----------|
| UUID dans les routes [clientId] | Simplifie les joins, slug existe en base mais non utilisé dans les URLs |
| owner_id (pas created_by) | Uniformisé sur toutes les tables |
| Pas de Supabase Realtime | Usage solo — revalidatePath() suffisant |
| Bucket Storage privé | Données client confidentielles — signed URLs uniquement |
| Schéma simple (owner_id seul) | Pas de multi-user en v1, migration additive en v2 |
- [Phase 01-foundation-auth-infrastructure-schema]: owner_id on all 5 tables enables direct RLS without join-based policies
- [Phase 01-foundation-auth-infrastructure-schema]: (SELECT auth.uid()) subquery form used in all RLS policies for single-eval optimization
- [01-01]: NEXT_PUBLIC_SUPABASE_ANON_KEY used (not PUBLISHABLE_KEY) — correct @supabase/ssr variable name
- [01-01]: server.ts createClient() is async (await cookies()) — required by Next.js 15/16 App Router
- [01-01]: SUPABASE_SERVICE_ROLE_KEY never prefixed NEXT_PUBLIC_ — SEC-4 compliant
- [Phase 01-foundation-auth-infrastructure-schema]: DO $$ block pattern used in seed SQL for readable FK variable references
- [01-03]: getUser() used exclusively — validates JWT server-side on every request; getSession() forbidden in all server files (SEC-3)
- [01-03]: (dashboard)/ route group protects all routes without adding URL segment — layout.tsx as auth gate
- [01-03]: login() Server Action returns { error } object instead of throwing — Client Component handles error display inline
- [Phase 01-foundation-auth-infrastructure-schema]: Audit confirmed zero corrections needed — Phase 01 auth was implemented correctly from the start (all SEC-1/2/3/4 pass)
- [Phase 01-foundation-auth-infrastructure-schema]: debug/route.ts SERVICE_ROLE_KEY access is SEC-4 compliant: server API Route, no NEXT_PUBLIC_ prefix
- [Phase 02-live-reads-server-components]: DAL wraps mock arrays (CLIENTS, PROJECTS, DOCUMENTS, BUDGET_PRODUCTS) directly — not helper functions — to make filtering logic explicit and easy to swap with Supabase queries
- [Phase 02-live-reads-server-components]: getClient() and getProject() return null (not undefined) — aligns with Supabase query result pattern for plan 02-02/03/04 swap-in
- [Phase 02-live-reads-server-components]: ClientSidebar refactored to accept all three category arrays as props — avoids async calls inside Client Component, enables parallel fetching by parent Server Component
- [Phase 02-live-reads-server-components]: toClient() row mapper extracts is_primary contact from Supabase join result — normalises into flat Client.contact shape
- [Phase 02-live-reads-server-components]: ClientPageShell receives clients/prospects/archived from Server Component — sidebar data parallel-fetched server-side
- [Phase 02-live-reads-server-components]: localProjects merge kept in Phase 02 ClientPageShell — propProjects from Supabase + local context, persisted in Phase 03
- [Phase 02-live-reads-server-components]: ProjectPageShell keeps useLocalProjects fallback for locally-created projects (Phase 02 acceptable — Phase 03 will persist)
- [Phase 02-live-reads-server-components]: project.clientId !== clientId guard ensures UUID-level consistency — invalid URL combos return 404
- [Phase 02-live-reads-server-components]: conversations in ChatTab defaults to [] in Phase 02 — no Supabase conversations table yet; empty state renders correctly
- [Phase 02-live-reads-server-components]: Tab components receive Supabase data as props exclusively — never call mock or DAL functions internally (ARCH-3)
- [Phase 02-live-reads-server-components]: useProjectOverrides removed from compta — project.potentialAmount from Supabase used directly; potential editing restored in Phase 03 via Server Actions
- [Phase 03-live-writes-server-actions-file-upload]: Storage migration is manual-only — delivered as SQL for Supabase Studio execution before PDF uploads
- [Phase 03-live-writes-server-actions-file-upload]: createClient import aliased as createSupabaseClient to avoid name collision with Server Action export
- [Phase 03-live-writes-server-actions-file-upload]: defense-in-depth: .eq('owner_id', user.id) on all UPDATE/DELETE even with RLS active — explicit ownership enforcement
- [Phase 03]: Supabase join result cast via unknown before target type to satisfy TS2352 overlap error in projects(client_id) select
- [Phase 03]: updatePaymentStage uses { [stage]: value } computed property key for dynamic JSONB column targeting
- [Phase 03-live-writes-server-actions-file-upload]: updateContact always fetches client_id from DB to build correct revalidatePath regardless of which fields are updated
- [Phase 03-live-writes-server-actions-file-upload]: deleteContact fetches client_id before deletion to preserve FK reference for cache invalidation via revalidatePath
- [Phase 03-live-writes-server-actions-file-upload]: 2-step PDF upload: Server Action generates signed URL only — browser uploads directly to Supabase Storage (PERF-3 + SEC-5 compliant)
- [Phase 03-live-writes-server-actions-file-upload]: deleteDocument order: Storage remove before DB delete prevents orphaned files in bucket
- [Phase 03-live-writes-server-actions-file-upload]: iframe PDF viewer in DocumentViewer is a placeholder — Phase 04 must replace with text extraction + Claude vision pipeline for AI context injection
- [Phase 03-live-writes-server-actions-file-upload]: createNote wired into DocumentsTab.tsx post-checkpoint via useTransition — confirms Server Action → UI loop works end-to-end
- [Phase 03]: useTransition used in ClientPageShell and BudgetsTab for Server Action pending states — provides visual feedback without blocking UI
- [Phase 03]: potentialAmount persisted onBlur (not onChange) in BudgetsTab to avoid Server Action call on every keystroke
- [Phase 03]: LocalProjects and ProjectOverrides contexts deleted — all project creation and potentialAmount persistence now go through Server Actions (ARCH-4 complete)
- [Phase Phase 03]: ClientSidebar createClient Server Action wired at checkpoint — 'Nouveau client/prospect' button now creates client in Supabase
- [Phase 04]: lib/types.ts has no server-only import — used by both server and client components
- [Phase 04]: All type imports migrated to @/lib/types; mock.ts runtime arrays stay until plan 04-05
- [04-02]: getClientDocs unchanged for UI (project_id IS NULL only); getClientDocsWithPinned added for AI context scope using .or() filter
- [04-02]: storagePath mapped in toDocument from storage_path column — enables PDF re-extraction path in 04-04
- [Phase 04]: MODEL_BY_SCOPE: agency uses Haiku (cost), client/project use Opus (quality)
- [Phase 04]: finalMessage() called after for-await loop to access accumulated token usage stats
- [Phase 04]: PDF extraction: non-blocking try/catch around extractDocumentContent in saveDocumentRecord — failure never blocks upload
- [Phase 04-05]: ClientChatDrawer inlines chat UI directly using useChat({ contextType: 'client', clientId }) — avoids dummy Client object for cosmetic header
- [Phase 04-05]: ProduitsTab.tsx deleted (dead code — BudgetsTab is the active produits tab, ProduitsTab had zero importers)
- [Phase 04-05]: DocumentViewer mock content fallback removed — real Supabase docs use content (note) or storagePath (PDF)
- [Phase 04-05]: react-markdown for assistant messages only; user messages stay plain text with pre-wrap
- [Phase 04-05]: Sonnet (claude-sonnet-4-5) for client/project over Opus — 3x faster for conversational use, same quality
- [Phase 04-05]: sessionStorage persistence for client/project chat scopes keyed by chat:client:{id} and chat:project:{clientId}:{projectId}

## Blockers
Aucun

## Notes
- Brownfield migration — UI v2 existante dans dashboard/, aucun changement UI prévu
- DAL layer (lib/data/) à introduire en Phase 02 avant tout import Supabase dans les pages
- Phase 04 nécessite un research sprint sur token budgets avant implémentation
