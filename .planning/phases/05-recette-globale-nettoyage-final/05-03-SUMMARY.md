---
phase: 05-recette-globale-nettoyage-final
plan: 03
subsystem: ui
tags: [react, typescript, error-handling, capacitor-toast, cache-api, i18n]

# Dependency graph
requires:
  - phase: 05-01
    provides: baseline rethrow canon reference (FavoritesContext/updateSpot aligned patterns)
provides:
  - SpotsContext addSpot/approveSpot/deleteSpot rethrow to caller (no hardcoded French Toast)
  - deleteSpot confirmation moved from native confirm() to app Modal at call site
  - AuthContext.signOut error handling with rethrow instead of swallowing
  - AuthModal uses Capacitor Toast instead of native alert()
  - cacheSpotImages parallelized with Promise.all (D-02 perf fix)
affects: [05-05-recette, error-handling, offline-cache]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rethrow-to-caller: contexts console.error + throw; components show translated feedback via t() (Pitfall 4 — contexts have no i18n access)"
    - "Destructive-action confirmation via app Modal (surface=light+center) at the call site, not native confirm()"
    - "Parallel cache warming via Promise.all with preserved per-item try/catch resilience"

key-files:
  created: []
  modified:
    - src/context/SpotsContext.tsx
    - src/context/AuthContext.tsx
    - src/components/AuthModal.tsx
    - src/components/Profile.tsx
    - src/components/AdminDashboard.tsx
    - src/utils/offline.ts
    - src/translations/fr.json
    - src/translations/en.json

key-decisions:
  - "addSpot restructured from fire-and-forget background IIFE to awaited async so rethrow reaches the caller (AddSpotForm handles it via existing try/catch inline error)"
  - "Reused error.generic for approve/delete failure Toasts (no new UX copy for error feedback)"
  - "Added admin.delete_confirm.* i18n keys (fr/en) — required to translate the delete-confirm Modal replacing the native confirm() string"
  - "Dropped addSpot progress/success Toasts; form close is the success signal (per plan: drop hardcoded French success Toasts)"

patterns-established:
  - "Pattern 1: context mutation error path = console.error + throw; caller decides feedback delivery (inline error or Toast) with t()"
  - "Pattern 2: destructive confirm = app Modal state (spotToDelete) + confirmed call into context"

requirements-completed: [CODE-02, CODE-01]

# Metrics
duration: ~20min
completed: 2026-07-31
---

# Phase 5 Plan 03: Homogénéisation de la gestion d'erreur + fix cacheSpotImages Summary

