---
phase: 01-audit-design-system
plan: 05
subsystem: ui
tags: [react, tailwind, design-system, components, lucide]

# Dependency graph
requires:
  - phase: 01-audit-design-system (plan 01-01)
    provides: before/ screenshots (parity oracle) + PATTERNS analog table (verbatim class donors)
  - phase: 01-audit-design-system (plan 01-03)
    provides: --radius-4xl token (2rem = 32px) reconciling the off-scale glass radius
provides:
  - src/ui/Card.tsx — master surface with glass + light (resting/interactive) variants, glass radius wired to the rounded-4xl token
  - src/ui/Header.tsx — master heading with stacked title+subtitle shape + row-with-close shape, text color driven by surface prop
  - Completes the DS-02 master component set (Button/Card/Input/Modal/Header)
affects: [01-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-match master components: distinct rendered surfaces exposed as VARIANTS (not unified), class strings extracted verbatim from existing app surfaces"
    - "Surface-driven text color via prop (glass=white, light=slate-800) — never hard-coded to one surface"
    - "className merged after variant classes via filtered join (no clsx/cn helper in repo)"

key-files:
  created:
    - src/ui/Card.tsx
    - src/ui/Header.tsx
  modified: []

key-decisions:
  - "Glass card 32px radius consumed via the rounded-4xl token (01-03 --radius-4xl: 2rem) instead of the rounded-[32px] literal — token wiring per UI-SPEC line 51 / DS-01, not a visual change"
  - "Distinct card radii preserved as variants (glass rounded-4xl vs light rounded-2xl) — not unified"
  - "Header row-with-close vs stacked shapes selected by presence of onClose prop; spacing classes (mb-2/mb-8/mb-6) kept verbatim"

patterns-established:
  - "Verbatim extraction discipline: master-component variant classes copied byte-for-byte from PATTERNS analogs; grep gates assert key strings; parity proven downstream (01-06)"

requirements-completed: [DS-02]

# Metrics
duration: ~8min
completed: 2026-07-28
---

# Phase 01 Plan 05: Card + Header Master Components Summary

**Two role-match master components (Card glass/light variants wired to the rounded-4xl token, Header stacked/row-with-close shapes with surface-driven text color) completing the DS-02 Button/Card/Input/Modal/Header set.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-28T20:43:00Z
- **Completed:** 2026-07-28T20:51:00Z
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- `src/ui/Card.tsx` — glass variant (`bg-white/95 backdrop-blur-md rounded-4xl p-6 shadow-xl border border-white/20`) and light variant (`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm`), with verbatim `cursor-pointer hover:border-sky-300 hover:shadow-md transition-all` hover-elevation on the interactive light card. Glass 32px radius consumed via the `rounded-4xl` token; no `rounded-[32px]` literal remains.
- `src/ui/Header.tsx` — stacked title+subtitle shape (AuthModal analog, consumed by the 01-06 migration) and row-with-close-button shape (FiltersModal analog). Heading is `text-2xl font-bold` (24px/700); text color (`text-white`/`text-white/50` vs `text-slate-800`/`text-slate-500`) driven by the `surface` prop, never hard-coded.
- Completes the DS-02 master component set.

## Task Commits

Each task was committed atomically:

1. **Task 1: src/ui/Card.tsx — glass + light card variants** - `cb65a3d` (feat)
2. **Task 2: src/ui/Header.tsx — title+subtitle / row-with-close** - `17f73c9` (feat)

## Files Created/Modified
- `src/ui/Card.tsx` - Master surface: glass + light (resting/interactive) card variants; glass radius via rounded-4xl token
- `src/ui/Header.tsx` - Master heading: stacked title(+subtitle) + optional row-with-close slot; text color by surface prop

## Decisions Made
- None beyond the plan's explicit constraints — glass radius wired to `rounded-4xl` token, distinct radii kept as variants, Header shape chosen by `onClose` presence. All values extracted verbatim.

## Deviations from Plan

None - plan executed exactly as written.

(One incidental adjustment during Task 1: the initial code comment contained the string `rounded-[32px]` to describe the reconciliation, which tripped the `! grep -q "rounded-\[32px\]"` gate. Reworded the comment to "off-scale literal" — no functional change. Not a deviation rule; the source never used the literal in a className.)

## Issues Encountered
- The `01-PATTERNS.md` reference file is untracked in this worktree base (created post-base in the main checkout), so it was not readable here. Not blocking: the verbatim class donors were confirmed directly from source (`src/components/AuthModal.tsx` L98-103, `src/components/FiltersModal.tsx` L38-43) and the exact class strings were provided inline in the plan's `<action>` blocks.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DS-02 master component set (Button/Card/Input/Modal/Header) is complete.
- `src/ui/Header.tsx` stacked title+subtitle shape is ready for the plan 01-06 AuthModal migration/proof.
- `npm run build` clean for both components; grep gates pass.

## Self-Check: PASSED

- Files: src/ui/Card.tsx, src/ui/Header.tsx, 01-05-SUMMARY.md all present
- Commits: cb65a3d, 17f73c9 verified in git log

---
*Phase: 01-audit-design-system*
*Completed: 2026-07-28*
