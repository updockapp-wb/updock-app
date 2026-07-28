# Requirements: Updock — v2.0 Refactor UI/UX & Performance

**Defined:** 2026-07-28
**Core Value:** Trouver et découvrir des spots de pumpfoil partout dans le monde — simplicité et beauté avant tout.
**Milestone goal:** Résorber la dette technique et l'incohérence visuelle — app plus rapide, plus légère, plus maintenable, visuellement homogène, sans aucune régression fonctionnelle.

> **Nature du milestone :** refactor interne. Les requirements décrivent des états observables du code et de l'UI (pas de nouvelles fonctionnalités user). Chaque requirement doit être vérifiable sans altérer le comportement utilisateur existant.

## v2.0 Requirements

### Design System (DS)

- [x] **DS-01**: Un fichier de tokens unique centralise couleurs, typographie, espacements, rayons et ombres ; aucune valeur de design en dur dispersée dans les composants migrés
- [x] **DS-02**: Des composants maîtres réutilisables existent avec leurs variantes : Button, Card, Input, Modal, Header
- [x] **DS-03**: Un document d'audit d'architecture décrit l'état actuel (structure, dépendances, dette, incohérences UI) et fixe des cibles de performance/bundle chiffrées

### Navigation & Vue Carte (NAV / MAP)

- [ ] **NAV-01**: La navigation globale et la bottom bar utilisent les composants et tokens du design system
- [ ] **MAP-01**: La vue Carte ne re-render pas les markers dont les données n'ont pas changé (mémoïsation vérifiée au profiler)
- [ ] **MAP-02**: La gestion du cache/médias de la vue Carte est optimisée (chargement conditionnel, pas de fuite mémoire sur les aperçus)

### Harmonisation des écrans (UI)

- [ ] **UI-01**: La fiche détail spot utilise exclusivement les composants du design system (Card, Header, Button, Modal)
- [ ] **UI-02**: L'écran Profil utilise exclusivement les composants du design system
- [ ] **UI-03**: Les formulaires d'ajout/édition de spot et le système de favoris utilisent les composants du design system (Input, Button, Modal)

### Performance (PERF)

- [ ] **PERF-01**: Les re-renders inutiles des écrans de navigation et de la vue Carte sont éliminés (avant/après vérifié au React Profiler)
- [ ] **PERF-02**: Les images/médias des fiches détaillées et des profils sont chargés en lazy loading
- [ ] **PERF-03**: La taille des bundles est réduite par rapport à la baseline de DS-03 (cible chiffrée atteinte)

### Qualité de code (CODE)

- [ ] **CODE-01**: Le code mort et les dépendances obsolètes/inutilisées sont identifiés puis supprimés
- [ ] **CODE-02**: La gestion d'état est homogénéisée — patterns cohérents entre les différents contexts/providers

### Robustesse (ROBUST)

- [ ] **ROBUST-01**: Les formulaires valident les données saisies et affichent des messages d'erreur clairs et cohérents
- [ ] **ROBUST-02**: Les appels API en échec sont gérés avec un feedback utilisateur cohérent (loading / erreur / retry) sans crash ni état bloqué

### Recette & non-régression (QA)

- [ ] **QA-01**: Une checklist des flux critiques (carte, fiche spot, favoris, avis, session, ajout/édition spot, profil, auth) passe à 100% en test manuel mobile après chaque phase — zéro régression fonctionnelle

## Future Requirements (hors v2.0)

- **DS-04**: Étendre le design system aux composants secondaires (toasts, tabs, badges, skeletons)
- **PERF-04**: Virtualisation de la liste des spots si le catalogue grossit fortement
- **CODE-03**: Introduire une infra de test automatisé (nécessite décision explicite — contrainte projet actuelle : pas de tests)

## Out of Scope

| Exclusion | Raison |
|-----------|--------|
| Nouvelle direction visuelle / rebranding | Milestone = harmonisation de l'existant, pas de refonte du langage visuel |
| Nouvelles fonctionnalités utilisateur | Milestone strictement refactor / dette technique |
| Refactor du stockage des types de spot (JSON string) | Fragile mais fonctionnel ; hors scope, risque de régression élevé |
| Introduction d'une infra de test automatisé | Contrainte projet « pas de tests » ; recette manuelle par checklist |
| Fix du bug notifications push iPhone | Bug fonctionnel orthogonal ; traité hors de ce milestone |
| Migration de framework / réécriture majeure | Approche incrémentale imposée, pas de big-bang |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DS-01 | Phase 1 | Validated (2026-07-29, override on literal "no hardcoded value" wording — see 01-VERIFICATION.md) |
| DS-02 | Phase 1 | Validated (2026-07-29) |
| DS-03 | Phase 1 | Validated (2026-07-29) |
| NAV-01 | Phase 2 | Pending |
| MAP-01 | Phase 2 | Pending |
| MAP-02 | Phase 2 | Pending |
| PERF-01 | Phase 2 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| UI-03 | Phase 4 | Pending |
| ROBUST-01 | Phase 4 | Pending |
| ROBUST-02 | Phase 4 | Pending |
| CODE-01 | Phase 5 | Pending |
| CODE-02 | Phase 5 | Pending |
| PERF-03 | Phase 5 | Pending |
| QA-01 | Phase 5 | Pending |

**Coverage:**
- v2.0 requirements: 17 total
- Mapped to phases: 17/17 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-07-28 — Milestone v2.0 Refactor UI/UX & Performance*
*Traceability filled: 2026-07-28 — Roadmap created (5 phases)*
