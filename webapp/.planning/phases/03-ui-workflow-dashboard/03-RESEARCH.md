# Phase 3: UI Workflow + Dashboard — Research

**Researched:** 2026-02-25
**Domain:** Workflow selection UI, per-workflow system prompts, workflow state management, Next.js App Router Server Actions
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WF-01 | Utilisateur peut lancer le workflow `/start` depuis un projet | WorkflowLauncher component with launch button per workflow; `/start` sends command to existing /api/chat route with workflow-specific system prompt |
| WF-02 | Utilisateur peut lancer `/platform` si `/start` est complété | `workflow_states` table already tracks status; button disabled/locked when status !== "available"; unlock after `/start` completion |
| WF-03 | Utilisateur peut lancer `/campaign` si `/platform` est complété | Same pattern as WF-02 — sequential dependency in the main brand chain |
| WF-04 | Utilisateur peut lancer `/site-standalone` indépendamment | Already initialized as "available" in `projects.ts` INITIAL_WORKFLOW_STATES; independent launch button always enabled at project start |
| WF-05 | Utilisateur peut lancer `/wireframe` si `/site-standalone` est complété | Same dependency pattern but on the standalone chain |
| WF-06 | Les workflows non disponibles sont visuellement désactivés | CSS disabled state on buttons + locked badge already exists in WorkflowStatusList; extend to interactive version |
</phase_requirements>

---

## Summary

Phase 3 transforms the existing static `WorkflowStatusList` component into an interactive workflow launcher, and wires each workflow to a dedicated Anthropic system prompt. The key technical pieces are already in place from Phases 1 and 2: the `workflow_states` table tracks status per project, the `/api/chat` route streams Anthropic responses, and the `ChatInterface` renders the conversation. Phase 3 adds the layer that (a) lets users launch specific workflows from the project page, (b) routes each workflow to the correct system prompt, and (c) marks a workflow as completed when done — unlocking its successor.

The central architectural decision is **how workflow completion is signaled**: the GBD workflows end with a specific "success" message pattern (e.g., `GBD ► CONTRE-BRIEF CRÉÉ`). The recommended approach is a Server Action (`markWorkflowComplete`) called explicitly by the user via a "Mark as complete" button after they confirm the output is ready. This avoids fragile heuristic parsing of the assistant's final message and keeps the state machine explicit and predictable.

The `/api/chat` route needs a `workflowSlug` parameter so it can select the correct system prompt per workflow. The workflow-specific system prompts are already written in the GBD SOURCES (`SOURCES/workflows/*.md`). They should be inlined into the Next.js route as constants — not read from disk at runtime — to avoid filesystem access issues in the Vercel serverless environment.

**Primary recommendation:** Use a `WorkflowLauncher` client component that (1) selects the workflow, (2) navigates to `/projects/[id]/chat?workflow=[slug]`, (3) the chat page reads `?workflow` from searchParams and passes it to `ChatInterface`, which pre-fills the first message and passes `workflowSlug` in the API body. Completion is triggered by a Server Action called from the chat UI.

---

## Standard Stack

### Core (already installed — no new packages required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Server Actions for workflow state updates | Same pattern as `createProject`, `deleteProject` — proven in Phase 1 |
| Supabase JS | ^2.97.0 | Update `workflow_states.status` | Already used for all DB operations |
| React | 19.2.3 | Client component for workflow selector UI | Already used throughout |
| Tailwind CSS v4 | ^4 | Disabled/locked visual states | Already configured |

### Supporting (no new packages)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js `useRouter` / `useSearchParams` | built-in | Pass workflow selection via URL searchParams | Chat page needs to know which workflow launched |
| Next.js `revalidatePath` | built-in | Invalidate project page after workflow state change | Same pattern as `createProject` uses `revalidatePath("/dashboard")` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL searchParams for workflow selection | React state / Context | URL is more resilient — survives page reload, allows deep-linking to a specific workflow chat |
| Explicit "mark complete" button | Auto-detect from assistant message content | Heuristic detection is fragile; explicit button is predictable and user-controlled |
| Inline system prompt constants | Read from `SOURCES/workflows/*.md` at runtime | Filesystem reads are unreliable in Vercel serverless; constants in source code are reliable |

