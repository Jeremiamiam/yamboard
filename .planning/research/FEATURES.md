# Feature Landscape

**Domain:** Agency / freelance project management dashboard with AI assistant
**Project:** YamBoard
**Researched:** 2026-03-08
**Overall confidence:** HIGH (core features), MEDIUM (AI-specific differentiators)

---

## Context: Who This Is For

YamBoard serves a **solo communication agency owner** (Yam) who:
- Manages 5-20 active clients and prospects simultaneously
- Runs branding/communication projects with defined deliverables (logo, naming, charte graphique)
- Bills in staged installments: Devis → Acompte → Avancement(s) → Solde
- Accumulates brand documents that must remain accessible across all future project interactions
- Needs an AI assistant that knows each client's context without re-explaining it every session

The comparison baseline is Notion/Trello (too generic), Bonsai/HoneyBook (good billing UX, no AI context), and monday.com/ClickUp (team-focused bloat).

---

## Table Stakes

Features users expect. Missing = the tool is unusable or immediately abandoned for a spreadsheet.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Client list with status (active / prospect / archive) | Core orientation — "where are all my clients?" | Low | Already exists in UI shell |
| Per-client project list | Can't manage work without seeing all projects per client | Low | Already exists in UI shell |
| Project status indicator | Instant "is this moving?" signal | Low | Status field on project card |
| Billing state per project | The #1 financial anxiety for freelancers is "did I invoice this?" | Medium | Devis / Acompte / Avancement / Solde states |
| Total billed / outstanding per project | Cash flow clarity without opening a spreadsheet | Medium | Derived from payment stages |
| Document storage per project | Briefs, deliverables, proposals live here | Medium | Upload PDF, external link, generated doc |
| Document storage at client level | Brand assets that outlast any one project (logo, charte, plateforme de marque) | Medium | Distinct from project docs |
| Contact info per client | Name, role, email, phone — minimum viable CRM | Low | Contacts tab on client |
| Free-text notes per client and per project | Unstructured context that doesn't fit any field | Low | Already exists as note on documents |
| Prospect-to-client conversion | Prospects are a separate state, not a separate system | Low | Status change on client record |
| Archive clients without deleting | Historical reference stays accessible | Low | Archive state |
| Create / edit / delete clients, projects, products | Basic CRUD — without this nothing works | Medium | Currently mock only |
| Auth (password-protected, solo access) | Private business data must not be public | Low | Supabase auth |

**Source confidence:** HIGH — these features appear in every freelance PM tool reviewed (Bonsai, HoneyBook, Notion templates, Trello workflows). Absence of any one causes immediate tool abandonment per user research patterns.

---

## Differentiators

Features that make YamBoard worth building instead of stitching together Notion + Bonsai + ChatGPT.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI agent with agency-wide context | Ask "which client is close to solde?" or "summarize all active projects" without copy-pasting data | High | Already streaming in UI shell; needs real data |
| AI agent with per-client context | Ask "what's the brand positioning for Leroy?" without uploading files manually | High | Client scope includes projects + pinned docs |
| AI agent with per-project context | Ask "draft a follow-up email based on the brief and last deliverable" | High | Project scope: project docs + pinned client brand docs |
| Document pinning: project → client level | A logo file created in Project A becomes part of the permanent client brand context | Medium | Core to context integrity; no equivalent in generic tools |
| Billing stage tracking (not invoicing) | Visual "where is this project in the payment lifecycle?" — not a full accounting tool | Low-Medium | Devis/Acompte/Avancement/Solde states with amounts |
| Note injection into AI context | A free-text note on a document or client becomes part of what the AI knows | Medium | Already exists in mock; enables lightweight curation |
| Unified view: client health at a glance | See client, active projects, billing states, and last activity without navigating | Medium | Dashboard / client card design |
| Prospect pipeline (lightweight) | Know which prospects are hot without a full CRM | Low | Status + notes + last contact date |

**What distinguishes YamBoard from every alternative:**
The 3-scope AI context (agency / client / project) tied to real documents and billing data is not available in Notion, Bonsai, HoneyBook, or monday.com. This is the moat. Every other feature in this list is table stakes wrapped with better UX.

**Source confidence:** MEDIUM — AI-scoped context per client/project is an emerging pattern (Context Engineering 2025, Google multi-agent architecture). The document-pinning-to-context-scope mechanism is a YamBoard-specific design choice not directly validated against existing tools, but consistent with how RAG scoping works in production agentic systems.

---

## AI-Specific Features Assessment

These warrant separate treatment because they are the core differentiator, not an add-on.

### What Works in Practice (2025-2026)

| AI Feature | Practical Value | Implementation Approach | Confidence |
|-----------|-----------------|------------------------|------------|
| Scoped context per entity (agency / client / project) | Prevents context pollution — project-level answers don't bleed across clients | Inject relevant records + docs into system prompt per scope | HIGH |
| Document notes injected into context | User-curated signal: "this is what matters about this doc" | Append note text to document metadata in context | HIGH |
| Pinned docs propagating to parent scope | Client brand documents remain available in all project-level conversations | Pin flag on document propagates to client context builder | MEDIUM |
| Streaming responses in sidebar | Feels fast, reduces perceived latency | Anthropic SDK streaming, already working | HIGH |
| Agency-level financial summary query | "What's outstanding across all clients?" — genuine time saver | Context includes billing states for all active projects | MEDIUM |

### What Does NOT Work / Should Not Be Built

