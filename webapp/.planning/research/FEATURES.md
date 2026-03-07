# Feature Landscape

**Domain:** Internal AI branding tool — web interface replacing CLI
**Project:** GET BRANDON Web App
**Researched:** 2026-02-25
**Confidence:** HIGH (based on direct CLI source analysis + domain knowledge)

---

## Context: What We're Replacing

The CLI runs 5 workflows through Claude Code slash commands. Each workflow is a multi-step, dialogic process — the agent proposes, the user validates, they iterate. This is not a "submit a prompt, get a response" chatbot. It is a structured co-creation loop.

Workflow inventory:
- `/gbd:start` — Read client dossier, challenge generic angles, co-build CONTRE-BRIEF.json
- `/gbd:platform` — Expand contre-brief into 10-page PLATFORM.json with validation gates
- `/gbd:campaign` — Identify creative tension, propose big ideas, write copy, produce CAMPAIGN.json
- `/gbd:site` — Two-phase: architecture validated before content, produce SITE.json
- `/gbd:standalone` + `/gbd:wireframe` — Site brief without brand platform, produce HTML wireframe

Output artifacts per project: CONTRE-BRIEF.json, PLATFORM.json, CAMPAIGN.json, SITE.json, GBD-WIKI.html (+ STANDALONE-BRIEF.json, STANDALONE-WIREFRAME.html for standalone track)

The wiki (GBD-WIKI.html) is a static self-contained HTML file: fixed left sidebar with scrollspy navigation, each livrable as a section with TL;DR box + full content. No external dependencies.

---

## Table Stakes

Features users will not adopt without. Absence = the web app is worse than the CLI.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Chat interface with alternating messages** | This is the CLI interaction model: agent proposes, user responds. Users already know this pattern. | Low | user/assistant bubbles, not a form |
| **Streaming token display** | Workflows take several minutes. Without streaming, the UI appears frozen. This is the single most critical technical feature. | Medium | SSE from Anthropic SDK; must handle back-pressure and reconnect |
| **Workflow launcher** | User must be able to choose which workflow to run for a given project (start, platform, campaign, site, standalone, wireframe) | Low | can be buttons or a slash-command input — matches CLI mental model |
| **Project creation and naming** | CLI creates `clients/[client-name]/` folder structure. Web app must replicate project namespacing. | Low | project name → slug, stored in DB |
| **File upload (client inputs)** | `/gbd:start` requires PDFs, .txt, .md, .eml files in `inputs/`. Without upload, the main workflow cannot begin. | Medium | Supabase Storage; multi-file; types: PDF, txt, md, docx, eml |
| **Session persistence** | Workflows span multiple exchanges across potentially multiple sittings. State must be resumable. | Medium | store messages + workflow step in DB; reload conversation on revisit |
| **Resume existing project** | CLI has explicit "Reprendre / Recommencer / Voir" branching when a project already exists. Web app must expose this. | Low | project detail page with workflow status per track |
| **JSON output display** | The JSON files (CONTRE-BRIEF, PLATFORM, CAMPAIGN, SITE) are the actual deliverables. They must be readable in-app. | Low | formatted JSON viewer or structured card display |
| **Wiki HTML display in-browser** | GBD-WIKI.html is the human-readable deliverable. Users currently open it in a browser. The web app should render it inline. | Medium | render in iframe or shadow DOM to preserve its CSS/JS; or reconstruct the wiki as a native component |
| **Two-user access to all projects** | Jeremy + associate. Both see all projects, all sessions, all outputs. | Low | no permissions logic needed; simple shared workspace |
| **Basic auth (2 accounts)** | Tool is internal. No public signup. Two hardcoded or Supabase-provisioned accounts. | Low | Supabase Auth with email/password; no invite flow |

---

## Differentiators

