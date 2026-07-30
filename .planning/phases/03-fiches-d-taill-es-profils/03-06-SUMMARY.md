---
phase: 03-fiches-d-taill-es-profils
plan: 06
subsystem: qa-phase-gate
tags: [qa, byte-identity, non-regression, phase-gate, UI-01, UI-02, PERF-02, QA-01]
requires:
  - "03-01 (03-BASELINE.md — captures AVANT + spot de référence + métriques A/B/C)"
  - "03-02 (Modal light+center + PremiumModal)"
  - "03-03 (Profile + CommunityStatsScreen migrés)"
  - "03-04 (SpotDetail tokens + rayons)"
  - "03-05 (lazy loading + prefetch, métriques APRÈS)"
provides:
  - "03-QA-CHECKLIST.md — preuve byte-identité CSS (section 1, complète) + templates de recette visuelle et device (sections 2-3)"
  - "Verdict UI-01/UI-02 côté preuve CSS compilé (toutes paires IDENTIQUE)"
affects:
  - ".planning/phases/03-fiches-d-taill-es-profils/03-QA-CHECKLIST.md"
tech-stack:
  added: []
  patterns:
    - "Preuve byte-identité par aliasing @theme : token sémantique = var(palette), résolution oklch/color-mix/radius identique en CSS compilé"
    - "Séparation des vérifications non scriptables : visuel APRÈS/AVANT (navigateur) vs recette gestuelle/safe-area (device physique)"
key-files:
  created:
    - ".planning/phases/03-fiches-d-taill-es-profils/03-QA-CHECKLIST.md"
  modified: []
decisions:
  - "Task 1 (byte-identité CSS) exécutée intégralement en sandbox : npm run build + extraction du CSS compilé, 12 paires prouvées IDENTIQUE"
  - "Task 2 (visuel APRÈS/AVANT) = checkpoint human-verify : rendu réel via chrome-devtools-mcp — délégué à l'orchestrateur (comme 03-01/03-05)"
  - "Task 3 (recette QA-01) = checkpoint human-action : device iOS physique — délégué à l'utilisateur réel, non substituable par un outil navigateur"
metrics:
  duration: "~4 min (Task 1 ; Tasks 2-3 en attente de vérification externe)"
  tasks-completed: 1
  tasks-checkpointed: 2
  files-modified: 1
  completed: 2026-07-30
requirements: [UI-01, UI-02, PERF-02]
---

# Phase 3 Plan 06 : Recette de phase — byte-identité + non-régression Summary

Phase gate de la Phase 3. La preuve **byte-identité CSS compilé** de tous les wirings de token du
périmètre est produite et concluante (12 paires, toutes IDENTIQUE) ; les deux vérifications non
scriptables — comparaison visuelle APRÈS/AVANT (navigateur) et recette manuelle mobile QA-01
(device iOS physique) — sont scaffoldées dans `03-QA-CHECKLIST.md` et remontées comme checkpoints
distincts vers, respectivement, l'orchestrateur (chrome-devtools-mcp) et l'utilisateur réel.

## What Was Built

### Task 1 — Preuve byte-identité CSS compilé (commit `b18056b`) — ✅ COMPLET

`npm run build` (worktree, `node_modules` restauré depuis le repo principal via symlink même
lockfile) → `dist/assets/index-CwYF5zEx.css`. Extraction verbatim des règles compilées et des
définitions `@theme`. Preuve d'**aliasing** : chaque token sémantique est défini
`--color-<token>: var(--color-<palette>)`, donc les deux membres de chaque paire résolvent à la
**même** valeur `oklch()` / `color-mix()` / `border-radius`.

**12 paires prouvées IDENTIQUE** (tableau complet en `03-QA-CHECKLIST.md § 1.b`) :
`text-slate-800→text-text`, `text-slate-500→text-muted`, `text-sky-500→text-primary`,
`bg-slate-50→bg-background`, `text-rose-500→text-accent`, `fill-rose-500→fill-accent`,
`border-sky-500→border-primary`, `focus:border-sky-500→focus:border-primary`,
`bg-slate-900→bg-secondary`, `bg-slate-900/40→bg-secondary/40` (backdrop Modal, fallback hex
`#0f172b66` identique — confirme 03-02), `rounded-[24px]→rounded-3xl` (1.5rem=24px),
`rounded-t-[32px]→rounded-t-4xl` (2rem=32px).

