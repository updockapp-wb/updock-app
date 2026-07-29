---
phase: 02-navigation-vue-carte-spots
plan: 01
subsystem: ui
tags: [react, chrome-devtools-mcp, mapbox, performance, memory-baseline, modal]

# Dependency graph
requires:
  - phase: 01-audit-design-system
    provides: "master src/ui/Modal (glass), Header, Button — surface DS à étendre en Plan 03"
provides:
  - "02-BASELINE.md — audit consommateurs Modal + baseline chiffrée Profiler/mémoire/nav-shell (GATE Wave 0 franchi)"
  - "Confirmation grep : AuthModal.tsx est l'unique consommateur de src/ui/Modal (défaut glass rétro-compatible pour l'extension D-02)"
  - "Cause racine identifiée du leak mémoire AddSpotForm (AddSpotForm.tsx:37-66) : composant jamais démonté à la fermeture + useEffect([imagePreviews]) qui révoque à chaque ajout d'image plutôt qu'au démontage"
affects: [02-02, 02-03, PERF-01-verification, MAP-01-verification, MAP-02-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Baseline avant/après chiffrée (renders + mémoire) archivée en phase dir avant tout refactor"
    - "Mesure de renders React sans extension React DevTools : console.count() temporaire + chrome-devtools-mcp, retiré avant commit"
    - "Détection de fuite Blob/object URL : hook JS sur URL.createObjectURL/revokeObjectURL injecté en session (pas de modif source)"

key-files:
  created:
    - .planning/phases/02-navigation-vue-carte-spots/02-BASELINE.md
  modified: []

key-decisions:
  - "AuthModal.tsx confirmé unique consommateur de src/ui/Modal → extension D-02 sûre avec défaut glass (Open Q1 RESOLVED, A2 levée)"
  - "React DevTools extension non disponible dans l'environnement → mesure via chrome-devtools-mcp (Chrome piloté) + instrumentation console.count() temporaire pour les renders, hook createObjectURL/revokeObjectURL pour la mémoire. Méthode documentée dans chaque section de 02-BASELINE.md pour reproductibilité après refactor."
  - "Test mémoire nécessitait un compte connecté (AddSpotForm verrouillé) — utilisateur s'est connecté avec son compte admin de test dans la session Chrome automatisée."

patterns-established:
  - "Pattern : figer la baseline perf/mémoire AVANT le premier changement de code pour rendre PERF-01/MAP-01/MAP-02 mesurables (comparaison avant/après)"
  - "Pattern : instrumentation temporaire (console.count / hooks JS runtime) pour mesurer sans extension navigateur, toujours retirée avant commit (git diff src/ vérifié vide)"

requirements-completed: []  # Baseline chiffrée disponible ; PERF-01/MAP-01/MAP-02/NAV-01 se complètent au refactor (Plans 02/03), pas à ce plan de mesure

# Metrics
duration: ~55min (Task 1 ~4min + Task 2 ~50min, mesure interactive incluant mise en place chrome-devtools-mcp)
completed: 2026-07-29
---

# Phase 2 Plan 01 : Baseline perf/mémoire + audit Modal — Summary

**Audit `grep` confirmant `AuthModal.tsx` comme unique consommateur de `src/ui/Modal`, et baseline chiffrée complète (renders carte, renders nav-shell, fuite mémoire Blob confirmée avec cause racine identifiée dans le code) archivée dans `02-BASELINE.md` AVANT tout refactor.**

## Statut du plan

**COMPLET.** Task 1 (automatisée) et Task 2 (mesure humaine/assistée) terminées. La mesure runtime a été réalisée via `chrome-devtools-mcp` (Chrome piloté par l'agent, MCP installé en cours de session) plutôt que l'extension React DevTools (non installée dans l'environnement) — méthode équivalente ou plus précise sur certains points (comptage exact de renders et de Blob URLs), documentée section par section dans `02-BASELINE.md`.

## Performance

- **Duration:** ~55 min (Task 1 ~4 min ; Task 2 ~50 min incluant installation/approbation du MCP `chrome-devtools`, connexion utilisateur, mesures)
- **Completed:** 2026-07-29
- **Tasks:** 2 / 2
- **Files modified:** 1 (02-BASELINE.md, créé puis complété)

## Accomplishments

- Audit `grep -rn "ui/Modal" src/` → **`src/components/AuthModal.tsx` unique consommateur** (surface glass). Débloque l'extension rétro-compatible de `Modal` en Plan 03 (défaut glass — Pitfall 1 / Open Q1 RESOLVED).
- **Baseline Profiler carte (§2) :** `MapComponent` re-render exactement 1× par clic filtre (14/14 clics, 2 passes complètes, StrictMode ×2 documenté) — aucun render superflu à ce niveau ; l'optimisation MAP-01 porte sur le coût interne du render, pas sur des renders en excès.
- **Baseline nav-shell (§5) :** confirmation chiffrée du problème PERF-01 — `NavBar` (mobile ET desktop) re-render inutilement (2 renders réels chacun) quand `selectedSpot` ou `isAuthModalOpen` changent dans `App.tsx`, alors qu'aucune prop effective de `NavBar` n'a changé. Le toggle de filtre carte, lui, ne déclenche **aucun** render `NavBar` (state bien isolé dans `MapComponent`).
- **Baseline mémoire (§3) :** fuite Blob confirmée — après fermeture d'`AddSpotForm` sans réouverture, **1 URL Blob reste définitivement non révoquée**. Cause racine identifiée par lecture du code (`AddSpotForm.tsx:37-66`) : le composant ne démonte jamais réellement à la fermeture, et le `useEffect(() => {...}, [imagePreviews])` révoque à chaque changement du tableau (donc à chaque ajout d'image) plutôt qu'au vrai démontage — ce qui masque une fuite non bornée derrière un compteur "live" qui semble stable à 1.
- Heap snapshots avant/après (5 cycles, 25 images) : +683 KB — signal secondaire faible, corroboré par le compteur Blob (source de vérité).

## Task Commits

1. **Task 1 : Audit Modal + scaffold 02-BASELINE.md** — `ec511a9` (docs)
2. **Task 2 : Baseline chiffrée Profiler/nav-shell/mémoire** — voir commit suivant cette SUMMARY

## Files Created/Modified
- `.planning/phases/02-navigation-vue-carte-spots/02-BASELINE.md` — audit Modal + baseline complète et chiffrée (5 sections)

## Decisions Made
- **AuthModal seul consommateur de `Modal`** : confirmé par grep, entérine le défaut `glass` rétro-compatible pour l'extension D-02 du Plan 03.
- **Méthode de mesure adaptée** : React DevTools extension absente de l'environnement → `chrome-devtools-mcp` (MCP officiel Chrome DevTools) installé en cours de session (scope projet, `.mcp.json`) + instrumentation temporaire (`console.count`, hook `createObjectURL`/`revokeObjectURL`) pour obtenir des chiffres exacts et reproductibles. Toute instrumentation source a été retirée avant commit (`git diff src/` vide, vérifié).
- **Compte de test utilisé pour le test mémoire** : `AddSpotForm` verrouillé sans authentification ; l'utilisateur s'est connecté avec son compte admin existant dans la session Chrome automatisée pour débloquer la mesure.

## Deviations from Plan

Le protocole de mesure a été exécuté avec un outillage différent de celui prescrit (`chrome-devtools-mcp` au lieu de React DevTools extension), suite à une décision explicite de l'utilisateur (installation du MCP en cours de checkpoint). Les chiffres obtenus répondent au même besoin (baseline chiffrée avant/après) et sont documentés comme tels dans `02-BASELINE.md` pour que la mesure "après refactor" utilise la même méthode.

## Issues Encountered
- Clic précis sur les marqueurs de carte (canvas Mapbox, pas de DOM par marqueur) : premiers essais de clic par coordonnées ont manqué la cible ; résolu en passant par un clic sur cluster (zone plus large) puis en affinant, technique validée et réutilisée pour la suite.
- Incident opérationnel (hors périmètre du plan) : une commande `git checkout -- .gitignore` lancée pour retirer un fichier temporaire a accidentellement effacé une modification non committée préexistante de l'utilisateur sur `.gitignore`. Récupérée immédiatement via `git fsck --dangling` (blob orphelin retrouvé et restauré à l'identique). Aucune perte de données au final ; signalé à l'utilisateur en transparence sur le moment.

## Next Phase Readiness
- **GATE Wave 0 franchi.** Les Plans 02 et 03 (Wave 1) peuvent démarrer : la baseline Profiler/mémoire/nav-shell est chiffrée et archivée, rendant PERF-01/MAP-01/MAP-02 vérifiables par comparaison avant/après.
- L'audit Modal (§1) débloque la conception de l'extension `Modal` du Plan 03.
- **Point d'attention pour Plan 02/03 :** la baseline mémoire révèle une cause racine précise (useEffect mal dépendant dans `AddSpotForm.tsx`) qui pourra guider directement le fix MAP-02/D-03 si ce fichier est dans le périmètre de refactor.

## Self-Check: PASSED
- FOUND: .planning/phases/02-navigation-vue-carte-spots/02-BASELINE.md (5 sections chiffrées)
- FOUND commit: ec511a9 (Task 1)
- VERIFIED: git diff src/ vide (instrumentation temporaire retirée)
- VERIFIED: git status propre après incident .gitignore (contenu restauré à l'identique)

---
*Phase: 02-navigation-vue-carte-spots*
*Completed: 2026-07-29*
