---
phase: 05-recette-globale-nettoyage-final
plan: 05
type: qa-checklist
status: pending-device-pass
created: 2026-07-31
requirements: [QA-01]
decisions: [D-10, D-11, D-12, D-13]
---

# 05-QA-CHECKLIST — Recette globale de non-régression (clôture v2.0)

> **Phase gate finale de la Phase 5 ET du milestone v2.0.** Cette recette est la **passe
> unique et finale** (D-13) déroulée **après** que tout le travail de la phase est complet :
> split des contextes + lint vert (05-01), nettoyage code mort/dépendances (05-02),
> harmonisation de la gestion d'erreurs + parallélisation `cacheSpotImages` (05-03),
> lazy-loading Map/AdminDashboard/PremiumModal derrière Suspense + Error Boundary (05-04).
>
> **Fusion de couverture (D-10) :** cette checklist consolide les flux critiques des recettes
> Phases 2/3/4 **plus** les flux avis/session/auth précédemment non couverts en un seul passage.
>
> **Contrainte cardinale (zéro régression) :** toute divergence de rendu ou régression
> fonctionnelle détectée pendant la recette est à corriger via gap closure
> (`/gsd:plan-phase 05 --gaps`), **pas** un arbitrage. Ne pas trancher soi-même.
>
> **Plateformes requises (D-11) :** recette à dérouler **à 100% sur un iPhone physique ET un
> device Android physique** — les deux plateformes en une seule passe finale (D-13). Le split
> de code (`import()` dynamique dans la WebView Capacitor — Pitfall 1) porte un risque
> cross-platform spécifique qui exige les deux OS.

---

## 0. Filet automatique (gate pré-recette)

> Rempli par la Task 2 du plan 05-05 (gate automatisé). À valider **avant** de commencer la
> passe device.

| Gate | Commande | Attendu | Résultat |
|------|----------|---------|----------|
| Lint | `npm run lint` | 0 problème (cible D-01 verte de la phase) | _(voir 05-05-SUMMARY.md)_ |
| Build | `npm run build` (`tsc -b && vite build`) | succès, aucune erreur TS | _(voir 05-05-SUMMARY.md)_ |
| Sync natif | `npx cap sync` | shells iOS + Android portent les nouveaux chunks hashés (Pitfall 1 : chunks périmés = écran blanc) | _(voir 05-05-SUMMARY.md — peut requérir Node ≥22, cf. Deferred Items)_ |

**Prérequis device :** si `npx cap sync` a été bloqué (env Node v20 < 22, cf. STATE.md Deferred
Items), lancer `npm run build && npx cap sync` dans un environnement **Node 22** avant la passe
device, afin que `public/` natif embarque les nouveaux chunks lazy hashés.

---

## 1. Scénarios de recette manuelle (device iOS physique ET Android physique)

> **Étape NON reproductible en desktop.** Gestuelle tactile, toasts Capacitor natifs,
> comportement offline réel et **chargement des chunks lazy en WebView native** exigent des
> **devices physiques**. Marquer PASS/FAIL par plateforme.
>
> **Garde-fous de recette :** compte de test réel, interactions réversibles uniquement
> (favori/join/leave/avis) ; ne pas créer de données parasites persistantes.

### 1.1 — Carte (Map)

| # | Scénario | Étapes | Résultat attendu | iOS | Android |
|---|----------|--------|-------------------|-----|---------|
| C1 | **Affichage carte + markers** | Cold-launch → onglet carte | La carte Mapbox charge, markers/clusters visibles par type de spot ; **aucun écran blanc**, skeleton puis rendu (chunk lazy Map) | ☐ | ☐ |
| C2 | **Filtres** | Ouvrir FiltersModal → cocher/décocher des types → appliquer | La carte se met à jour selon les types sélectionnés ; bottom-sheet DS inchangé | ☐ | ☐ |
| C3 | **Recherche** | Ouvrir SearchModal → saisir un nom de spot/lieu | Résultats affichés, sélection recentre la carte | ☐ | ☐ |
| C4 | **Aperçu offline** | Couper le réseau → parcourir la carte déjà chargée | Les images en cache restent visibles (cache offline existant), pas de crash | ☐ | ☐ |

### 1.2 — Fiche spot (SpotDetail)

| # | Scénario | Étapes | Résultat attendu | iOS | Android |
|---|----------|--------|-------------------|-----|---------|
| F1 | **Ouverture fiche (gestuelle)** | Clic marker → tiroir snap 0.35 → drag vers 0.95 → swipe-to-dismiss | Morphing du nom (`layoutId`), snap points fluides, fermeture par swipe OK | ☐ | ☐ |
| F2 | **Onglets Info/Avis/Sessions** | Basculer entre les 3 onglets | Bascule OK ; avatars/vignettes (lazy) sans image manquante | ☐ | ☐ |
| F3 | **Lightbox photos** | Ouvrir une photo → next/prev → swipe dans la lightbox → fermer | Next/prev fluides (prefetch) ; swipe interne ne déclenche PAS le drag-to-dismiss (portail isolé) | ☐ | ☐ |
| F4 | **Édition inline (propriétaire)** | Éditer un spot dont on est propriétaire → modifier → Save ; retester réseau coupé | Champs `Input` DS, `Button loading` ; validation identique au formulaire d'ajout ; échec réseau → erreur inline, overlay reste ouvert, données conservées ; bouton Save NON coupé par la safe-area bottom (correctif `46c239a`) | ☐ | ☐ |

