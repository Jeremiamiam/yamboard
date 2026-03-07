---
phase: 03-ui-workflow-dashboard
verified: 2026-02-25T23:30:00Z
status: human_needed
score: 13/13 automated checks verified
re_verification: false
human_verification:
  - test: "Lancer button navigates to correct URL and chat shows workflow-specific subtitle"
    expected: "Clicking Lancer on /start navigates to /projects/[id]/chat?workflow=start and header shows 'Workflow start'"
    why_human: "URL navigation and rendered text cannot be verified by static code analysis"
  - test: "Agent responds with workflow-appropriate system prompt (not generic GBD)"
    expected: "After launching /start and sending a message, agent introduces itself as brand strategy expert and asks for client brief"
    why_human: "Requires live Anthropic API call to verify prompt routing at runtime"
  - test: "Marquer comme terminé button updates Supabase and unlocks next workflow"
    expected: "After clicking the button in /start chat, project page shows /start as 'Complété' and /platform as 'Disponible' with Lancer button"
    why_human: "Requires live Supabase DB writes and Next.js revalidation to observe UI change"
  - test: "Workflow chat history is scoped — /start and /platform show separate messages"
    expected: "After chatting in /start then opening /platform, /platform shows empty history (not /start messages)"
    why_human: "Requires multiple browser sessions and DB state observation"
  - test: "Locked workflows show 🔒 Bloqué with no Lancer button (WF-06)"
    expected: "On a fresh project, /platform, /campaign, /wireframe show locked badge only — no blue Lancer button"
    why_human: "Requires visual confirmation of rendered UI state"
---

# Phase 3: UI Workflow + Dashboard Verification Report

**Phase Goal:** L'utilisateur peut sélectionner et lancer n'importe quel workflow depuis l'interface, avec feedback visuel sur les dépendances
**Verified:** 2026-02-25T23:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Utilisateur peut lancer le workflow /start depuis un projet | ? NEEDS HUMAN | WorkflowLauncher wires Lancer button → router.push → chat?workflow=start. Runtime confirmation needed. |
| 2 | /platform, /campaign, /wireframe visuellement désactivés tant que prérequis non complétés | ? NEEDS HUMAN | StatusBadge renders "🔒 Bloqué" when status==="locked"; Lancer button only rendered when status==="available". Visual confirmation needed. |
| 3 | Utilisateur peut lancer /site-standalone indépendamment | ? NEEDS HUMAN | WORKFLOW_ORDER includes "site-standalone"; no dependency on "start" in WORKFLOW_UNLOCKS. Runtime confirmation needed. |
| 4 | Completing /start unlocks /platform | ? NEEDS HUMAN | markWorkflowComplete reads WORKFLOW_UNLOCKS["start"]="platform", updates status to "available", revalidates path. Requires live DB verification. |

All 4 truths have complete automated implementation evidence. Human browser confirmation is required per the original plan (03-04 is a human-verify checkpoint).

