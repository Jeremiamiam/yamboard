---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-08T11:17:03.794Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 9
  completed_plans: 8
---

# Project State

**Project:** YamBoard
**Milestone:** v1.0 — Supabase Backend Migration
**Last updated:** 2026-03-08

## Current Phase
Phase 01 — Foundation: Auth + Infrastructure + Schema

## Current Position
All plans 01-01 through 01-05 complete. Phase 01 awaiting final human checkpoint: SQL pg_policies validation in Supabase Studio (see 01-05-SUMMARY.md). Next phase: 02 (Data Access Layer / DAL).

## Status
Phase 01 complete (5/5 plans). Security audit (01-05) passed all checks via static grep analysis: SEC-1/2/3/4 green. Awaiting human verify checkpoint — SQL validation queries in Supabase Studio. Once approved, Phase 02 (DAL) is unblocked.

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

## Blockers
Aucun

## Notes
- Brownfield migration — UI v2 existante dans dashboard/, aucun changement UI prévu
- DAL layer (lib/data/) à introduire en Phase 02 avant tout import Supabase dans les pages
- Phase 04 nécessite un research sprint sur token budgets avant implémentation
