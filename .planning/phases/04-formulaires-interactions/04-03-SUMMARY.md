---
phase: 04-formulaires-interactions
plan: 03
subsystem: ui
tags: [react, design-system, forms, validation, i18n, modal]

# Dependency graph
requires:
  - phase: 04-01
    provides: "Input DS étendu (surface light, multiline, maxLength, error) + clés i18n form.error.* / form.confirm.no_photo.*"
provides:
  - "AddSpotForm migré vers le design system (Input surface=light, Button, Modal)"
  - "Validation client inline (nom requis/≤100, description ≤2000, ≥1 type) avant addSpot"
  - "Confirmation douce « pas de photo » via Modal light+center non bloquant (D-04)"
  - "Pattern de référence de migration de formulaire pour 04-04 (SpotDetail) et 04-05 (AdminDashboard)"
affects: [04-04-spotdetail, 04-05-admindashboard, 04-06-recette]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "handleSubmit : validation client inline (setError + return) AVANT addSpot ; garde UX uniquement, RLS/Postgres reste autoritaire"
    - "Soumission effective extraite dans doSubmit() réutilisable (chemin avec photo + confirmation sans photo)"
    - "Confirmation douce non bloquante via Modal DS light+center (2 actions positives), jamais confirm() natif"

key-files:
  created:
    - .planning/phases/04-formulaires-interactions/deferred-items.md
  modified:
    - src/components/AddSpotForm.tsx

key-decisions:
  - "Shell max-w-lg du formulaire CONSERVÉ (le master Modal light+sheet est max-w-sm et rétrécirait le formulaire — Pitfall 1)"
  - "Pills de type + grille photos + select difficulté laissés verbatim (hors périmètre de ce plan)"
  - "form.error.submit_failed câblé inline dans le catch (ROBUST-01), données conservées sur échec"

patterns-established:
  - "Migration de formulaire clair : champs via Input surface=light, submit via Button loading, erreurs via bannière inline light"
  - "Confirmation utilisateur douce via Modal DS au lieu de confirm() natif"

requirements-completed: [UI-03, ROBUST-01, ROBUST-02]

# Metrics
duration: 18min
completed: 2026-07-31
---

# Phase 4 Plan 03 : Migration AddSpotForm (DS + validation + confirmation pas-de-photo) Summary

**AddSpotForm migré vers le design system (Input surface=light, Button loading, Modal light+center) avec validation client inline des 4 règles avant addSpot et confirmation douce non bloquante « pas de photo » (D-04).**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-07-31
- **Completed:** 2026-07-31
- **Tasks:** 2
- **Files modified:** 1 (+1 créé : deferred-items.md)

## Accomplishments
- Champs nom/description rendus par le composant DS `Input` (`surface="light"`, description en `multiline`, `maxLength` 100/2000) — labels manuels supprimés (rendus par Input).
- Bouton de soumission remplacé par le DS `Button` (`variant="primary"`, `size="lg"`, `loading={isSending}`) ; ancien bouton custom `py-4 bg-sky-500` supprimé.
- Validation client inline des 4 règles dans `handleSubmit` AVANT `addSpot` : nom requis (trim), nom ≤100, description ≤2000, ≥1 type (D-02/D-03) ; bannière d'erreur inline surface claire ; données conservées sur erreur (aucun reset).
- Confirmation douce « pas de photo » : soumission valide sans photo → `Modal surface="light" layout="center"` non bloquant avec 2 actions positives (« Publier quand même » → `doSubmit()`, « Ajouter une photo » → ferme) ; aucun `confirm()` natif.
- Pills de type, grille photos et select difficulté conservés verbatim ; bouton suppression photo ajusté `p-1.5` → `p-2` (UI-SPEC).

## Task Commits

Chaque tâche committée atomiquement :

1. **Task 1: Migrer champs + bouton submit vers Input/Button + validation client inline** — `6a42aa6` (feat)
2. **Task 2: Confirmation douce « pas de photo » via Modal light+center (D-04)** — `4e10fb4` (feat)

**Plan metadata:** (final docs commit ci-dessous)

_Note: Task 1 marquée tdd="true" — voir Deviations : aucune infra de test introduite (contrainte PROJECT.md), vérification par assertions source + build, telle que définie par les blocs `<verify>` du plan._

