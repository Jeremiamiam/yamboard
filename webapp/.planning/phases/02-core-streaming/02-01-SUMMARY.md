---
phase: 02-core-streaming
plan: 01
subsystem: infra
tags: [anthropic-sdk, react-markdown, tailwindcss-typography, supabase, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: Supabase project with projects table and RLS setup
provides:
  - "@anthropic-ai/sdk installed for streaming API route"
  - "react-markdown and remark-gfm installed for markdown rendering"
  - "@tailwindcss/typography registered via @plugin in globals.css (Tailwind v4)"
  - "src/lib/supabase/messages.ts with loadMessages() and persistMessage() helpers"
  - "Supabase messages table SQL migration ready to run"
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added:
    - "@anthropic-ai/sdk ^0.78.0 — Anthropic streaming API client"
    - "react-markdown ^10.1.0 — Markdown rendering in React"
    - "remark-gfm ^4.0.1 — GitHub Flavored Markdown support"
    - "@tailwindcss/typography ^0.5.19 — Prose styling plugin"
  patterns:
    - "Tailwind v4 plugin syntax: @plugin directive in globals.css (not plugins[] in config)"
    - "Generic SupabaseClient from @supabase/supabase-js (not @supabase/ssr) for DB helpers — works with both browser and server clients"

key-files:
  created:
    - src/lib/supabase/messages.ts
  modified:
    - package.json
    - src/app/globals.css

key-decisions:
  - "SupabaseClient import from @supabase/supabase-js (generic) not @supabase/ssr — allows same helpers to work in both client and server contexts"
  - "Tailwind v4 @plugin syntax instead of v3 plugins[] array — globals.css is the config surface"

patterns-established:
  - "DB helper pattern: inject SupabaseClient as parameter rather than creating inside function — enables reuse across browser/server"

requirements-completed: [CHAT-06]

# Metrics
duration: 1min
completed: 2026-02-25
---

# Phase 2 Plan 01: Infrastructure Setup Summary

**Anthropic SDK, react-markdown, and @tailwindcss/typography installed; messages DB helpers (loadMessages + persistMessage) created for Supabase chat history persistence**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-25T21:17:02Z
- **Completed:** 2026-02-25T21:18:07Z
- **Tasks:** 2
- **Files modified:** 3 (package.json, globals.css, messages.ts)

## Accomplishments
- Installed 4 npm packages: @anthropic-ai/sdk, react-markdown, remark-gfm, @tailwindcss/typography
- Registered typography plugin in globals.css using Tailwind v4 `@plugin` syntax
- Created `src/lib/supabase/messages.ts` with `Message` type + two exported helpers
- TypeScript compilation passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install npm packages + register Tailwind typography plugin** - `14e8060` (feat)
2. **Task 2: Implement DB helpers for message persistence** - `33b8657` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `package.json` - Added @anthropic-ai/sdk, react-markdown, remark-gfm as dependencies; @tailwindcss/typography as devDependency
- `src/app/globals.css` - Added `@plugin "@tailwindcss/typography";` after `@import "tailwindcss";`
- `src/lib/supabase/messages.ts` - Message type + loadMessages() + persistMessage() using generic SupabaseClient

## Decisions Made
- Used `SupabaseClient` from `@supabase/supabase-js` (not `@supabase/ssr`) for the messages helpers — the generic type works with both browser and server Supabase clients, enabling the same functions to be called from client-side (user messages) and server-side (assistant messages)
- Tailwind v4 `@plugin` directive in globals.css rather than `plugins[]` array in config — this is the correct v4 syntax

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**The Supabase `messages` table must be created manually.** Run the following SQL in the Supabase Dashboard SQL Editor (Project: getBrandon):

```sql
-- Create messages table for chat history persistence
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  workflow_slug text default null,
  created_at timestamptz not null default now()
);

-- Index for fast history retrieval ordered by time
create index if not exists messages_project_id_created_at
  on messages(project_id, created_at asc);

-- RLS: same policy as projects — all authenticated users can manage messages
alter table messages enable row level security;

create policy "authenticated users can manage messages"
  on messages for all
  using (auth.role() = 'authenticated');
```

After running, verify in Dashboard → Table Editor: `messages` table exists with columns (id, project_id, role, content, **workflow_slug**, created_at) and RLS enabled.

> **Note (Phase 3 post-checkpoint):** `workflow_slug` was added to scope chat history per workflow. If the table was created without this column, run: `ALTER TABLE messages ADD COLUMN workflow_slug text DEFAULT NULL;`

## Next Phase Readiness
- @anthropic-ai/sdk ready for import in Plan 02-02 (streaming route handler)
- `loadMessages`/`persistMessage` available for import in Plans 02-02 and 02-04
- Typography plugin registered for markdown rendering in Plan 02-04
- Supabase messages table SQL is ready to run — must be executed before Plans 02-02 through 02-04 can persist messages

---
*Phase: 02-core-streaming*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: src/lib/supabase/messages.ts
- FOUND: .planning/phases/02-core-streaming/02-01-SUMMARY.md
- FOUND: commit 14e8060 (Task 1)
- FOUND: commit 33b8657 (Task 2)
- FOUND: commit 82b56a4 (docs/metadata)
