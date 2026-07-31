---
phase: 05-recette-globale-nettoyage-final
plan: 05
subsystem: testing
tags: [qa, recette, regression, capacitor, ios, android, lint, build, code-splitting]

# Dependency graph
requires:
  - phase: 05-01
    provides: split des 7 contextes + lint vert
  - phase: 05-02
    provides: nettoyage code mort / dependances
  - phase: 05-03
    provides: harmonisation gestion d'erreurs + parallelisation cacheSpotImages
  - phase: 05-04
    provides: lazy-loading Map/AdminDashboard/PremiumModal derriere Suspense + Error Boundary
provides:
  - 05-QA-CHECKLIST.md — checklist de recette globale fusionnee (8 groupes de flux, iOS + Android)
  - Gate automatise pre-recette valide (lint vert + build vert + cap sync iOS)
affects: [milestone-v2.0-closure, QA-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Recette globale fusionnee en passe unique finale (D-13) apres tout le travail de phase"
    - "Colonnes PASS/FAIL par plateforme (iOS + Android) dans un meme document (D-11)"

key-files:
  created:
    - .planning/phases/05-recette-globale-nettoyage-final/05-QA-CHECKLIST.md
  modified: []

key-decisions:
  - "cap sync a reussi sur Node v26 dans l'env courant — le blocker Node>=22 des Deferred Items ne s'applique plus"
  - "Seule la plateforme iOS existe dans le repo (pas de dossier android/) — la passe device Android exige d'abord 'npx cap add android'"

patterns-established:
  - "Gate automatise (lint+build+cap sync) execute avant la passe device manuelle"

requirements-completed: []  # QA-01 non satisfait tant que la passe device (Task 3) n'est pas 100% PASS

# Metrics
duration: 3min
completed: 2026-07-31
---

# Phase 5 Plan 05 : Recette globale & gate pre-recette Summary

**Checklist de recette globale fusionnee (8 groupes de flux, iOS + Android) livree, et gate automatise pre-recette vert (lint 0 probleme, build OK avec chunks lazy separes, cap sync iOS) — la passe device manuelle reste a derouler par l'utilisateur (checkpoint bloquant).**

> STATUT : PLAN EN PAUSE AU CHECKPOINT. Les 2 taches auto (Task 1 + Task 2) sont completes et
> commitees. La Task 3 (`checkpoint:human-verify`, gate bloquant) — recette manuelle sur iOS +
> Android reels — n'est PAS executee : seul l'utilisateur peut la realiser sur des devices
> physiques. QA-01 n'est PAS encore satisfait ; le plan 05-05 n'est PAS clos.

## Performance

- **Duration:** ~3 min (taches auto uniquement ; passe device non incluse)
- **Started:** 2026-07-31T17:26:19Z
- **Completed (auto tasks):** 2026-07-31T17:29:16Z
- **Tasks:** 2 / 3 (Task 3 = checkpoint bloquant, en attente utilisateur)
- **Files modified:** 1 cree (05-QA-CHECKLIST.md)

## Accomplishments

- **Task 1 — Checklist de recette globale fusionnee (D-10/D-12) :** `05-QA-CHECKLIST.md` cree,
  couvrant les 8 groupes de flux critiques (carte, fiche spot, favoris, avis, session,
  ajout/edition spot, profil, auth) avec colonnes PASS/FAIL par plateforme. Section dediee aux
  verifications specifiques Phase 5 (resilience chunk-load, reset d'etat au logout, confirmation
  de suppression via Modal app, message d'inscription en Toast). Section separee des 2 exclusions
  connues D-12 (push notif iPhone, liste pays CommunityStats). Exigence iOS + Android reels (D-11)
  et passe unique finale (D-13) actees.
- **Task 2 — Gate automatise pre-recette :** `npm run lint` vert (exit 0, 0 probleme — cible D-01
  atteinte), `npm run build` vert (chunks lazy `Map`, `AdminDashboard`, `PremiumModal` bien
  emis separement, confirmant le split 05-04), `npx cap sync` reussi pour iOS.

## Task Commits

1. **Task 1 : Checklist de recette globale fusionnee** — `dfe1545` (docs)
2. **Task 2 : Gate automatise (lint + build + cap sync)** — pas de commit propre (aucune modif
   source ; le copy web de cap sync va dans `ios/App/App/public`, gitignored ; resultats captures
   dans ce SUMMARY)
3. **Task 3 : Recette manuelle iOS + Android** — NON executee (checkpoint bloquant en attente)

## Files Created/Modified

- `.planning/phases/05-recette-globale-nettoyage-final/05-QA-CHECKLIST.md` — checklist de recette
  globale fusionnee + exclusions connues D-12

## Résultats du gate automatisé (Task 2)

| Gate | Commande | Résultat |
|------|----------|----------|
| Lint | `npm run lint` (`eslint .`) | **VERT** — exit 0, 0 probleme (cible D-01 atteinte) |
| Build | `npm run build` (`tsc -b && vite build`) | **VERT** — `✓ built in 3.97s`, aucune erreur TS |
| Sync natif | `npx cap sync` | **OK (iOS)** — web assets copiees vers `ios/App/App/public`, `pod install` OK, 5 plugins Capacitor detectes |

**Chunks lazy emis (preuve du split 05-04 dans le build) :**
`Map-DU5ND9-h.js` (41.6 kB / gzip 13.7 kB), `AdminDashboard-CCb47_W6.js` (14.4 kB / gzip 3.9 kB),
`PremiumModal-cFN6kKJU.js` (1.4 kB / gzip 0.7 kB), separes de l'entree `index-CJYPvb2l.js`.

## Decisions Made

- **cap sync non bloque :** contrairement aux Deferred Items de STATE.md (« cap sync requiert
  Node >=22, env v20 »), l'env courant tourne en **Node v26.0.0** et `npx cap sync` a reussi.
  Le blocker documente ne s'applique plus ; les shells natifs iOS portent bien les nouveaux
  chunks hashes. La ligne « Env : cap sync Node>=22 » des Deferred Items peut etre marquee resolue.

## Deviations from Plan

None — plan execute conformement pour les 2 taches auto. Le gate acceptance criteria est satisfait
(lint 0, build OK, cap sync OK). Aucun auto-fix Rule 1/2/3 necessaire.

## Issues Encountered

- **Plateforme Android absente du repo :** il n'existe qu'un dossier `ios/` — pas de dossier
  `android/`. `npx cap sync` n'a donc synchronise QUE iOS. Le plan (D-11) exige une passe device
  sur iOS **et** Android. Pour tester sur Android, l'utilisateur devra d'abord ajouter la
  plateforme : `npx cap add android && npm run build && npx cap sync`. Ce point est **surface au
  checkpoint** (Task 3) pour arbitrage utilisateur — non auto-corrige (l'ajout d'un scaffold natif
  Android est une modification structurelle Rule 4, hors du periметre d'un gate, et le repo a
  historiquement ete iOS-only : recettes Phases 3/4 sur iPhone, TestFlight).
- **ios/App/Podfile & Podfile.lock modifies par `pod install` :** ces 2 fichiers apparaissaient
  deja comme modifies dans l'etat git initial (avant toute execution). Laisses non commites — hors
  du periметre « no source changes » de la Task 2 et sans rapport avec le travail de recette.

## User Setup Required

None — aucune config de service externe. Mais la **passe device manuelle (Task 3)** requiert
l'action de l'utilisateur sur des appareils physiques (voir checkpoint ci-dessous).

## Next Phase Readiness

- Checklist prete a piloter la passe device ; gate automatise vert.
- **Bloquant restant :** passe device manuelle iOS + Android (checkpoint Task 3). QA-01 sera
  satisfait et le milestone v2.0 pourra clore **apres** un 100% PASS sur les deux plateformes
  (exclusions D-12 mises a part). Prerequis Android : `npx cap add android` d'abord (plateforme
  absente).

## Self-Check: PASSED

- FOUND: `.planning/phases/05-recette-globale-nettoyage-final/05-QA-CHECKLIST.md`
- FOUND: `.planning/phases/05-recette-globale-nettoyage-final/05-05-SUMMARY.md`
- FOUND commit: `dfe1545` (Task 1)

---
*Phase: 05-recette-globale-nettoyage-final*
*Auto tasks completed: 2026-07-31 — plan en pause au checkpoint (Task 3 pending)*
