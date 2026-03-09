# Phase 04: AI on Real Data — Context Builders Migration - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert the 3 context builder functions (`buildAgencyContext`, `buildClientContext`, `buildProjectContext`) from synchronous mock arrays to async Supabase DAL calls. Delete `mock.ts`. The chat API route (`/api/chat/route.ts`) and DocumentsTab upload flow will also be updated.

Also includes: building the global Yamboard agency-level chat (new UI — button in GlobalNav → drawer, no persistence, Haiku model).

Out of scope: conversations persistence, new AI capabilities beyond 3 existing scopes.

</domain>

<decisions>
## Implementation Decisions

### File content extraction

- `.txt` and `.md` uploads: extract file text at upload time → store in `documents.content` column (same as copy-paste notes)
- PDFs: call Claude vision API at upload time → extract text → cache in `documents.content`. No re-extraction on subsequent context builds.
- Extraction happens server-side in the Server Action that handles file uploads (`createSignedUploadUrl` / `saveDocumentRecord` flow — Phase 04 extends this)
- If both a user note AND extracted file text exist: concatenate both into context (note first, then file content)
- For PDFs not yet extracted (uploaded before Phase 04): inject filename only until re-triggered

### Doc formatters

- Drop `fmtPlatform` and `fmtBrief` entirely — they rely on hardcoded mock content that won't exist in Supabase
- All docs use a single formatter: `fmtDoc(doc)` → doc name + type + content text if present
- `doc-content.ts` (PLATFORM_CONTENT, BRIEF_CONTENT) is deleted along with `mock.ts`

### Pinned docs scope

- **Client context (AI-2):** fetch docs where `client_id = X AND (project_id IS NULL OR is_pinned = true)` — client brand docs + pinned project docs
- **Project context (AI-3):** project's own docs (`project_id = projectId`) + the same client-level set (project_id IS NULL OR is_pinned = true). NOT all client docs — only the pinned/brand ones.
- `is_pinned` and `pinned_from_project` columns already exist in schema (Phase 03)

### Contacts in context

- Primary contact only (contact where `is_primary = true`, or first contact if none marked) in all 3 scopes
- Agency context: primary contact name + role per client (lean — respects ≤20K token budget)
- Client context: primary contact name, role, email, phone
- Project context: same as client context (primary contact)
- Contacts fetched via DAL — `getClient()` already returns `contact` (primary) from joined contacts query

### Token budget

- Claude's Discretion: implement priority-based truncation. Agency ≤20K tokens, client ≤30K, project ≤40K. Strategy: drop product payment stage details first, then doc content truncation, then project descriptions. Log a warning if a context exceeds budget but don't hard-fail.

### Context builders architecture

- `context-builders.ts` becomes `async` — all 3 functions return `Promise<string>`
- Import from DAL (`lib/data/`) instead of `lib/mock`
- `route.ts` (API Route) already runs server-side — can `await` async context builders
- Auth check in `route.ts`: verify user via Supabase `getUser()` before building context (SEC-3 pattern already established)
- Types (`Client`, `Project`, `Document`, `BudgetProduct`, etc.) migrated out of `mock.ts` into a new `lib/types.ts` (or `lib/mock.ts` types-only section) so DAL files don't import from a deleted file

### Model selection per scope

- Agency scope → `claude-haiku-4-5-20251001` (fast, cheap — vue globale budgets/projets/clients)
- Client scope → `claude-opus-4-6` (deep — travail de marque, briefs, livrables)
- Project scope → `claude-opus-4-6` (deep — même logique)
- `route.ts` selects model based on `contextType` before calling `client.messages.stream()`

### Global agency chat — UI

- New chat button in `GlobalNav` (top bar) → opens a slide-over drawer
- `contextType: "agency"` — uses `buildAgencyContext()` with real Supabase data
- No persistence: conversation state lives in React `useState` only, reset on drawer close
- Reuses existing `useChat` hook (already supports `{ contextType: "agency" }` signature)
- No `clientId` or `projectId` needed — agency scope is global

### Claude's Discretion

- Exact truncation algorithm for token budget enforcement
- Whether to add a `storage_path` field to the `toDocument` DAL mapper (needed for PDF re-extraction trigger)
- PDF extraction: which Claude model to use for vision (use the cheapest that handles PDFs well — haiku or sonnet)
- Error handling when Claude vision fails on a PDF (store partial text or empty, don't block upload)

</decisions>

<specifics>
## Specific Ideas

- "au niveau du client y'a que des pinned normalement" — all docs visible at client level in UI are either direct client docs (project_id IS NULL) or explicitly pinned project docs (is_pinned=true). Context should match UI-visible set.
- PDF vision extraction happens at upload (not lazily on first chat open) — better UX since context is ready immediately after upload

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `lib/data/clients.ts`: `getClients(category)`, `getClient(id)` — returns `Client` with primary contact already resolved from joined contacts query. Ready to use.
- `lib/data/projects.ts`: `getClientProjects(clientId)`, `getProject(projectId)`, `getAllProjects()` — Supabase-backed, async. Ready to use.
- `lib/data/documents.ts`: `getClientDocs(clientId)`, `getProjectDocs(projectId)`, `getBudgetProducts(projectId)`, `getAllBudgetProducts()` — but `getClientDocs` currently fetches `project_id IS NULL` only. **Needs update** to also fetch `is_pinned = true` docs for client/project contexts.
- `actions/documents.ts`: `pinDocument()`, `saveDocumentRecord()` — Phase 04 extends `saveDocumentRecord` to trigger Claude vision extraction for PDFs after save.
- `lib/supabase/server.ts`: `createClient()` — async Supabase server client, established pattern.

### Established Patterns

- All Server Actions use `createClient` aliased as `createSupabaseClient` to avoid name collision
- `getUser()` for auth (never `getSession()`) — SEC-3
- `import 'server-only'` in all server-only files
- `.eq('owner_id', user.id)` defense-in-depth on all queries even with RLS
- `revalidatePath()` after mutations

### Integration Points

- `app/(dashboard)/api/chat/route.ts` — becomes async, adds `getUser()` auth gate, selects model per `contextType` (Haiku for agency, Opus for client/project)
- `components/GlobalNav.tsx` — new agency chat button + drawer component (reuses `useChat` hook)
- `app/(dashboard)/actions/documents.ts` — `saveDocumentRecord` extended to trigger PDF vision extraction after file save
- `lib/data/documents.ts` — `getClientDocs` needs a new variant or flag to fetch `is_pinned = true` docs cross-project for a client
- `lib/mock.ts` — deleted at end of phase; types migrated to `lib/types.ts`
- `lib/doc-content.ts` — deleted at end of phase (PLATFORM_CONTENT, BRIEF_CONTENT no longer needed)

</code_context>

<deferred>
## Deferred Ideas

- Conversations persistence (chat history saved to Supabase) — noted, separate phase
- Structured doc types (platform/brief with parsed sections) — dropped in favor of free-form content; could be revisited in a future phase if needed
- Re-extraction trigger for PDFs uploaded before Phase 04 — out of scope; will inject filename-only until user re-uploads or manually adds note

</deferred>

---

*Phase: 04-ai-on-real-data-context-builders-migration*
*Context gathered: 2026-03-09*
