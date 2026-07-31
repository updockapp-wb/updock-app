---
phase: 04-formulaires-interactions
plan: 04
subsystem: ui
tags: [react, design-system, capacitor-toast, form-validation, favorites, i18n]

# Dependency graph
requires:
  - phase: 04-01
    provides: "Input surface=light + multiline + maxLength + error ; clés i18n form.error.* / fav.*"
  - phase: 04-02
    provides: "toggleFavorite rejetante (revert + throw) ; updateSpot rethrow"
provides:
  - "Bouton favori de SpotDetail migré vers Button iconOnly (aria-label dynamique, cible 44px, badge cadenas conservé)"
  - "Toast de revert favori (fav.error.revert) déclenché depuis le composant sur rejet de toggleFavorite (D-08)"
  - "Formulaire d'édition inline migré : champs Input surface=light, Save via Button loading"
  - "Validation client de l'édition (nom requis/≤100, desc ≤2000, ≥1 type) avec message inline"
  - "Gestion d'échec API inline (form.error.submit_failed) conservant les données, overlay non bloqué (D-07)"
affects: [04-05, 04-06, AdminDashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bouton favori iconOnly via Button DS + toast de revert depuis le composant (i18n via t())"
    - "Formulaire d'édition : validation client pure avant mutation + inline error surface light (miroir AddSpotForm/AuthModal)"

key-files:
  created: []
  modified:
    - src/components/SpotDetail.tsx

key-decisions:
  - "TDD gate (task 2 tdd=true) non appliqué : PROJECT.md interdit d'introduire une infra de test ; validation via source assertions + build + recette manuelle (04-06)"
  - "Dette Pitfall 3 (URL.createObjectURL(file) L657 sans révocation) laissée en l'état : zone photo non réécrite, bug préexistant hors régression"

patterns-established:
  - "Favori DS : Button variant=ghost iconOnly + override className fond clair (!bg-slate-100) + Toast.show(t('fav.error.revert')) sur .catch()"
  - "Édition inline : setEditError(null) → validations à return anticipé → try/catch updateSpot → setEditError(t('form.error.submit_failed'))"

requirements-completed: [UI-03, ROBUST-01, ROBUST-02]

# Metrics
duration: ~15min
completed: 2026-07-31
---

# Phase 04 Plan 04: SpotDetail — Favori DS + Édition robuste Summary

**Bouton favori migré vers Button iconOnly (44px, aria-label dynamique, badge cadenas) avec toast de revert, et formulaire d'édition inline migré vers Input/Button avec validation client et erreur inline conservant les données.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-31
- **Tasks:** 2
- **Files modified:** 1 (SpotDetail.tsx) + 1 artefact phase (deferred-items.md)

## Accomplishments
- Bouton favori = `Button variant="ghost" iconOnly` avec `aria-label` dynamique (`fav.add`/`fav.remove`), cible tactile portée à 44px (`w-11 h-11`), rendu clair préservé (`!bg-slate-100 hover:!bg-slate-200`) et badge cadenas `!user` conservé verbatim.
- Échec du toggle favori : le context revert l'état optimiste (04-02) ET le composant affiche un toast discret traduit `t('fav.error.revert')` via `.catch()` (D-08).
- Champs nom/description de l'édition inline migrés vers `Input surface="light"` (description `multiline`, `maxLength` 100/2000).
- Bouton Enregistrer migré vers `Button variant="primary" loading={isSaving}` (spinner + disabled gérés par le DS).
- Validation client dans `handleSaveEdit` (nom non vide trim/≤100, description ≤2000, ≥1 type) avec `return` AVANT `updateSpot` ; échec API capté → `setEditError(t('form.error.submit_failed'))`, données conservées, overlay non bloqué (D-07).
- Pills type/difficulté et grille photos conservées verbatim.

## Task Commits

1. **Task 1: Bouton favori → Button iconOnly + toast de revert (D-08, D-10)** - `a8a12f6` (feat)
2. **Task 2: Formulaire d'édition inline → Input/Button + validation + erreur inline** - `2b811b3` (feat)

_Task 2 était marquée `tdd="true"` mais implémentée en une passe (voir Deviations)._

## Files Created/Modified
- `src/components/SpotDetail.tsx` - Bouton favori DS + toast revert ; formulaire d'édition migré (Input/Button) + validation client + inline error ; `editError` state ajouté et nettoyé à l'ouverture/fermeture de l'overlay.
- `.planning/phases/04-formulaires-interactions/deferred-items.md` - Journal de la dette lint repo-wide préexistante (hors scope).

## Decisions Made
- **TDD non appliqué sur Task 2 (`tdd="true"`)** : PROJECT.md pose une contrainte dure — « Pas d'infra de test : aucune infra de test en place — ne pas en introduire sauf si demandé explicitement ». L'orchestrateur n'a passé aucun flag MVP/TDD. Le `<verify>` du plan repose sur des assertions de source + lint + build, et la vérification comportementale relève de la recette manuelle 04-06. Le comportement `<behavior>` (6 cas) est implémenté et couvert par des assertions de source ; les cas runtime seront validés en recette.
- **Dette Pitfall 3 laissée en l'état** : la zone d'aperçu photo (`URL.createObjectURL(file)` sans `revokeObjectURL`, désormais L657) n'a pas été réécrite par cette migration ; fuite préexistante, non introduite ici. À traiter si la grille photo est refondue (pattern ref+revoke d'AddSpotForm).

