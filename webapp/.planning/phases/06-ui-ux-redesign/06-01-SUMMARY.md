---
phase: 06-ui-ux-redesign
plan: 01
subsystem: design-system
tags: [design-tokens, tailwind-v4, typography, css-custom-properties]
dependency_graph:
  requires: []
  provides: [design-tokens, color-palette, border-radius-scale]
  affects: [all-components]
tech_stack:
  added: []
  patterns: [tailwind-v4-theme-inline, semantic-color-tokens, css-custom-properties]
key_files:
  created: []
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
decisions:
  - "Tailwind v4 @theme inline block — tokens exposed as CSS custom properties consumed by utility classes"
  - "Removed dark mode media query — app is light-only per requirements (internal tool, no dark mode)"
  - "16 semantic color tokens: bg, surface, border (2), text (3), brand (3), success (3), danger (3)"
  - "5 border-radius tokens: sm(6px) through 2xl(24px)"
  - "lang=fr on html element — entire app is French"
  - "font-sans on body — activates Geist Sans via --font-sans token"
metrics:
  duration: ~1min
  completed: 2026-02-27
  tasks_completed: 2
  files_modified: 2
---

# Phase 6 Plan 01: Design System Foundation Summary

**One-liner:** Established full Tailwind v4 design token system — 16 semantic color tokens, 5 radius tokens, Geist Sans wired via @theme inline, root layout polished with French metadata.

## What Was Implemented

### Task 1 — Design tokens in globals.css

Replaced the minimal Next.js boilerplate globals.css with a comprehensive Tailwind v4 token set using `@theme inline {}`.

Token groups defined:
- **Backgrounds:** `--color-bg` (#F9FAFB), `--color-surface` (#FFFFFF)
- **Borders:** `--color-border` (#E5E7EB), `--color-border-subtle` (#F3F4F6)
- **Text:** `--color-text-primary` (#111827), `--color-text-secondary` (#6B7280), `--color-text-disabled` (#9CA3AF)
- **Brand:** `--color-brand` (#2563EB), `--color-brand-hover` (#1D4ED8), `--color-brand-subtle` (#EFF6FF)
- **Success:** `--color-success` (#16A34A), `--color-success-subtle` (#F0FDF4), `--color-success-text` (#15803D)
- **Danger:** `--color-danger` (#DC2626), `--color-danger-subtle` (#FEF2F2), `--color-danger-border` (#FECACA)
- **Radius:** `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-2xl` (24px)

Body styles set to use `var(--color-bg)`, `var(--color-text-primary)`, and `var(--font-geist-sans)` directly.

### Task 2 — Root layout.tsx polish

Three targeted changes:
1. Metadata title set to "GET BRANDON", description updated to French agency copy
2. `<html lang="fr">` — corrects the default "en" for a fully French app
3. `font-sans` added to body className — activates Geist Sans via the `--font-sans` token defined in globals.css

## Key Decisions

- **Removed dark mode:** The `@media (prefers-color-scheme: dark)` block was removed. The app is an internal tool explicitly out-of-scope for dark mode per REQUIREMENTS.md.
- **Semantic token naming:** Tokens are named by purpose (e.g., `--color-text-secondary`) not by value (e.g., `--color-gray-500`). This allows future palette swaps without touching component files.
- **Tailwind v4 @theme inline:** Tokens defined here are automatically available as Tailwind utility classes (e.g., `bg-[--color-surface]` or via Tailwind's CSS variable resolution).

## Files Modified

| File | Change |
|------|--------|
| `src/app/globals.css` | Replaced boilerplate with full @theme inline token set (37 additions, 16 deletions) |
| `src/app/layout.tsx` | Updated metadata, lang attribute, body className (4 changes) |

## Build Status

Build passes with 0 TypeScript errors and 0 build errors after both tasks.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/app/globals.css` exists and contains `--color-brand`, `@theme inline`, `--radius-lg`: VERIFIED
- `src/app/layout.tsx` contains `GET BRANDON`, `lang="fr"`, `font-sans`: VERIFIED
- No `prefers-color-scheme` in globals.css: VERIFIED
- Commits 7a8325e and 2a91b5f exist: VERIFIED
- Build passes: VERIFIED
