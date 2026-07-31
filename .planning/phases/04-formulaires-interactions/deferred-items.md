# Deferred Items — Phase 04

Out-of-scope discoveries logged during execution. NOT fixed (pre-existing, unrelated to the current task's changes).

## Pre-existing lint debt (project-wide)

- `npm run lint` (`eslint .`) reports ~28 errors / 7 warnings on the wave-1 base commit `edc8f3f`, spread across the codebase — pre-existing technical debt, not introduced by phase 04 plans.
- Within `src/components/AddSpotForm.tsx` specifically, pre-existing errors present on the base commit (confirmed via `git show HEAD:...`):
  - `catch (err: any)` in `handleSubmit` (`@typescript-eslint/no-explicit-any`)
  - `setDifficulty(e.target.value as any)` on the difficulty `<select>` (`@typescript-eslint/no-explicit-any`)
  - `resetForm()` called inside `useEffect` on open (`react-hooks/set-state-in-effect`) + missing-dep warning
- These lines were NOT modified by plan 04-03 (the `<select>` difficulty is explicitly out of scope per the plan; the `handleSubmit` try/catch and open-effect predate this phase). `npm run build` (`tsc -b && vite build`) is green. Code added by 04-03 is lint-clean.

### 04-04 findings (SpotDetail)

Discovered during 04-04 execution. `npm run lint` fails with 28 errors / 7 warnings that
pre-date this plan (identical count with the change stashed). None are in `SpotDetail.tsx`
(which lints clean: `npx eslint src/components/SpotDetail.tsx` → 0 errors, 3 pre-existing
`react-hooks/exhaustive-deps` warnings unrelated to this plan).

Affected files (all out of scope for 04-04):
- `src/context/ProfileContext.tsx` — `react-hooks/set-state-in-effect`, `react-refresh/only-export-components`
- `src/context/SessionsContext.tsx` — `react-refresh/only-export-components`
- `src/context/SpotsContext.tsx` — `@typescript-eslint/no-explicit-any` (×5), `react-refresh/only-export-components`
- (others across `src/`)

Impact: the plans' `<verify>` blocks assume `npm run lint` is green. It is not, due to pre-existing
debt. Per-file lint of each touched file is clean. Recommend a dedicated lint-cleanup plan
(candidate for Phase 5 CODE-01/CODE-02).
