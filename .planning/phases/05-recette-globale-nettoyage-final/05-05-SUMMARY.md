---
phase: 05-recette-globale-nettoyage-final
plan: 05
subsystem: testing
tags: [qa, recette, regression, capacitor, ios, android, lint, build, code-splitting, firebase]

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
  - 05-QA-CHECKLIST.md — checklist de recette globale fusionnee (8 groupes de flux, iOS + Android), revue et approuvee
  - Gate automatise pre-recette valide (lint vert + build vert + cap sync iOS + Android)
  - Plateforme native Android ajoutee au repo (npx cap add android)
  - Cablage GoogleService-Info.plist restaure (correctif Firebase iOS)
affects: [milestone-v2.0-closure, QA-01]

# Tech tracking
tech-stack:
  added:
    - "Plateforme native Android (android/) via npx cap add android"
  patterns:
    - "Recette globale fusionnee en passe unique finale (D-13) apres tout le travail de phase"
    - "Colonnes PASS/FAIL par plateforme (iOS + Android) dans un meme document (D-11)"

key-files:
  created:
    - .planning/phases/05-recette-globale-nettoyage-final/05-QA-CHECKLIST.md
    - android/ (scaffold natif Capacitor)
    - ios/App/App/GoogleService-Info.plist (restaure)
  modified:
    - ios/App/App.xcodeproj/project.pbxproj (cablage GoogleService-Info.plist + entitlements)

key-decisions:
  - "cap sync a reussi sur Node v26 dans l'env courant — le blocker Node>=22 des Deferred Items ne s'applique plus"
  - "Plateforme Android ajoutee (npx cap add android) car le repo etait iOS-only et D-11 exige les 2 plateformes"
  - "Recette validee sur relecture de checklist (approbation qualifiee), pas sur execution device scenario-par-scenario"

patterns-established:
  - "Gate automatise (lint+build+cap sync) execute avant la passe device manuelle"

requirements-completed: [QA-01]

# Metrics
duration: ~1 session (taches auto + scaffold Android + correctif Firebase + cloture checkpoint)
completed: 2026-07-31
---

# Phase 5 Plan 05 : Recette globale & cloture v2.0 Summary

**Checklist de recette globale fusionnee (8 groupes de flux, iOS + Android) livree et approuvee par relecture, gate automatise pre-recette vert (lint 0 probleme, build avec chunks lazy separes, cap sync iOS + Android), plateforme Android ajoutee, et incident de cablage GoogleService-Info.plist trouve puis corrige pendant la recette — QA-01 satisfait, refactor v2.0 clos.**

> STATUT : PLAN CLOS. Les 3 taches sont terminees. La Task 3 (`checkpoint:human-verify`,
> bloquant) a recu une **approbation qualifiee** de l'utilisateur : validation par **relecture**
> integrale de la checklist, pas par une execution device scenario-par-scenario. L'app boote sur
> iPhone physique apres le correctif Firebase. C'est le **dernier plan de la Phase 5** et du
> milestone v2.0.

## Performance

- **Duration:** taches auto ~3 min + scaffold Android + correctif Firebase + cloture checkpoint
- **Started (auto tasks):** 2026-07-31T17:26:19Z
- **Completed:** 2026-07-31 (apres reponse utilisateur au checkpoint)
- **Tasks:** 3 / 3 (Task 3 approuvee au checkpoint)
- **Files created/modified:** 05-QA-CHECKLIST.md (cree), android/ (scaffold), GoogleService-Info.plist (restaure), project.pbxproj (cable)

## Accomplishments

