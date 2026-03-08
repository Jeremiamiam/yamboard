---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-08T11:30:00.000Z"
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 5
  completed_plans: 4
---

# Project State

**Project:** YamBoard
**Milestone:** v1.0 — Supabase Backend Migration
**Last updated:** 2026-03-08

## Current Phase
Phase 01 — Foundation: Auth + Infrastructure + Schema

## Current Position
Plans 01-01, 01-02, 01-03, and 01-04 complete. Next: 01-05 (security audit — getSession→getUser, WITH CHECK, service role key isolation).

## Status
Executing Phase 01. Plans 01-01, 01-02, 01-03, and 01-04 complete. Auth gate verified by human: redirect to /login without session, login/logout flows work, UI v2 intact. Plan 01-05 (security audit) is the last plan in this phase.

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

## Blockers
Aucun

## Notes
- Brownfield migration — UI v2 existante dans dashboard/, aucun changement UI prévu
- DAL layer (lib/data/) à introduire en Phase 02 avant tout import Supabase dans les pages
- Phase 04 nécessite un research sprint sur token budgets avant implémentation
