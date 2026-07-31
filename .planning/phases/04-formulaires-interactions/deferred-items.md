# Deferred Items — Phase 04

Out-of-scope discoveries logged during execution (not fixed — outside current task scope).

## Pre-existing repo-wide lint errors (`npm run lint` = `eslint .`)

Discovered during 04-04 execution. `npm run lint` fails with 28 errors / 7 warnings that
pre-date this plan (identical count with my change stashed). None are in `SpotDetail.tsx`
(which lints clean: `npx eslint src/components/SpotDetail.tsx` → 0 errors, 3 pre-existing
`react-hooks/exhaustive-deps` warnings unrelated to this plan).

Affected files (all out of scope for 04-04):
- `src/context/ProfileContext.tsx` — `react-hooks/set-state-in-effect`, `react-refresh/only-export-components`
- `src/context/SessionsContext.tsx` — `react-refresh/only-export-components`
- `src/context/SpotsContext.tsx` — `@typescript-eslint/no-explicit-any` (×5), `react-refresh/only-export-components`
- (others across `src/`)

Impact: the plan's `<verify>` blocks assume `npm run lint` is green. It is not, due to pre-existing
debt. Per-file lint of the touched file is clean. Recommend a dedicated lint-cleanup plan
(candidate for Phase 5 CODE-01/CODE-02).