- **Task 1 — Checklist de recette globale fusionnee (D-10/D-12) :** `05-QA-CHECKLIST.md` cree,
  couvrant les 8 groupes de flux critiques (carte, fiche spot, favoris, avis, session,
  ajout/edition spot, profil, auth) avec colonnes PASS/FAIL par plateforme. Section dediee aux
  verifications specifiques Phase 5 (resilience chunk-load, reset d'etat au logout, confirmation
  de suppression via Modal app, message d'inscription en Toast). Section separee des 2 exclusions
  connues D-12 (push notif iPhone, liste pays CommunityStats). Exigence iOS + Android reels (D-11)
  et passe unique finale (D-13) actees.
- **Task 2 — Gate automatise pre-recette :** `npm run lint` vert (exit 0, 0 probleme — cible D-01
  atteinte), `npm run build` vert (chunks lazy `Map`, `AdminDashboard`, `PremiumModal` bien emis
  separement, confirmant le split 05-04), `npx cap sync` reussi pour **iOS et Android** apres
  ajout de la plateforme Android.
- **Ajout plateforme Android :** `npx cap add android` (le repo etait iOS-only), puis
  `npm run build && npx cap sync` relance pour que les 2 shells natifs embarquent les chunks lazy
  hashes — requis par D-11.
- **Task 3 — Recette manuelle (approuvee au checkpoint) :** l'utilisateur a valide la recette par
  relecture integrale de la checklist. App verifiee au boot sur iPhone physique (post-correctif
  Firebase). Aucune regression nouvelle signalee ; exclusions D-12 confirmees hors perimetre.
- **Incident trouve et corrige pendant la recette :** cablage `GoogleService-Info.plist` +
  `project.pbxproj` restaure (crash `FirebaseApp.configure()` au 1er lancement iOS).

## Task Commits

1. **Task 1 : Checklist de recette globale fusionnee** — `dfe1545` (docs)
2. **Task 2 : Gate automatise (lint + build + cap sync)** — `9ccee69` (docs/SUMMARY ; pas de modif
   source propre, le copy web de cap sync va dans les `public/` natifs gitignored)
3. **Ajout plateforme Android (D-11)** — `db0bb73` (feat)
4. **Correctif Firebase (hors recette, fix environnement)** — `ecdabca` (fix)
5. **Task 3 : cloture recette (checklist revue + SUMMARY)** — commit docs de cloture de ce plan

_Note : Task 1 et Task 2 etaient deja committees avant le checkpoint ; le scaffold Android
(`db0bb73`) et le correctif Firebase (`ecdabca`) ont ete faits pendant/apres le checkpoint._

## Files Created/Modified

- `.planning/phases/05-recette-globale-nettoyage-final/05-QA-CHECKLIST.md` — checklist de recette
  globale fusionnee, mise a jour avec le statut d'approbation par relecture (§0 gate vert, §1
  banniere de transparence, §4 verdict qualifie, §5 incident Firebase)
- `android/` — scaffold natif Capacitor Android (nouvelle plateforme)
- `ios/App/App/GoogleService-Info.plist` — config Firebase iOS restauree
- `ios/App/App.xcodeproj/project.pbxproj` — cablage GoogleService-Info.plist (fileRef, build file
  Resources, App.entitlements, CODE_SIGN_ENTITLEMENTS) + bump MARKETING_VERSION 1.1.3 → 1.1.5

## Résultats du gate automatisé (Task 2)

| Gate | Commande | Résultat |
|------|----------|----------|
| Lint | `npm run lint` (`eslint .`) | **VERT** — exit 0, 0 probleme (cible D-01 atteinte) |
| Build | `npm run build` (`tsc -b && vite build`) | **VERT** — `✓ built in 3.97s`, aucune erreur TS |
| Sync natif | `npx cap sync` | **OK (iOS + Android)** — apres `npx cap add android` |

**Chunks lazy emis (preuve du split 05-04 dans le build) :**
`Map-DU5ND9-h.js` (41.6 kB / gzip 13.7 kB), `AdminDashboard-CCb47_W6.js` (14.4 kB / gzip 3.9 kB),
`PremiumModal-cFN6kKJU.js` (1.4 kB / gzip 0.7 kB), separes de l'entree `index-CJYPvb2l.js`.

## Nature de l'approbation (transparence)

L'approbation de la Task 3 est **qualifiee**. Reponse exacte de l'utilisateur :
_« L'essentiel me semble correct, je n'ai pas teste les points un par un, mais je les ai
parcourus en les lisant et tout me semble bon, on valide. »_

- **Verifie sur device reel :** l'app boote et tourne sur iPhone physique (post-correctif
  Firebase — c'est en la lancant que le crash a ete detecte).
- **NON execute ligne a ligne :** chaque scenario PASS/FAIL n'a pas ete joue un a un sur iOS +
  Android. Les cases ☐ de la checklist restent non cochees : elles representent une **revue**
  approuvee, pas une execution device certifiee par ligne.
