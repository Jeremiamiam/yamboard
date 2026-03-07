---
phase: 05-wiki-native-page
plan: "01"
subsystem: ui
tags: [next.js, react, supabase, tailwind, server-component]

# Dependency graph
requires:
  - phase: 04-file-upload
    provides: workflow_outputs table with output_json column
  - phase: 03-ui-workflow-dashboard
    provides: project page layout and routing patterns

provides:
  - Wiki route at /projects/[id]/wiki — Server Component fetching workflow_outputs
  - WikiSection component: renders TL;DR + structured key-value content per workflow
  - WikiSidebar component: sticky nav with anchor links for scroll-spy (Plan 02)
  - Wiki link in project page header

affects: [05-02-scroll-spy-polish, future-wiki-plans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component wiki page with force-dynamic, same pattern as project page"
    - "extractTldr() ordered key lookup: summary > titre > title > big_idea > positionnement"
    - "WIKI_SECTIONS constant defines display order and deduplication for site/site-standalone"

key-files:
  created:
    - src/app/projects/[id]/wiki/page.tsx
    - src/components/wiki-section.tsx
    - src/components/wiki-sidebar.tsx
  modified:
    - src/app/projects/[id]/page.tsx

key-decisions:
  - "WIKI_SECTIONS constant controls render order — site-standalone deduplication handled by first-match on ordered outputs array"
  - "WikiSidebar and WikiSection are Server Components (no use client) — scroll-spy will be added as client wrapper in Plan 02"
  - "scroll-mt-8 on section ensures sticky header offset is respected when anchor-jumping"

patterns-established:
  - "WikiSection id pattern: id='wiki-{slug}' — must match WikiSidebar href='#wiki-{slug}'"
  - "data-slug attribute on sidebar anchors — reserved for scroll-spy Plan 02"

requirements-completed: [WIKI-01, WIKI-02, WIKI-03]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 5 Plan 01: Wiki Native Page Summary

**Wiki route at /projects/[id]/wiki rendering completed workflow outputs as TL;DR + structured sections with sticky sidebar nav**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T10:56:43Z
- **Completed:** 2026-02-26T10:57:57Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `WikiSection` Server Component that extracts TL;DR (ordered key lookup) and renders full output_json key-value pairs
- Created `WikiSidebar` Server Component with sticky nav and `data-slug` attributes ready for scroll-spy in Plan 02
- Created `/projects/[id]/wiki` route: Server Component with `force-dynamic`, fetches workflow_outputs, filters/orders by WIKI_SECTIONS, handles site/site-standalone deduplication
- Added "Wiki →" link in project page header with `ml-auto` flex positioning

## Task Commits

Each task was committed atomically:

1. **Task 1: WikiSection and WikiSidebar components** - `630d53c` (feat)
2. **Task 2: Wiki page Server Component + project page wiki link** - `4f0f783` (feat)

## Files Created/Modified

- `src/components/wiki-sidebar.tsx` - Sticky nav with anchor links `href="#wiki-{slug}"` and `data-slug` attribute, exports `WikiSidebarSection` type
- `src/components/wiki-section.tsx` - TL;DR block (blue-50) + full key-value content rendering, `scroll-mt-8` for header offset
- `src/app/projects/[id]/wiki/page.tsx` - Server Component: fetches projects + workflow_outputs, builds sections in WIKI_SECTIONS order, renders sidebar + sections or empty state
- `src/app/projects/[id]/page.tsx` - Added "Wiki →" link (`ml-auto`, blue-600) in header after workflow count

## Decisions Made

- WIKI_SECTIONS constant defines the canonical order and labels: start→Contre-brief, platform→Plateforme, campaign→Campagne, site/site-standalone→Site
- Deduplication: `seenSlugs` Set ensures if both `site` and `site-standalone` have outputs, only the first (most recent, since ordered desc) is shown
- WikiSidebar and WikiSection kept as Server Components — client-side scroll-spy interactivity deferred to Plan 02

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wiki route fully functional: fetches real data, renders sections, shows empty state
- `data-slug` attributes on sidebar anchors ready for Plan 02 scroll-spy implementation
- Both components are Server Components — Plan 02 can wrap sidebar in a Client Component for active-link highlighting without changing wiki-section

---
*Phase: 05-wiki-native-page*
*Completed: 2026-02-26*
