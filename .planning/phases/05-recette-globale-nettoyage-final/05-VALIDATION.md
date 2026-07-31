---
phase: 05
slug: recette-globale-nettoyage-final
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-31
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (locked project constraint — no automated test infrastructure; CODE-03/test scaffolding is future/out of scope) |
| **Config file** | `eslint.config.js` (lint), `vite.config.ts` (build/analyze) |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` (+ `ANALYZE=1 npm run build` for the bundle treemap) |
| **Estimated runtime** | ~30-60s (lint) / ~2-3 min (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint` — problem count must not increase, target 0 by phase end.
- **After every plan wave:** Run `npm run lint && npm run build` — must be green.
- **Before `/gsd:verify-work`:** Lint green + build green + bundle measured (eager/initial gzip JS vs baseline, per Q1 resolution) + full manual recette (D-10/D-11) at 100%.
- **Max feedback latency:** ~180s (build is the slowest gate).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | CODE-01 | — | N/A | lint+static | `npx knip` / `npm run lint` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | CODE-02 | — | N/A | lint | `npm run lint` (0 `react-refresh`/`any` in context files) | ✅ | ⬜ pending |
| 05-02-01 | 02 | 2 | PERF-03 | — | N/A | measurement | `npm run build` + `ANALYZE=1 npm run build` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 3 | QA-01 | — | N/A | manual (iOS+Android device) | Merged recette checklist (D-10), single final pass (D-13) | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Create the merged QA-01 recette checklist artifact (from Phases 2/3/4 checklists + avis/session/auth flows + D-12 known exclusions) **before** the recette task. Source flows from `src/components/` (Map, SpotDetail, Profile, AuthModal, AddSpotForm, ReviewForm/List, SessionForm/List, AdminDashboard, FiltersModal, SearchModal) and `App.tsx` tabs (map/favorites/list/profile).
- [ ] Create a Phase-5 `audit/` output target (e.g. `.planning/phases/05-recette-globale-nettoyage-final/audit/`) so `ANALYZE=1 npm run build` doesn't overwrite the frozen Phase-1 baseline artifacts.
- [ ] No test framework install — locked "no automated test infrastructure" constraint stays in effect.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full critical-flow regression (carte, fiche spot, favoris, avis, session, ajout/édition spot, profil, auth) | QA-01 | No automated test infra (locked constraint); UI/UX and cross-platform behavior require human judgment | Execute the merged recette checklist (D-10) on real iOS + Android devices (D-11), single final pass after CODE-01/02 + PERF-03 are complete (D-13); log D-12 known exclusions separately from newly found regressions |
| Chunk-load resilience of lazy screens (Map, AdminDashboard, PremiumModal) in Capacitor WebView | PERF-03 / CODE-02 | Dynamic-import failure behavior in the native WebView needs on-device confirmation (Pitfall 1 / A2 in RESEARCH.md) | On each platform, cold-launch the app, navigate to the map tab and open admin/premium flows, confirm no blank screen or unrecoverable error on chunk load |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
