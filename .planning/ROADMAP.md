# Roadmap: Updock — v2.0 Refactor UI/UX & Performance

## Overview

Ce milestone est un refactor interne : aucune nouvelle fonctionnalité utilisateur, zéro régression fonctionnelle. On part d'un audit chiffré et de la construction d'un design system centralisé (tokens + composants maîtres), puis on adopte ce design system écran par écran de façon incrémentale — navigation et carte, fiches détaillées et profils, formulaires et interactions — en optimisant la performance à chaque étape. Le milestone se clôt par un nettoyage global (code mort, dépendances, gestion d'état), une réduction mesurée du bundle et une recette manuelle de non-régression. Chaque phase valide un périmètre cohérent, un module à la fois, avec la checklist de flux critiques comme filet de sécurité permanent.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Numérotation remise à 1 : les phases v1.1.3 (01→09) sont archivées dans `.planning/archive/v1.1.3-community-features/`.

- [ ] **Phase 1: Audit & Design System** - Audit d'architecture chiffré + tokens centralisés + composants maîtres réutilisables
- [ ] **Phase 2: Navigation & Vue Carte / Spots** - Adoption du design system sur la nav + optimisation rendu/markers/cache de la carte
- [ ] **Phase 3: Fiches Détaillées & Profils** - Harmonisation UI des fiches et profils + lazy loading des médias
- [ ] **Phase 4: Formulaires & Interactions** - Harmonisation UI des formulaires/favoris + validation et gestion d'erreurs robustes
- [ ] **Phase 5: Recette globale & nettoyage final** - Suppression code mort/deps, homogénéisation d'état, réduction bundle, non-régression

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

- [ ] 01-03-PLAN.md — Token canonicalization DS-01 (src/index.css) [Wave 2]

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-04-PLAN.md — Master components: Modal + Input + Button [Wave 3]
- [ ] 01-05-PLAN.md — Master components: Card + Header [Wave 3]

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-06-PLAN.md — AuthModal proof migration D-09 [Wave 4]

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

**Plans**: TBD
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

**Plans**: TBD
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

**Plans**: TBD
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

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audit & Design System | 2/6 | In Progress|  |
| 2. Navigation & Vue Carte / Spots | 0/TBD | Not started | - |
| 3. Fiches Détaillées & Profils | 0/TBD | Not started | - |
| 4. Formulaires & Interactions | 0/TBD | Not started | - |
| 5. Recette globale & nettoyage final | 0/TBD | Not started | - |