**Installation:** No new packages required for Phase 3.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── actions/
│   └── workflows.ts          # markWorkflowComplete(projectId, slug) Server Action
├── app/
│   └── projects/[id]/
│       ├── page.tsx           # Extended: WorkflowLauncher replaces WorkflowStatusList
│       └── chat/
│           └── page.tsx       # Extended: reads ?workflow searchParam, passes to ChatInterface
├── components/
│   ├── workflow-launcher.tsx  # NEW: 'use client' — interactive workflow list with launch buttons
│   └── chat-interface.tsx     # MODIFIED: accepts workflowSlug prop, sends it in API body
└── lib/
    └── workflows/
        └── system-prompts.ts  # NEW: per-workflow system prompt constants + WORKFLOW_GRAPH
```

### Pattern 1: Workflow Selection via URL searchParams

**What:** User clicks "Lancer" on a workflow in the project page. The `WorkflowLauncher` client component uses `router.push(/projects/${id}/chat?workflow=${slug})`. The chat page reads `searchParams.workflow` (string) and passes it to `ChatInterface`. `ChatInterface` uses the slug to pre-fill the first message and passes `workflowSlug` to the API.

**When to use:** When the workflow selection must survive navigation and be linkable.

**Example:**

```typescript
// src/components/workflow-launcher.tsx
"use client"
import { useRouter } from "next/navigation"

