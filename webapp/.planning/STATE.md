# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** N'importe quel membre de l'équipe peut démarrer et piloter un projet GBD sans passer par le CLI.
**Current focus:** Phase 6 — UI/UX Redesign

## Current Position

Phase: 6 of 6 (UI/UX Redesign) — COMPLETE
Plan: 5 of 5 — Plan 05 complete (all plans done)
Status: Phase 6 COMPLETE — build gate passed (0 errors) + human verification approved. All 4 DSGN requirements confirmed. v1.1 milestone shipped.
Last activity: 2026-02-27 — 06-05 complete (production build gate + human verification — Phase 6 and v1.1 milestone done)

Progress: [██████████] 100% (v1.1)

## Performance Metrics

**Velocity (v1.0 reference):**
- Total plans completed: 13
- Average duration: ~3min
- Total execution time: ~39min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-auth | 5/5 | ~26min | ~5.2min |
| 02-core-streaming | 4/4 | ~10min | ~2.5min |
| 03-ui-workflow-dashboard | 4/4 | ~20min | ~5min |

**Recent Trend:**
- Last 5 plans: P03-02 (~1min), P03-03 (~2min), P03-04 (~15min)
- Trend: Stable

*Updated after each plan completion*

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 05-wiki-native-page P01 | 1/3 | ~2min | ~2min |
| 05-wiki-native-page P02 | 2/3 | ~1min | ~1min |
| 05-wiki-native-page P03 | 3/3 | ~5min | ~5min |
| Phase 06-ui-ux-redesign P01 | 1min | 2 tasks | 2 files |
| Phase 06-ui-ux-redesign P02 | 1 | 2 tasks | 5 files |
| Phase 06-ui-ux-redesign P03 | 2min | 2 tasks | 4 files |
| Phase 06-ui-ux-redesign P04 | 2min | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Recent decisions affecting current work:

- [Phase 04-03]: Output persistence is non-fatal — errors in persistOutput are caught and logged, chat stream is unaffected
- [Phase 04-03]: workflowSlug guard ensures non-workflow chats never trigger output extraction
- [Future]: PDF injection dans workflows → Anthropic Files API (option A) — upload PDF vers Anthropic, Claude lit texte + images nativement, limite 32MB/fichier. Décision confirmée 2026-02-26.
- [Phase 04-01]: Client-direct-to-Storage via signed URL — path {user_id}/{project_id}/{filename}, RLS enforces ownership on first segment
- [Phase 04-01]: Defense-in-depth ownership check in DELETE API (explicit code check + RLS both enforce)
- Upload: Client direct → Supabase Storage via signed URL (évite limite 4MB et timeouts Vercel)
- [Phase 03-04]: workflow_slug column on messages table — each workflow session has isolated history
- [Phase 03-04]: redirect() in markWorkflowComplete — user sent back to project page after completion
- [Phase 03-03]: markWorkflowComplete.bind(null, projectId, slug) Server Action form pattern
- [Phase 02-02]: runtime="nodejs" mandatory for Anthropic SDK; dynamic="force-dynamic" prevents SSE caching
- [Phase 04-04]: Outputs loaded server-side in Server Component, passed as initialOutputs — consistent with workflowStates pattern; data always fresh on navigation
- [Phase 04-04]: Client-side download via createObjectURL/Blob — no server round-trip for JSON download
- [Phase 04-04]: E2E output test deferred — approved on build check; unblocks when Anthropic Files API injection is implemented
- [Phase 04-02]: ProjectFilesSection stateful wrapper — Server Component hydrates initial files, client refreshes via GET API after upload/delete
- [Phase 04-02]: GET /api/projects/[id]/files maps full storage paths at list-time — FileList receives pre-built paths without needing userId
- [Phase 05-01]: WIKI_SECTIONS constant controls render order — site-standalone deduplication handled by first-match on ordered outputs
- [Phase 05-01]: WikiSidebar and WikiSection are Server Components (no use client) — scroll-spy will be added as client wrapper in Plan 02
- [Phase 05-02]: WikiNav renders its own nav markup (no WikiSidebar wrapping) — keeps WikiSidebar a pure Server Component, avoids use client contamination
- [Phase 05-02]: IntersectionObserver rootMargin -10% 0px -80% 0px — activates link when section enters top 20% band of viewport
- [Phase 05-wiki-native-page]: Phase 5 closed on human approval — wiki feature confirmed working end-to-end in browser
- [Phase 06-01]: Tailwind v4 @theme inline for design tokens — semantic naming by purpose not value (--color-text-secondary not --color-gray-500)
- [Phase 06-01]: Dark mode removed — internal tool, light-only per REQUIREMENTS.md out-of-scope
- [Phase 06-01]: lang="fr" on html element, font-sans on body — corrects Next.js boilerplate defaults
- [Phase 06-02]: Progress bar denominator hardcoded to 6 — consistent with fixed 6-workflow system throughout the app
- [Phase 06-02]: Available workflow rows use border-l-2 border-blue-500 left accent for clear actionable affordance; locked rows use opacity-60 on the entire row
- [Phase 06-02]: Delete button reduced to x icon-only (text-gray-300 hover:text-red-500) — reduces visual noise in project card list
- [Phase 06-03]: Back navigation rendered inside ChatInterface (not page.tsx) — keeps Server Component clean, ChatInterface has projectId prop
- [Phase 06-03]: WORKFLOW_LABELS imported in chat-interface.tsx for subtitle — single source of truth for workflow display names
- [Phase 06-03]: Marquer comme terminé button moved above input row — input always anchored to bottom edge
- [Phase 06-04]: Tailwind animate-spin with border-t contrast pattern used across all spinners for consistent loading animation
- [Phase 06-04]: Alert boxes use flex items-start gap-2 with warning icon character for accessible error display
- [Phase 06-04]: Wiki key-value layout switched from div/h3 to dl/dt/dd semantic HTML with uppercase tracking-wider labels
- [Phase 06-05]: Phase 6 closed on human approval — all 4 DSGN requirements confirmed working in browser; v1.1 milestone shipped

### Pending Todos

None yet.

### Blockers/Concerns

- Vercel timeout: Vérifier `maxDuration` actuel sur les docs Vercel au moment du setup (peut avoir changé depuis Aug 2025)
- PDF size limit: Supabase Storage free tier = 50MB/fichier. Anthropic Files API = 32MB/fichier (contrainte à garder en tête pour l'injection Claude).

## Session Continuity

Last session: 2026-02-27
Stopped at: Completed 06-05-PLAN.md — Production build gate + human verification. Phase 6 COMPLETE. v1.1 milestone shipped.
Resume file: None