- **`text-slate-900→text-secondary` : NON câblé** (choix conservateur verrouillé par UI-SPEC).
  `text-secondary` absent des 4 fichiers du périmètre ; littéraux conservés à
  `SpotDetail:241,469` et `Profile:257`.
- **Résidus littéraux restants** (`text-slate-800` L551, `bg-slate-50` L565/599, `border-sky-500`
  L565/584/599/611, `rounded-[24px]` L548) tous confinés à l'**overlay d'édition** de SpotDetail
  (à partir de L548), explicitement hors périmètre (Phase 4 / UI-03). Aucun DIVERGENT en périmètre.

### Task 2 — Comparaison visuelle APRÈS/AVANT — ⏳ CHECKPOINT (human-verify, orchestrateur)

Nécessite un rendu réel via `npm run dev` + session Chrome authentifiée pilotée par
chrome-devtools-mcp — indisponible dans le sandbox de l'exécuteur. Section 2 de
`03-QA-CHECKLIST.md` scaffoldée : tableau de 10 surfaces (5 surfaces migrées + 3 onglets fiche +
AuthModal + FiltersModal) avec captures AVANT référencées (`03-BASELINE.md § 9`) et emplacements
`03-after-*` à produire, points focaux à confirmer, colonne verdict à remplir. **Délégué à
l'orchestrateur** (qui a fait cette mesure pour 03-01 et 03-05). Écarts tolérés : `aria-label="Close"`
+ commentaire `src/index.css:41`.

### Task 3 — Recette QA-01 device iOS — ⏳ CHECKPOINT (human-action, utilisateur réel)

Gestuelle tactile (`vaul` drag-to-dismiss, snap points, `layoutId`), comportement réel de
`loading="lazy"` en WebView iOS et safe-area : **non reproductibles en desktop ni par aucun outil
navigateur**. Section 3 scaffoldée : 13 items (gestuelle, lightbox, onglets, 4 gardes non
authentifiées, profil auth/anonyme, PremiumModal, CommunityStats safe-area, auth/filtres) avec
colonne PASS/FAIL. **Délégué à l'utilisateur réel sur son iPhone** — distinct de Task 2, à ne pas
router vers un outil navigateur.

## Verdict de phase (état à la remise)

| Exigence | Statut |
|----------|--------|
| UI-01 / UI-02 (byte-identité) | CSS compilé : **✅ prouvé** (Task 1). Visuel APRÈS/AVANT : ⏳ Task 2 |
| PERF-02 (lazy mesurable) | **✅ satisfait** (03-05, `03-BASELINE.md § 8`) ; dégradation gracieuse iOS à confirmer Task 3 item 3 |
| QA-01 (recette mobile 100%) | ⏳ Task 3 (device) |

## Deviations from Plan

None — plan exécuté conformément. Aucune règle de déviation (1-4) déclenchée. **Aucun `npm install`
de nouveau package** (threat T-03-SC : aucune cible ; `node_modules` restauré par symlink du repo
principal sur le même lockfile, pas d'ajout de dépendance). Tasks 2 et 3 remontées comme checkpoints
conformément à leur `type="checkpoint:human-verify"` et à la nature non scriptable de leurs
vérifications — flux de checkpoint normal, pas une déviation.

## Known Stubs

Section 2 (verdicts visuels) et section 3 (verdicts device) de `03-QA-CHECKLIST.md` sont des
**templates à colonnes vides** — c'est intentionnel : elles seront remplies par l'orchestrateur
(navigateur) et l'utilisateur (device) lors de la résolution des deux checkpoints. Ce ne sont pas
des stubs de code applicatif ; aucun code `src/` n'est écrit par ce plan (plan de vérification pur).

## Threat Flags

None — aucune nouvelle surface de code. Rappel appliqué en section 2 : masquer l'email du compte de
test sur la capture profil authentifié (T-03-06-02), aucune capture ne doit contenir JWT/token/URL
signée Supabase.

## Self-Check: PASSED

- `.planning/phases/03-fiches-d-taill-es-profils/03-QA-CHECKLIST.md` — FOUND
- Section « Preuve byte-identité » présente avec verdict IDENTIQUE — FOUND
- Commit `b18056b` (Task 1) — présent dans git log
- `dist/assets/*.css` produit par `npm run build` — présent