export function WorkflowLauncher({ projectId, workflowStates }) {
  const router = useRouter()

  const handleLaunch = (slug: string) => {
    router.push(`/projects/${projectId}/chat?workflow=${slug}`)
  }

  return (
    <ul>
      {WORKFLOW_ORDER.map((slug) => {
        const state = stateMap[slug]
        const isAvailable = state?.status === "available"
        const isCompleted = state?.status === "completed"
        return (
          <li key={slug}>
            <span>{WORKFLOW_LABELS[slug]}</span>
            <StatusBadge status={state?.status} />
            {isAvailable && (
              <button onClick={() => handleLaunch(slug)}>Lancer</button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
```

### Pattern 2: Per-Workflow System Prompts

**What:** The `/api/chat` route accepts `workflowSlug` in the request body. A lookup map selects the correct system prompt constant. Falls back to the generic GBD prompt if slug is absent.

**When to use:** Every workflow has a distinct operational mode — `/start` runs brand strategy, `/platform` expands the contre-brief, `/campaign` generates creative concepts, etc. Each needs its own system prompt.

**Example:**

```typescript
// src/lib/workflows/system-prompts.ts
export const WORKFLOW_SYSTEM_PROMPTS: Record<string, string> = {
  "start": `Tu es Brandon, un stratège de marque senior...
  [full start.md workflow instructions]`,

  "platform": `Tu es Brandon, expert en plateformes de marque...
  [full platform.md workflow instructions]`,

  "campaign": `Tu es Brandon, directeur de la stratégie créative...
  [full campaign.md workflow instructions]`,

  "site-standalone": `Tu es Brandon, directeur de projet digital...
  [full standalone.md workflow instructions]`,

  "wireframe": `Tu es Brandon, expert en architecture de l'information...
  [full wireframe.md workflow instructions]`,
}

export const GBD_GENERIC_PROMPT = `Tu es Brandon...` // Phase 2 generic prompt

// Workflow dependency graph — drives unlock logic
export const WORKFLOW_DEPENDENCIES: Record<string, string | null> = {
  "start": null,           // no dependency
  "platform": "start",     // requires start completed
  "campaign": "platform",  // requires platform completed
  "site-standalone": null, // independent
  "site": "site-standalone",
  "wireframe": "site-standalone",
}
```

### Pattern 3: Workflow Completion Server Action

**What:** A Server Action `markWorkflowComplete(projectId, slug)` that (1) sets current workflow to `completed`, (2) reads the dependency graph to find which workflow to unlock, (3) sets that workflow to `available`, (4) calls `revalidatePath`.

**When to use:** Called from a "Marquer comme terminé" button inside `ChatInterface` after the user confirms the workflow output is ready. This button only appears when a `workflowSlug` is present and streaming is not in progress.

**Example:**

```typescript
// src/actions/workflows.ts
"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { WORKFLOW_DEPENDENCIES } from "@/lib/workflows/system-prompts"

// Which workflow does completing slug unlock?
const WORKFLOW_UNLOCKS: Record<string, string | null> = {
  "start": "platform",
  "platform": "campaign",
  "campaign": null,
  "site-standalone": "wireframe",
  "site": null,
  "wireframe": null,
}

export async function markWorkflowComplete(projectId: string, slug: string) {
  const supabase = await createClient()

  // Mark current workflow completed
  await supabase
    .from("workflow_states")
    .update({ status: "completed" })
    .eq("project_id", projectId)
    .eq("workflow_slug", slug)

  // Unlock next workflow in chain
  const nextSlug = WORKFLOW_UNLOCKS[slug]
  if (nextSlug) {
    await supabase
      .from("workflow_states")
      .update({ status: "available" })
      .eq("project_id", projectId)
      .eq("workflow_slug", nextSlug)
  }

  revalidatePath(`/projects/${projectId}`)
}
```

### Pattern 4: ChatInterface with Workflow Awareness

**What:** `ChatInterface` receives an optional `workflowSlug` prop. When present, it passes the slug in every API call body. The `/api/chat` route uses the slug to select the system prompt. Additionally, when a workflow slug is present and the conversation has at least one message, a "Marquer comme terminé" button appears (only enabled when not streaming).

**Example:**

```typescript
// src/components/chat-interface.tsx (extended)
interface ChatInterfaceProps {
  projectId: string
  projectName: string
  workflowSlug?: string    // NEW
}

// In API call:
body: JSON.stringify({ projectId, message: userMessage, history, workflowSlug })

// New UI element (after input form):
{workflowSlug && messages.length > 0 && (
  <form action={markWorkflowComplete.bind(null, projectId, workflowSlug)}>
    <button type="submit" disabled={isStreaming}>
      ✓ Marquer comme terminé
    </button>
  </form>
)}
```

### Anti-Patterns to Avoid

- **Auto-detecting workflow completion from assistant message content:** Heuristic text matching (e.g., looking for `GBD ► CONTRE-BRIEF CRÉÉ`) is fragile. The agent may not produce exactly that string in all cases, and the user should control when a workflow is "done."
- **Reading workflow system prompts from `SOURCES/` at runtime:** The `SOURCES/` directory is outside the Next.js `src/` tree. Vercel's serverless build does not bundle arbitrary files outside the project root. Inline the prompts as TypeScript string constants.
- **Passing full system prompt via client:** Never send the system prompt from the client. The `workflowSlug` travels from client → API route, and the route selects the prompt server-side. Security: prompts stay server-side.
- **Using `router.refresh()` instead of `revalidatePath`:** In Server Actions, use `revalidatePath` to invalidate cached pages. `router.refresh()` is for client-side cache invalidation after navigation. The `markWorkflowComplete` Server Action should use `revalidatePath`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Workflow state machine | Custom state management / Zustand store | Supabase `workflow_states` table as source of truth | Already exists, RLS protected, reflects DB state across sessions/users |
| Disabled button styling | Custom CSS classes per state | Tailwind `disabled:` and `opacity-50 cursor-not-allowed` variants | Already used on chat input button in Phase 2 |
| Form submission for Server Action | `fetch()` POST to an API route | `<form action={serverAction.bind(null, args)}>` | Same pattern as `signOut` and `deleteProject` in Phase 1 — works without JS, consistent |
| Workflow order enforcement | Sorting algorithm | `WORKFLOW_ORDER` constant (already in `workflow-status-list.tsx`) | Already defined, move to shared `system-prompts.ts` or `workflows.ts` constants file |

**Key insight:** The `workflow_states` table in Supabase is already the state machine. Phase 3 only needs to update rows in it — no client-side state machine needed.

---

## Common Pitfalls

### Pitfall 1: Next.js 16 searchParams are async

**What goes wrong:** `searchParams.workflow` accessed synchronously in a page Server Component throws a build warning or runtime error in Next.js 16, where `searchParams` is a Promise.

**Why it happens:** Next.js 16 (same as params) makes `searchParams` a Promise that must be awaited.

**How to avoid:** In `chat/page.tsx`, await searchParams:
```typescript
export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ workflow?: string }>
}) {
  const { id } = await params
  const { workflow } = await searchParams
  // ...
}
```

**Warning signs:** TypeScript type for `searchParams` shows it as `Promise<...>`, not a plain object.

### Pitfall 2: Form action Server Action binding with multiple arguments

**What goes wrong:** `markWorkflowComplete.bind(null, projectId, workflowSlug)` fails if `markWorkflowComplete` signature starts with `FormData` as the first argument (Next.js injects FormData as the first argument when using `form action={}`).

**Why it happens:** When binding args to a Server Action used as a form action, the unbound arguments come BEFORE the FormData argument that Next.js injects.

**How to avoid:** Define the Server Action signature as:
```typescript
// bind(null, projectId, slug) → function receives (projectId, slug, formData)
export async function markWorkflowComplete(projectId: string, slug: string, _formData: FormData) {
  // ...
}
```
The `_formData` argument is injected last by Next.js; the bound args come first. Consistent with `deleteProject.bind(null, id)` pattern from Phase 1.

**Warning signs:** Server Action receives `undefined` for `projectId` or `slug` despite binding.

### Pitfall 3: workflowSlug in useChatStream vs ChatInterface

**What goes wrong:** Passing `workflowSlug` directly to `useChatStream` hook and including it in the `historySnapshot` or reconnect logic — causing the slug to be lost on reconnection.

**Why it happens:** The hook's reconnect mechanism calls `reloadHistory()` which loads from DB, not from props. The slug is a UI concern, not a history concern.

**How to avoid:** Pass `workflowSlug` only to the `sendMessage` call (or include it in the body via a ref in `useChatStream`). Keep the hook's internal state clean of workflow concerns. Either:
- Add `workflowSlug` as a parameter to `useChatStream(projectId, workflowSlug?)` and include it in every `fetch` body inside `attemptStream`
- Or keep the hook unchanged and pass `workflowSlug` via ChatInterface directly in the POST body before calling `sendMessage`

Recommended: Add `workflowSlug?: string` to `useChatStream` params — cleanest single responsibility.

### Pitfall 4: Race condition between markWorkflowComplete and page revalidation

**What goes wrong:** User clicks "Marquer comme terminé", the Server Action runs, `revalidatePath` fires, but the user is still on the chat page — the project page doesn't visually update until they navigate back.

**Why it happens:** `revalidatePath("/projects/[id]")` invalidates the Next.js cache for that path, but the user is on `/projects/[id]/chat` — they won't see the update until they navigate to `/projects/[id]`.

**How to avoid:** This is actually correct behavior. The project page will be fresh when the user navigates back (link in chat header → project page). Optionally, also call `router.push(/projects/${projectId})` in a client component wrapper after the Server Action completes, to redirect the user back to the project page automatically. Use `useTransition` and `startTransition` to handle this without blocking.

### Pitfall 5: System prompt size in API body

**What goes wrong:** Some GBD workflow system prompts are very long (start.md is ~430 lines). Including the full prompt in `max_tokens` counting matters — the prompt reduces available tokens for the conversation.

**Why it happens:** Anthropic counts system prompt tokens against the model's context window. With `max_tokens: 8192` for output and a large system prompt, there's less room for the conversation history.

**How to avoid:** Keep `max_tokens: 8192` as set in Phase 2 (this is the output limit, not the context limit). The claude-sonnet-4-6 model has a 200K token context window — system prompt length is not a practical concern here. Just inline the prompts as string constants.

---

## Code Examples

### Workflow Dependency Graph (verified from SOURCES/workflows/*.md)

```typescript
// Source: SOURCES/workflows/start.md, platform.md, campaign.md, standalone.md, wireframe.md
// Verified dependency chain from workflow "next step" confirmations:
// start.md → "▶ Prochaine étape: /gbd_platform"
// platform.md → "▶ Prochaine étape: /gbd_brandbook" (site chain handled separately)
// standalone.md → "▶ Prochaine étape: /gbd:wireframe"
// campaign.md → "▶ Prochaine étape: /gbd_site"

export const WORKFLOW_UNLOCKS: Record<string, string | null> = {
  "start":           "platform",
  "platform":        "campaign",
  "campaign":        null,           // end of main chain (site is a separate Phase 4+ concern)
  "site-standalone": "wireframe",
  "site":            null,
  "wireframe":       null,
}

// Already defined in workflow-status-list.tsx — move to shared constants
export const WORKFLOW_ORDER = ["start", "platform", "campaign", "site-standalone", "site", "wireframe"]
```

### Next.js 16 searchParams pattern

```typescript
// Source: Next.js 16 docs (same pattern as params — both are Promises in Next 16)
// Consistent with existing chat/page.tsx which already awaits params

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ workflow?: string }>
}) {
  const { id } = await params
  const { workflow: workflowSlug } = await searchParams
  // workflowSlug is string | undefined
}
```

### API route extension (minimal change to existing route.ts)

```typescript
// src/app/api/chat/route.ts — add workflowSlug extraction and prompt selection
import { WORKFLOW_SYSTEM_PROMPTS, GBD_GENERIC_PROMPT } from "@/lib/workflows/system-prompts"

// In POST handler, extract workflowSlug from body:
const { projectId, message, history, workflowSlug } = await request.json()

// Select system prompt:
const systemPrompt = (workflowSlug && WORKFLOW_SYSTEM_PROMPTS[workflowSlug])
  ? WORKFLOW_SYSTEM_PROMPTS[workflowSlug]
  : GBD_GENERIC_PROMPT

// Use systemPrompt in anthropic.messages.stream({ system: systemPrompt, ... })
```

---

## What Exists vs What Phase 3 Builds

### Already Built (do not rebuild)

| Component | File | What It Does |
|-----------|------|--------------|
| `WorkflowStatusList` | `src/components/workflow-status-list.tsx` | Read-only list with status badges — REUSE the `StatusBadge` sub-component |
| `workflow_states` table | Supabase DB | Already tracks status per workflow per project |
| `INITIAL_WORKFLOW_STATES` | `src/actions/projects.ts` | Sets start + site-standalone as available on project creation |
| `WORKFLOW_ORDER` constant | `workflow-status-list.tsx` | Defines display order — move to shared constants |
| Chat route + streaming | `src/app/api/chat/route.ts` | Extend with `workflowSlug` param |
| `ChatInterface` | `src/components/chat-interface.tsx` | Extend with `workflowSlug` prop + completion button |
| `useChatStream` | `src/hooks/use-chat-stream.ts` | Extend with optional `workflowSlug` parameter |

### New in Phase 3

| Component | File | Purpose |
|-----------|------|---------|
| `WorkflowLauncher` | `src/components/workflow-launcher.tsx` | Interactive version of `WorkflowStatusList` with launch buttons |
| `markWorkflowComplete` | `src/actions/workflows.ts` | Server Action: mark completed + unlock next |
| System prompts | `src/lib/workflows/system-prompts.ts` | Per-workflow Anthropic system prompt constants + dependency graph |

---

## GBD Workflow Characteristics (from SOURCES/)

Understanding each workflow's nature is critical for system prompt design:

| Workflow slug | Source file | Nature | Output artifact |
|--------------|------------|--------|-----------------|
| `start` | `workflows/start.md` | Multi-step dialogue — reads client dossier, proposes angles, co-constructs 5 strategic zones | CONTRE-BRIEF.json |
| `platform` | `workflows/platform.md` | Expands CONTRE-BRIEF into 10-page brand platform | PLATFORM.json |
| `campaign` | `workflows/campaign.md` | Generates creative campaign concept from PLATFORM.json | CAMPAIGN.json |
| `site-standalone` | `workflows/standalone.md` | Site brief from scratch (no brand platform required) | STANDALONE-BRIEF.json |
| `wireframe` | `workflows/wireframe.md` | HTML wireframe from STANDALONE-BRIEF.json | STANDALONE-WIREFRAME.html |

Key observation: **All GBD workflows are conversational** — they require multiple back-and-forth exchanges. None are single-shot. The `/api/chat` route already handles multi-turn conversation via `history` parameter. System prompts must instruct Claude to follow the workflow steps while maintaining the conversational format.

Important: In the web context, workflows don't write files to disk. The "file outputs" are artifacts of the CLI. In the webapp, the conversation IS the workflow. Phase 3 does not handle output extraction (that's Phase 4). The workflow is "complete" when the agent has produced the final output (CONTRE-BRIEF content, PLATFORM content, etc.) in the chat.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `workflow_states` update via API route | Server Action `markWorkflowComplete` | Phase 3 | Consistent with Phase 1 pattern (deleteProject, createProject) — no extra API route needed |
| Generic system prompt for all workflows | Per-workflow system prompt selected by slug | Phase 3 | Each workflow gets its full operational context |

---

## Open Questions

1. **Should system prompts inline the full SOURCES/workflows/*.md content?**
   - What we know: The workflow files are 100-400+ lines each. Inlining all 5 into TypeScript constants is verbose but reliable.
   - What's unclear: Whether the prompts need simplification for the web context (they reference CLI file paths like `clients/[client]/inputs/` which don't apply in the webapp).
   - Recommendation: Inline the workflow logic sections but adapt/remove the file system references. The web agent doesn't create files — it produces artifacts in the chat conversation.

2. **Does the `site` workflow (as distinct from `site-standalone`) need a launcher in Phase 3?**
   - What we know: REQUIREMENTS.md lists WF-01 through WF-06 which reference `/start`, `/platform`, `/campaign`, `/site-standalone`, `/wireframe`. The `/site` workflow (generates site from PLATFORM + CAMPAIGN) is in `WORKFLOW_ORDER` and `INITIAL_WORKFLOW_STATES` but NOT in the requirements.
   - What's unclear: Whether `/site` is in scope for Phase 3 or later.
   - Recommendation: Include `/site` in `WorkflowLauncher` with locked state (matching the existing locked state in DB), but don't add a system prompt for it in Phase 3. Its unlock logic (`campaign` → `site`) can be wired now even if the system prompt is deferred.

3. **Pre-filling the first message in chat**
   - What we know: When a user launches `/start`, the chat opens. In the GBD CLI, the user types `/gbd_start [client-name] --ready`. In the webapp, the "message" to send is implicit.
   - What's unclear: Should the UI auto-send an initial message, or just pre-fill the input?
   - Recommendation: Pre-fill the input with the workflow launch command (e.g., for `/start`: send a message like "Lance le workflow /start pour le projet [projectName]") and let the user send it. This keeps the user in control and avoids a confusing "message appeared before I typed anything" experience. Alternative: auto-send silently on first load.

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection — `src/components/workflow-status-list.tsx`, `src/actions/projects.ts`, `src/app/api/chat/route.ts`, `src/hooks/use-chat-stream.ts`, `src/components/chat-interface.tsx` — verified existing architecture and patterns
- `/Users/jeremyhervo/Agence Yam Dropbox/Yambox/_IA/getBrandon/SOURCES/workflows/start.md` — verified workflow steps, output artifacts, dependency signals
- `/Users/jeremyhervo/Agence Yam Dropbox/Yambox/_IA/getBrandon/SOURCES/workflows/platform.md` — verified /platform depends on /start
- `/Users/jeremyhervo/Agence Yam Dropbox/Yambox/_IA/getBrandon/SOURCES/workflows/campaign.md` — verified /campaign depends on /platform
- `/Users/jeremyhervo/Agence Yam Dropbox/Yambox/_IA/getBrandon/SOURCES/workflows/standalone.md` — verified /site-standalone is independent
- `.planning/STATE.md` — verified Phase 1 patterns: `deleteProject.bind(null, id)` form action, `revalidatePath`, `router.refresh()` usage
- `.planning/REQUIREMENTS.md` — confirmed WF-01 through WF-06 scope

### Secondary (MEDIUM confidence)

- Next.js 16 searchParams as Promise pattern — inferred from existing `params: Promise<{ id: string }>` pattern already used in `chat/page.tsx` (same API design applies to searchParams in Next.js 16)

### Tertiary (LOW confidence)

- None — all findings verified from codebase or primary source files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all patterns from existing Phase 1 + 2 code
- Architecture: HIGH — patterns directly derived from codebase inspection and GBD workflow sources
- Pitfalls: HIGH for items 1-3 (derived from known Next.js 16 behavior and existing code patterns), MEDIUM for items 4-5 (behavior reasoning, not empirically tested)
- GBD workflow characteristics: HIGH — read directly from SOURCES/workflows/*.md

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable stack — no fast-moving dependencies)
