# Updock

## What This Is

Updock est une carte interactive communautaire qui référence tous les spots de pumpfoil dans le monde (dockstart, beach start, etc.). Les utilisateurs soumettent des spots que l'administrateur valide avant publication. L'app est mobile-first, déployée via Capacitor sur iOS/Android.

## Core Value

Les spots, avant tout. Trouver et découvrir des spots de pumpfoil partout dans le monde — tout le reste est secondaire.

## Requirements

### Validated

- ✓ Carte interactive Mapbox avec clustering par type de spot — existant
- ✓ Soumission de spot par les utilisateurs (validée par l'admin) — existant
- ✓ Authentification email/password via Supabase — existant
- ✓ Système de favoris (local + Supabase) — existant
- ✓ Dashboard admin (approbation / suppression de spots) — existant
- ✓ Onglet liste de spots (présent mais cassé) — existant
- ✓ Internationalisation FR/EN — existant
- ✓ Cache offline pour les images — existant

### Active

- [ ] Onglet liste fonctionnel : afficher les spots triés par proximité GPS de l'utilisateur
- [ ] Formulaire d'ajout de spot simplifié : retirer le champ "hauteur", garder nom / type / photos / description ; meilleure UX visuelle
- [ ] Profils utilisateurs simples : nom, avatar, historique des spots soumis — sans surcharger l'expérience
- [ ] Avis et notation des spots : les utilisateurs peuvent laisser une note et un commentaire sur un spot
- ✓ Sessions programmées : un utilisateur indique qu'il sera sur un spot à une heure précise ; les autres peuvent être notifiés et le rejoindre — Validated in Phase 03: sessions
- ✓ Spot ownership : afficher l'uploader et permettre la modification par le créateur du spot et l'admin — Validated in Phase 07: spot-ownership

### Out of Scope

- Chat en temps réel — trop complexe, hors du cœur de l'app
- Réseau social (followers, feed d'activité) — ne pas dériver vers une app sociale
- Monétisation / abonnements — pas dans la vision actuelle
- Analyse de données / analytics avancées — hors scope v1
- Application web desktop complète — mobile-first uniquement

## Context

- Stack : React + TypeScript, Supabase (auth + DB), Mapbox GL, Capacitor (iOS/Android), Framer Motion, Tailwind v4
- L'onglet liste est déjà implémenté mais ne s'affiche pas (bug à investiguer dans SpotsContext / List component)
- Le formulaire AddSpotForm a un champ "hauteur" superflu et une UX perfectible (memory leak sur les aperçus d'images à corriger aussi)
- Les types de spot sont stockés comme JSON string en base — fragile, à surveiller lors des modifications
- Pas de tests automatisés — tout changement doit être testé manuellement sur mobile

## Constraints

- **Mobile-first** : toutes les UI doivent fonctionner sur petits écrans (iOS safe-area, notch)
- **Simplicité utilisateur** : les riders veulent voir des spots, pas créer un profil complexe — garder toute nouvelle fonctionnalité légère
- **Supabase** : backend imposé, ne pas introduire d'autre service de données
- **Pas de tests** : aucune infra de test en place — ne pas en introduire sauf si demandé explicitement

## Key Decisions

| Décision | Rationale | Outcome |
|----------|-----------|---------|
| Profils simples avant fonctionnalités communautaires | Base nécessaire pour avis + sessions sans alourdir l'UX | — Pending |
| Sessions programmées avec notifications push | Fonctionnalité communautaire différenciante, naturelle pour les riders | Sessions livrées (Phase 03) — Notifications push en Phase 04 |
| Ne pas refactoriser le type de spot (JSON string) maintenant | Hors scope des correctifs prioritaires | — Pending |

---
*Last updated: 2026-04-14 after Phase 08 (bug-fixes) completion*
