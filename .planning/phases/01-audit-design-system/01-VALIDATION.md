---
phase: 01
slug: audit-design-system
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-28
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Project constraint (locked):** this project has **no test framework** and "no automated tests" is a locked scope decision (REQUIREMENTS Out of Scope; CODE-03 is future). Validation here is **build/lint gates + audit-artifact existence + manual visual parity** — NOT automated tests. Do **not** introduce a test runner.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (project constraint: no automated tests) |
| **Config file** | none |
| **Quick run command** | `npm run lint && npm run build` (ESLint + `tsc -b` typecheck + Vite build) |
| **Full suite command** | `npm run build && npm run preview` + manual auth QA checklist + AuthModal before/after screenshot diff |
| **Estimated runtime** | ~30–60 s (build/lint) + manual screenshot parity |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm run build`
- **After every plan wave:** Full build + `preview` + AuthModal screenshot diff
- **Before `/gsd:verify-work`:** Lint+typecheck green · all audit artifacts committed under `audit/` · AuthModal pixel-identical
- **Max feedback latency:** ~60 s for the build/lint gate

---

## Per-Task Verification Map

| Req ID | Behavior | Type | Command / Check | Exists? |
|--------|----------|------|-----------------|---------|
| DS-03 | Firm bundle baseline captured | build artifact | `npm run build` size table saved to `audit/build-size.txt` | ❌ Wave 0 (create `audit/`) |
| DS-03 | Bundle composition captured | build artifact | `stats.html` from `rollup-plugin-visualizer` present | ❌ Wave 0 |
| DS-03 | Dependency inventory captured | static analysis | `knip.md` + `depcheck.json` present; `npm ls` mismatch noted | ❌ Wave 0 |
| DS-03 | Directional perf baseline captured | lab/profiler | Lighthouse JSON (or documented fallback) + React Profiler notes | ❌ Wave 0 |
| DS-01 | No dead tokens; utilities still resolve | build | `npm run build` succeeds after `@theme` prune | ✅ existing build |
| DS-02 | `src/ui/` components compile & typecheck | typecheck | `tsc -b` clean; ESLint clean | ✅ existing lint/build |
| DS-02 / D-09 | AuthModal renders pixel-identical | manual visual | before/after screenshots (login, signup, error states) match | ❌ Wave 0 (capture "before" first) |
| QA (parity) | Auth flow unregressed | manual | login + signup + error path exercised on device/preview | ✅ manual checklist |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Create `.planning/phases/01-audit-design-system/audit/` for audit artifacts.
- [ ] Capture **"before" AuthModal screenshots** (login / signup / error) BEFORE any token or component change — this is the pixel-parity oracle.
- [ ] Confirm Chrome/Chromium availability for Lighthouse; if absent, record the documented fallback (Vite compressed-size report + React Profiler) and note Lighthouse as manual/deferred.
- [ ] **No test-framework install** — forbidden by project constraint.

*Audit tooling installs (`rollup-plugin-visualizer`, `knip`, `depcheck`, `lighthouse`) are all `[ASSUMED]` in RESEARCH.md — planner must gate each behind a human-verify checkpoint (`npm view <pkg> scripts.postinstall`).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AuthModal pixel-identity | DS-02 / D-09 | No visual-regression infra; parity is the cardinal constraint | Capture before/after screenshots of login, signup, and error states; diff must show no rendered change |
| Auth flow unregressed | QA parity | No auth test harness | Exercise login + signup + error path on device or `vite preview`; `handleSubmit` / `mapAuthError` / `supabase.auth.*` must stay byte-identical |
| Directional perf baseline | DS-03 / PERF-03 | Lighthouse-as-mobile is directional (D-08); Chrome may be unavailable | Run Lighthouse mobile against `vite preview` if Chrome present; else document fallback |

---

## Validation Sign-Off

- [x] Every task has a build/lint gate, an audit-artifact existence check, or a Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without a build/lint or artifact gate
- [x] Wave 0 covers all MISSING references (`audit/` dir, "before" screenshots, Chrome preflight)
- [x] No watch-mode flags; no test-framework introduced
- [x] Feedback latency < 60 s for the build/lint gate
- [x] `nyquist_compliant: true` set in frontmatter (plan-level checks pass; `wave_0_complete` flips true at execution)

**Approval:** approved 2026-07-28 (plan-level; plan-checker Dimension 8 passed)