### 1.3 — Favoris

| # | Scénario | Étapes | Résultat attendu | iOS | Android |
|---|----------|--------|-------------------|-----|---------|
| FV1 | **Add/remove depuis la fiche + la liste** | Toggler le cœur depuis SpotDetail ET depuis l'onglet favoris | `Button iconOnly`, cible ≥44px, `aria-label` correct ; état synchronisé entre fiche et liste | ☐ | ☐ |
| FV2 | **Favori non connecté** | Toggler un favori déconnecté | Ouverture de l'auth (SpotDetail) + badge cadenas visible sur les vignettes | ☐ | ☐ |
| FV3 | **Favori offline (revert optimiste)** | Couper le réseau → toggler un favori | État visuel màj immédiate (optimiste) puis revert automatique + toast discret « Échec, réessaie. » | ☐ | ☐ |

### 1.4 — Avis (ReviewForm / ReviewList)

| # | Scénario | Étapes | Résultat attendu | iOS | Android |
|---|----------|--------|-------------------|-----|---------|
| AV1 | **Ajout d'avis** | Onglet Avis d'une fiche → laisser une note + un commentaire → soumettre | Avis enregistré et affiché en tête de liste ; note reflétée dans la moyenne | ☐ | ☐ |
| AV2 | **Affichage liste d'avis** | Ouvrir un spot avec avis existants | ReviewList affiche notes + commentaires + avatars auteurs ; empty state « Aucun avis pour le moment » si vide | ☐ | ☐ |

### 1.5 — Sessions (SessionForm / SessionList / SessionCard)

| # | Scénario | Étapes | Résultat attendu | iOS | Android |
|---|----------|--------|-------------------|-----|---------|
| S1 | **Création de session** | Onglet Sessions d'une fiche → créer une session (date/heure) | Session créée et affichée dans SessionList | ☐ | ☐ |
| S2 | **Affichage + rejoindre** | Voir une session existante → rejoindre (join) puis quitter (leave) | SessionCard affiche l'horaire + participants ; join/leave réversible met à jour le compteur | ☐ | ☐ |

### 1.6 — Ajout / édition de spot (AddSpotForm / AdminDashboard)

| # | Scénario | Étapes | Résultat attendu | iOS | Android |
|---|----------|--------|-------------------|-----|---------|
| A1 | **Ajout de spot** | Ouvrir le formulaire → remplir → soumettre | Champs `Input` DS ; `Button loading` ; toast « Envoi du spot en cours… » (comportement `addSpot` inchangé) | ☐ | ☐ |
| A2 | **Validation ajout** | Soumettre nom vide/espaces, nom >100, description >2000, 0 type | Message inline par cas ; `addSpot` NON déclenché ; données conservées | ☐ | ☐ |
| A3 | **Confirmation « pas de photo » (D-04)** | Soumettre sans photo | `Modal` DS (light+center) app — PAS `confirm()` natif — « Publier quand même » / « Ajouter une photo » | ☐ | ☐ |
| A4 | **Édition admin (FR + EN)** | Depuis AdminDashboard, éditer un spot en FR puis EN ; retester réseau coupé | Champs `Input` DS ; libellés corrects dans les 2 langues ; validation identique ; échec réseau → toast ; succès → overlay fermé | ☐ | ☐ |
| A5 | **Suppression de spot (D — Modal app)** | Depuis AdminDashboard (ou fiche si propriétaire), supprimer un spot | La confirmation passe par un **Modal app** (PAS un dialogue natif) et **gate toujours** l'action destructive avant suppression effective | ☐ | ☐ |

### 1.7 — Profil (Profile / PremiumModal / CommunityStatsScreen)

| # | Scénario | Étapes | Résultat attendu | iOS | Android |
|---|----------|--------|-------------------|-----|---------|
| P1 | **Profil authentifié** | Onglet profil connecté | Avatar, 2 stats (Card), rangées de réglages, bouton Log Out présents | ☐ | ☐ |
| P2 | **Profil anonyme** | Onglet profil déconnecté | Branche « Se connecter » / « Créer un compte » | ☐ | ☐ |
| P3 | **PremiumModal** | « Devenir Premium » → ouvrir, fermer par bouton close ET par backdrop | Modal premium charge (chunk lazy) sans erreur ; ouverture/fermeture OK | ☐ | ☐ |
| P4 | **CommunityStatsScreen** | Ouvrir depuis le profil | Titre NON masqué par la status bar (safe-area) ; 2 KPI (Card) + liste pays | ☐ | ☐ |
| P5 | **Rangée Admin masquée (non-admin)** | Profil d'un compte non-admin | « Tableau de Bord Admin » masquée (le contrôle de rôle gate toujours le montage lazy — T-05-10) | ☐ | ☐ |