**Automated Score:** 13/13 artifact and wiring checks passed

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/lib/workflows/system-prompts.ts` | VERIFIED | Exists, 186 lines, exports WORKFLOW_ORDER (6 slugs), WORKFLOW_LABELS, WORKFLOW_UNLOCKS, GBD_GENERIC_PROMPT, WORKFLOW_SYSTEM_PROMPTS (5 full workflow prompts — each >500 chars, substantive operational instructions) |
| `src/app/api/chat/route.ts` | VERIFIED | Imports WORKFLOW_SYSTEM_PROMPTS + GBD_GENERIC_PROMPT; extracts workflowSlug from body; selects systemPrompt via lookup with fallback |
| `src/components/workflow-launcher.tsx` | VERIFIED | 'use client', exports WorkflowLauncher, imports WORKFLOW_ORDER + WORKFLOW_LABELS, StatusBadge sub-component, Lancer button conditional on status==="available", router.push with ?workflow= |
| `src/app/projects/[id]/page.tsx` | VERIFIED | Imports WorkflowLauncher (not WorkflowStatusList), passes projectId + workflowStates props, no "Ouvrir le chat" generic link, no Phase 3 placeholder text |
| `src/actions/workflows.ts` | VERIFIED | "use server", exports markWorkflowComplete(projectId, slug, _formData), WORKFLOW_UNLOCKS lookup, revalidatePath + redirect to project page |
| `src/hooks/use-chat-stream.ts` | VERIFIED | useChatStream(projectId, workflowSlug?), workflowSlug included in fetch POST body, included in useCallback dep array, passed to loadMessages for history scoping |
| `src/components/chat-interface.tsx` | VERIFIED | workflowSlug? prop, passes to useChatStream(projectId, workflowSlug), dynamic subtitle "Workflow {slug}", completion button visible when workflowSlug && messages.length > 0, button disabled while isStreaming |
| `src/app/projects/[id]/chat/page.tsx` | VERIFIED | searchParams typed as Promise<{workflow?: string}>, awaited, workflowSlug passed to ChatInterface |
| `src/lib/supabase/messages.ts` | VERIFIED | loadMessages filters by workflow_slug (or IS NULL for generic), persistMessage writes workflow_slug column — chat history scoped per workflow |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `workflow-launcher.tsx` | `/projects/[id]/chat?workflow=[slug]` | `router.push` on Lancer button | WIRED | Line 42: `router.push(\`/projects/${projectId}/chat?workflow=${slug}\`)` — confirmed |
| `projects/[id]/page.tsx` | `workflow-launcher.tsx` | WorkflowLauncher component render | WIRED | Line 2 import + line 50 render with projectId + workflowStates props |
| `chat/page.tsx` | `chat-interface.tsx` | workflowSlug prop from searchParams | WIRED | Lines 12-13: `await searchParams`, line 36: `workflowSlug={workflowSlug}` |
| `chat-interface.tsx` | `use-chat-stream.ts` | `useChatStream(projectId, workflowSlug)` | WIRED | Line 29: `useChatStream(projectId, workflowSlug)` — slug forwarded |
| `use-chat-stream.ts` | `/api/chat` | workflowSlug in POST body | WIRED | Line 43: `body: JSON.stringify({ projectId, message: userMessage, history, workflowSlug })` |
| `api/chat/route.ts` | `system-prompts.ts` | `WORKFLOW_SYSTEM_PROMPTS[workflowSlug]` | WIRED | Line 4 import, lines 46-49: lookup with GBD_GENERIC_PROMPT fallback |
| `chat-interface.tsx` | `actions/workflows.ts` | `markWorkflowComplete.bind(null, projectId, workflowSlug)` | WIRED | Line 120: form action binding confirmed |
| `actions/workflows.ts` | Supabase `workflow_states` | DB update + WORKFLOW_UNLOCKS chain | WIRED | Lines 23-41: update current → "completed", lookup next, update next → "available" |
| `use-chat-stream.ts` | `messages.ts` loadMessages | workflowSlug scoped history load | WIRED | Line 26: `loadMessages(projectId, supabaseRef.current, workflowSlug)` |
| `api/chat/route.ts` | `messages.ts` persistMessage | workflowSlug written to messages table | WIRED | Line 77: `persistMessage(projectId, "assistant", assistantContent, supabase, workflowSlug)` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| WF-01 | 03-01, 03-02, 03-03 | Utilisateur peut lancer le workflow /start depuis un projet | SATISFIED | WorkflowLauncher renders Lancer button for /start when status==="available"; router.push to chat?workflow=start; chat page reads slug; correct system prompt selected |
| WF-02 | 03-01, 03-03 | Utilisateur peut lancer /platform si /start est complété | SATISFIED | WORKFLOW_UNLOCKS["start"]="platform"; markWorkflowComplete sets next workflow to "available"; WorkflowLauncher shows Lancer button when available |
| WF-03 | 03-01, 03-03 | Utilisateur peut lancer /campaign si /platform est complété | SATISFIED | WORKFLOW_UNLOCKS["platform"]="campaign"; same unlock chain mechanism |
| WF-04 | 03-01, 03-02 | Utilisateur peut lancer /site-standalone (indépendant) | SATISFIED | "site-standalone" in WORKFLOW_ORDER with no dependency on other completed workflows; initial status comes from DB initialization |
| WF-05 | 03-01, 03-03 | Utilisateur peut lancer /wireframe si /site-standalone est complété | SATISFIED | WORKFLOW_UNLOCKS["site-standalone"]="wireframe"; same unlock mechanism |
| WF-06 | 03-02 | Workflows non disponibles visuellement désactivés | SATISFIED | StatusBadge renders 🔒 Bloqué for locked status; Lancer button NOT rendered when status !== "available" |

All 6 phase-3 requirements (WF-01 through WF-06) are implemented and wired. No orphaned requirements.

---

### Anti-Patterns Scan

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `system-prompts.ts` | 168, 184 | "PLACEHOLDER" | INFO | These are intentional content inside the wireframe workflow instructions — the agent is instructed to put `[PLACEHOLDER]` text in the generated HTML. Not a code stub. |
| `messages.ts` | 34 | `return []` | INFO | Valid error-handling fallback in loadMessages. Not a stub — data query and error logging precede it. |

No blockers or warnings found. No empty implementations, no console.log-only handlers, no TODO/FIXME in production code paths.

---

### TypeScript Compilation

```
npx tsc --noEmit → 0 errors
```

All phase 3 files compile cleanly with the full project.

---

### Git Commits Verified

All commits referenced in summaries exist in the repository:

| Commit | Description | Status |
|--------|-------------|--------|
| `55a2f72` | feat(03-01): create workflow system prompt constants | VERIFIED |
| `661a89c` | feat(03-01): extend /api/chat route with workflowSlug routing | VERIFIED |
| `5f0236f` | feat(03-02): create WorkflowLauncher interactive component | VERIFIED |
| `b10a552` | feat(03-02): update project page to use WorkflowLauncher | VERIFIED |
| `9936176` | feat(03-03): create markWorkflowComplete Server Action | VERIFIED |
| `5e76677` | feat(03-03): wire workflowSlug through chat stack | VERIFIED |
| `19d2eec` | fix(03): scope chat history by workflow + redirect after markComplete | VERIFIED |

---

### Human Verification Required

Plan 03-04 is explicitly a `checkpoint:human-verify gate="blocking"` plan. The SUMMARY claims human-verified, but as a GSD verifier I flag the following items as requiring a human to confirm, since they cannot be verified by static code analysis:

#### 1. Workflow Launch Navigation

**Test:** Log in, open a project, click "Lancer" next to /start
**Expected:** Browser navigates to `/projects/[id]/chat?workflow=start`, chat header shows "Workflow start"
**Why human:** URL navigation and rendered text require a live browser session

#### 2. Per-Workflow System Prompt Routing

**Test:** In /start chat, send "Bonjour"
**Expected:** Agent introduces itself as brand strategy expert (not generic GBD persona) and asks for the client brief — confirming the start system prompt was used
**Why human:** Requires live Anthropic API call; cannot verify prompt dispatch at runtime via static analysis

#### 3. Workflow Unlock Chain (WF-02)

**Test:** In any project, open /start chat, send a message, click "✓ Marquer comme terminé"
**Expected:** Browser redirects to project page; /start shows "✓ Complété", /platform shows "Disponible" with Lancer button
**Why human:** Requires live Supabase DB write + Next.js revalidation + visual confirmation

#### 4. Chat History Scoping

**Test:** Chat in /start, go back, chat in /platform — then re-open /start
**Expected:** /start chat shows only /start messages; /platform chat shows only /platform messages
**Why human:** Requires multiple browser sessions and DB state observation

#### 5. Locked Workflow Guards (WF-06)

**Test:** On a fresh project (no completed workflows), view project page
**Expected:** /platform, /campaign, /wireframe show "🔒 Bloqué" badge — no blue Lancer button beside them
**Why human:** Requires visual confirmation of rendered component state

---

### Post-Checkpoint Bug Fixes (Informational)

Plan 03-04 SUMMARY documents two bugs found during human testing and fixed post-checkpoint in commit `19d2eec`:

1. **Chat history cross-contamination** — Fixed by adding `workflow_slug` column to messages table and scoping `loadMessages`/`persistMessage` queries. Evidence confirmed in `src/lib/supabase/messages.ts`.

2. **Missing redirect after markComplete** — Fixed by adding `redirect(\`/projects/${projectId}\`)` to Server Action. Evidence confirmed in `src/actions/workflows.ts` (line 49).

Both fixes are present and wired in the current codebase.

---

## Summary

Phase 3 automated verification is complete with 13/13 checks passing:

- All 8 artifact files exist with substantive, non-stub implementations
- All 10 key wiring links are verified in the actual code
- All 6 requirements (WF-01 through WF-06) are accounted for and implemented
- TypeScript compiles with 0 errors
- All 7 git commits referenced in summaries exist
- No blocking anti-patterns found

The phase claims human verification was already completed (approved in 03-04 checkpoint). The 5 items above are flagged as `human_needed` because static analysis cannot substitute for live browser confirmation of URL navigation, API response content, DB writes, and rendered UI state. If the human checkpoint approval from 2026-02-25 is accepted as valid, this phase is **passed**.

---

_Verified: 2026-02-25T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
