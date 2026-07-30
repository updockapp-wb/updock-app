---
phase: 03-fiches-d-taill-es-profils
plan: 04
subsystem: ui-spot-detail
tags: [design-system, tokens, tailwind-v4, spot-detail]
requires:
  - "03-01 (baseline + tokens src/index.css @theme)"
provides:
  - "SpotDetail.tsx avec tokens de couleur câblés et rayons canoniques (coque vaul + layoutId intacts)"
affects:
  - "src/components/SpotDetail.tsx"
tech-stack:
  added: []
  patterns:
    - "Wiring de tokens 1:1 aliasés Tailwind v4 (harmonisation, pas rebranding)"
    - "Retrait des valeurs de rayon arbitraires -> échelle canonique (rounded-3xl / rounded-t-4xl)"
key-files:
  created: []
  modified:
    - "src/components/SpotDetail.tsx"
decisions:
  - "text-slate-900 laissé LITTÉRAL (L226 titre gelé, L453 note moyenne) — choix conservateur, pas de token text-secondary sémantiquement adéquat"
  - "Aucune migration de composant maître (Card/Header/Button/Modal/Input) — aucun n'est byte-identique dans ce fichier (D-01/D-02/gradient/bg-slate-50)"
  - "rounded-t-4xl sur Drawer.Content autorisé — D-01 gèle structure/gestuelle, pas les chaînes de classe"
metrics:
  duration: "~10 min"
  tasks-completed: 2
  files-modified: 1
  completed: 2026-07-30
---

# Phase 3 Plan 04 : Harmonisation SpotDetail (tokens + rayons) Summary

Wiring des tokens de couleur 1:1 et remplacement des valeurs de rayon arbitraires dans `SpotDetail.tsx`, sans migrer aucun composant maître ni toucher aux zones gelées (coque `vaul`, `layoutId` partagé, overlay d'édition, gardes d'accès).

## What Was Built

Deux refactors de présentation purs sur `src/components/SpotDetail.tsx`, honorant UI-01 selon le critère d'override documenté (`03-UI-SPEC.md` § Contrat de périmètre) : l'inventaire de `03-RESEARCH.md` prouve que zéro composant maître s'applique byte-identique ici, donc UI-01 se résout au câblage des tokens 1:1 + retrait des rayons arbitraires.

### Task 1 — Câblage des tokens de couleur (commit 4707be2)

Wirings 1:1 appliqués (hors overlay d'édition L526-664 et zones gelées) :

| Avant | Après | Sites |
|-------|-------|-------|
| `text-sky-500` | `text-primary` | trigger « Modifier » (uploader), icône Wind (carte stats) |
| `text-slate-800` | `text-text` | valeur difficulté, valeur hauteur, titre « Photos », titre « Description » |
| `text-slate-500` | `text-muted` | coordonnées GPS, nom uploader, CTA verrouillé « écrire un avis », CTA verrouillé « créer session » |
| `bg-slate-50` | `bg-background` | 2 cartes stats, encart description, 2 CTA verrouillés |
| `fill-rose-500 text-rose-500` | `fill-accent text-accent` | cœur favori actif |

`text-slate-900` conservé LITTÉRAL (L226 titre dans `motion.h2` gelé + L453 note moyenne) — choix conservateur verrouillé par `03-UI-SPEC.md` (pas de token `text-secondary` sémantiquement adéquat).

### Task 2 — Rayons canoniques (commit 369f44a)

| Avant | Après | Site |
|-------|-------|------|
| `md:rounded-[24px]` | `md:rounded-3xl` | coque du contenu (L218) |
| `rounded-[24px]` | `rounded-3xl` | sidebar desktop (L741) |
| `rounded-t-[32px]` | `rounded-t-4xl` | `Drawer.Content` (L763) |

Valeurs byte-identiques (défauts Tailwind v4 : 3xl=1.5rem=24px, 4xl=2rem=32px, ce dernier redéclaré `src/index.css:21`). Sert directement DS-01 sans risque de rendu. Le `rounded-[24px]` de l'overlay d'édition (L532) reste intact (hors périmètre).

## Zones gelées / intégrité préservée

- `layoutId={`spot-name-${spot.id}`}` : count=1, intact (animation d'élément partagé liste<->fiche non cassée).
- Coque `vaul` (`Drawer.Root`/`Portal`/`Content`, `snapPoints=[0.35, 0.95]`, `modal={false}`, handlers touch) : structure et comportement inchangés ; seul le rayon de `Drawer.Content` a bougé.
- Icon-buttons du header (Partager/Favori/Fermer/Modifier) : restent des `<button>` natifs (D-02).
- Portail lightbox + handlers `onTouch*`/`onPointerDown` (L680-682) : non touchés.
- Overlay d'édition (L526-664) : strictement intact.
- Gardes d'accès `!user` (favori L288, lightbox L397, `blur-sm`+cadenas L412-421, droit d'édition L253) : non régressées.
- Aucun nouvel `import` depuis `../ui/` (count=0).

## Deviations from Plan

None — plan exécuté exactement comme écrit. Aucune règle de déviation (1-4) déclenchée. Aucun `npm install`.

## Dette Phase 4 (rappel)

`URL.createObjectURL(file)` en rendu à `SpotDetail.tsx:622` (aperçus `blob:` de l'overlay d'édition) n'est **jamais révoqué** → fuite mémoire (Pitfall 7, threat T-03-04-03 disposition=accept). **NON corrigé ici** volontairement (mélangerait fix de bug et migration DS ; l'overlay d'édition relève de Phase 4 / UI-03). À traiter en Phase 4.

## Verification

- `npm run build` (typecheck `tsc -b` inclus) : vert après chaque tâche.
- Task 1 greps : `text-primary`/`text-text`/`text-muted`/`bg-background`/`fill-accent text-accent` présents ; `text-sky-500` count=0 ; `layoutId` count=1 ; `spot-name-` présent ; `text-slate-900` préservé ; `Drawer.Content`/`snapPoints` présents ; imports `../ui/` count=0 ; `URL.createObjectURL` préservé.
- Task 2 greps : `rounded-3xl`/`rounded-t-4xl` présents ; `rounded-[24px]` count=1 (overlay seul) ; `rounded-t-[32px]` count=0 ; `Drawer.Content` présent.
- `git diff` : 17 lignes modifiées au total (14 Task 1 + 3 Task 2), toutes hors overlay (L526-664), hors handlers touch (L680-682), hors portail lightbox. Aucune classe hors token (slate-100/200/…, dégradés, ombres) modifiée.
- Byte-identité visuelle + recette device (drag-to-dismiss, layoutId liste<->fiche, lightbox, 3 onglets) : déléguées au plan 03-06.

## Known Stubs

None.
