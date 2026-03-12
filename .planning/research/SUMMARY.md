# Project Research Summary

**Project:** YamBoard — Agency Dashboard (Supabase backend milestone)
**Domain:** Agency / freelance project management dashboard with AI assistant
**Researched:** 2026-03-08
**Confidence:** HIGH

## Executive Summary

YamBoard is a brownfield migration: the Next.js 16 + Tailwind v4 UI shell is fully built and running on mock data. The task is to wire a real Supabase backend underneath it — replacing `mock.ts` imports with authenticated, RLS-secured database queries — while preserving the existing UI entirely. This is NOT a greenfield build; it is a disciplined data layer swap. The recommended approach is incremental migration in 6 sequential steps: infrastructure setup → schema + seed → reads (Server Components) → writes (Server Actions) → file uploads (Storage) → AI context builders. Each step leaves the UI intact and keeps the app functional throughout the migration.

The recommended stack is minimal and additive to what already exists: `@supabase/supabase-js` (^2.98.0) and `@supabase/ssr` (^0.9.0) are the only two packages to install. The `@supabase/ssr` package is the current official solution for cookie-based auth in Next.js App Router, replacing the deprecated `auth-helpers` package. Supabase Auth, Database, and Storage cover all backend needs with no external service dependencies. Supabase Realtime is explicitly not needed — this is a solo-user tool and Server Actions with `revalidatePath()` provide sufficient data freshness after mutations.

The dominant risk is auth security: `getSession()` on the server is a critical vulnerability (cookie spoofing bypass), and the project must establish `getUser()` as the only server-side auth check from the first commit. Secondary risks are RLS misconfiguration (tables locked out due to missing policies), the 1MB Server Action limit blocking PDF uploads, and unbounded AI context growth as real data accumulates. The 3-scope AI context system (agency / client / project) is the core product differentiator and must be designed with token budgets and prompt injection defenses from day one.

---

## Key Findings

### Recommended Stack

The integration layer requires exactly two new packages on top of the existing Next.js 16 + React 19 + Anthropic SDK stack. `@supabase/ssr` handles cookie-based session persistence across Server Components, Server Actions, Route Handlers, and middleware — the four server execution contexts in App Router. `@supabase/supabase-js` is the core SDK it depends on. The deprecated `@supabase/auth-helpers-nextjs` must not be installed.

**Core technologies:**
- `@supabase/supabase-js` ^2.98.0 — base SDK for all DB, Storage, and Auth operations
- `@supabase/ssr` ^0.9.0 — cookie-based auth for App Router; official replacement for `auth-helpers`
- Supabase Auth (email/password) — solo owner login; `inviteUserByEmail` available server-side for future collaborator flow
- Supabase Database (Postgres + RLS) — all relational data behind row-level security from day one
- Supabase Storage (private bucket) — PDF and document uploads via signed URLs; never public buckets
- Supabase Realtime — explicitly skipped; single-user tool with no collaborative state

The two Supabase client files (`lib/supabase/server.ts` and `lib/supabase/client.ts`) plus `middleware.ts` are the complete infrastructure footprint. The browser client is a singleton. The server client is created per-request (request-scoped cookies). Middleware calls `getUser()` on every request to refresh the auth token.

### Expected Features

The UI shell already covers the visual layer for most table-stakes features. What is missing is persistence — every interaction resets on reload.

**Must have (table stakes) — connect mock to real DB:**
- Auth gate — Supabase email/password; redirect to `/login` if no session
- Client CRUD — create, edit, archive, delete, prospect → client conversion
- Project + Product CRUD — create, edit, close, with status tracking
- Billing stages — Devis / Acompte / Avancement / Solde with amounts and paid/pending state
- Document management — upload PDF (Storage), external link, free-text note; attach to project or client level
- Document pinning — project-level doc promoted to client-level permanent context
- Contacts CRUD — name, role, email, phone per client

**Should have (the core differentiator):**
- AI agent with 3-scope context (agency / client / project) backed by real Supabase data — this is the product moat
- Document notes injected into AI context — user-curated signal per document
- Pinned documents propagating to parent client context — ensures brand assets survive across projects
- Agency-level financial summary via AI — "what's outstanding?" answered from real billing data

