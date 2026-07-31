---
created: 2026-07-31T07:20:20.927Z
title: Fermeture SpotDetail décalée/coupée quand le nom du spot est long
area: ui
files:
  - src/components/SpotDetail.tsx:252-350
---

## Problem

Découvert pendant la recette device de la Phase 4 (04-06). Quand le nom d'un spot est long,
le bloc titre (`<div className="flex-1">`, contenant le `<motion.h2 layoutId>` sans `truncate`)
refuse de se réduire (comportement flexbox par défaut : `min-width: auto` sur un item avec du
texte non tronqué). Il pousse alors la rangée de boutons de droite (share / favori / fermer,
`<div className="flex gap-2">`, ligne ~307) hors de la zone visible : le bouton croix (fermer)
se retrouve partiellement coupé — on ne voit pas le rond entier. Le bouton reste cliquable
(la hitbox n'est pas affectée), c'est purement visuel.

Confirmé antérieur à la Phase 4 (présent dans le code base `a0dc289`, aucun plan 04-0x n'a
touché cette rangée de titre) — pas une régression de cette phase, mais un vrai bug UI.

## Solution

TBD — piste probable : ajouter `truncate` (ou `min-w-0` + wrap contrôlé) sur le conteneur du
titre, et/ou `shrink-0` explicite sur la rangée de boutons (`<div className="flex gap-2">`,
ligne 307) pour garantir qu'elle reste toujours entièrement visible quel que soit la longueur
du nom.
