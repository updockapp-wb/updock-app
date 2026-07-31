# Updock

## What This Is

Updock est une carte interactive communautaire qui référence tous les spots de pumpfoil dans le monde (dockstart, beach start, etc.). Les utilisateurs soumettent des spots que l'administrateur valide avant publication. L'app est mobile-first, déployée via Capacitor sur iOS/Android.

## Core Value

Les spots, avant tout. Trouver et découvrir des spots de pumpfoil partout dans le monde — tout le reste est secondaire.

## Current Milestone: v2.0 Refactor UI/UX & Performance

**Goal:** Résorber la dette technique et l'incohérence visuelle accumulées au fil des mises à jour — rendre l'app plus rapide, plus légère, plus maintenable et visuellement homogène, sans altérer aucune fonctionnalité existante.

**Target features:**
- Design System : thème centralisé (couleurs, typographie, espacements) + composants maîtres réutilisables (Boutons, Cards, Inputs, Modales, Headers)
- Performance & code : réduction des re-renders inutiles, optimisation cache/médias (vue Carte), nettoyage code mort / dépendances obsolètes, homogénéisation de la gestion d'état
- Robustesse : sécurisation de la gestion des erreurs et de la validation des données (formulaires + appels API)

**Contraintes du milestone :**
- **Zéro régression fonctionnelle** — 100% des fonctionnalités existantes conservées, comportement utilisateur inchangé
- **Approche incrémentale** — un module/composant à la fois, jamais un balayage global de la codebase
- **Recette manuelle** — pas d'infra de test ; chaque phase se valide via une checklist de flux critiques testée sur mobile

Requirements détaillés : voir `.planning/REQUIREMENTS.md`. Roadmap : voir `.planning/ROADMAP.md`.

**Phase 1 (Audit & Design System) — Complete (2026-07-28).** DS-01/DS-02/DS-03 validés : audit chiffré (`01-AUDIT.md`, baseline gzip JS ≈504 kB), tokens centralisés dans `src/index.css` (couleurs aliasées aux variables Tailwind natives — zéro dérive de couleur), 5 composants maîtres (`src/ui/{Button,Card,Header,Input,Modal}`) extraits verbatim de l'app existante et prouvés sur l'AuthModal (migration D-09, parité pixel confirmée, logique auth byte-identique).

**Phase 2 (Navigation & Vue Carte / Spots) — Complete (2026-07-29).** NAV-01/MAP-01/MAP-02/PERF-01 validés.

**Phase 3 (Fiches Détaillées & Profils) — Complete (2026-07-30).** UI-01/UI-02/PERF-02 validés : SpotDetail et Profile/CommunityStatsScreen migrés vers le design system (tokens + composants maîtres), lazy loading des médias (`loading="lazy"` ×3 + prefetch lightbox), byte-identité CSS et visuelle prouvées (10/10 surfaces), recette QA-01 device iOS à 100% (12/12 items PASS). Bug de modale masquée derrière le tiroir SpotDetail découvert et corrigé en gap closure (`createPortal` sur le master Modal, commit `497f347`). Phase 4 (Formulaires & Interactions) peut démarrer.

**Phase 4 (Formulaires & Interactions) — Complete (2026-07-31).** UI-03/ROBUST-01/ROBUST-02 validés : `Input` DS étendu (surface claire, textarea, maxLength, erreur inline) ; formulaires d'ajout/édition de spot (AddSpotForm, SpotDetail, AdminDashboard) et boutons favori (SpotDetail, App.tsx) migrés vers Input/Button/Modal avec validation client cohérente (nom requis/≤100, description ≤2000, ≥1 type) ; `alert()` natifs éliminés de `SpotsContext`/`FavoritesContext` au profit d'erreurs propagées (inline) et de `Toast` Capacitor (transitoire), sans état bloqué. Recette QA-01 device iOS à 100% (8/8 items PASS) — un bug bloquant (bouton Save coupé par la safe-area bottom manquante dans l'overlay d'édition) trouvé et corrigé en gap closure immédiat (`pb-[env(safe-area-inset-bottom)]`, commits `d1b3e14`/`46c239a`). Quatre constats hors régression (croix SpotDetail décalée sur nom long, description non obligatoire, onglet Pending admin non migré, accent manquant sur « communauté ») capturés en todos pour une phase future. Phase 5 (Recette globale & nettoyage final) peut démarrer.

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
| Milestone v2.0 = refactor sans nouvelle feature user | Dette technique + incohérence visuelle bloquent la maintenabilité ; consolider avant d'ajouter des features | — Pending |
| Numérotation des phases remise à 1 pour v2.0 | Phases v1.1.3 (01→09) archivées ; nouveau cycle repart proprement à Phase 1 | Archivé dans .planning/archive/v1.1.3-community-features/ |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-31 — Phase 4 (Formulaires & Interactions) complete*