**Defer (v2+):**
- Collaborator invite (invite flow designed but schema deferred)
- Client portal (client-facing view)
- Billing summary aggregate dashboard
- Document versioning and full-text search
- Time tracking, Gantt, sprint views, integrations (explicitly anti-features for v1)

### Architecture Approach

The migration does not change the UI layer. Every existing component stays `'use client'` and receives data as props. What changes is the data source: page-level Server Components (`app/[clientId]/page.tsx`, `app/[clientId]/[projectId]/page.tsx`) become `async` functions that query Supabase instead of calling mock getters. Server Actions in `lib/actions/*.ts` replace the `useState` mutation handlers and `LocalProjects` / `ProjectOverrides` context providers — which exist only because there was no backend and become dead code after migration. The `/api/chat/route.ts` Route Handler stays unchanged structurally; only `context-builders.ts` goes async.

The migration has a clean 6-step dependency chain:
```
Auth setup → Schema + seed → Reads (Server Components) → Writes (Server Actions) → File upload (Storage) → AI context builders
```

Each step is independently testable and leaves the app functional.

**Major components after migration:**
1. `lib/supabase/server.ts` + `lib/supabase/client.ts` + `middleware.ts` — auth infrastructure, created once
2. Server Component pages (`app/**/page.tsx`) — async data fetch from Supabase, pass typed props to client components
3. `lib/actions/*.ts` — all mutations (clients, projects, documents, products) with `revalidatePath()` after each
4. `lib/context-builders.ts` — async Supabase queries replacing mock arrays; called from `/api/chat/route.ts`
5. Supabase schema — 5 tables (clients, contacts, projects, budget_products, documents) with `owner_id`, RLS, and indexes

**Key architecture decisions:**
- Server Components fetch data; Client Components render it — no Supabase queries in Client Components
- `revalidatePath()` after every Server Action mutation — no Realtime needed
- Signed upload URLs for PDFs — never pipe files through Server Actions (1MB limit)
- Delete `LocalProjects` and `ProjectOverrides` context providers after writes migration
- The "dark swap" technique (env flag `NEXT_PUBLIC_USE_SUPABASE`) is available to toggle between mock and real DB during development without code deploys

### Critical Pitfalls

1. **`getSession()` on the server is a security vulnerability** — Always use `getUser()` in middleware, Server Components, and Route Handlers. `getSession()` reads a cookie without revalidation; it can be spoofed. This must be correct from the first auth commit. No exceptions.

2. **RLS enabled but no policies = silent DENY ALL** — The Supabase default when RLS is on and no policies exist is to block all access. Every `CREATE TABLE` migration must include the corresponding RLS policies in the same file. Test via the Supabase SDK with real auth, not the SQL Editor (which runs as superuser and bypasses RLS).

3. **Missing `WITH CHECK` on INSERT/UPDATE policies** — `USING` alone on an INSERT policy allows any authenticated user to insert rows with arbitrary `owner_id` values. Always pair `WITH CHECK (auth.uid() = owner_id)` with all INSERT and UPDATE policies. Critical for future multi-user safety.

4. **PDF uploads fail silently through Server Actions** — Next.js Server Actions have a ~1MB body limit. PDFs routinely exceed this. Use the signed URL upload pattern: Server Action generates `createSignedUploadUrl()`, client uploads directly to Supabase Storage, Server Action saves the metadata record.

5. **Unbounded AI context growth** — The agency context builder grows linearly with real data. Apply token budgets per scope: agency ≤20K tokens (names + summaries only), client ≤30K, project ≤40K. Never inject raw PDF text — use only document title, type, and human-written note fields. Implement structural XML-tag separation between system instructions and injected data to prevent prompt injection.

---

## Implications for Roadmap

Based on the combined research, the migration has a natural 4-phase structure driven by hard dependencies. Phases 1-3 deliver a fully functional dashboard on real data. Phase 4 activates the core AI differentiator on real data.

