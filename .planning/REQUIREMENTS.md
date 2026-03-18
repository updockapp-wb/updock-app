# Requirements: Updock

**Defined:** 2026-03-18
**Core Value:** Trouver et découvrir des spots de pumpfoil partout dans le monde — simplicité et beauté avant tout.

## v1 Requirements

### Correctifs techniques

- [ ] **TECH-01**: Résoudre le mismatch de version Capacitor (CLI v7 / core v8) avant toute modification native
- [ ] **FIX-01**: L'onglet liste affiche les spots triés par distance croissante par rapport à la position GPS de l'utilisateur
- [ ] **FIX-02**: Le formulaire d'ajout de spot ne contient plus le champ "hauteur" et propose une UX simplifiée et esthétique

### Profils utilisateurs

- [ ] **PROF-01**: L'utilisateur peut définir un pseudo affiché sur ses avis et sessions
- [ ] **PROF-02**: L'utilisateur peut uploader une photo de profil (avatar)

### Avis et notation

- [ ] **AVIS-01**: L'utilisateur authentifié peut attribuer une note (1 à 5 étoiles) à un spot
- [ ] **AVIS-02**: L'utilisateur authentifié peut laisser un commentaire textuel sur un spot
- [ ] **AVIS-03**: Les avis et la note moyenne sont visibles dans la fiche détail du spot
- [ ] **AVIS-04**: L'utilisateur peut voir et modifier son propre avis

### Sessions programmées

- [ ] **SESS-01**: L'utilisateur peut annoncer une session sur un spot (date + heure + message optionnel)
- [ ] **SESS-02**: Les sessions à venir sont visibles dans la fiche détail du spot
- [ ] **SESS-03**: L'utilisateur peut rejoindre une session annoncée par quelqu'un d'autre
- [ ] **SESS-04**: L'utilisateur peut annuler sa propre session ou son inscription à une session

### Notifications push

- [ ] **NOTIF-01**: L'utilisateur peut activer les notifications push (permission demandée au moment de créer ou rejoindre une session, pas au lancement)
- [ ] **NOTIF-02**: L'utilisateur reçoit une notification quand une session est créée sur un spot qu'il a en favori
- [ ] **NOTIF-03**: Les participants d'une session reçoivent une notification de rappel avant l'heure de la session

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
| TECH-01 | Phase 1 — Foundation | Pending |
| FIX-01 | Phase 1 — Foundation | Pending |
| FIX-02 | Phase 1 — Foundation | Pending |
| PROF-01 | Phase 1 — Foundation | Pending |
| PROF-02 | Phase 1 — Foundation | Pending |
| AVIS-01 | Phase 2 — Reviews | Pending |
| AVIS-02 | Phase 2 — Reviews | Pending |
| AVIS-03 | Phase 2 — Reviews | Pending |
| AVIS-04 | Phase 2 — Reviews | Pending |
| SESS-01 | Phase 3 — Sessions | Pending |
| SESS-02 | Phase 3 — Sessions | Pending |
| SESS-03 | Phase 3 — Sessions | Pending |
| SESS-04 | Phase 3 — Sessions | Pending |
| NOTIF-01 | Phase 4 — Push Notifications | Pending |
| NOTIF-02 | Phase 4 — Push Notifications | Pending |
| NOTIF-03 | Phase 4 — Push Notifications | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability updated after roadmap creation (4-phase coarse structure)*