## Deviations from Plan

### Auto-fixed / Adjusted Issues

**1. [TDD gate non applicable] Task 2 `tdd="true"` implémentée sans cycle RED/GREEN unitaire**
- **Found during:** Task 2
- **Issue:** La tâche demande un flux TDD, mais le projet interdit explicitement d'introduire une infra de test (PROJECT.md Constraints) et aucun runner n'existe.
- **Fix:** Comportement implémenté directement ; vérification via assertions de source (`grep`), `npx eslint` par fichier (0 erreur) et `npm run build` (vert). Validation comportementale déléguée à la recette manuelle 04-06 (approche de test officielle du projet).
- **Files modified:** src/components/SpotDetail.tsx
- **Committed in:** 2b811b3

---

**Total deviations:** 1 ajustement (contrainte projet vs TDD gate).
**Impact on plan:** Aucun scope creep. Les deux surfaces du périmètre (favori + édition) sont livrées conformes aux must_haves.

## Issues Encountered

- **`npm run lint` (= `eslint .`) rouge sur du code préexistant.** Le lint scanne tout le repo et échoue sur 28 erreurs / 7 warnings préexistantes dans d'autres fichiers (`ProfileContext.tsx`, `SessionsContext.tsx`, `SpotsContext.tsx`…). Comptage identique avec ma modification retirée (stash) → aucune erreur/warning introduite par ce plan. `npx eslint src/components/SpotDetail.tsx` est propre (0 erreur, 3 warnings `exhaustive-deps` préexistants sans lien). Détail consigné dans `deferred-items.md` (candidat Phase 5 CODE-01/CODE-02).
- **`npm run build` vert** (2326 modules, tsc + vite OK ; warning de taille de chunk préexistant et sans rapport).

## Known Stubs

Aucun. Les deux surfaces sont pleinement câblées (context favoris + updateSpot réels, i18n effectives).

## Next Phase Readiness
- SpotDetail (favori + édition) entièrement migré vers le DS et durci — prêt pour la recette manuelle 04-06.
- Le pattern d'édition inline (validation + submit_failed inline) est directement réutilisable pour `AdminDashboard` (overlay d'édition identique, D-09).
- Dette lint repo-wide et fuite `createObjectURL` L657 signalées pour un futur plan (hors périmètre 04-04).

---
*Phase: 04-formulaires-interactions*
*Completed: 2026-07-31*
