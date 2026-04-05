# Requirements: Updock

**Defined:** 2026-03-18
**Core Value:** Trouver et decouvrir des spots de pumpfoil partout dans le monde — simplicite et beaute avant tout.

## v1 Requirements

### Correctifs techniques

- [x] **TECH-01**: Resoudre le mismatch de version Capacitor (CLI v7 / core v8) avant toute modification native
- [x] **FIX-01**: L'onglet liste affiche les spots tries par distance croissante par rapport a la position GPS de l'utilisateur
- [x] **FIX-02**: Le formulaire d'ajout de spot ne contient plus le champ "hauteur" et propose une UX simplifiee et esthetique

### Profils utilisateurs

- [x] **PROF-01**: L'utilisateur peut definir un pseudo affiche sur ses avis et sessions
- [x] **PROF-02**: L'utilisateur peut uploader une photo de profil (avatar)

### Avis et notation

- [x] **AVIS-01**: L'utilisateur authentifie peut attribuer une note (1 a 5 etoiles) a un spot
- [x] **AVIS-02**: L'utilisateur authentifie peut laisser un commentaire textuel sur un spot
- [x] **AVIS-03**: Les avis et la note moyenne sont visibles dans la fiche detail du spot
- [x] **AVIS-04**: L'utilisateur peut voir et modifier son propre avis

### Sessions programmees

- [x] **SESS-01**: L'utilisateur peut annoncer une session sur un spot (date + heure + message optionnel)
- [x] **SESS-02**: Les sessions a venir sont visibles dans la fiche detail du spot
- [x] **SESS-03**: L'utilisateur peut rejoindre une session annoncee par quelqu'un d'autre
- [x] **SESS-04**: L'utilisateur peut annuler sa propre session ou son inscription a une session

### Notifications push

- [x] **NOTIF-01**: L'utilisateur peut activer les notifications push (permission demandee au moment de creer ou rejoindre une session, pas au lancement)
- [x] **NOTIF-02**: L'utilisateur recoit une notification quand une session est creee sur un spot qu'il a en favori
- [x] **NOTIF-03**: Les participants d'une session recoivent une notification de rappel avant l'heure de la session

### Acces anonyme

- [x] **ANON-01**: L'app se lance directement sur la carte pour les utilisateurs non connectes (pas de mur d'auth)
- [x] **ANON-02**: La LandingPage est supprimee, aucune reference restante
- [x] **ANON-03**: Le SpotDetail affiche les avis et sessions en lecture seule pour les utilisateurs anonymes
- [x] **ANON-04**: Les actions protegees (favori, avis, session, ajout spot) affichent un cadenas et declenchent AuthModal
- [x] **ANON-05**: L'onglet Profil affiche un ecran de connexion dedie pour les utilisateurs anonymes avec toggle de langue
- [x] **ANON-06**: La navigation GPS fonctionne sans compte
- [x] **ANON-07**: L'onglet Favoris declenche AuthModal pour les utilisateurs anonymes
- [x] **ANON-08**: Le role anon Supabase peut lire les reviews, sessions et session_attendees

### Spot Ownership

- **OWN-01**: Le SpotDetail affiche l'avatar et le nom du createur sous le titre du spot (si user_id existe)
- **OWN-02**: Un bouton Modifier est visible uniquement pour le createur du spot ou l'admin
- **OWN-03**: L'overlay d'edition permet de modifier nom, type, description et difficulte
- **OWN-04**: L'overlay d'edition permet d'ajouter de nouvelles photos et de supprimer des photos existantes
- **OWN-05**: Une politique RLS empeche les non-createurs non-admin de modifier les spots

## v2 Requirements

### Donnees spots

- **DATA-01**: Outil d'import en masse de spots (scraping ou import CSV/JSON)
- **DATA-02**: Interface admin pour valider et enrichir les spots importes en masse

### Profil enrichi

- **PROF-03**: L'utilisateur peut consulter l'historique de ses spots soumis dans son profil
- **PROF-04**: L'utilisateur peut ecrire une courte bio sur son profil

### Decouverte

- **DISC-01**: Filtres sur la carte par type de depart, note minimale, sessions a venir
- **DISC-02**: L'utilisateur peut voir les spots avec des sessions prevues mis en valeur sur la carte

## Out of Scope

| Feature | Raison |
|---------|--------|
| Chat en temps reel | Complexite de moderation, hors du coeur de l'app |
| Reseau social (followers, feed d'activite) | Devie du focus spots |
| Gamification / points / badges | Degrade la qualite des avis (voir KiteSpot) |
| Notifications push hors sessions | Scope trop large pour v1 |
| Application web desktop complete | Mobile-first uniquement |
| Analytics avancees | Hors vision actuelle |

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
| OWN-01 | Phase 7 — Spot Ownership | Planned |
| OWN-02 | Phase 7 — Spot Ownership | Planned |
| OWN-03 | Phase 7 — Spot Ownership | Planned |
| OWN-04 | Phase 7 — Spot Ownership | Planned |
| OWN-05 | Phase 7 — Spot Ownership | Planned |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-04-05 — Phase 7 spot ownership requirements added*
