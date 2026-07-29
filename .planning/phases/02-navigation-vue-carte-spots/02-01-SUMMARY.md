---
phase: 02-navigation-vue-carte-spots
plan: 01
subsystem: ui
tags: [react, react-devtools-profiler, mapbox, performance, memory-baseline, modal]

# Dependency graph
requires:
  - phase: 01-audit-design-system
    provides: "master src/ui/Modal (glass), Header, Button — surface DS à étendre en Plan 03"
provides:
  - "02-BASELINE.md — audit consommateurs Modal + scaffold Profiler/mémoire/nav-shell (GATE Wave 0)"
  - "Confirmation grep : AuthModal.tsx est l'unique consommateur de src/ui/Modal (défaut glass rétro-compatible pour l'extension D-02)"
affects: [02-02, 02-03, PERF-01-verification, MAP-01-verification, MAP-02-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Baseline avant/après chiffrée (Profiler + Memory) archivée en phase dir avant tout refactor"

key-files:
  created:
    - .planning/phases/02-navigation-vue-carte-spots/02-BASELINE.md
  modified: []

key-decisions:
  - "AuthModal.tsx confirmé unique consommateur de src/ui/Modal → extension D-02 sûre avec défaut glass (Open Q1 RESOLVED, A2 levée)"
  - "Sections Profiler/mémoire/nav-shell laissées non chiffrées : mesure runtime interactive (React DevTools) impossible en CLI — déléguée au checkpoint humain Task 2"

patterns-established:
  - "Pattern : figer la baseline perf/mémoire AVANT le premier changement de code pour rendre PERF-01/MAP-01/MAP-02 mesurables (comparaison avant/après)"

requirements-completed: []  # PERF-01/MAP-01/MAP-02/NAV-01 NON complétés — baseline chiffrée pending (Task 2 humaine)

# Metrics
duration: ~4min
completed: 2026-07-29
---

# Phase 2 Plan 01 : Baseline perf/mémoire + audit Modal — Summary (PARTIEL — checkpoint humain en attente)

**Audit `grep` confirmant `AuthModal.tsx` comme unique consommateur de `src/ui/Modal`, et scaffold `02-BASELINE.md` (5 sections : audit Modal, Profiler carte, mémoire, protocole exact, nav-shell) prêt à recevoir les chiffres — capture Profiler/mémoire déléguée à un checkpoint humain (Task 2).**

## Statut du plan

**PARTIEL.** Task 1 (automatisée) terminée et commitée. **Task 2 est un `checkpoint:human-verify` (gate=blocking)** qui exige une mesure runtime en navigateur (React DevTools Profiler + onglet Memory) — impossible pour un agent CLI. Le plan **n'est PAS complet** : les chiffres Profiler/mémoire/nav-shell AVANT refactor restent à capturer par le dev.

## Performance

- **Duration:** ~4 min (Task 1 uniquement)
- **Completed (Task 1):** 2026-07-29T11:17:57Z
- **Tasks:** 1 / 2 (Task 2 = checkpoint humain, non exécutable par l'agent)
- **Files modified:** 1 créé

## Accomplishments
- Audit `grep -rn "ui/Modal" src/` → **`src/components/AuthModal.tsx` unique consommateur** (surface glass), consigné brut dans `02-BASELINE.md`. Débloque l'extension rétro-compatible de `Modal` en Plan 03 (défaut glass — Pitfall 1 / Open Q1 RESOLVED).
- Création de `02-BASELINE.md` avec les **5 sections** requises : (1) Consommateurs de `src/ui/Modal`, (2) Baseline Profiler carte, (3) Baseline mémoire, (4) Protocole exact (verbatim RESEARCH § PERF-01 + complément nav-shell), (5) Baseline nav-shell.
- Tableaux vides prêts à remplir (filtre/renders/durée/Source-re-render pour la carte ; action non-nav/renders NavBar mobile+desktop/props-inchangées pour le nav-shell ; snapshots + delta rétention Blob/object URLs pour la mémoire). **Aucun chiffre fabriqué.**

## Task Commits

1. **Task 1 : Audit Modal + scaffold 02-BASELINE.md** — `ec511a9` (docs)

_Task 2 (checkpoint:human-verify) : non commitée — en attente de mesure humaine._

## Files Created/Modified
- `.planning/phases/02-navigation-vue-carte-spots/02-BASELINE.md` — audit consommateurs Modal (rempli) + scaffolds Profiler/mémoire/nav-shell (à chiffrer en Task 2)

## Decisions Made
- **AuthModal seul consommateur de `Modal`** : confirmé par grep, entérine le défaut `glass` rétro-compatible pour l'extension D-02 du Plan 03 (aucune régression sur AuthModal).
- **Ne pas chiffrer les sections Profiler/mémoire/nav-shell** : la mesure requiert React DevTools + onglet Memory en navigateur — hors de portée d'un agent CLI. Fabriquer des valeurs invaliderait la comparaison avant/après (PERF-01). Sections laissées explicitement `_(à mesurer)_`.

## Deviations from Plan

None — plan exécuté tel qu'écrit. Task 1 conforme à `<action>` et `<acceptance_criteria>` ; Task 2 correctement identifiée comme gate humain non automatisable (arrêt sans fabrication de chiffres, conformément au protocole de checkpoint).

## Issues Encountered
None.

## Checkpoint en attente (Task 2)

- **Type :** `checkpoint:human-verify` (gate=blocking)
- **Bloqué par :** mesure runtime interactive impossible en CLI (React DevTools Profiler + onglet Memory du navigateur).
- **Action humaine requise :** suivre § 4 « Protocole exact » de `02-BASELINE.md` :
  1. `npm run dev`, ouvrir React DevTools → Profiler.
  2. Toggler chaque filtre carte 2× → noter renders + durée de `MapComponent`, et si `<Source>`/layers re-render (§ 2).
  3. Profiler nav-shell : 3 actions non-nav (ouvrir/fermer SpotDetail, toggle filtre, favori) → noter renders `NavBar` mobile + desktop (§ 5).
  4. Onglet Memory : snapshot → 5 images dans AddSpotForm → fermer → rouvrir/refermer ×5 → snapshot → delta rétention Blob/object URLs (§ 3).
  5. Remplir `02-BASELINE.md` avec toutes les valeurs.
- **Resume-signal :** taper « baseline capturée » une fois `02-BASELINE.md` rempli, ou décrire tout blocage (React DevTools absent, etc.).

## Next Phase Readiness
- **GATE Wave 0 NON franchi.** Les Plans 02 et 03 (Wave 1) ne doivent modifier aucun fichier source tant que les sections Profiler/mémoire/nav-shell de `02-BASELINE.md` ne sont pas chiffrées (sinon PERF-01/MAP-01 deviennent invérifiables).
- L'audit Modal (§ 1) est en revanche complet et débloque déjà la conception de l'extension `Modal` du Plan 03.

## Self-Check: PASSED
- FOUND: .planning/phases/02-navigation-vue-carte-spots/02-BASELINE.md
- FOUND commit: ec511a9 (Task 1)

---
*Phase: 02-navigation-vue-carte-spots*
*Completed (partiel — Task 1): 2026-07-29*
