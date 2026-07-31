# Phase 5: Recette globale & nettoyage final - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-31
**Phase:** 5-Recette globale & nettoyage final
**Areas discussed:** Périmètre nettoyage code (CODE-01), Homogénéisation état (CODE-02), Stratégie réduction bundle (PERF-03), Checklist de recette globale (QA-01)

---

## Périmètre nettoyage code (CODE-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Tout corriger | Dette lint + code mort + deps obsolètes, `npm run lint` doit finir vert | ✓ |
| Code mort/deps strict seulement | Lecture littérale de CODE-01, dette lint en backlog | |
| Cas par cas | Corriger les problèmes rapides/sûrs, laisser les changements risqués en backlog | |

**User's choice:** Tout corriger (Recommandé)
**Notes:** 34 problèmes lint accumulés depuis Phase 1 (27 erreurs / 7 warnings) — any types, react-refresh, set-state-in-effect, exhaustive-deps.

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, l'inclure | `cacheSpotImages()` (thread bloqué) inclus dans le périmètre | ✓ |
| Non, hors périmètre | Reste backlog pour phase future | |

**User's choice:** Oui, l'inclure (Recommandé)
**Notes:** Déféré depuis Phase 2 (`02-CONTEXT.md`), risque jugé faible (fonction utilitaire isolée).

| Option | Description | Selected |
|--------|-------------|----------|
| Suppression des packages inutilisés uniquement | knip/depcheck déjà installés, pas de bump de version | ✓ |
| Suppression + mises à jour mineures/patch | Bump versions mineures/patch en plus | |

**User's choice:** Suppression des packages inutilisés uniquement (Recommandé)
**Notes:** Évite le risque de régression lié aux breaking changes de version.

---

## Homogénéisation état (CODE-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Oui | Extraire hooks/constantes des 3 contexts concernés (Language/Sessions/Spots) vers fichiers séparés | ✓ |
| Non, laisser tel quel | Warning jugé cosmétique | |

**User's choice:** Oui (Recommandé)
**Notes:** Résout le warning `react-refresh/only-export-components` ET aligne la structure de fichiers.

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, auditer et aligner tous les contexts | Étendre le pattern d'erreur Phase 4 (rethrow + Toast) à Auth/Profile/Sessions | ✓ |
| Non, rester sur Spots/Favorites | Périmètre ROBUST-01/02 restait formulaires/favoris | |

**User's choice:** Oui, auditer et aligner tous les contexts (Recommandé)
**Notes:** Cohérence totale avant de clore le milestone.

---

## Stratégie réduction bundle (PERF-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Code-splitting/lazy-load | Dynamic import pour Mapbox GL et librairies lourdes | ✓ |
| Suppression deps + tree-shaking | Gains plus modérés, pas de changement de chargement | |
| Combiner les deux | Approche la plus complète | |

**User's choice:** Code-splitting/lazy-load (Recommandé)
**Notes:** Mapbox GL = 54.5% du bundle gzip, plus gros levier identifié par l'audit Phase 1 ; cible -15% déjà fixée (504.17→≈428.5 kB).

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton/spinner sur la zone carte | Placeholder pendant le chargement du chunk Mapbox | ✓ |
| Précharger Mapbox dès le login | Dynamic import déclenché en arrière-plan post-auth | |

**User's choice:** Skeleton/spinner sur la zone carte (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, tous les écrans/modales non critiques | AdminDashboard + PremiumModal + autres en React.lazy | ✓ |
| Mapbox uniquement | Se concentrer sur le plus gros levier | |

**User's choice:** Oui, tous les écrans/modales non critiques (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, même méthodologie | Reproduire build-size.txt/stats.html de Phase 1 | ✓ |
| Claude décide au planning | Outillage laissé à la discrétion | |

**User's choice:** Oui, même méthodologie (Recommandé)

---

## Checklist de recette globale (QA-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Checklist complète de régression globale | Fusion des checklists Phases 2/3/4 + avis/session/auth | ✓ |
| Checklist ciblée sur les changements Phase 5 | Vérifier seulement ce que Phase 5 touche | |

**User's choice:** Checklist complète de régression globale (Recommandé)
**Notes:** Recette de clôture du milestone v2.0 entier.

| Option | Description | Selected |
|--------|-------------|----------|
| iOS uniquement | Cohérent avec Phases 3/4 | |
| iOS + Android | Couverture cross-platform pour la clôture du milestone | ✓ |

**User's choice:** iOS + Android
**Notes:** Divergence assumée par rapport au précédent iOS-only des Phases 3/4 — changements transverses (state/bundle) jugés à risque cross-platform.

| Option | Description | Selected |
|--------|-------------|----------|
| Les lister explicitement comme exclusions connues | Documenter push-notif + country-list comme "connus, hors périmètre" | ✓ |
| Ne pas les mentionner | Gérés séparément via les todos existants | |

**User's choice:** Les lister explicitement comme exclusions connues (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Passe finale unique | Recette après que tout le nettoyage/bundle soit terminé | ✓ |
| Recette intermédiaire après le code-splitting | Isoler la source d'une éventuelle régression | |

**User's choice:** Passe finale unique (Recommandé)

---

## Claude's Discretion

- Nommage exact et emplacement des fichiers extraits pour l'homogénéisation CODE-02 (D-04).
- Détail technique du découpage React.lazy/Suspense (granularité des chunks, D-06/D-08).
- Choix entre `knip` et `depcheck` (ou les deux) pour l'identification des deps mortes (D-03).
- Liste exacte des composants/modales inclus dans "écrans non critiques" au-delà d'AdminDashboard/PremiumModal (D-08).

## Deferred Ideas

None — discussion stayed within phase scope.

**Reviewed but not folded:**
- `.planning/todos/country-list-incomplete-other-emoji.md` — référencé comme exclusion connue dans QA-01, pas corrigé (bug de données, pas de nettoyage/perf/état).
- `.planning/todos/push-notif-no-popup-iphone.md` — référencé comme exclusion connue dans QA-01, explicitement hors milestone.