- **A ne PAS surinterpreter** comme « 100% PASS exhaustif iOS + Android, zero regression certifiee
  par scenario ».

## Decisions Made

- **cap sync non bloque :** contrairement aux Deferred Items historiques de STATE.md, l'env
  courant tourne en **Node v26** et `npx cap sync` a reussi (iOS + Android). Le blocker Node>=22
  ne s'applique plus.
- **Ajout Android :** le repo etait iOS-only ; D-11 exige les 2 plateformes → `npx cap add android`.
- **Approbation par relecture :** l'utilisateur a explicitement choisi de valider sur relecture
  plutot qu'execution device exhaustive ; documente comme tel sans surinterpretation.

## Deviations from Plan

### Ajouts / correctifs hors des 3 taches nominales

**1. [Rule 3 - Blocking] Ajout de la plateforme native Android**
- **Found during:** Task 2 (cap sync) — le repo n'avait qu'un dossier `ios/`, `cap sync` ne
  pouvait pas synchroniser Android, alors que D-11 exige les 2 plateformes.
- **Fix:** `npx cap add android` puis `npm run build && npx cap sync`.
- **Files:** `android/` (scaffold)
- **Committed in:** `db0bb73` (feat)

**2. [Env fix] Restauration du cablage GoogleService-Info.plist**
- **Found during:** premiere tentative de lancement Xcode sur device iOS pendant la recette
  (crash `FirebaseApp.configure() could not find a valid GoogleService-Info.plist`).
- **Root cause:** un `git stash -u` orchestrateur **anterieur a la phase** avait happe le fichier
  non suivi `GoogleService-Info.plist` et son cablage `project.pbxproj` etait mid-edit dans le
  meme stash. Pas une regression du code Phase 5.
- **Fix:** restauration du fichier + du diff pbxproj isole qui le reference (fileRef, build file
  Resources, App.entitlements, CODE_SIGN_ENTITLEMENTS).
- **Files:** `ios/App/App/GoogleService-Info.plist`, `ios/App/App.xcodeproj/project.pbxproj`
- **Committed in:** `ecdabca` (fix) — commit isole, non bundle avec la recette.

---

**Total deviations :** 1 blocking (scaffold Android) + 1 fix environnement (Firebase). Les deux
necessaires a la recette cross-platform (D-11) et au boot iOS. Pas de scope creep sur le code
applicatif.

## Issues Encountered

- **Plateforme Android absente au demarrage :** resolue par `npx cap add android` (voir deviation 1).
- **Crash Firebase au boot iOS :** resolu par restauration du cablage GoogleService-Info.plist
  (voir deviation 2). Cause racine = operation git orchestrateur, pas le code de phase.
- **ios/App/Podfile & Podfile.lock modifies par `pod install` :** deja modifies dans l'etat git
  initial, laisses non commites — hors perimetre recette.

## User Setup Required

None — aucune config de service externe nouvelle. La passe device a ete validee par l'utilisateur
au checkpoint.

## Next Phase Readiness

- **QA-01 satisfait** (approbation qualifiee) ; **milestone v2.0 clos** — c'est le dernier plan de
  la derniere phase.
- Plateforme Android desormais dans le repo pour toute recette/build future.
- **Suivi recommande (non bloquant) :** une passe device exhaustive scenario-par-scenario sur iOS
  + Android reste souhaitable avant une release store, puisque l'approbation actuelle est une
  relecture. Les 2 bugs D-12 (push notif iPhone, liste pays) restent en backlog hors milestone.

## Self-Check: PASSED

- FOUND: `.planning/phases/05-recette-globale-nettoyage-final/05-QA-CHECKLIST.md`
- FOUND: `.planning/phases/05-recette-globale-nettoyage-final/05-05-SUMMARY.md`
- FOUND: `ios/App/App/GoogleService-Info.plist`
- FOUND commit: `dfe1545` (Task 1), `9ccee69` (Task 2/SUMMARY), `db0bb73` (Android), `ecdabca` (Firebase fix)

---
*Phase: 05-recette-globale-nettoyage-final*
*Completed: 2026-07-31 — dernier plan de la Phase 5, cloture du milestone v2.0*
