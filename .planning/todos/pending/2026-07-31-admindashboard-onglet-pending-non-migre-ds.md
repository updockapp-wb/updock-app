---
created: 2026-07-31T07:20:20.927Z
title: Migrer l'onglet "Pending" d'AdminDashboard vers le design system
area: ui
files:
  - src/components/AdminDashboard.tsx
---

## Problem

Remarqué pendant la recette device de la Phase 4 (04-06) : l'onglet "Pending" du tableau de
bord admin (`view === 'pending'`, cartes d'approbation/rejet des spots en attente, autour de
`AdminDashboard.tsx:108-190`) n'a pas été migré vers le design system. Ce n'est **pas** une
régression — le plan 04-05 couvrait explicitement le formulaire d'édition inline (D-09), pas
les cartes d'approbation de l'onglet Pending, qui sont une UI distincte (pas un formulaire).
Reste un candidat de nettoyage visuel pour une phase future si l'objectif est une cohérence DS
totale de l'admin.

## Solution

TBD — auditer les boutons/cartes de l'onglet Pending (`AdminDashboard.tsx` autour des lignes
108-190) et migrer vers `Button`/`Input`/tokens sémantiques si jugé prioritaire, en suivant le
même pattern que 04-05 pour l'onglet "all".
