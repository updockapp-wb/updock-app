---
phase: 01-audit-design-system
plan: 03
subsystem: ui
tags: [css, tailwind, design-tokens, index-css]

# Dependency graph
requires:
  - phase: 01-audit-design-system (plan 01-01)
    provides: before/ AuthModal screenshots — parity oracle used for human-verify
  - phase: 01-audit-design-system (plan 01-02)
    provides: DS-03 audit inventory (dead @theme palette / .glass class, 0-consumer proof)
provides:
  - Canonicalized src/index.css as the single token source (DS-01)
  - Semantic color tokens equal to rendered values (--color-primary #0ea5e9, --color-secondary #0f172a, --color-accent #f43f5e, --color-text #1e293b, --color-muted #64748b, --color-background #f8fafc)
  - --font-sans canonicalized to the rendered system stack
  - --radius-4xl: 2rem token reconciling the off-scale rounded-[32px]
affects: [01-04, 01-05, 01-06]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Single @theme token source in src/index.css — no :root color duplication, no Tailwind default-scale overrides, only additive off-scale tokens"]

key-files:
  created: []
  modified:
    - src/index.css

key-decisions:
  - "Dead 'Deep Ocean' @theme palette (#0f172a/#1e293b/#38bdf8/#2dd4bf/#f472b6 family) and the 0-consumer .glass class deleted — grep-verified zero utility consumers before removal"
  - "@theme vs :root color double-declaration resolved by keeping the actually-rendered LIGHT values as the canonical @theme tokens, removing the redundant :root re-declaration"
  - "--font-sans set to the rendered system stack (system-ui, -apple-system, ...); previous 'Inter'/'DM Sans' declarations were dead — never loaded — per RESEARCH A1"
  - "Exactly one off-scale radius token added (--radius-4xl: 2rem) to reconcile the 6× rounded-[32px] usage; Tailwind v4 default spacing/radius scale left untouched"

patterns-established:
  - "Token pruning discipline: subtraction + thin semantic layer only — every retained value must equal what already renders; never touch Tailwind's default --spacing or radius scale"

requirements-completed: [DS-01]

# Metrics
duration: ~20min (includes human-verify checkpoint wait)
completed: 2026-07-28
---

# Phase 01 — Plan 03: Token Canonicalization (DS-01) Summary

**`src/index.css` canonicalized into a single dead-code-free token source — dead Deep Ocean palette and `.glass` class pruned, colors/font/radius resolved to actually-rendered values, zero visual change confirmed by human pixel-parity check.**

## Performance

- **Duration:** ~20 min (includes human-verify checkpoint wait for build/preview comparison)
- **Completed:** 2026-07-28
- **Tasks:** 2
- **Files modified:** 1 (`src/index.css`)

## Accomplishments
- Deleted the dead `@theme` "Deep Ocean" palette (6 vars, grep-verified 0 utility consumers)
- Deleted the dead `.glass` class (0 consumers; referenced an undefined `--border-color` var)
- Resolved the `@theme`/`:root` color double-declaration onto the single set of actually-rendered light values
- Canonicalized `--font-sans` (and `:root font-family`) to the rendered system stack — removed dead `'Inter'`/`'DM Sans'` load targets
- Added exactly one off-scale radius token (`--radius-4xl: 2rem`) to reconcile `rounded-[32px]` (6 usages) without touching Tailwind's default scale
- Human-verified pixel-parity: build+preview spot-checked against the `before/` oracle screenshots — no visible change

## Task Commits

1. **Task 1: Prune dead tokens + canonicalize colors, font, and radius token** — `c3b6d28` (refactor)
2. **Task 2: Verify token prune is pixel-identical vs before-screenshots** — human-verify checkpoint, confirmed "identical" (no code commit — verification only)

## Files Created/Modified
- `src/index.css` — pruned dead Deep Ocean palette + `.glass`; canonicalized colors/font/radius into `@theme`; kept iOS `input{font-size:16px}` rule and glass vars verbatim

## Decisions Made
- Kept the semantic token values byte-identical to what was already rendering (light theme) — this was a subtraction/consolidation pass, not a redesign.
- Confirmed via `npm run build` (green) and grep assertions (dead values gone, new tokens present) before requesting human verification.

## Deviations from Plan
None — plan executed exactly as written. The executor correctly stopped at the Task 2 blocking checkpoint instead of attempting to self-resolve the visual verification.

## Issues Encountered
None. User confirmed "identical" on visual comparison against the before/ screenshots (noted the diff was subtle/hard to see by eye, which is expected — the prune targeted dead/unused values, not rendered ones).

## User Setup Required
None.

## Next Phase Readiness
- Wave 2 complete. `src/index.css` is now the single, honest token source that Wave 3's master components (Button, Input, Modal, Card, Header) will consume.
- Wave 3 (01-04, 01-05) is unblocked — both depend on 01-01 (screenshots) and 01-03 (tokens).
- No blockers carried forward.

---
*Phase: 01-audit-design-system*
*Completed: 2026-07-28*