### Phase 1: Foundation — Auth + Infrastructure + Schema
**Rationale:** Nothing else can run without auth. RLS policies depend on `auth.uid()`, which requires a logged-in user. Schema must exist before any data can be read or written. This phase has no UI changes — it is pure infrastructure.
**Delivers:** Working Supabase project with auth gate, all 5 tables created with RLS + indexes + policies, seed data migrated from mock, two Supabase client files, middleware, env vars configured.
**Addresses:** Auth (table stakes), RLS security (schema)
**Avoids:** Pitfall 1 (`getSession()` → `getUser()` enforced from day one), Pitfall 3 (RLS + policies in the same migration), Pitfall 5 (`WITH CHECK` on all INSERT/UPDATE), Pitfall 6 (service role key isolation), Pitfall 15 (simple `owner_id` schema, no premature multi-user complexity)
**Research flag:** Standard patterns — no additional research needed. Supabase official docs fully cover this.

### Phase 2: Live Reads — Server Component Data Fetching
**Rationale:** Reads must be migrated before writes. If you migrate writes first, Server Actions have no real data to revalidate against. The "dark swap" env flag makes this safely reversible during development.
**Delivers:** All pages fetching from Supabase. UI looks identical to today but data persists across sessions. `mock.ts` is no longer used for reads. `ClientSidebar` and `GlobalNav` receive real client lists as props.
**Addresses:** Client list, per-client projects, project status, billing state visibility (all table stakes)
**Avoids:** Pitfall 8 (stale cache — `@supabase/ssr` opts out of Next.js cache automatically), Pitfall 16 (introduce DAL functions `lib/data/clients.ts` etc. before migrating, not page-by-page edits)
**Research flag:** Standard patterns — Server Component data fetching is well-documented.

### Phase 3: Live Writes — Server Actions + File Upload
**Rationale:** Once reads are stable, writes can be added. Server Actions replace the `useState` mutation handlers and the `LocalProjects`/`ProjectOverrides` context providers become deletable dead code. File upload is included in this phase because it gates document management, which is a table-stakes feature.
**Delivers:** Full CRUD for clients, projects, products, billing stages. PDF upload to Supabase Storage via signed URLs. Document and contact management. `LocalProjects` and `ProjectOverrides` context providers deleted.
**Addresses:** Client CRUD, Project + Product CRUD, Billing stages, Document management, Document pinning, Contacts (all remaining table stakes)
**Avoids:** Pitfall 4 (RLS indexes already in place from Phase 1), Pitfall 9 (private bucket + signed URLs for all document access), Pitfall 10 (signed upload URL pattern, never pipe file through Server Action), Pitfall 11 (any views get `security_invoker = true`)
**Research flag:** Standard patterns — Server Actions and signed upload URLs are well-documented.

### Phase 4: AI on Real Data — Context Builders Migration
**Rationale:** The AI agent already works with mock data. This phase swaps the context builders to query Supabase, making the 3-scope AI system genuinely useful. This is last because it depends on real data existing in the DB (Phase 2) and real documents being uploadable (Phase 3).
**Delivers:** `buildAgencyContext`, `buildClientContext`, `buildProjectContext` query Supabase asynchronously. AI answers questions about real clients, real billing states, real documents. `mock.ts` deleted entirely.
**Addresses:** AI agent with agency-wide context, AI agent with per-client context, AI agent with per-project context, note injection, document pinning propagation to AI context (all differentiators)
**Avoids:** Pitfall 12 (token budgets per scope enforced in context builders), Pitfall 13 (XML-tag structural separation of data vs. instructions from day one), Pitfall 14 (summary-first pattern — only title + type + note injected, never raw PDF text)
**Research flag:** May benefit from research-phase on AI context design patterns, specifically token budget strategies and summary extraction approaches for PDFs. The prompt injection defense patterns from Anthropic docs are well-documented but the YamBoard-specific scoping mechanism warrants validation.

### Phase Ordering Rationale

