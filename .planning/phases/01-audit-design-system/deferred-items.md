# Deferred Items — Phase 01 (Audit & Design System)

Out-of-scope discoveries logged during execution. NOT fixed here; recorded for the
audit inventory and future phases.

| Category | Item | Count | Discovered | Target |
|----------|------|-------|------------|--------|
| Lint debt | `@typescript-eslint/no-explicit-any` in `src/context/*` (SpotsContext, etc.) | 13 | Plan 01-02 Task 2 | CODE-01/CODE-02 (Phase 5) |
| Lint debt | `react-refresh/only-export-components` (context files export non-components) | 7 | Plan 01-02 Task 2 | CODE-01/CODE-02 (Phase 5) |
| Lint debt | `react-hooks/set-state-in-effect` (setState directly in effects) | 7 | Plan 01-02 Task 2 | PERF-01 / CODE-01 (Phase 2/5) |
| Lint debt | `react-hooks/exhaustive-deps` (missing effect deps) | 5 | Plan 01-02 Task 2 | PERF-01 / CODE-01 (Phase 2/5) |
| Lint debt | `typescript-eslint/no-unused-vars` | 1 | Plan 01-02 Task 2 | CODE-01 (Phase 5) |

Total: 33 problems (28 errors, 5 warnings) across `src/` app source. All pre-existing;
none introduced by plan 01-02 (which only touched `vite.config.ts` + dev deps).
Full report: `audit/lint-report.txt`.
