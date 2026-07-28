# Phase 8: Bug Fixes — Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Corriger les bugs existants dans l'app. Aucune nouvelle fonctionnalité. Chaque item est soit un bug confirmé par l'utilisateur, soit une incohérence identifiée dans le code.

</domain>

<decisions>
## Implementation Decisions

### AdminDashboard — Bouton X ne ferme pas
- **D-01:** Le bouton X du header AdminDashboard (`onClick={onClose}`) ne ferme pas le dashboard. Investiguer la prop `onClose` dans le parent (probablement App.tsx) et les éventuels conflits de z-index avec l'overlay d'édition (z-50 interne).

### AdminDashboard — Photos des spots non affichées dans la preview
- **D-02:** La modal de preview d'un spot en attente (`previewSpot`) n'affiche pas les photos du spot. Ajouter l'affichage de `previewSpot.image_urls` dans cette modal.
- **D-03:** Les photos uploadées par des utilisateurs classiques échouent probablement parce que les policies Supabase Storage ne sont pas appliquées sur l'instance de production. La migration `supabase/migrations/supabase_storage_setup.sql` doit être exécutée manuellement dans le SQL Editor Supabase (ou instruite comme action manuelle dans le plan).

### AdminDashboard — UX
- **D-04:** L'UX générale du dashboard n'est "pas top" selon l'utilisateur. Identifier et améliorer les points de friction les plus évidents (feedback visuel sur actions approve/delete, états vides, lisibilité). Pas de refonte — des améliorations ciblées.

### Galerie photos — Bouton X ne répond pas
- **D-05:** Dans `SpotDetail.tsx`, le bouton X de la lightbox (`isImageOpen`) ne répond pas du tout sur mobile. Ajouter `e.stopPropagation()` sur le bouton X. Vérifier aussi que le Portal (`createPortal`) est correctement attaché au `document.body` sur iOS Capacitor.

### Numéro de version
- **D-06:** `Profile.tsx` affiche `Updock v1.1.0 (Beta)` en dur. Corriger le hardcode à `v1.1.3`.

### Badge ROOKIE — Suppression
- **D-07:** Supprimer entièrement le système de gamification (Rookie / Pro / Expert) dans `Profile.tsx`. Retirer la fonction `getLevel`, le calcul `level`, et l'affichage du badge sous le nom d'utilisateur.

### Nombre de spots uploadés
- **D-08:** `spotsCount` utilise `favorites.length` au lieu du nombre de spots créés par l'utilisateur. La stat "Spots Added" est hardcodée à `0`. Fetcher depuis Supabase : `SELECT COUNT(*) FROM spots WHERE user_id = auth.uid()`. Afficher ce count dans la carte stats du profil.

### Avatar par défaut
- **D-09:** Les 5 avatars SVG prédéfinis sont supprimés. Afficher une silhouette neutre unique quand l'utilisateur n'a pas uploadé de photo de profil.
- **D-10:** Utiliser l'icône Lucide `UserCircle` ou `User` déjà présente dans le projet comme avatar neutre par défaut — zéro fichier asset supplémentaire. L'interface de sélection d'avatar prédéfini (grille de 5 boutons) est retirée. L'utilisateur peut toujours uploader une photo personnalisée.

</decisions>

<canonical_refs>
## Canonical References

- `src/components/Profile.tsx` — version, badge ROOKIE, spotsCount, avatars
- `src/components/SpotDetail.tsx` — lightbox galerie, bouton X
- `src/components/AdminDashboard.tsx` — bouton X, preview photos, UX
- `src/context/SpotsContext.tsx` — fetch spots par user_id
- `supabase/migrations/supabase_storage_setup.sql` — policies Storage à appliquer en prod
- `package.json` — version de référence (1.1.3)

</canonical_refs>

<deferred>
## Idées Reportées

- Gestion de photos dans l'overlay d'édition AdminDashboard (comme dans SpotDetail) — hors scope phase 08
- Refonte complète de l'UX AdminDashboard — hors scope phase 08

</deferred>
