# Roadmap: Updock — 1.2.0 Refactor UI/UX & Performance

## Overview

Ce milestone est un refactor interne : aucune nouvelle fonctionnalité utilisateur, zéro régression fonctionnelle. On part d'un audit chiffré et de la construction d'un design system centralisé (tokens + composants maîtres), puis on adopte ce design system écran par écran de façon incrémentale — navigation et carte, fiches détaillées et profils, formulaires et interactions — en optimisant la performance à chaque étape. Le milestone se clôt par un nettoyage global (code mort, dépendances, gestion d'état), une réduction mesurée du bundle et une recette manuelle de non-régression. Chaque phase valide un périmètre cohérent, un module à la fois, avec la checklist de flux critiques comme filet de sécurité permanent.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Numérotation remise à 1 : les phases v1.1.3 (01→09) sont archivées dans `.planning/archive/v1.1.3-community-features/`.

- [x] **Phase 1: Audit & Design System** - Audit d'architecture chiffré + tokens centralisés + composants maîtres réutilisables (completed 2026-07-28)
- [x] **Phase 2: Navigation & Vue Carte / Spots** - Adoption du design system sur la nav + optimisation rendu/markers/cache de la carte (completed 2026-07-29)
- [x] **Phase 3: Fiches Détaillées & Profils** - Harmonisation UI des fiches et profils + lazy loading des médias (completed 2026-07-30)
- [x] **Phase 4: Formulaires & Interactions** - Harmonisation UI des formulaires/favoris + validation et gestion d'erreurs robustes (completed 2026-07-31)
- [x] **Phase 5: Recette globale & nettoyage final** - Suppression code mort/deps, homogénéisation d'état, réduction bundle, non-régression (completed 2026-07-31)

## Phase Details

### Phase 1: Audit & Design System

**Goal**: Établir la fondation du refactor : une photographie chiffrée de l'existant et un design system centralisé (tokens + composants maîtres) prêt à être adopté par les phases suivantes.
**Depends on**: Nothing (first phase)
**Requirements**: DS-01, DS-02, DS-03
**Success Criteria** (what must be TRUE):

  1. Un document d'audit d'architecture existe et décrit l'état actuel (structure, dépendances, dette, incohérences UI) avec des cibles de performance et de bundle chiffrées servant de baseline.
  2. Un fichier de tokens unique centralise couleurs, typographie, espacements, rayons et ombres.
  3. Les composants maîtres réutilisables Button, Card, Input, Modal et Header existent avec leurs variantes et consomment les tokens (aucune valeur de design en dur dans ces composants).
  4. Les tokens sont extraits des valeurs de design réellement présentes dans l'app existante — l'apparence des écrans reste inchangée (harmonisation de l'existant, pas de rebranding).

**Plans**: 6 plans (4 waves)
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Baseline oracle & audit env gate (audit dir, Chrome preflight, before-screenshots) [Wave 1]
- [x] 01-02-PLAN.md — Architecture audit DS-03 (bundle/deps/perf baseline + 01-AUDIT.md) [Wave 1]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Token canonicalization DS-01 (src/index.css) [Wave 2]

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md — Master components: Modal + Input + Button [Wave 3]
- [x] 01-05-PLAN.md — Master components: Card + Header [Wave 3]

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-06-PLAN.md — AuthModal proof migration D-09 [Wave 4]

**UI hint**: yes

### Phase 2: Navigation & Vue Carte / Spots

**Goal**: Migrer la navigation globale et la vue Carte vers le design system, et éliminer les re-renders et fuites mémoire de l'écran le plus critique de l'app.
**Depends on**: Phase 1
**Requirements**: NAV-01, MAP-01, MAP-02, PERF-01
**Success Criteria** (what must be TRUE):

  1. La navigation globale et la bottom bar utilisent les composants et tokens du design system, sans changement de comportement pour l'utilisateur.
  2. Au React Profiler, les markers de la carte ne se re-render plus quand leurs données n'ont pas changé (mémoïsation vérifiée avant/après).
  3. Le cache/médias de la vue Carte est optimisé (chargement conditionnel) et ne présente plus de fuite mémoire sur les aperçus.
  4. Les re-renders inutiles des écrans de navigation et de la vue Carte sont éliminés, mesure avant/après à l'appui.
  5. La checklist de recette manuelle sur carte et navigation passe à 100% — aucune régression fonctionnelle.

**Plans**: 3 plans (2 waves)
Plans:
**Wave 0** *(baseline gate — doit précéder tout refactor)*

- [x] 02-01-PLAN.md — Baseline Profiler/mémoire + audit consommateurs Modal [Wave 0]

**Wave 1** *(parallèle, fichiers disjoints — bloqué sur Wave 0)*

- [x] 02-02-PLAN.md — Vue Carte : couleurs markers (MAP_COLORS), split-memoization, fix fuite mémoire aperçus [Wave 1]
- [x] 02-03-PLAN.md — Navigation & filtres : extension Modal (light/sheet), migration FiltersModal, wiring tokens + mémoïsation nav-shell NavBar/App (PERF-01) [Wave 1]

**UI hint**: yes

### Phase 3: Fiches Détaillées & Profils

**Goal**: Harmoniser visuellement la fiche détail spot et l'écran Profil via le design system, et charger leurs médias en lazy loading.
**Depends on**: Phase 2
**Requirements**: UI-01, UI-02, PERF-02
**Success Criteria** (what must be TRUE):

  1. La fiche détail spot utilise exclusivement les composants du design system (Card, Header, Button, Modal).
  2. L'écran Profil utilise exclusivement les composants du design system.
  3. Les images et médias des fiches détaillées et des profils sont chargés en lazy loading.
  4. La checklist de recette manuelle sur fiche spot et profil passe à 100% — comportement utilisateur inchangé.

**Plans**: 6 plans (4 waves)
Plans:
**Wave 0** *(baseline gate — doit précéder tout refactor)*

- [x] 03-01-PLAN.md — Baseline réseau chiffrée (métriques A/B/C) + audit consommateurs Modal + captures AVANT [Wave 0]

**Wave 1** *(parallèle, fichiers disjoints — bloqué sur Wave 0)*

- [x] 03-02-PLAN.md — Extension Modal (3e forme light+center) + migration PremiumModal (Modal + Header + tokens) [Wave 1]
- [x] 03-03-PLAN.md — Migration Profile + CommunityStatsScreen (Card ×4, Button secondary, wiring tokens) [Wave 1]
- [x] 03-04-PLAN.md — SpotDetail : wiring tokens + rayons canoniques, coque vaul/layoutId gelés [Wave 1]

**Wave 2** *(bloqué sur 03-04 — fichier SpotDetail partagé)*

- [x] 03-05-PLAN.md — Lazy loading (loading="lazy" ×3 + prefetch voisins ±1 lightbox) + mesure PERF-02 APRÈS [Wave 2]

**Wave 3** *(phase gate — bloqué sur toutes les waves précédentes)*

- [x] 03-06-PLAN.md — Preuve byte-identité CSS + comparaison visuelle 5 surfaces + recette QA-01 device à 100% [Wave 3]

**UI hint**: yes

### Phase 4: Formulaires & Interactions

**Goal**: Migrer les formulaires d'ajout/édition de spot et le système de favoris vers le design system, et fiabiliser la validation des données et la gestion des erreurs API.
**Depends on**: Phase 3
**Requirements**: UI-03, ROBUST-01, ROBUST-02
**Success Criteria** (what must be TRUE):

  1. Les formulaires d'ajout/édition de spot et le système de favoris utilisent les composants du design system (Input, Button, Modal).
  2. Les formulaires valident les données saisies et affichent des messages d'erreur clairs et cohérents.
  3. Les appels API en échec sont gérés avec un feedback utilisateur cohérent (loading / erreur / retry), sans crash ni état bloqué.
  4. La checklist de recette manuelle sur ajout/édition de spot et favoris passe à 100% — aucune régression fonctionnelle.

**Plans**: 6 plans (3 waves)
Plans:
**Wave 1** *(fondations, fichiers disjoints)*

- [x] 04-01-PLAN.md — Extension Input (surface light + multiline + maxLength + error) + clés i18n validation/confirmation/favori [Wave 1]
- [x] 04-02-PLAN.md — Propagation d'erreur contexts : updateSpot rethrow + Toast approve/delete, toggleFavorite Promise rejetante (ROBUST-02) [Wave 1]

**Wave 2** *(migrations formulaires/favoris, fichiers disjoints — bloqué sur Wave 1)*

- [x] 04-03-PLAN.md — AddSpotForm : champs→Input, submit→Button, validation client, confirmation douce pas-de-photo (D-04) [Wave 2]
- [x] 04-04-PLAN.md — SpotDetail : bouton favori Button iconOnly + toast revert (D-08/D-10), édition inline→Input/Button + validation/erreur inline [Wave 2]
- [x] 04-05-PLAN.md — AdminDashboard édition→Input/Button + i18n + feedback (D-09) + App.tsx bouton favori liste (D-10) [Wave 2]

**Wave 3** *(phase gate — bloqué sur Wave 2)*

- [x] 04-06-PLAN.md — Checklist recette manuelle 04-QA-CHECKLIST + build/lint verts + recette device 100% (QA-01) [Wave 3]

**UI hint**: yes

### Phase 5: Recette globale & nettoyage final

**Goal**: Clôturer le refactor : supprimer le code mort et les dépendances obsolètes, homogénéiser la gestion d'état, réduire le bundle sous la cible baseline, et valider la non-régression globale.
**Depends on**: Phase 4
**Requirements**: CODE-01, CODE-02, PERF-03, QA-01
**Success Criteria** (what must be TRUE):

  1. Le code mort et les dépendances obsolètes/inutilisées sont identifiés puis supprimés du projet.
  2. La gestion d'état est homogénéisée — les contexts/providers suivent des patterns cohérents.
  3. La taille des bundles est réduite par rapport à la baseline de DS-03 et atteint la cible chiffrée.
  4. La checklist des flux critiques (carte, fiche spot, favoris, avis, session, ajout/édition spot, profil, auth) passe à 100% en test manuel mobile — zéro régression fonctionnelle sur l'ensemble du milestone.

**Plans**: 5 plans (4 waves)
Plans:
**Wave 1** *(fondations, fichiers disjoints)*

- [x] 05-01-PLAN.md — Split des 7 contexts (use{Name}.ts) + lint 100% vert (CODE-02, CODE-01) [Wave 1]
- [x] 05-02-PLAN.md — Code mort + deps : delete test-fcm.mjs, add geojson, disposition knip (CODE-01) [Wave 1]

**Wave 2** *(bloqué sur 05-01 — fichiers contexts partagés)*

- [x] 05-03-PLAN.md — Harmonisation erreurs D-05 (rethrow/Toast/Modal) + fix cacheSpotImages D-02 (CODE-02, CODE-01) [Wave 2]

**Wave 3** *(bloqué sur 05-03 — Profile.tsx partagé)*

- [x] 05-04-PLAN.md — Code-splitting Map/AdminDashboard/PremiumModal + Error Boundary + mesure bundle (PERF-03) [Wave 3]

**Wave 4** *(phase gate — bloqué sur toutes les waves)*

- [x] 05-05-PLAN.md — Checklist recette globale + gate lint/build/cap sync + recette device iOS+Android 100% (QA-01) [Wave 4]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audit & Design System | 6/6 | Complete   | 2026-07-28 |
| 2. Navigation & Vue Carte / Spots | 3/3 | Complete   | 2026-07-29 |
| 3. Fiches Détaillées & Profils | 6/6 | Complete   | 2026-07-30 |
| 4. Formulaires & Interactions | 6/6 | Complete   | 2026-07-31 |
| 5. Recette globale & nettoyage final | 5/5 | Complete    | 2026-07-31 |
