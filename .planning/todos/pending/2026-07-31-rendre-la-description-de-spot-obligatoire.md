---
created: 2026-07-31T07:20:20.927Z
title: Rendre la description de spot obligatoire
area: ui
files:
  - src/components/AddSpotForm.tsx
  - src/components/SpotDetail.tsx
  - src/components/AdminDashboard.tsx
  - src/translations/fr.json
  - src/translations/en.json
---

## Problem

Demande utilisateur remontée pendant la recette device de la Phase 4 (04-06) : la description
d'un spot devrait être un champ obligatoire à la création/édition. Ce n'est actuellement pas le
cas — c'est un choix de design assumé de la Phase 4 (`form.error.desc_too_long` existe pour la
longueur max, mais aucune règle de présence). Ce n'est pas une régression, c'est un nouveau
besoin fonctionnel qui touche les 3 formulaires migrés en Phase 4 (ajout, édition user, édition
admin) et nécessite une nouvelle clé i18n (ex. `form.error.desc_required`) avec parité fr/en.

## Solution

TBD — ajouter la validation "description non vide" dans les 3 points de validation client
(AddSpotForm, SpotDetail édition inline, AdminDashboard édition), avec message inline dédié,
sur le modèle de `form.error.name_required`. Vérifier aussi si une contrainte NOT NULL /
CHECK côté Postgres doit accompagner le changement (cohérence RLS).