- Phase 1 is a hard prerequisite: `auth.uid()` is the foundation of every RLS policy, every Server Action auth check, and every context builder query. You cannot safely skip ahead.
- Phase 2 before Phase 3 because reads establish the data shape that writes must match. Migrating writes first creates a state where Server Actions invalidate cache for pages that still read from mock — a confusing mixed state.
- Phase 3 before Phase 4 because the AI context builders are only valuable once real documents exist. Connecting them to real data before real data can be uploaded produces an empty context, not a useful one.
- The "dark swap" env flag between Phase 2 and Phase 3 allows safe parallel development if needed, but sequential execution is recommended for a solo developer.
- `mock.ts` deletion is the final act of Phase 4, serving as a clean milestone marker.

### Research Flags

Phases with standard patterns (no research-phase needed):
- **Phase 1:** Auth + schema setup is fully documented by official Supabase + Next.js docs. No unknowns.
- **Phase 2:** Server Component data fetching is a well-established App Router pattern.
- **Phase 3:** Server Actions and signed upload URLs are covered by official docs.

Phase that may benefit from deeper research during planning:
- **Phase 4:** Token budget strategies for multi-scope AI context, and PDF content summarization for injection. The architectural pattern is clear but the optimal token limits and summarization approach for YamBoard's specific document types (briefs, brand platforms, deliverables) would benefit from a focused research sprint before implementation.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Both packages verified on npm at specified versions. `@supabase/ssr` confirmed as official replacement via deprecation notice. All code patterns from official Supabase docs. |
| Features | HIGH (core), MEDIUM (AI differentiators) | Table-stakes features verified against multiple freelance PM tools. AI scoped context is an emerging pattern — the YamBoard-specific document-pinning-to-context mechanism has no direct comparison tool to validate against. |
| Architecture | HIGH | Migration pattern from official Supabase Next.js SSR guide. Server Component + Server Action data flow from official Next.js docs. Signed upload URL pattern from official Storage docs. |
| Pitfalls | HIGH | Critical auth pitfalls (`getSession` vulnerability) from official Supabase security docs. RLS policy gaps from official docs. AI pitfalls (prompt injection OWASP #1) from official Anthropic and OWASP sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **PDF content extraction for AI context:** The research recommends against injecting raw PDF text and recommends a `summary` field populated at upload time. The specific approach for generating summaries (lightweight Anthropic call vs. manual entry vs. extraction library) is not resolved. Flag this for Phase 4 planning.

- **Token budget calibration:** Recommended limits (20K/30K/40K per scope) are derived from cost and quality reasoning, not from empirical testing against YamBoard's actual document types. These should be validated in Phase 4 against real data before locking in.

- **`owner_id` vs `created_by` naming:** STACK.md and ARCHITECTURE.md use `owner_id` consistently. PITFALLS.md uses `created_by` in one section. Standardize on `owner_id` across all tables and all documentation before schema migration to avoid column naming inconsistency.

- **Slug column usage:** The `clients` schema includes a `slug` text field (unique, human-readable). The current App Router uses `[clientId]` as the URL param. Clarify during Phase 1 whether routes use UUID or slug — this affects all `<Link>` components and all Server Action paths.

---

## Sources

### Primary (HIGH confidence)
- [Setting up Server-Side Auth for Next.js — Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Creating a Supabase client for SSR — Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Row Level Security — Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Performance and Best Practices — Supabase Docs](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Storage Access Control — Supabase Docs](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage uploadToSignedUrl — Supabase JS Reference](https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [OWASP LLM Top 10 2025: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [Anthropic: Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

### Secondary (MEDIUM confidence)
- [auth.admin.inviteUserByEmail — Supabase JS Reference](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — future collaborator invite flow design
- [Signed URL file uploads with Next.js and Supabase — community](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0)
- [GitHub Discussion: Multiple GoTrueClient Instances](https://github.com/orgs/supabase/discussions/37755) — browser client singleton pattern
- [Bonsai vs HoneyBook comparison — ManyRequests 2026](https://www.manyrequests.com/blog/bonsai-vs-honeybook) — competitive feature analysis
- [AI in project management — Epicflow 2026](https://www.epicflow.com/blog/ai-agents-for-project-management/) — AI feature viability

### Tertiary (LOW confidence — inferred/emerging)
- Context engineering for scoped agents — YamBoard-specific 3-scope design; no direct tool comparison available
- Token budget limits (20K/30K/40K) — derived from cost reasoning; needs empirical validation against real YamBoard data

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
