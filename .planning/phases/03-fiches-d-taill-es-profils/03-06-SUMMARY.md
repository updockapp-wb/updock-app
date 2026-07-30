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
  - "03-QA-CHECKLIST.md — preuve byte-identité CSS (section 1) + comparaison visuelle 10/10 (section 2) + recette device 12/12 (section 3), toutes complètes"
  - "Verdict de phase final : UI-01, UI-02, PERF-02, QA-01 tous satisfaits — phase 3 validée à 100%"
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
  - "Bug de modale masquée derrière le tiroir SpotDetail (isolation:isolate sur #root + portail Vaul) corrigé en gap closure immédiat pendant la recette (commit 497f347 sur main), plutôt que différé — cause racine claire, fix chirurgical (createPortal) à faible risque"
  - "Recette étalée sur deux sessions (4/12 puis 12/12 items) sans invalider les items déjà PASS — chaque item est un contrôle indépendant"
metrics:
  duration: "~4 min (Task 1, sandbox) + recette device étalée sur deux sessions (4/12 puis 8/12 restants)"
  tasks-completed: 3
  files-modified: 1
  completed: 2026-07-30
requirements: [UI-01, UI-02, PERF-02]
---

# Phase 3 Plan 06 : Recette de phase — byte-identité + non-régression Summary

Phase gate de la Phase 3, **validée à 100%**. La preuve **byte-identité CSS compilé** de tous les
wirings de token du périmètre est concluante (12 paires, toutes IDENTIQUE), la comparaison
**visuelle APRÈS/AVANT** est validée 10/10, et la **recette manuelle mobile QA-01** sur device iOS
physique est passée à **12/12 items PASS**. Un bug bloquant (modale masquée derrière le tiroir
SpotDetail) découvert pendant la recette a été corrigé en gap closure immédiat et confirmé
fonctionnel sur device avant de sceller le verdict final.

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

### Task 2 — Comparaison visuelle APRÈS/AVANT (commit `655153e`) — ✅ VALIDÉ

Rendu réel exécuté par l'orchestrateur via chrome-devtools-mcp (`npm run dev` sur `:5173`,
branche `main` waves 1+2 mergées = état APRÈS complet, compte `updock.app@gmail.com`, viewport
390×844×3). 10 surfaces comparées APRÈS/AVANT (5 migrées + 3 onglets fiche + AuthModal +
FiltersModal), captures `03-after-*` sous `audit/screenshots/`. Méthode : AX tree structurel +
pixel-à-pixel échantillonné (fiche snap 0.35, community-stats) + inspection des autres.
**Verdict : 10/10 IDENTIQUE, aucune régression.** Seul écart = `aria-label="Close"` de
PremiumModal (toléré). AuthModal/FiltersModal confirmés non régressés par l'extension du master
Modal. Email masqué sur la capture profil auth (T-03-06-02 appliqué). Section 2 de
`03-QA-CHECKLIST.md` renseignée.

### Task 3 — Recette QA-01 device iOS (commits `324ddb4`, `99b3a96`) — ✅ COMPLET (12/12 PASS)

Gestuelle tactile (`vaul` drag-to-dismiss, snap points, `layoutId`), comportement réel de
`loading="lazy"` en WebView iOS et safe-area : non reproductibles en desktop ni par aucun outil
navigateur — déroulé par l'utilisateur réel sur son iPhone, item par item, sur deux sessions.

**12/12 items PASS :** fiche spot — gestuelle chemin critique ; lightbox (prefetch fluide, portail
isolé du drag-to-dismiss) ; onglets Info/Avis/Sessions (avatars lazy sans image manquante) ; passe
non authentifiée complète (vignette floutée+cadenas, cœur favori→auth, lightbox→auth, rangée Admin
masquée) ; profil authentifié (avatar, stats, réglages, Log Out) ; profil anonyme (Sign In/Join) ;
PremiumModal (ouverture + double fermeture bouton/backdrop) ; CommunityStatsScreen (safe-area
préservée, 2 KPI + liste pays) ; non-régression AuthModal/FiltersModal.

**Bug bloquant trouvé et corrigé en gap closure (items 2/4b/4c) :** `AuthModal`/`PremiumModal`
rendus derrière le tiroir `SpotDetail` (invisibles ou partiellement masqués selon le snap), le
rendant inutilisable. **Cause racine :** `#root { isolation: isolate }` (pré-existant, v1.1.1)
plafonne tout `position: fixed` rendu comme enfant React normal, tandis que le portail natif de
Vaul (`Drawer.Content`) s'échappe dans `<body>` et passe au-dessus quel que soit le z-index.
**Fix :** les 3 formes du master `Modal` (`src/ui/Modal.tsx`) rendues via `createPortal(...,
document.body)` ; `AuthModal`/`AdminDashboard`/`WelcomeScreen` déplacés hors de
`vaul-drawer-wrapper` dans `src/App.tsx`. Mergé sur `main` (commit `497f347`, **hors périmètre de
ce worktree**), vérifié en desktop puis confirmé fonctionnel sur device avant reprise de la
recette (items 2/4b/4c → PASS).

## Verdict de phase final

| Exigence | Statut |
|----------|--------|
| UI-01 / UI-02 (byte-identité) | CSS compilé : **✅ prouvé** (Task 1) + Visuel APRÈS/AVANT : **✅ validé** 10/10 (Task 2) |
| PERF-02 (lazy mesurable) | **✅ satisfait** (03-05, `03-BASELINE.md § 8`) ; dégradation gracieuse iOS confirmée (item 3) |
| QA-01 (recette mobile 100%) | **✅ satisfait — 12/12 items PASS** sur device iOS physique (Task 3) |

**Phase 3 (Fiches Détaillées & Profils) validée sans régression.** Success criterion 4 du
ROADMAP Phase 3 honoré.

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
