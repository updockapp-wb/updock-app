---
phase: 04-formulaires-interactions
plan: 02
subsystem: data-orchestration
tags: [error-handling, robustness, context, favorites, spots]
requires: []
provides:
  - "SpotsContext.updateSpot rethrow (echec captable en aval pour affichage inline)"
  - "SpotsContext.approveSpot/deleteSpot: Toast Capacitor natif (plus d'alert)"
  - "FavoritesContext.toggleFavorite: (spotId) => Promise<void> rejetante apres revert"
affects:
  - "04-04 (SpotDetail: edition inline + toast favori)"
  - "04-05 (AdminDashboard: edition + App.tsx favori)"
tech-stack:
  added: []
  patterns:
    - "Toast Capacitor natif pour feedback d'actions transitoires (favoris/admin)"
    - "rethrow depuis le context pour deleguer le feedback traduit au composant (i18n cote UI)"
key-files:
  created: []
  modified:
    - src/context/SpotsContext.tsx
    - src/context/FavoritesContext.tsx
decisions:
  - "updateSpot ne montre PAS de Toast (feedback d'edition inline cote composant, D-07)"
  - "toggleFavorite ne montre PAS de Toast dans le context (pas d'acces a t(), Pitfall 4) — le composant appelant declenche le feedback traduit (D-08)"
metrics:
  duration: ~10min
  completed: 2026-07-31
---

# Phase 04 Plan 02: Fiabilisation de la couche d'orchestration (ROBUST-02) Summary

Propagation des echecs API des contexts Spots/Favoris vers l'UI : `updateSpot` et `toggleFavorite` rethrow au lieu d'avaler l'erreur, `approveSpot`/`deleteSpot` utilisent un Toast Capacitor natif au lieu d'`alert()` bloquant.

## What Was Built

### Task 1 — SpotsContext (commit 2647ed6)
- `approveSpot` catch : `alert('Failed to approve.')` → `Toast.show({ text: "Échec de l'approbation.", duration: 'long' })`.
- `deleteSpot` catch : `alert(\`[DEBUG] Failed to delete spot: ...\`)` → `Toast.show({ text: \`Échec de la suppression : ${errorMessage}\`, duration: 'long' })` — **prefixe `[DEBUG]` retire** (fuite de debug en prod, T-04-I2).
- `updateSpot` catch : `alert('Failed to update spot.')` → `throw error` (apres le `console.error` existant), pour que `handleSaveEdit` (SpotDetail/AdminDashboard) capte l'echec et l'affiche inline (D-07).
- **Conserves inchanges** : `confirm('Delete this spot?')`, `type: JSON.stringify(...)` (chemin fragile hors scope), `addSpot`, lat/lng.

### Task 2 — FavoritesContext (commit 5cfc311)
- Signature `FavoritesContextType.toggleFavorite` : `(spotId: string) => void` → `(spotId: string) => Promise<void>`.
- Catch de `toggleFavorite` : le `setFavorites(...)` de revert optimiste existant est conserve STRICTEMENT, suivi d'un `throw err`, pour que le composant appelant (App.tsx / SpotDetail.tsx) declenche un feedback traduit.
- **Aucun `Toast` ni chaine FR codee en dur dans le context** (Pitfall 4 : pas d'acces a `t()`). Le feedback est delegue au composant (04-04 / 04-05).

## Threat Mitigations (register)
- **T-04-D1** (etat bloque) : erreurs propagees (throw) au lieu d'`alert()` bloquant / promesse silencieuse. Revert favori garantit un etat coherent apres echec.
- **T-04-I2** (fuite d'info) : prefixe `[DEBUG]` retire du message de suppression.
- **T-04-R1** (feedback absent) : le rethrow du revert favori permet au composant d'informer l'utilisateur.

## Verification
- Task 1 : `grep -c 'alert('` = 0 ; `grep -c '[DEBUG]'` = 0 ; `throw error` present ; `Toast.show` present ; `confirm('Delete this spot?')` = 1 ; `type: JSON.stringify` present.
- Task 2 : `toggleFavorite: (spotId: string) => Promise<void>` present ; revert `setFavorites` suivi de `throw err` ; `grep -ci Toast` = 0.
- `npx tsc --noEmit` : **clean** (0 erreur) — le changement de type `Promise<void>` ne casse aucun appelant existant.

## Deviations from Plan

### Note de scope — lint pre-existant (non un ecart de contenu)
Le plan specifie `npm run lint` vert dans les criteres. Or `npm run lint` est **rouge dans l'etat de base** (commit `a0dc289`), avec 28 erreurs reparties sur plusieurs fichiers non touches (SessionsContext, AuthContext, ...) : regles `@typescript-eslint/no-explicit-any`, `react-refresh/only-export-components`, `react-hooks/set-state-in-effect`. Ces erreurs existent sur des lignes **inchangees** (ex. `catch (error: any)` L259, `data.map((s: any)` L80, export `useFavorites` L118) et sont **hors scope** (scope boundary : ne corriger que les problemes directement causes par la tache).

**Aucune nouvelle erreur de lint introduite par ce plan.** Le typecheck `tsc --noEmit` (equivalent `npm run build`) est **vert**, ce qui valide le critere de non-regression de type. Aucune modification de contenu au-dela du plan.

Sinon : plan execute exactement comme ecrit.

## Self-Check: PASSED
- FOUND: src/context/SpotsContext.tsx (modifie, commit 2647ed6)
- FOUND: src/context/FavoritesContext.tsx (modifie, commit 5cfc311)
- FOUND: commit 2647ed6 (Task 1)
- FOUND: commit 5cfc311 (Task 2)
