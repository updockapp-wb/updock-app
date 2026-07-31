---
phase: 04-formulaires-interactions
plan: 01
subsystem: design-system
tags: [design-system, i18n, input, forms, contract]
requires:
  - "src/ui/Input.tsx (primitive DS existante, surface glass)"
  - "src/ui/Header.tsx / src/ui/Modal.tsx (convention surface à répliquer)"
  - "src/components/AddSpotForm.tsx (source verbatim des classes light)"
provides:
  - "Input étendu : surface ('glass' | 'light') | multiline | maxLength | error"
  - "12 clés i18n form.error.* / form.confirm.no_photo.* / fav.* (parité fr/en)"
  - "fr spot.edit_save corrigé -> 'Enregistrer les modifications'"
affects:
  - "04-03 (AddSpotForm), 04-04 (SpotDetail), 04-05 (AdminDashboard) — consomment ce contrat"
tech-stack:
  added: []
  patterns:
    - "Extension de primitive DS via prop surface (D-01) — étendre plutôt que dupliquer"
    - "Classes light extraites verbatim de l'app existante, jamais inventées"
    - "JSON i18n plat (clés à points) avec parité stricte fr/en"
key-files:
  created: []
  modified:
    - "src/ui/Input.tsx"
    - "src/translations/fr.json"
    - "src/translations/en.json"
decisions:
  - "Boîte d'erreur inline light = adaptation verbatim d'AuthModal L150 (p-3 rounded-xl ... text-sm) avec tokens clairs bg-red-50/border-red-200/text-red-600 par UI-SPEC L105 — structure conservée, couleurs seules adaptées"
  - "Label light normalisé en font-normal (UI-SPEC Typography) plutôt que font-medium d'AddSpotForm — décision de plan explicite"
metrics:
  duration: ~8 min
  completed: 2026-07-31
  tasks: 2
  files_changed: 3
---

# Phase 04 Plan 01 : Contrat Input + i18n Summary

Étend la primitive DS `Input` avec une variante fond clair (surface=light), le mode multiline (textarea), maxLength et message d'erreur inline — défaut `glass` byte-identique — et ajoute les 12 clés i18n de validation/confirmation/favori consommées en aval, avec parité fr/en stricte.

## What Was Built

**Task 1 — Primitive `Input` étendue** (`src/ui/Input.tsx`, commit `d440787`)
- Nouveaux props : `surface?: 'glass' | 'light'` (défaut `'glass'`), `multiline?`, `maxLength?`, `error?`.
- `onChange` élargi à `React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>` — aucun consommateur existant cassé (typecheck vert).
- Surface `glass` (défaut) : classes label/champ conservées verbatim (`text-white/70 uppercase tracking-wider`, `bg-black/20 ... focus:ring-primary`) → AuthModal non régressé (Pitfall 2 RESEARCH).
- Surface `light` : label `block text-sm font-normal text-slate-700 mb-2`, champ `w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 ...` extrait verbatim d'AddSpotForm L206.
- `multiline` : rend un `<textarea>` avec `min-h-[100px]` (verbatim AddSpotForm L218) ; `maxLength` propagé à l'élément rendu.
- `error` : rend une boîte `bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3` — adaptation des tokens sombres d'AuthModal L150 vers le clair (UI-SPEC L105), texte simple (pas de HTML → T-04-I1 mitigé).

**Task 2 — Clés i18n (parité fr/en) + correctif** (`src/translations/{fr,en}.json`, commit `ab5757b`)
- 12 clés ajoutées des deux côtés : `form.error.{name_required,name_too_long,desc_too_long,type_required,submit_failed}`, `fav.error.revert`, `form.confirm.no_photo.{title,body,confirm,cancel}`, `fav.remove`, `fav.add`.
- Copy verbatim de l'UI-SPEC Copywriting Contract (L121-132).
- Correctif : `fr.spot.edit_save` = « Enregistrer les modifications » (en « Save Changes » servait de référence).
- Format JSON plat préservé ; parité stricte vérifiée (aucune clé unilatérale).

## Verification Results

- `npx eslint src/ui/Input.tsx` → exit 0 (fichier propre).
- `npx tsc --noEmit` → aucune erreur (signature `onChange` élargie n'impacte aucun consommateur, dont AuthModal).
- Script de parité node → `OK parite` : 12 clés présentes fr ET en, `spot.edit_save` corrigé, aucune clé unilatérale, JSON valide des deux côtés.
- Greps de contrat : `surface = 'glass'`, `HTMLTextAreaElement`, `bg-slate-50 border-2 border-slate-100`, `min-h-[100px]`, `text-white/70 uppercase tracking-wider` tous présents.

## Deviations from Plan

None — plan exécuté tel qu'écrit.

## Deferred Issues

- `npm run lint` (suite complète) remonte 28 erreurs **préexistantes** dans des fichiers non touchés par ce plan (`src/context/SessionsContext.tsx`, `src/context/SpotsContext.tsx`, `src/context/AuthContext.tsx` — `no-explicit-any`, `react-refresh/only-export-components`, `set-state-in-effect`). Hors périmètre de ce plan (SCOPE BOUNDARY) : non corrigées. Les fichiers modifiés par ce plan passent le lint proprement.

## Threat Surface

Aucun nouveau vecteur. `error` rend du texte simple (pas de `dangerouslySetInnerHTML`) → T-04-I1 mitigé. `maxLength` reste un garde-fou UX client, la validation autoritaire demeure RLS/Postgres (T-04-V1 accepté). Aucune installation de package.

## Self-Check: PASSED

- FOUND: src/ui/Input.tsx
- FOUND: src/translations/fr.json
- FOUND: src/translations/en.json
- FOUND commit: d440787 (Task 1)
- FOUND commit: ab5757b (Task 2)