| AI Feature | Why Skip |
|-----------|----------|
| Auto-task generation from briefs | Creates noise, not signal. Solo user already knows the tasks. |
| AI-generated project timelines | Unreliable without real scheduling data; creates false confidence |
| AI-based billing reminders | Over-engineering a reminder email; a simple status flag suffices |
| AI scoring prospects | Solo user intuition > ML pipeline for 10 prospects |
| Multi-agent orchestration | Unnecessary complexity for one user managing 20 clients |

**Source confidence:** MEDIUM — based on 2025-2026 industry reports on AI in project management (Epicflow, Celoxis, PMI Infinity), filtered for solo-user applicability. Large-team AI features do not translate to solo workflows.

---

## Anti-Features

Features that actively bloat agency tools. Deliberately exclude these.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Time tracking | Solo owner knows how long things take; tracking adds friction without insight | Notes field if needed |
| Built-in invoicing / PDF generation | Adds legal/accounting complexity; Yam already has an accounting tool | Track billing states (Devis/Acompte/Solde), not invoice generation |
| Client portal (client-facing view) | Multi-user complexity in v1; solo tool first | Out of scope for v1 |
| Team permissions and roles | There is one user; permissions UI adds zero value | Single-user auth; collaborator invite is v2+ |
| Gantt charts / timeline views | Visual for stakeholder presentations, not solo operational tracking | Status + stage fields suffice |
| Sprint / agile board views | Creative agency work is milestone-based, not sprint-based | Project + product + payment stage model |
| Recurring project templates | Not enough project volume to justify; manual setup is fine | Copy project manually when needed |
| Zapier / webhook integrations | Premature automation for a brand-new internal tool | Build the core first |
| Comment threads / @mentions | No team to mention; just adds notification overhead | Notes field per document |
| Activity feed / audit log | Team feature; solo user remembers what they did | Not needed in v1 |
| Mobile app | Web-first is sufficient for internal agency tool | Responsive web is acceptable |
| Revenue analytics / forecasting | Not enough data volume to be meaningful early on | Simple billing state + amounts per project |

**Pattern observed across tools:** Bonsai and HoneyBook both offer features (time tracking, tax management, automated reminders) that solo creative agency owners frequently ignore. The lightest, most opinionated tools (Folk for contacts, Notion for notes) survive by doing fewer things well. YamBoard's advantage is hyper-specific scope.

---

## Feature Dependencies

```
Auth (Supabase) → All CRUD operations
Client CRUD → Project CRUD
Project CRUD → Product CRUD
Project CRUD → Document management
Document management → Pinning (project → client)
Document management + Pinning → AI context builders
Real data in Supabase → AI agents (replace mock)
Billing states → Financial summary in AI context
Contacts CRUD → Client context completeness
```

The critical path is: Auth → Client/Project CRUD → Documents → Pinning → AI on real data.

---

## MVP Recommendation

**Build in this order:**

1. **Auth** — Supabase email/password. Gate the entire dashboard. Nothing else matters without this.

2. **Client CRUD** — Create, edit, archive, delete, prospect → client conversion. The foundation of everything.

3. **Project + Product CRUD** — Create, edit, close projects. Add products with names and amounts.

4. **Billing states** — Devis / Acompte / Avancement(s) / Solde with amounts and paid/pending toggle. Visual per project.

5. **Document management** — Upload PDF to Supabase Storage, external link, plain-text note, AI-generated doc stub. Attach to project or client level.

6. **Document pinning** — Project doc → visible at client level. Enables AI context integrity.

7. **Contacts** — Name, role, email, phone. Linked to client record.

8. **AI on real data** — Swap mock context builders for Supabase queries. The 3 scopes become genuinely useful.

**Defer (post-MVP):**
- Client portal (client-facing view)
- Collaborator invite
- Billing summary / financial dashboard (aggregate view)
- Document versioning
- Full-text search across documents

---

## Competitive Positioning Summary

| Tool | Billing Tracking | Document Context | AI Scoped Context | Solo-First Design |
|------|-----------------|-----------------|------------------|--------------------|
| Notion | DIY | Manual | Notion AI (generic) | No (generic tool) |
| Trello | No | No | No | No |
| Bonsai | YES (invoicing) | No | No | YES |
| HoneyBook | YES (smart files) | No | No | YES (client portals) |
| monday.com | Limited | Yes (file attach) | Partial (generic AI) | No (team-focused) |
| **YamBoard** | YES (stages) | YES (pinning) | YES (3 scopes) | YES (solo-first) |

YamBoard does not compete on invoicing richness (Bonsai wins there) or client portal UX (HoneyBook wins there). It wins on: **AI that knows your clients and projects without manual re-briefing**, combined with the billing visibility a solo agency owner actually needs.

---

## Sources

- Bonsai vs HoneyBook comparison: [ManyRequests 2026](https://www.manyrequests.com/blog/bonsai-vs-honeybook)
- Freelance PM tool features overview: [The Digital Project Manager 2026](https://thedigitalprojectmanager.com/tools/best-freelance-project-management-software/)
- Solo user tool bloat analysis: [Solocrafter 2025](https://www.solocrafter.com/blog/best-task-manager-solo-developers)
- AI in project management: [Epicflow 2026](https://www.epicflow.com/blog/ai-agents-for-project-management/)
- Context engineering for agents: [Prompt Builder 2025](https://promptbuilder.cc/blog/context-engineering-agents-guide-2025)
- Creative agency pain points: [COR Blog](https://projectcor.com/blog/top-pain-points-for-creative-agencies/)
- All-in-one freelance platforms: [Plutio 2026](https://www.plutio.com/freelancer-magazine/best-all-in-one-platforms-for-freelancers)
- HoneyBook vs Bonsai honest comparison: [Assembly 2025](https://assembly.com/blog/bonsai-vs-honeybook)