### 1.8 — Auth (AuthModal)

| # | Scénario | Étapes | Résultat attendu | iOS | Android |
|---|----------|--------|-------------------|-----|---------|
| AU1 | **Connexion** | Ouvrir AuthModal → se connecter (email/mot de passe) | Connexion OK ; AuthModal (fond sombre, label uppercase) inchangé | ☐ | ☐ |
| AU2 | **Inscription (Toast)** | Créer un compte | Le message d'inscription apparaît en **Toast** (PAS un `alert()` natif) | ☐ | ☐ |
| AU3 | **Déconnexion (reset d'état)** | Se déconnecter | La déconnexion **réinitialise correctement** profil / token / état notifications (correctif set-state-in-effect) ; retour à l'état anonyme propre | ☐ | ☐ |

---

## 2. Vérifications spécifiques à la Phase 5 (à confirmer on-device, les 2 plateformes)

> Ces points portent le risque cross-platform introduit par la Phase 5. À vérifier
> explicitement en plus des scénarios ci-dessus.

| # | Vérification | Pourquoi (Phase 5) | Attendu | iOS | Android |
|---|--------------|--------------------|---------|-----|---------|
| V1 | **Résilience chunk-load (cold launch)** | Split de code 05-04 : `import()` dynamique en WebView Capacitor (Pitfall 1 / Error Boundary — T-05-11) | Cold-launch → onglet carte : **skeleton puis rendu**, aucun **écran blanc**, aucune erreur « Failed to fetch dynamically imported module » | ☐ | ☐ |
| V2 | **Chunks admin + premium** | AdminDashboard et PremiumModal lazy derrière Suspense (05-04) | Ouvrir le flux admin (si admin) et le flux premium : chargent **sans erreur** ni écran blanc ; Error Boundary récupère si échec | ☐ | ☐ |
| V3 | **Reset d'état au logout** | Correctifs set-state-in-effect (05-01/05-03) | Le logout réinitialise profil / notifications / token sans état résiduel (cf. AU3) | ☐ | ☐ |
| V4 | **Confirmation de suppression via Modal app** | `deleteSpot` confirme désormais via Modal app, plus `confirm()` natif | La suppression affiche le Modal app et gate toujours l'action destructive (cf. A5) | ☐ | ☐ |
| V5 | **Message d'inscription en Toast** | AuthModal : `alert()` natif → Toast | L'inscription déclenche un Toast, pas d'alerte native (cf. AU2) | ☐ | ☐ |

---

## 3. Exclusions connues — NON considérées comme des régressions (D-12)

> Ces 2 bugs sont **hors périmètre du milestone v2.0** (fonctionnel/données, pas
> harmonisation/refactor). S'ils sont rencontrés pendant la recette, les **logger comme
> KNOWN**, séparément de toute régression nouvellement trouvée. Ils **ne bloquent pas** la
> clôture de la Phase 5.

| # | Bug connu | Source | Nature | Statut |
|---|-----------|--------|--------|--------|
| K1 | **Notifications push de session non reçues sur iPhone** (webhook OK HTTP 200, mais tokens FCM manquants / opt-out) | `.planning/todos/push-notif-no-popup-iphone.md` | Notifications (hors milestone) | Reporté (hors milestone) |
| K2 | **Liste de pays incomplète dans CommunityStatsScreen** ("Other" + emoji drapeau cassé pour les spots hors des 14 pays codés en dur) | `.planning/todos/country-list-incomplete-other-emoji.md` | Données / reverse-geocoding (backlog) | Backlog data bug |

---

## 4. Verdict de recette

| Exigence | Preuve | Statut |
|----------|--------|--------|
| **QA-01 / D-10** — recette globale fusionnée (8 groupes de flux) | Sections 1.1–1.8 | ⏳ en attente device |
| **D-11** — 100% PASS sur iOS **et** Android réels | Colonnes iOS + Android sections 1–2 | ⏳ en attente device |
| **D-13** — passe unique finale après 05-01/02/03/04 | Filet auto (§0) + sections 1–2 | ⏳ en attente device |
| **D-12** — 2 bugs connus logués comme exclusions | Section 3 | ✅ documenté |

**Règle de sortie :** toute régression **nouvelle** (hors K1/K2) → **STOP**, demander une gap
closure (`/gsd:plan-phase 05 --gaps`), ne pas arbitrer. Recette validée uniquement si **100%
PASS sur les deux plateformes** (exclusions D-12 mises à part).

**Verdict final :** _(à compléter par l'utilisateur après la passe device — voir Task 3 /
checkpoint du plan 05-05)_
