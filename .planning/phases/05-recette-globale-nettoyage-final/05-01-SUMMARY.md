---
phase: 05-recette-globale-nettoyage-final
plan: 01
subsystem: state-layer
tags: [react, context, eslint, react-refresh, typescript, react-hooks]

# Dependency graph
requires:
  - phase: 02-performance
    provides: "context providers and hooks refactored for perf (useCallback stable handlers)"
provides:
  - "Homogeneous context file structure: each context exposes its hook from a dedicated use{Name}.ts file (CODE-02)"
  - "Fully green lint gate: npm run lint = 0 problems (CODE-01 / D-01)"
  - "Typed Supabase spot rows (DbSpotRow) and typed map click events (MapLayerMouseEvent)"
affects: [05-02, 05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "use{Name}.ts convention: Context object + hook live in a dedicated non-component module; provider .tsx exports only components + type interfaces (react-refresh clean)"
    - "Scoped eslint-disable-next-line with French justification for behavior-preserving logout/open resets (T-05-01) and unmemoized context-fn effect deps"

key-files:
  created:
    - src/context/useAuth.ts
    - src/context/useFavorites.ts
    - src/context/useLanguage.ts
    - src/context/useProfile.ts
    - src/context/useSessions.ts
    - src/context/useSpots.ts
    - src/context/useNotifications.ts
  modified:
    - src/context/*Context.tsx (7 providers)
    - src/context/SpotsContext.tsx (DbSpotRow typing)
    - src/App.tsx
    - src/components/* (hook import repoint + lint fixes)

key-decisions:
  - "Split all 7 contexts (incl. Notifications, which did not trip react-refresh) for CODE-02 file-structure coherence"
  - "Derive App welcome state from URL hash via lazy useState initializer instead of setState-in-effect (idiomatic)"
  - "Preserve logout/open reset behavior (T-05-01) via scoped eslint-disable rather than risky refactor validated in recette"

patterns-established:
  - "use{Name}.ts hook module + *Context.tsx provider module split"
  - "Typed catch bindings: narrow unknown via instanceof Error, never widen to any"

requirements-completed: [CODE-02, CODE-01]

# Metrics
duration: 22min
completed: 2026-07-31
---

# Phase 5 Plan 01: State-Layer Homogenization & Lint Debt Clearance Summary

**Split all 7 React contexts into dedicated `use{Name}.ts` hook modules (react-refresh clean) and cleared the entire lint debt to reach `npm run lint = 0`, with `npm run build` green.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-07-31T18:47:00Z
- **Completed:** 2026-07-31T19:08:00Z
- **Tasks:** 2
- **Files modified:** 33 (7 created, 26 modified)

## Accomplishments
- Every context now exposes its `Context` object and `use{Name}` hook from a dedicated `src/context/use{Name}.ts` module; provider `.tsx` files export only components + type interfaces, clearing all 6 `react-refresh/only-export-components` offenders (CODE-02).
- `npm run lint` is fully green: 0 errors, 0 warnings — the D-01 green-lint gate is satisfied (CODE-01).
- Removed all `@typescript-eslint/no-explicit-any` in the codebase: added `DbSpotRow` interface, `Spot['difficulty']` casts, typed `catch` bindings, `MapLayerMouseEvent`, `StartType | 'All'`, and `{ spot_id: string }` row typing.
- `set-state-in-effect` and `exhaustive-deps` cleared while preserving the logout/auth-change reset behavior flagged by threat T-05-01.

## Task Commits

1. **Task 1: Split all 7 context hooks into use{Name}.ts and repoint imports** - `2062762` (refactor)
2. **Task 2: Fix all remaining lint problems to reach npm run lint = 0** - `4a6a45a` (fix)

## Files Created/Modified
- `src/context/use{Auth,Favorites,Language,Profile,Sessions,Spots,Notifications}.ts` - New hook modules: exported Context object + `use{Name}` hook, `import type { {Name}ContextType }` from the provider file (type-only, no circular runtime import).
- `src/context/{Auth,Favorites,Language,Profile,Sessions,Spots,Notifications}Context.tsx` - Provider components now import their Context from `use{Name}`; exported the `{Name}ContextType` interfaces; `SessionsContext` keeps `interface Session` exported.
- `src/context/SpotsContext.tsx` - Added `DbSpotRow` interface, replaced 5 `any` (rows/difficulty/catch bindings), `?? undefined` for nullable fields.
- `src/context/FavoritesContext.tsx` - Typed favorites row, `spotsRef` to remove `spots` from fetch-effect deps without a re-fetch loop.
- `src/context/NotificationsContext.tsx`, `src/context/ProfileContext.tsx` - Scoped disables preserving logout reset (T-05-01).
- `src/App.tsx` - Welcome state derived from URL hash via lazy initializer; hook imports repointed.
- `src/components/*` (18 files) - Hook imports repointed to `use{Name}`; combined `useSessions, type Session` imports split (Session stays on `SessionsContext`); lint fixes in AddSpotForm, AdminDashboard, AuthModal, FiltersModal, Map, Profile, ReviewList, SpotDetail, CommunityStatsScreen.

## Decisions Made
- Split `NotificationsContext` too even though `useNotifications` did not trip `react-refresh`, for CODE-02 structural coherence (kept its explicit `: NotificationsContextType` return annotation).
- Preferred behavior-preserving scoped `eslint-disable-next-line` (with French justification comments) over refactoring unmemoized context functions (`fetchUserSessions`, `fetchSessionsForSpot`) into effect deps — the alternative risks the session flows validated by the Phase-5 recette.
- Fixed `set-state-in-effect` idiomatically where safe (App welcome via lazy initializer; `checkPermission` added to Profile deps since it is already `useCallback`).

## Deviations from Plan

### Scope note (not a deviation)

Task 2's acceptance criterion is `npm run lint` = 0. The plan's `<interfaces>` listed the known offenders but Task 2 explicitly instructs "Any stragglers ... and whatever else `npm run lint` still reports — fix to zero" (full D-01 lint scope). Beyond the files named in `files_modified`, the following files also carried pre-existing lint debt and were fixed to satisfy the green gate: `AddSpotForm.tsx`, `AdminDashboard.tsx`, `AuthModal.tsx`, `CommunityStatsScreen.tsx`, `Map.tsx`, `ReviewList.tsx`, `SpotDetail.tsx`. This is in-scope per the plan's stated Task 2 target, not scope creep.

### Auto-fixed Issues

**1. [Rule 3 - Blocking] New TypeScript errors from tightened typing**
- **Found during:** Task 2 (after replacing `any`)
- **Issue:** `npm run build` surfaced 3 `tsc` errors — `feature.properties` possibly null (Map.tsx x2) and `string[]` not assignable to `StartType[]` (SpotsContext.tsx) — caused by the new stricter types replacing `any`.
- **Fix:** Optional-chained `feature.properties?.…`, cast `s.type as StartType[]`, and `?? undefined` for nullable `DbSpotRow` fields.
- **Files modified:** src/components/Map.tsx, src/context/SpotsContext.tsx
- **Verification:** `npm run build` green (tsc -b + vite build succeed).
- **Committed in:** 4a6a45a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking build error introduced by the planned typing change).
**Impact on plan:** Necessary to keep the build green alongside the lint fix. No scope creep.

## Issues Encountered
- A scoped `set-state-in-effect` disable on `Profile.tsx` (`setSpotsCount(0)` reset) reported as an "unused directive" — the rule no longer flagged that line after the surrounding edits, so the disable was removed. Lint remains fully green.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- State layer is homogeneous and lint is green; foundation ready for plans 05-02..05-05.
- No blockers. Logout/auth-change reset behavior (T-05-01) preserved and must be re-checked in the 05-05 recette (auth + notifications flows).

---
*Phase: 05-recette-globale-nettoyage-final*
*Completed: 2026-07-31*

## Self-Check: PASSED

All 7 use{Name}.ts hook modules and 05-01-SUMMARY.md exist on disk; task commits 2062762, 4a6a45a and metadata commit d1a22fc verified in git log.