**Les 3 divergences d'error-handling vérifiées alignées sur le canon rethrow/Toast/Modal, et cacheSpotImages parallélisé via Promise.all (D-02).**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-31T16:57:00Z (approx.)
- **Completed:** 2026-07-31T17:16:09Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- SpotsContext `addSpot`/`approveSpot`/`deleteSpot` ne montrent plus de Toast codé en dur en français : ils rethrow vers l'appelant qui affiche le feedback traduit via `t()`.
- `deleteSpot` : suppression du `confirm('Delete this spot?')` natif ; la confirmation passe désormais par le Modal de l'app (`surface=light`+`center`) dans AdminDashboard, avec copie traduite.
- `AuthContext.signOut` : ajout d'un try/catch + `console.error` + rethrow (ne plus avaler l'erreur, D-05) ; Profile affiche un Toast traduit en cas d'échec.
- `AuthModal` : `alert()` natif remplacé par un Toast Capacitor.
- `cacheSpotImages` : boucle série `for-await` remplacée par `Promise.all`, avec try/catch par URL conservé (un échec n'interrompt pas le lot) et clé/forme de cache inchangées.

## Task Commits

Each task was committed atomically:

1. **Task 1: Harmonize SpotsContext + AuthContext + AuthModal to the rethrow/Toast/Modal canon** - `b66b734` (refactor)
2. **Task 2: Parallelize cacheSpotImages (D-02)** - `19919f4` (perf)

## Files Created/Modified
- `src/context/SpotsContext.tsx` - addSpot restructuré en async awaité qui rethrow ; approveSpot/deleteSpot rethrow ; native confirm() retiré ; import Toast supprimé (plus utilisé).
- `src/context/AuthContext.tsx` - signOut avec try/catch + console.error + rethrow.
- `src/components/AuthModal.tsx` - import Toast ; alert() → Toast.show.
- `src/components/Profile.tsx` - import Toast ; signOut().catch(Toast) au site d'appel.
- `src/components/AdminDashboard.tsx` - import Modal ; state spotToDelete ; approveSpot avec try/catch+Toast et .catch(Toast) ; deleteSpot déclenché via Modal de confirmation ; Modal de confirmation ajouté.
- `src/utils/offline.ts` - cacheSpotImages parallélisé avec Promise.all.
- `src/translations/fr.json` / `src/translations/en.json` - clés admin.delete_confirm.{title,body,confirm,cancel}.

## Decisions Made
- **addSpot restructuré en flux awaité** : l'ancienne implémentation lançait le travail dans une IIFE détachée et retournait immédiatement `Promise.resolve()`, ce qui rendait impossible le rethrow vers l'appelant. La fonction est maintenant un `async` classique qui await l'upload + insert et throw en cas d'échec. AddSpotForm.doSubmit await déjà `addSpot` et gère succès (fermeture du formulaire) / erreur (message inline traduit `form.error.submit_failed`, données conservées) — aucun changement nécessaire côté AddSpotForm.
- **error.generic réutilisé** pour les Toasts d'échec d'approbation/suppression (pas de nouvelle copie UX pour le feedback d'erreur).
- **error delivery seulement** : aucune modification des appels Supabase ni de leur autorisation (RLS reste la garde autoritaire, cf. threat model T-05-04).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Ajout de clés i18n admin.delete_confirm.***
- **Found during:** Task 1 (Modal de confirmation de suppression dans AdminDashboard)
- **Issue:** Le plan demande une copie traduite via `t()` pour le Modal de confirmation, mais aucune clé i18n n'existait pour ce dialogue (l'ancien texte était le string anglais codé en dur `'Delete this spot?'` du confirm() natif).
- **Fix:** Ajout de `admin.delete_confirm.title/body/confirm/cancel` dans fr.json et en.json.
- **Files modified:** src/translations/fr.json, src/translations/en.json
- **Verification:** lint + build verts ; le Modal résout les clés via t().
- **Committed in:** b66b734 (Task 1 commit)

**2. [Rule 3 - Blocking] Restructuration de addSpot pour permettre le rethrow**
- **Found during:** Task 1 (harmonisation addSpot)
- **Issue:** addSpot utilisait une IIFE d'arrière-plan détachée et retournait immédiatement — le rethrow vers l'appelant (critère d'acceptation) était mécaniquement impossible.
- **Fix:** Conversion en `async` awaité qui throw sur le chemin d'erreur. Effet de bord assumé : le formulaire attend désormais la fin de l'upload (spinner `isSending` déjà présent) au lieu de se fermer immédiatement, et les Toasts « Envoi en cours »/« Spot envoyé » codés en dur sont supprimés (la fermeture du formulaire fait office de feedback de succès, conforme au plan).
- **Files modified:** src/context/SpotsContext.tsx
- **Verification:** lint + build verts ; AddSpotForm.doSubmit gère succès/erreur.
- **Committed in:** b66b734 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical i18n, 1 blocking restructuration)
**Impact on plan:** Les deux ajustements sont nécessaires pour satisfaire les critères d'acceptation (rethrow effectif, copie traduite du Modal). Aucun scope creep — les appels Supabase et l'autorisation restent inchangés.

## Issues Encountered
None — les deux tâches ont été exécutées sans blocage. Warning pré-existant de taille de chunk au build (mapbox-gl / index > 500 kB), hors périmètre, non corrigé.

## Known Stubs
None.

## Threat Flags
None — le périmètre modifie uniquement la livraison du feedback d'erreur, pas les surfaces réseau/auth. La confirmation de suppression (T-05-04) reste effective : `deleteSpot` n'exécute la suppression qu'après confirmation via le Modal, et RLS/Postgres reste la garde autoritaire côté serveur.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CODE-02 (homogénéisation error-pattern) et CODE-01/D-02 (fix perf cacheSpotImages) satisfaits.
- Prêt pour la recette 05-05 : vérifier le flow delete-spot (Modal de confirmation) et le feedback d'erreur signup/signout.

## Self-Check: PASSED

- SUMMARY.md present.
- Task commits b66b734, 19919f4 verified in git log.

---
*Phase: 05-recette-globale-nettoyage-final*
*Completed: 2026-07-31*
