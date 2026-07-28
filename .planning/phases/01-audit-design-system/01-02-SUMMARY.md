---
phase: 01-audit-design-system
plan: 02
subsystem: infra
tags: [vite, rollup-plugin-visualizer, knip, depcheck, lighthouse, bundle-analysis, tailwind]

# Dependency graph
requires:
  - phase: 01-audit-design-system (plan 01-01)
    provides: audit/ scaffold + PREFLIGHT Chrome/Lighthouse decision (soft — Chrome-absent known independently)
provides:
  - Firm bundle baseline (raw + gzip per chunk) frozen from vite build
  - Bundle composition treemap (stats.html, gzip + brotli)
  - Dependency inventory (knip + depcheck) and Capacitor version verdict
  - 01-AUDIT.md — DS-03 deliverable with directional PERF-03 target
affects: [02-*, phase-5-performance]

# Tech tracking
tech-stack:
  added: [rollup-plugin-visualizer@7.0.1, knip@6.29.0, depcheck@1.4.7]
  patterns: ["Build-time bundle analysis wired into vite.config.ts (visualizer, gzip+brotli)"]

key-files:
  created:
    - .planning/phases/01-audit-design-system/audit/build-size.txt
    - .planning/phases/01-audit-design-system/audit/stats.html
    - .planning/phases/01-audit-design-system/audit/knip.md
    - .planning/phases/01-audit-design-system/audit/depcheck.json
    - .planning/phases/01-audit-design-system/audit/capacitor-versions.txt
    - .planning/phases/01-audit-design-system/audit/npm-outdated.txt
    - .planning/phases/01-audit-design-system/01-AUDIT.md
  modified:
    - vite.config.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Firm baseline frozen as gzip total JS ≈ 504 kB (mapbox 274.66 + index 214.11 + vendor chunks); Mapbox GL is the dominant chunk"
  - "Lighthouse deferred to documented fallback (Chrome absent on machine); perf is directional (D-08), so absence downgrades but does not block"
  - "Capacitor cli/core mismatch from CONCERNS.md re-verified as resolved: cli@8.2.0 / core@8.0.0 (both 8.x); @capacitor/assets still pulls transitive cli@5.7.8 (dev-only, non-blocking)"

patterns-established:
  - "Bundle analysis: rollup-plugin-visualizer wired build-time only (not shipped), gzipSize+brotliSize enabled"
  - "Audit artifacts committed verbatim under .planning/phases/01-audit-design-system/audit/ as the numeric backing for DS-03"

# Metrics
duration: ~10min
completed: 2026-07-28
---

# Phase 01 — Plan 02: Architecture Audit (DS-03) Summary

**DS-03 audit delivered: firm gzip-JS bundle baseline (~504 kB, Mapbox-dominated) + dependency inventory + UI-incoherence inventory frozen on pristine source, with a directional PERF-03 target.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-07-28
- **Tasks:** 3 (Task 1 legitimacy gate pre-approved by orchestrator/user)
- **Files modified:** 3 modified + 7 audit artifacts created

## Accomplishments
- Installed and vetted audit dev tools (visualizer, knip, depcheck) after the human legitimacy gate
- Wired `rollup-plugin-visualizer` into `vite.config.ts` (treemap, gzip + brotli), build-time only
- Captured the FIRM bundle baseline verbatim from `npm run build` → `audit/build-size.txt`
- Captured dependency inventory (`knip.md`, `depcheck.json`), `npm outdated`, and Capacitor version tree
- Authored `01-AUDIT.md` (DS-03): structure, deps, UI-incoherence inventory, firm baseline, directional PERF-03 target

## Task Commits

1. **Task 1: Audit-tool legitimacy gate (human-verify)** — pre-approved by orchestrator (npm view postinstall + source-repo glance for all 4 tools); no code commit
2. **Task 2: Install tools + wire visualizer + capture baseline** — `01d9c9f` (chore)
3. **Task 3: Directional perf fallback + author 01-AUDIT.md** — `e56358e` (docs)

## Files Created/Modified
- `vite.config.ts` — added visualizer plugin (build-time bundle treemap)
- `package.json` / `package-lock.json` — added devDeps rollup-plugin-visualizer, knip, depcheck
- `audit/build-size.txt` — verbatim vite build compressed-size table (firm baseline)
- `audit/stats.html` — visualizer treemap (gzip + brotli)
- `audit/knip.md`, `audit/depcheck.json` — dependency/dead-code inventory
- `audit/capacitor-versions.txt`, `audit/npm-outdated.txt` — version verdicts
- `01-AUDIT.md` — DS-03 deliverable

## Decisions Made
- **Firm baseline:** gzip total JS ≈ 504 kB; headline chunk is `mapbox-gl` (274.66 kB gzip) followed by `index` (214.11 kB gzip). CSS 13.60 kB gzip.
- **Perf via fallback:** Chrome absent → Lighthouse deferred/manual; documented fallback (Vite compressed-size + React Profiler notes) recorded per D-08.
- **Capacitor verdict:** cli@8.2.0 / core@8.0.0 aligned (8.x); CONCERNS.md mismatch no longer applies. `@capacitor/assets` transitively pins cli@5.7.8 (dev tooling only).

## Deviations from Plan
None material — Task 1 legitimacy gate was resolved at the orchestrator level (user approved all 4 tools after a postinstall + source-repo glance) rather than mid-executor, so the executor proceeded straight to Task 2. Lighthouse ran via the plan's documented Chrome-absent fallback.

## Issues Encountered
- Executor process terminated by an API connection error AFTER all 3 task commits landed but BEFORE writing this SUMMARY.md. Recovered via spot-check (both task commits present, all artifacts on disk, verified content) and this SUMMARY was authored by the orchestrator without re-executing — no duplicate work.

## User Setup Required
None.

## Next Phase Readiness
- DS-03 firm baseline frozen — Phase 5 (PERF-03) now has a measurable reference (~504 kB gzip JS, -15% directional target).
- UI-incoherence inventory (Map.tsx hard-coded hexes, dead `@theme` palette / `.glass` class, duplicated modal patterns) ready to feed Phase 2 migration.
- Wave 1's other plan (01-01) still needs the "before" AuthModal screenshots (human-action) before Wave 2 token changes.

---
*Phase: 01-audit-design-system*
*Completed: 2026-07-28*
