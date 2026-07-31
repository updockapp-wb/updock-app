---
phase: 04-formulaires-interactions
plan: 05
subsystem: ui
tags: [react, design-system, i18n, forms, validation, favorites, capacitor-toast]

# Dependency graph
requires:
  - phase: 04-01
    provides: Input DS (surface=light, multiline, maxLength) + form.error.* / spot.edit_* i18n keys
  - phase: 04-02
    provides: updateSpot rethrow + toggleFavorite rejecting Promise (optimistic revert)
provides:
  - AdminDashboard edit form migrated to DS (Input/Button) + full i18n + client validation + toast/inline failure feedback (D-09)
  - Favorites-list heart button migrated to DS Button (iconOnly, 44px) + translated revert toast (D-08, D-10)
affects: [04-06 recette manuelle, futures migrations formulaires]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin edit form: same DS+validation+toast pattern as SpotDetail (D-09)"
    - "Optimistic action button: context reverts state + component-level translated Toast on rejection (D-08)"

key-files:
  created: []
  modified:
    - src/components/AdminDashboard.tsx
    - src/App.tsx

key-decisions:
  - "Left preview-modal 'Description' heading (out of scope) untouched — plan migrates only the edit overlay labels"
  - "No test framework was set up for the tdd=true task: project has zero test infra and the plan's verification is grep/lint/build only"

patterns-established:
  - "Inline editError + Toast(form.error.submit_failed) keeps admin overlay open on failure (D-07)"
  - "Button variant=ghost overridden with !p-2/w-11 h-11 to reproduce light rose rendering at 44px touch target"

requirements-completed: [UI-03, ROBUST-01, ROBUST-02]

# Metrics
duration: 12min
completed: 2026-07-31
---

# Phase 4 Plan 05: Édition admin & bouton favori liste → Design System Summary

**Formulaire d'édition inline de l'AdminDashboard migré vers Input/Button avec i18n, validation client et feedback d'échec (toast/inline), et bouton favori de la liste d'App.tsx migré vers Button iconOnly 44px avec toast de revert traduit.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-07-31
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- AdminDashboard : champs nom/description via `Input surface="light"` (maxLength 100/2000), libellés `Edit Spot`/`Name`/`Type`/`Description`/`Difficulty`/`Save Changes` passés par `t()`, bouton Save custom → `Button variant="primary" loading`.
- Validation client dans `handleSaveEdit` (nom requis ≤100, description ≤2000, ≥1 type) avec `setEditError` + `return` AVANT `updateSpot` ; `updateSpot` enveloppé try/catch → `Toast.show(t('form.error.submit_failed'))` et overlay conservé (D-07/D-09).
- App.tsx : bouton favori liste custom → `Button variant="ghost" iconOnly aria-label={t('fav.remove')}` avec cible tactile 44px (`w-11 h-11`, avant ~36px) ; échec du toggle → revert (context) + `Toast.show(t('fav.error.revert'))` discret (D-08/D-10).
- Pills type/difficulté conservées verbatim ; garde admin inchangée ; fichiers de traduction NON modifiés (réutilisation de clés existantes).

## Task Commits

Each task was committed atomically:

1. **Task 1: AdminDashboard — édition inline → Input/Button + i18n + validation + feedback** - `257e5ba` (feat)
2. **Task 2: App.tsx — bouton favori liste → Button iconOnly + toast de revert** - `6d1d316` (feat)

## Files Created/Modified
- `src/components/AdminDashboard.tsx` - Formulaire d'édition admin migré DS + i18n + validation + feedback toast/inline
- `src/App.tsx` - Bouton favori liste migré Button iconOnly 44px + toast de revert

## Decisions Made
- **Preview-modal `Description` heading laissé en dur (ligne ~425).** L'acceptance grep `>Description<` le capte, mais c'est le titre de section de la modale d'aperçu (hors périmètre) ; le plan ne migre que les libellés de l'overlay d'édition, tous convertis. Règle Scope Boundary : ne pas toucher au code hors périmètre.
- **`Save` retiré de l'import lucide-react** dans AdminDashboard : le bouton Save custom (seul consommateur de l'icône) a été remplacé par `Button` sans icône enfant → évite une erreur lint « unused import ».

## Deviations from Plan

None - plan executed exactly as written for both tasks' actions.

**Note sur `tdd="true"` (Task 1) :** le dépôt ne possède aucune infrastructure de test (pas de runner dans package.json, zéro fichier `*.test.*`) et la vérification du plan est entièrement statique (grep) + `lint`/`build`. Monter une stack vitest+jsdom+testing-library pour tester `handleSaveEdit` (composant imbriqué dans 6 providers) aurait été un ajout d'infrastructure de niveau Règle 4, absent des `acceptance_criteria` du plan. Le comportement de validation a été implémenté conformément au bloc `<behavior>` et vérifié via les checks automatisés du plan + relecture des contrats de contexte (voir ci-dessous). Décision documentée, pas de skip silencieux.

## Issues Encountered
- **Contrats de contexte vérifiés avant usage :** `toggleFavorite` (`Promise<void>`) rethrow après revert (FavoritesContext L45) et `updateSpot` rethrow (SpotsContext L285) confirmés — le `.catch()` d'App.tsx et le try/catch d'AdminDashboard sont donc correctement câblés (pas de `.catch` sur `undefined`).
- **Lint pré-existant hors périmètre :** `npm run lint` global remonte 28 erreurs pré-existantes dans des fichiers non liés. Les fichiers modifiés ici ne portent que des erreurs pré-existantes identiques au baseline (`any` sur les pills difficulté verbatim dans AdminDashboard ; `setState`-in-effect L49 d'App.tsx). Aucune nouvelle erreur introduite. `npm run build` (tsc) vert.

## Verification
- Task 1 : `grep -c 'surface="light"'` = 2 ; `spot.edit_title` présent ; `form.error.submit_failed` présent ; pills verbatim ; `npm run build` vert.
- Task 2 : `iconOnly`, `fav.error.revert`, `from '@capacitor/toast'` présents ; cible 44px (`w-11 h-11`) ; `npm run build` vert.
- `src/translations/*.json` non modifiés (toutes les clés réutilisées existaient déjà).

## Next Phase Readiness
- Périmètre de migration des formulaires (édition admin, D-09) et des boutons favori (second bouton coeur, D-10) fermé.
- Prêt pour la recette manuelle 04-06 (édition admin invalide → inline ; échec réseau → toast + données conservées ; favori offline → revert + toast ; libellés FR/EN).

## Self-Check: PASSED
- FOUND: src/components/AdminDashboard.tsx, src/App.tsx, 04-05-SUMMARY.md
- FOUND commits: 257e5ba (Task 1), 6d1d316 (Task 2)

---
*Phase: 04-formulaires-interactions*
*Completed: 2026-07-31*
