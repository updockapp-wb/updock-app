---
phase: 05-recette-globale-nettoyage-final
plan: 04
subsystem: ui
tags: [react, react-lazy, suspense, error-boundary, code-splitting, vite, rollup-visualizer, mapbox, bundle-size]

# Dependency graph
requires:
  - phase: 01-audit-design-system
    provides: frozen bundle baseline (504.17 kB gzip JS) and measurement methodology (build-size.txt, ANALYZE=1 stats.html treemap)
  - phase: 05-recette-globale-nettoyage-final (05-01, 05-03)
    provides: cleaned component surfaces (Map, AdminDashboard, PremiumModal, Profile) ready for lazy boundaries
provides:
  - React.lazy code-splitting for Map, AdminDashboard, PremiumModal
  - reusable ErrorBoundary component with retry affordance for lazy chunk-load failures
  - gated admin chunk (non-admins never fetch AdminDashboard)
  - Phase-5 bundle audit artifacts (build-size.txt, stats.html) without clobbering the Phase-1 baseline
  - eager/initial gzip JS reduced 56.7% (504.17 -> 218.09 kB), well under the -15% PERF-03 target
affects: [05-05 recette, on-device chunk-load resilience verification, future code-splitting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React.lazy + Suspense for conditionally-visible large surfaces"
    - "Class Error Boundary wrapping lazy screens with a retry callback (Pitfall 1 mitigation)"
    - "Gated lazy mount ({state && <Suspense>...}) so a chunk is never fetched until needed"
    - "Env-driven visualizer output (ANALYZE_OUT) to protect frozen baseline artifacts"

key-files:
  created:
    - src/components/ErrorBoundary.tsx
    - .planning/phases/05-recette-globale-nettoyage-final/audit/build-size.txt
    - .planning/phases/05-recette-globale-nettoyage-final/audit/stats.html
  modified:
    - src/App.tsx
    - src/components/Map.tsx
    - src/components/Profile.tsx
    - src/main.tsx
    - vite.config.ts
    - src/translations/fr.json
    - src/translations/en.json

key-decisions:
  - "Operative PERF-03 metric = eager/initial gzip JS (parsed before the map renders); summed-total reported for continuity but NOT the gate (user-resolved)"
  - "Gated the admin mount ({isAdminOpen && ...}) rather than always-mounting under Suspense, because AdminDashboard has no mount-time side-effects (T-05-06)"
  - "Moved mapbox-gl CSS from main.tsx into Map.tsx so it defers with the lazy chunk (D-07)"
  - "Redirected the visualizer to a Phase-5 audit folder via ANALYZE_OUT env default; Phase-1 artifacts left byte-unchanged (D-09/T-05-08)"

patterns-established:
  - "Lazy screens are wrapped in ErrorBoundary + Suspense; the map fallback is a spinner confined to the map area, non-map fallbacks are null (user-tap triggered)"
  - "New translation keys error.load_failed / error.retry drive the Error Boundary fallback copy"

requirements-completed: [PERF-03]

# Metrics
duration: ~15min
completed: 2026-07-31
---

# Phase 5 Plan 04: Bundle Reduction via React.lazy Code-Splitting Summary

**Lazy-loaded Map (+ mapbox-gl), AdminDashboard and PremiumModal behind Suspense + a retry-capable Error Boundary, cutting eager/initial gzip JS 56.7% (504.17 -> 218.09 kB) and passing the -15% PERF-03 target with room to spare.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-31
- **Tasks:** 3
- **Files modified:** 7 (2 created: ErrorBoundary.tsx + audit artifacts)

## Accomplishments
- Mapbox GL (274.66 kB gzip, 54.5% of JS) and the Map wrapper (13.71 kB) moved off the initial parse path via `const Map = lazy(() => import('./components/Map'))`.
- New `ErrorBoundary` (getDerivedStateFromError + componentDidCatch) wraps the lazy map with a translated message and a "retry" button that resets the boundary to re-attempt the dynamic import (Pitfall 1: a rejected import in the Capacitor WebView would otherwise blank the subtree).
- AdminDashboard is gated (`{isAdminOpen && <Suspense fallback={null}>...}`) so non-admins never fetch its 14.39 kB chunk (T-05-06); PremiumModal is lazy at its Profile call site.
- Phase-5 audit folder produced (build-size.txt + stats.html treemap) with the frozen Phase-1 baseline artifacts left byte-unchanged.

## Bundle Measurement (PERF-03)

Baseline (Phase-1, frozen): everything eager, summed-total gzip JS = **504.17 kB**. Target -15% = **≤ 428.5 kB**.

| Metric | Value | Notes |
|--------|-------|-------|
| **eager/initial gzip JS** | **218.09 kB** | **PASS** — the pass/fail gate. index (202.55) + web chunks (14.10 + 0.14 + 0.23 + 0.25 + 0.35 + 0.47). Excludes now-lazy Map, mapbox-gl, AdminDashboard, PremiumModal. **−56.7% vs baseline**, beats the expected ~230 kB. |
| summed-total gzip JS | 511.06 kB | Continuity only, NOT the gate. Slightly above the 504.17 baseline due to code-split boundary/runtime overhead + the newly split Map chunk. |

Lazy chunks now off the initial path: mapbox-gl 274.66 kB, Map 13.71 kB, AdminDashboard 3.88 kB, PremiumModal 0.72 kB.

## Task Commits

Each task was committed atomically:

1. **Task 1: Error Boundary + lazy Map behind Suspense (D-06/D-07)** — `2306783` (feat)
2. **Task 2: Gated lazy-mount AdminDashboard + PremiumModal (D-08)** — `3f786d6` (feat)
3. **Task 3: Measure bundle into Phase-5 audit folder (D-09)** — `a8827f2` (chore)

## Files Created/Modified
- `src/components/ErrorBoundary.tsx` (new) — class Error Boundary with retry affordance for lazy chunk-load failures
- `src/App.tsx` — lazy Map + ErrorBoundary/Suspense wrap, MapSkeleton fallback, gated lazy AdminDashboard mount
- `src/components/Map.tsx` — mapbox-gl CSS import moved here so it defers with the lazy chunk
- `src/components/Profile.tsx` — lazy PremiumModal, gated under `{isPremiumOpen && <Suspense>}`
- `src/main.tsx` — removed eager mapbox-gl CSS import
- `vite.config.ts` — env-driven visualizer output (ANALYZE_OUT) defaulting to the Phase-5 audit folder
- `src/translations/fr.json`, `src/translations/en.json` — added `error.load_failed` / `error.retry`
- `.planning/phases/05-recette-globale-nettoyage-final/audit/build-size.txt`, `stats.html` (new) — Phase-5 bundle measurement

## Decisions Made
- Confirmed AdminDashboard and PremiumModal have no mount-time side-effects (no `useEffect`/subscription/fetch at top level), so the gated-mount pattern loses nothing — chose gating over always-mounted-under-Suspense for the security benefit (non-admins never fetch the admin chunk).
- Added two translation keys rather than hardcoding fallback copy, since the Error Boundary fallback is user-facing and the app is bilingual (fr/en).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added translated Error Boundary fallback copy**
- **Found during:** Task 1 (Error Boundary)
- **Issue:** The plan specified a "short translated message" for the map fallback, but a class Error Boundary cannot use the `useLanguage` hook, and no suitable translation keys existed.
- **Fix:** Added `error.load_failed` / `error.retry` to fr.json and en.json, and pass a render-function fallback from App.tsx (which has `t`) so the message respects the active language; ErrorBoundary keeps a plain-text safety-net default for any call site that omits a fallback.
- **Files modified:** src/translations/fr.json, src/translations/en.json, src/components/ErrorBoundary.tsx, src/App.tsx
- **Verification:** `npm run build` green; fallback wired through the map ErrorBoundary render function.
- **Committed in:** 2306783 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The added keys are required to satisfy the plan's "translated message" requirement in a class component. No scope creep.

## Issues Encountered
- The default tab is `map`, so the Map/mapbox chunks are fetched immediately after first paint. Per the user-resolved operative metric, this is still counted as *lazy* (the app shell + nav become interactive while the map chunk loads behind the MapSkeleton spinner), so the eager/initial figure legitimately excludes it. Documented explicitly so the 05-05 recette verifies the on-device shell-interactive-during-map-load behavior (D-11).

## Threat Model Coverage
- **T-05-06** (non-admin -> admin chunk): mitigated — admin mount gated behind `isAdminOpen`; verified separate `AdminDashboard-*.js` chunk emitted and never in the eager set.
- **T-05-07** (lazy chunk-load failure blanks screen): mitigated — ErrorBoundary with retry wraps the map; on-device resilience to be verified in 05-05 (D-11).
- **T-05-08** (overwriting frozen baseline): mitigated — visualizer redirected to Phase-5 folder; Phase-1 `audit/build-size.txt` and `audit/stats.html` confirmed byte-unchanged (mtime + size).

## Next Phase Readiness
- Code-splitting shipped and measured; PERF-03 satisfied on the operative eager/initial metric.
- Ready for 05-05 recette: verify on-device (Capacitor WebView) that the map skeleton shows during chunk load and that a forced chunk-load failure triggers the Error Boundary retry rather than a blank screen (D-11).

## Self-Check: PASSED
- `src/components/ErrorBoundary.tsx` — FOUND
- `.planning/phases/05-recette-globale-nettoyage-final/audit/build-size.txt` — FOUND
- `.planning/phases/05-recette-globale-nettoyage-final/audit/stats.html` — FOUND
- Commit `2306783` — FOUND
- Commit `3f786d6` — FOUND
- Commit `a8827f2` — FOUND

---
*Phase: 05-recette-globale-nettoyage-final*
*Completed: 2026-07-31*
