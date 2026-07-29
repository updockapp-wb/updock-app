---
title: Liste de pays incomplète dans les stats communauté ("Other" + emoji drapeau cassé)
area: community-stats
priority: low
captured: 2026-07-29
status: active
---

## Symptome
Sur l'écran Statistiques communauté, des spots situés hors des pays couverts tombent dans une
catégorie "Other" dont l'emoji drapeau ne s'affiche pas correctement.

## Contexte
`src/utils/countryFromCoords.ts` :
- `COUNTRY_BOUNDS` est une liste codée en dur de 14 pays (CH, FR, ES, PT, IT, DE, NL, BE, GB, GR,
  HR, US, AU, BR) avec bounding-box lat/lng approximatives.
- Tout spot hors de ces 14 bounding-box tombe dans `getCountryFromCoords` → fallback
  `{ code: 'XX', name: 'Other' }`.
- `countryCodeToFlag('XX')` calcule un emoji drapeau à partir du code ISO — "XX" n'est pas un vrai
  code ISO 3166, donc l'emoji résultant ne correspond à aucun drapeau réel (glyphe cassé/manquant).
- Repéré concrètement avec des spots existants en Norvège, Pologne, Maroc, Colombie, Mozambique,
  Tanzanie — tous hors des 14 pays couverts.

## Pistes
1. Étoffer `COUNTRY_BOUNDS` avec la liste complète des pays (~195 entrées) — simple mais fastidieux
   à maintenir et les bounding-box rectangulaires restent approximatives (chevauchements possibles).
2. Remplacer par une vraie lib de reverse-geocoding (ex: `country-reverse-geocoding`,
   `@turf/boolean-point-in-polygon` + GeoJSON des frontières, ou un point-in-polygon local sans
   dépendance réseau) — plus précis, plus lourd.
3. Court terme : au minimum, ne pas afficher d'emoji pour "Other" (juste le nom "Other"/"Autre")
   plutôt qu'un glyphe cassé.

## Note
Bug repéré pendant la Phase 2 (v2.0 refactor UI/UX). Hors scope du milestone en cours
(fonctionnel/données, pas harmonisation design system) — voir REQUIREMENTS.md "Out of Scope".
