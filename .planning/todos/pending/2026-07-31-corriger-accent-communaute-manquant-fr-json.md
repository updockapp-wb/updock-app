---
created: 2026-07-31T07:20:20.927Z
title: Corriger l'accent manquant sur "communauté" dans fr.json
area: ui
files:
  - src/translations/fr.json:136
  - src/translations/fr.json:137
  - src/translations/fr.json:152
  - src/translations/fr.json:157
---

## Problem

Remarqué pendant la recette device de la Phase 4 (04-06) : le mot "communauté" est écrit sans
accent ("communaute") dans plusieurs clés de `fr.json` — `anon_profile.title`,
`anon_profile.subtitle`, `community_stats.title`, `community_stats.nav_label`. Incohérence
préexistante : d'autres clés du même fichier (`landing.subtitle`, `welcome.subtitle`) ont déjà
le bon accent. Confirmé présent avant la Phase 4 (commit `a0dc289`) — pas une régression de
cette phase, fichier non touché par les plans 04-0x.

## Solution

TBD — corriger les 4 occurrences en `communauté` dans `fr.json`. Vérifier au passage l'absence
d'autres accents manquants dans les mêmes clés/fichier (passe rapide de relecture i18n fr).