## Files Created/Modified
- `src/components/AddSpotForm.tsx` — Formulaire d'ajout migré DS + validation client + confirmation pas-de-photo ; `doSubmit()` extrait ; return enveloppé dans un fragment pour rendre le Modal.
- `.planning/phases/04-formulaires-interactions/deferred-items.md` — Journal de la dette lint pré-existante (hors périmètre).

## Decisions Made
- Shell `max-w-lg` du formulaire conservé (ne pas remplacer par le master Modal light+sheet en `max-w-sm` — Pitfall 1).
- `catch (err: any)` réécrit en `catch (err)` lors de l'extraction de `doSubmit()` (code plus propre, supprime au passage un `any` pré-existant sur cette ligne — aucun nouveau `any` introduit).
- Pills/grille/select laissés verbatim (harmonisation hors périmètre de ce plan).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Câblage de `form.error.submit_failed` inline sur échec de soumission**
- **Found during:** Task 2 (extraction de `doSubmit()`)
- **Issue:** Le `catch` d'origine ne posait aucune erreur inline (uniquement l'alert du contexte) ; la clé `form.error.submit_failed`, provisionnée par 04-01 pour ce cas exact, restait inutilisée — incohérent avec l'objectif ROBUST-01 (erreurs claires, données conservées).
- **Fix:** `setError(t('form.error.submit_failed'))` ajouté dans le `catch` de `doSubmit()` ; les données saisies restent intactes (pas de reset).
- **Files modified:** src/components/AddSpotForm.tsx
- **Verification:** `npm run build` vert ; grep de la clé présent.
- **Committed in:** `4e10fb4` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical / robustesse)
**Impact on plan:** Amélioration alignée sur ROBUST-01, réutilisant une clé i18n déjà livrée. Aucun scope creep.

## Issues Encountered
- **Contrainte tests vs `tdd="true"` :** Task 1 est marquée `tdd="true"`, mais PROJECT.md interdit explicitement d'introduire une infra de test (« ne pas en introduire sauf si demandé explicitement ») et aucun framework de test n'est présent. Les blocs `<verify>` du plan sont eux-mêmes des assertions source (grep) + lint/build, cohérents avec cette contrainte. Résolution : implémentation puis vérification via les assertions source du plan + `npm run build`, sans introduire de framework de test. La contrainte projet prime.
- **`npm run lint` (project-wide) non vert :** le dépôt porte ~28 erreurs eslint pré-existantes sur le commit de base `edc8f3f`. Dans `AddSpotForm.tsx`, les 4 erreurs restantes (`data: any` de l'interface de props, `setDifficulty(... as any)` du select, `resetForm()` dans un `useEffect`) sont toutes pré-existantes (confirmé via `git show HEAD:...`) et sur des lignes hors périmètre de ce plan (le select difficulté est explicitement hors scope). Le code ajouté par 04-03 est lint-propre et `npm run build` (`tsc -b && vite build`) est vert. Détail consigné dans `deferred-items.md`.

## Threat surface
Aucune nouvelle surface de sécurité introduite. La validation client ajoutée est une garde UX (T-04-V2) ; RLS/Postgres reste l'autorité. Aucun `dangerouslySetInnerHTML`. Aucune validation MIME/taille de fichier ajoutée (D-05, hors scope respecté).

## Known Stubs
Aucun. Le formulaire est entièrement câblé (state réel, `addSpot`, i18n complet FR/EN).

## User Setup Required
None - aucune configuration de service externe requise.

## Next Phase Readiness
- Pattern de migration de formulaire clair établi et prouvé — réutilisable par 04-04 (SpotDetail) et 04-05 (AdminDashboard).
- Recette manuelle 04-06 : saisie invalide → message inline ; soumission sans photo → dialogue doux ; données conservées après erreur.
- Dette lint pré-existante à traiter globalement hors de ce milestone (voir deferred-items.md).

## Self-Check: PASSED
- FOUND: src/components/AddSpotForm.tsx
- FOUND: .planning/phases/04-formulaires-interactions/04-03-SUMMARY.md
- FOUND commit 6a42aa6 (Task 1)
- FOUND commit 4e10fb4 (Task 2)

---
*Phase: 04-formulaires-interactions*
*Completed: 2026-07-31*
