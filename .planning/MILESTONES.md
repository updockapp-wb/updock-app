# Milestones

Historique des milestones livrés sur Updock.

## v1.1.3 — Community Features (livré)

Ajout de la couche communautaire par-dessus la découverte de spots (carte, auth, favoris, admin).

**Phases livrées :**
- **Phase 1 — Foundation** : correctif Capacitor, schéma DB (5 tables + RLS), profils utilisateurs, tri liste par proximité GPS, simplification formulaire d'ajout
- **Phase 2 — Reviews** : notation 1-5 étoiles + commentaires, onglet Reviews sur la fiche spot, moyenne calculée client-side
- **Phase 3 — Sessions** : sessions programmées avec join/leave sur un spot
- **Phase 4 — Push Notifications** : push FCM (@capacitor-firebase/messaging) pour l'activité de session sur les spots favoris
- **Phase 5 — Anonymous Access** : navigation carte + fiches spot sans compte
- **Phase 7 — Spot Ownership** : affichage de l'uploader, édition par le créateur du spot et l'admin
- **Phase 8 — Bug Fixes** : correctifs admin dashboard et bouton fermer galerie photos
- **Phase 9 — Community Stats** : section statistiques globales de la communauté dans l'onglet Profil

**Quick tasks associées :** filtre flou/cadenas images non connecté, prénom comme pseudo par défaut, filtre beach start, notifications session (push aux favoris + préférences + conflit même jour).

**Reste ouvert (reporté) :** bug notifications push session non reçues sur iPhone (webhook OK, tokens manquants — voir mémoire projet).

Artefacts archivés dans `.planning/archive/v1.1.3-community-features/`.

---

## 1.2.0 — Refactor UI/UX & Performance (en cours)

Voir `.planning/PROJECT.md` (Current Milestone) et `.planning/ROADMAP.md`.
