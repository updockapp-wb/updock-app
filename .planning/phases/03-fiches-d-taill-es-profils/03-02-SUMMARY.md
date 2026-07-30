---
phase: 03-fiches-d-taill-es-profils
plan: 02
subsystem: design-system
tags: [modal, header, premium-modal, token-wiring, ui-harmonisation]
requires: ["03-01"]
provides:
  - "src/ui/Modal light+center (3e forme du master)"
  - "PremiumModal consommant Modal + Header du DS"
affects:
  - "src/ui/Modal.tsx"
  - "src/components/PremiumModal.tsx"
tech-stack:
  added: []
  patterns:
    - "Extension-avant-migration : livrer la forme master, puis brancher le consommateur"
    - "Wiring de token prouvé byte-identique en CSS compilé avant commit"
key-files:
  created: []
  modified:
    - "src/ui/Modal.tsx"
    - "src/components/PremiumModal.tsx"
decisions:
  - "Backdrop du light+center câblé bg-slate-900/40 -> bg-secondary/40 (preuve CSS byte-identique)"
  - "aria-label=\"Close\" ajouté au bouton close de PremiumModal (écart a11y autorisé, zéro effet visuel)"
metrics:
  duration: ~10min
  completed: 2026-07-30
  tasks: 2
  files: 2
requirements: [UI-02]
---

# Phase 3 Plan 02 : Master Modal light+center + migration PremiumModal — Summary

Ajout de la 3e forme `surface="light"` + `layout="center"` au master `src/ui/Modal` (classes extraites verbatim de PremiumModal), puis migration de `PremiumModal` vers `Modal` + `Header` avec câblage des tokens — sans aucun changement de rendu observable hormis l'`aria-label="Close"` autorisé.

## What Was Built

### Task 1 — 3e forme light+center dans src/ui/Modal
- Dispatch binaire remplacé par un dispatch à 3 voies, dans l'ordre imposé :
  1. `surface === 'light' && layout === 'center'` (nouveau, évalué EN PREMIER) — wrapper `fixed inset-0 z-[5000] flex items-center justify-center p-6`, backdrop `motion.div` animé en fondu `absolute inset-0 bg-secondary/40 backdrop-blur-sm` + `onClick={onClose}`, panneau `motion.div` `relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl overflow-hidden` (anim scale+y), aucun close intégré.
  2. `surface === 'light' || layout === 'sheet'` (light+sheet existant) — markup et classes strictement inchangés, `z-[3000]`.
  3. Fallback glass+center existant — markup et classes strictement inchangés, `z-[5000]`.
- Dev-warning reformulé : ne se déclenche plus que pour la paire non supportée `glass`+`sheet` et ne prétend plus que light+sheet est la seule paire light valide.
- Commentaire de tête mis à jour pour documenter les 3 formes et leur origine verbatim.
- Fichiers non touchés confirmés vides en `git status` : AuthModal.tsx, FiltersModal.tsx, Header.tsx, Button.tsx.

### Task 2 — Migration PremiumModal vers Modal + Header
- Coque locale (`AnimatePresence` + backdrop `motion.div` + panneau `motion.div`) supprimée, remplacée par `<Modal isOpen onClose surface="light" layout="center">`.
- Imports `motion`/`AnimatePresence` retirés ; `Modal` et `Header` ajoutés.
- Titre migré vers `<Header surface="light" title={t('premium.title')} />` (pas de `onClose`, pas de `subtitle`).
- Signature `PremiumModalProps`, export default, badge Sparkles, description `<p>` custom, CTA `<button>` custom (`py-3.5`) et 3 clés i18n préservés.

## Comparaison CSS `bg-slate-900/40` vs `bg-secondary/40` (preuve de wiring)

Procédure déterministe exécutée (`npm run build` puis grep du CSS compilé). Les deux règles produisent une valeur **identique** :

```
.bg-secondary\/40{background-color:#0f172b66}
.bg-secondary\/40{background-color:color-mix(in oklab,var(--color-secondary)40%,transparent)}
.bg-slate-900\/40{background-color:#0f172b66}
.bg-slate-900\/40{background-color:color-mix(in oklab,var(--color-slate-900)40%,transparent)}
```

Le fallback hex est littéralement identique (`#0f172b66`) ; la forme `color-mix` ne diffère que par le nom de variable (`--color-secondary` vs `--color-slate-900`), et `--color-secondary: var(--color-slate-900)` dans `src/index.css` @theme. Résolution byte-identique confirmée.

**Décision : câblé** — le backdrop du light+center utilise `bg-secondary/40` dans le master.

## Câblages de token appliqués à PremiumModal.tsx

| Source (avant) | Cible (après) | Emplacement |
|----------------|---------------|-------------|
| `text-slate-500` | `text-muted` | bouton close |
| `text-slate-500` | `text-muted` | description `<p>` |
| `text-slate-800` | absorbé par `<Header surface="light">` | titre |
| `bg-slate-900` | `bg-secondary` | CTA |

Compteurs finaux : `text-muted` = 2, `bg-secondary` = 1, `text-slate-500` = 0, `text-slate-800` = 0, `bg-slate-900` = 0, `AnimatePresence` = 0, `motion` = 0.

Backdrop `bg-slate-900/40 -> bg-secondary/40` : câblé dans le master `Modal` (Task 1), pas dans PremiumModal.

## Deviations from Plan

None - plan exécuté exactement comme écrit. Le wiring `bg-secondary/40` était conditionnel (à prouver avant commit) ; la preuve CSS étant concluante, il a été appliqué comme prévu par la branche positive de la procédure.

## Verification

- `npm run build` (typecheck `tsc -b` inclus) passe après chaque tâche.
- Task 1 : 3 branches, light+center d'abord ; chaînes des 2 formes existantes présentes à l'identique ; `z-[3000]`=1, `z-[5000]`=2 ; AuthModal/FiltersModal/Header/Button non touchés.
- Task 2 : 0 `AnimatePresence`/`motion`/`text-slate-500`/`text-slate-800`/`bg-slate-900` ; 2 `text-muted` ; 1 `bg-secondary` ; `<Header surface="light">` sans onClose/subtitle ; `aria-label="Close"` présent ; `py-3.5` et badge Sparkles intacts.
- `git status --short src/` limité aux 2 fichiers du plan.
- Vérification visuelle pixel-identique : déléguée au plan 03-06 (recette manuelle).

## Self-Check: PASSED

- src/ui/Modal.tsx : FOUND (modifié, commit 4a3ca73)
- src/components/PremiumModal.tsx : FOUND (modifié, commit b290984)
- Commit 4a3ca73 (feat Task 1) : présent
- Commit b290984 (feat Task 2) : présent
