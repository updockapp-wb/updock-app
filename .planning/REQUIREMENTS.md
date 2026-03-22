# Requirements: Updock

**Defined:** 2026-03-18
**Core Value:** Trouver et découvrir des spots de pumpfoil partout dans le monde — simplicité et beauté avant tout.

## v1 Requirements

### Correctifs techniques

- [x] **TECH-01**: Résoudre le mismatch de version Capacitor (CLI v7 / core v8) avant toute modification native
- [x] **FIX-01**: L'onglet liste affiche les spots triés par distance croissante par rapport à la position GPS de l'utilisateur
- [x] **FIX-02**: Le formulaire d'ajout de spot ne contient plus le champ "hauteur" et propose une UX simplifiée et esthétique

### Profils utilisateurs

- [x] **PROF-01**: L'utilisateur peut définir un pseudo affiché sur ses avis et sessions
- [x] **PROF-02**: L'utilisateur peut uploader une photo de profil (avatar)

### Avis et notation

- [x] **AVIS-01**: L'utilisateur authentifié peut attribuer une note (1 à 5 étoiles) à un spot
- [x] **AVIS-02**: L'utilisateur authentifié peut laisser un commentaire textuel sur un spot
- [x] **AVIS-03**: Les avis et la note moyenne sont visibles dans la fiche détail du spot
- [x] **AVIS-04**: L'utilisateur peut voir et modifier son propre avis

### Sessions programmées

- [x] **SESS-01**: L'utilisateur peut annoncer une session sur un spot (date + heure + message optionnel)
- [x] **SESS-02**: Les sessions à venir sont visibles dans la fiche détail du spot
- [x] **SESS-03**: L'utilisateur peut rejoindre une session annoncée par quelqu'un d'autre
- [x] **SESS-04**: L'utilisateur peut annuler sa propre session ou son inscription à une session

### Notifications push

- [x] **NOTIF-01**: L'utilisateur peut activer les notifications push (permission demandée au moment de créer ou rejoindre une session, pas au lancement)
- [x] **NOTIF-02**: L'utilisateur reçoit une notification quand une session est créée sur un spot qu'il a en favori
- [x] **NOTIF-03**: Les participants d'une session reçoivent une notification de rappel avant l'heure de la session

### Acces anonyme

- [x] **ANON-01**: L'app se lance directement sur la carte pour les utilisateurs non connectes (pas de mur d'auth)
- [x] **ANON-02**: La LandingPage est supprimee, aucune reference restante
- [ ] **ANON-03**: Le SpotDetail affiche les avis et sessions en lecture seule pour les utilisateurs anonymes
- [ ] **ANON-04**: Les actions protegees (favori, avis, session, ajout spot) affichent un cadenas et declenchent AuthModal
- [x] **ANON-05**: L'onglet Profil affiche un ecran de connexion dedie pour les utilisateurs anonymes avec toggle de langue
- [ ] **ANON-06**: La navigation GPS fonctionne sans compte
- [ ] **ANON-07**: L'onglet Favoris declenche AuthModal pour les utilisateurs anonymes
- [x] **ANON-08**: Le role anon Supabase peut lire les reviews, sessions et session_attendees

## v2 Requirements

### Données spots

- **DATA-01**: Outil d'import en masse de spots (scraping ou import CSV/JSON)
- **DATA-02**: Interface admin pour valider et enrichir les spots importés en masse

### Profil enrichi

- **PROF-03**: L'utilisateur peut consulter l'historique de ses spots soumis dans son profil
- **PROF-04**: L'utilisateur peut écrire une courte bio sur son profil

### Découverte

- **DISC-01**: Filtres sur la carte par type de départ, note minimale, sessions à venir
- **DISC-02**: L'utilisateur peut voir les spots avec des sessions prévues mis en valeur sur la carte

## Out of Scope

| Feature | Raison |
|---------|--------|
| Chat en temps réel | Complexité de modération, hors du cœur de l'app |
| Réseau social (followers, feed d'activité) | Dévie du focus spots |
| Gamification / points / badges | Dégrade la qualité des avis (voir KiteSpot) |
| Notifications push hors sessions | Scope trop large pour v1 |
| Application web desktop complète | Mobile-first uniquement |
| Analytics avancées | Hors vision actuelle |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TECH-01 | Phase 1 — Foundation | Complete |
| FIX-01 | Phase 1 — Foundation | Complete |
| FIX-02 | Phase 1 — Foundation | Complete |
| PROF-01 | Phase 1 — Foundation | Complete |
| PROF-02 | Phase 1 — Foundation | Complete |
| AVIS-01 | Phase 2 — Reviews | Complete |
| AVIS-02 | Phase 2 — Reviews | Complete |
| AVIS-03 | Phase 2 — Reviews | Complete |
| AVIS-04 | Phase 2 — Reviews | Complete |
| SESS-01 | Phase 3 — Sessions | Complete |
| SESS-02 | Phase 3 — Sessions | Complete |
| SESS-03 | Phase 3 — Sessions | Complete |
| SESS-04 | Phase 3 — Sessions | Complete |
| NOTIF-01 | Phase 4 — Push Notifications | Complete |
| NOTIF-02 | Phase 4 — Push Notifications | Complete |
| NOTIF-03 | Phase 4 — Push Notifications | Complete |
| ANON-01 | Phase 5 — Anonymous Access | Planned |
| ANON-02 | Phase 5 — Anonymous Access | Planned |
| ANON-03 | Phase 5 — Anonymous Access | Planned |
| ANON-04 | Phase 5 — Anonymous Access | Planned |
| ANON-05 | Phase 5 — Anonymous Access | Planned |
| ANON-06 | Phase 5 — Anonymous Access | Planned |
| ANON-07 | Phase 5 — Anonymous Access | Planned |
| ANON-08 | Phase 5 — Anonymous Access | Planned |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-22 — Phase 5 anonymous access requirements added*