Features that make the web app meaningfully better than the CLI. These justify building the web app at all.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Project dashboard** | CLI has no overview. The web app can show all clients, their workflow completion status (which JSONs exist), last activity date. This was impossible in the CLI. | Low | simple list/grid of projects with status badges per workflow track |
| **Workflow progress indicator** | Multi-step workflows (6 steps for start, 3 for platform) have no visual feedback in CLI. A step tracker (e.g., "Step 3/6 — Co-construction") reduces cognitive load significantly. | Medium | requires knowing current step from agent response; could be inferred from streaming content or stored as workflow state |
| **Structured output cards** | Raw JSON is correct but not readable. Rendering CONTRE-BRIEF fields as named cards (Angle stratégique, Raison d'être, etc.) adds zero logic but makes deliverables presentable in a client meeting or review. | Medium | map known JSON schemas to display components; schemas are fully documented in workflow files |
| **File management per project** | CLI users manually place files in `inputs/`. Web app allows upload, listing, and deletion of input files per project. No more filesystem navigation. | Medium | Supabase Storage per project slug |
| **Multi-track workflow navigation** | A project can have parallel tracks: start → platform → campaign → site, AND standalone → wireframe. Web app can display this as a workflow map, making the project progression legible at a glance. | Medium | track state derived from which outputs exist |
| **Inline wiki with live update** | Rather than opening GBD-WIKI.html in a new tab, the wiki is rendered inside the app and regenerated automatically when a new JSON is produced. No manual `/gbd:wiki` call needed. | High | requires wiki regeneration hook on output write; iframe or native rendering |
| **Streamed output with copy button** | Long streamed content (manifesto, 10-page platform) is hard to copy from a terminal. In the web app, each assistant message has a copy-to-clipboard action, and final JSON outputs have a download button. | Low | standard clipboard API; trivial to implement |
| **Workflow dependency enforcement** | CLI silently fails when prerequisites are missing (e.g., no CONTRE-BRIEF.json before running platform). Web app can disable unavailable workflow buttons and show clear "Requires: Contre-brief" state. | Low | check which output files exist per project before enabling launcher buttons |

---

## Anti-Features

Things to explicitly NOT build in v1. Omission is a deliberate product decision.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Markdown WYSIWYG editor for outputs** | JSON is the source of truth. Editing JSON in a rich editor is complex and risks schema corruption. Users can export and edit in their tools. | Display JSON readonly; offer download as .json |
| **PDF export** | PROJECT.md explicitly marks this out of scope. It adds a significant rendering dependency (Puppeteer or similar) for a feature neither user has validated as needed. | Users can print the wiki from the browser or export JSON to Figma Slides as designed |
| **Client sharing links** | PROJECT.md marks this as v2. It requires public URL handling, access tokens, and read-only view logic — a meaningfully different surface. | Ship v1 without sharing; add in v2 if requested |
| **Real-time collaboration (multi-cursor / presence)** | 2 users, never simultaneous on the same project in practice. Adding presence (Supabase realtime cursors, etc.) is pure complexity with no real use case. | First-writer-wins is fine; sessions are user-named anyway |
| **Custom workflow builder** | Tempting but completely out of scope. Workflows are markdown files with specific structure. A UI to create new ones would require building a workflow DSL editor. | Hardcode the 5 workflows; add new ones by updating the prompt files |
| **Figma export** | PROJECT.md marks this out of scope. JSON files are already structured for Figma Slides copy-paste — that is sufficient. | The JSON structure IS the Figma bridge; no additional export needed |
| **Mobile app** | PROJECT.md marks this out of scope. These are long-form creative sessions that require keyboard input and reading long outputs. Desktop browser is the correct interface. | Responsive web is acceptable as a fallback, not a target |
| **Public signup / multi-tenant** | Internal tool. Adding tenant isolation, billing, invite flows, and access controls would take longer to build than the entire v1 feature set. | 2 hardcoded accounts; revisit if the tool is productized later |
| **Notification system** | With 2 users and sessions that are always attended, async notifications add no value. | No notifications in v1 |
| **Workflow version history / diff** | Interesting but risky. Versioning CONTRE-BRIEF.json through iterations adds data model complexity. Not needed for 2 users. | Single latest version per output; manual restart if rework needed |

---

## Feature Dependencies

```
Auth (login)
  └── Project dashboard (list all projects)
        └── Project creation (name, slug)
              └── File upload (inputs/)
                    └── Workflow launcher: /start
                          └── Chat interface + streaming
                                └── CONTRE-BRIEF.json output
                                      └── Workflow launcher: /platform
                                            └── PLATFORM.json output
                                                  ├── Workflow launcher: /campaign → CAMPAIGN.json
                                                  └── Workflow launcher: /site → SITE.json
                                                        └── Wiki display (aggregates all JSONs)

Parallel track (no platform required):
  Project creation
    └── File upload (optional)
          └── Workflow launcher: /standalone
                └── Chat + streaming → STANDALONE-BRIEF.json
                      └── Workflow launcher: /wireframe → STANDALONE-WIREFRAME.html

Wiki auto-regeneration depends on: any JSON output being written
Structured output cards depend on: JSON output display
Workflow progress indicator depends on: chat interface + streaming
```

**Critical path for v1 MVP:**
Auth → Project creation → File upload → Chat interface + streaming → JSON display → Wiki display

Everything else is additive.

---

## Workflow-Specific Feature Notes

### /start workflow — highest interaction density
- 6 steps with explicit stops (initialize waits for files, check_indispensables may ask questions)
- The "Reprendre / Recommencer / Voir" branch at step 1 must be surfaced in the UI as a clear choice, not buried in chat
- File upload must complete BEFORE the workflow is launched with `--ready` equivalent
- Session log (DISCUSSION-LOG.md) should be accessible but is not a deliverable

### /platform workflow — longest output
- Generates 10 pages in sequence; each page is substantial
- Pages 5 (Valeurs), 9 (Manifeste), 10 (Territoire) have explicit validation gates
- Streaming will run for 3-5+ minutes; UI must not show timeout states
- PLATFORM.json is the largest output — display as structured cards, not raw JSON

### /campaign workflow — most creative, shortest
- 3 main steps; validation at concept selection
- CAMPAIGN.json contains billboard wording — display it in a visual "affiche" card format if possible

### /site workflow — two-phase
- Phase 1 (architecture) must be validated before Phase 2 (contents) begins
- This is a real gate — the UI should make phase separation legible
- SITE.json has pages with sections — display as expandable page tree

### /standalone + /wireframe — independent track
- Can be run on a project with no prior GBD work
- /wireframe produces HTML (not JSON) — display in iframe or as download
- The wireframe HTML is self-contained and interactive (dark/light toggle, desktop/mobile viewport)

---

## MVP Recommendation

**Phase 1 MVP (ship and validate):**
1. Auth (2 accounts, Supabase)
2. Project dashboard (list, create, name)
3. File upload to project inputs
4. Chat interface with streaming (covers all workflows)
5. Workflow launcher (6 buttons per project, disabled when prerequisites missing)
6. Session persistence (resume from last message)
7. JSON output display (formatted, downloadable)
8. Wiki display (iframe render of GBD-WIKI.html)

**Defer to Phase 2:**
- Structured output cards (requires custom rendering per JSON schema)
- Inline wiki auto-regeneration on output write
- Workflow progress step indicator
- Client sharing links
- PDF export

**Defer indefinitely (not in v1 or v2):**
- Mobile app
- Public signup
- Real-time collaboration
- Custom workflow builder
- Figma export

---

## Sources

- Direct analysis of CLI workflow files: `/workflows/start.md`, `/workflows/platform.md`, `/workflows/campaign.md`, `/workflows/site.md`, `/workflows/standalone.md`, `/workflows/wireframe.md`, `/workflows/wiki.md`
- Project requirements: `/WEBAPP/.planning/PROJECT.md`
- Product vision: `/SOURCES/VISION.md`
- Real output artifact: `/clients/brandon/outputs/GBD-WIKI.html` (structure, CSS, JS patterns)
- Confidence: HIGH — based on first-party source code analysis, not web search
