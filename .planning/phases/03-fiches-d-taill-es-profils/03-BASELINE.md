---
phase: 03-fiches-d-taill-es-profils
plan: 01
type: baseline
status: complete
created: 2026-07-30
measured: 2026-07-30
wave: 0
reference_spot_id: 153f6575-acc1-446a-b332-58e0e5714214
---

# 03-BASELINE — Baseline réseau images & audit statique (AVANT refactor)

> **GATE Wave 0.** Ce document doit être **entièrement renseigné** (chiffres A/B/B-bis/C +
> captures) avant que les plans 03-02, 03-03 et 03-04 ne touchent le moindre fichier sous `src/`.
>
> **État : COMPLET.** Task 1 (audit statique) + Task 2 (mesures runtime instrumentées via
> chrome-devtools-mcp sur session Chrome authentifiée, viewport mobile émulé 390×844×3) renseignés.
> Gate Wave 0 **levé** : les plans 03-02, 03-03 et 03-04 peuvent démarrer.

**Méthodologie de mesure (Task 2) :** `npm run dev` (:5173), Chrome piloté via chrome-devtools-mcp,
compte de test authentifié. Cache Storage `updock-images-v1` vidé (`caches.delete`) avant chaque
mesure. Compteur = `performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img').length`
avec `performance.clearResourceTimings()` avant chaque fenêtre. Viewport mobile émulé 390×844×3
(iPhone-like) pour les mesures de fiche — les snap points 0.35/0.95 sont un comportement **mobile**
(le desktop affiche un panneau latéral fixe sans snap).

**Note liminaire — CommunityStatsScreen :** `src/components/CommunityStatsScreen.tsx` contient
**zéro** balise `<img>` (les drapeaux sont des emoji unicode produits par `countryCodeToFlag()`).
La clause « éventuelles images de CommunityStatsScreen » de D-06 se résout donc à **zéro image** :
c'est un **résultat mesuré**, pas un oubli.

**Inventaire de référence des 9 sites `<img>` du périmètre** (grep exhaustif, ne pas re-chercher) :

| # | Site | Rôle | Dans le périmètre ? |
|---|------|------|---------------------|
| 1 | `SpotDetail.tsx:246` | avatar uploader 20×20, en viewport dès snap 0.35 | Oui |
| 2 | `SpotDetail.tsx:409` | vignette `image_urls[0]`, conteneur `aspect-video` | Oui |
| 3 | `SpotDetail.tsx:610` | grille photos overlay d'édition | **HORS PÉRIMÈTRE** |
| 4 | `SpotDetail.tsx:622` | aperçus `blob:` overlay d'édition | **HORS PÉRIMÈTRE** |
| 5 | `SpotDetail.tsx:721` | `motion.img` unique de la lightbox (`key={currentPhotoIndex}`) | Oui |
| 6 | `Profile.tsx:164` | avatar profil 96×96 | Oui |
| 7 | `ReviewList.tsx:47` | avatar auteur d'avis, N simultanés | Oui |
| 8 | `SessionCard.tsx:85` | avatar créateur de session, N simultanés | Oui |
| 9 | `CommunityStatsScreen.tsx` | **ZÉRO `<img>`** (drapeaux = emoji unicode) | Oui (= 0 image) |

Grep de confirmation (Task 1) `grep -rn "<img\|motion.img" src/components/ src/ui/` — les 9 sites
ci-dessus sont confirmés (plus les sites hors périmètre `AddSpotForm.tsx:232`, `AdminDashboard.tsx:337/379`
qui n'appartiennent pas aux 5 surfaces mesurées).

---

## 1. Consommateurs de src/ui/Modal

**Commande (a) rejouée** — `grep -rn "from '../ui/" src/` :

```
src/components/FiltersModal.tsx:4:import Modal from '../ui/Modal';
src/components/FiltersModal.tsx:5:import Header from '../ui/Header';
src/components/AuthModal.tsx:5:import Modal from '../ui/Modal';
src/components/AuthModal.tsx:6:import Header from '../ui/Header';
src/components/AuthModal.tsx:7:import Input from '../ui/Input';
src/components/AuthModal.tsx:8:import Button from '../ui/Button';
```

**Consommateurs directs de `src/ui/Modal`** (`grep -rln "from '../ui/Modal'" src/`, exactement **deux**) :

| Fichier | Composants `ui/` importés | Paire `surface`/`layout` passée à `Modal` |
|---------|---------------------------|-------------------------------------------|
| `src/components/AuthModal.tsx` | Modal, Header, Input, Button | `glass` + `center` (défaut — forme d'origine) |
| `src/components/FiltersModal.tsx` | Modal, Header | `light` + `sheet` (bottom-sheet) |

**Conclusion de rétro-compatibilité :** l'état actuel du master (`src/ui/Modal.tsx`) n'expose que
deux formes appariées : `glass`+`center` (défaut, consommé par AuthModal) et `light`+`sheet`
(FiltersModal). **Aucun consommateur ne passe la paire `light`+`center`.** Toute 3e forme ajoutée
en plan 03-02 (extension du master pour la fiche/le profil) est donc **inatteignable par les deux
consommateurs existants** : le risque de régression sur AuthModal et FiltersModal est **nul par
construction** (leur code d'appel reste byte-identique, les props par défaut `glass`/`center` et la
paire explicite `light`/`sheet` conservent leur rendu actuel).

---

## 2. Spot de référence

La mesure **APRÈS** (plan 03-05) devra porter sur le **MÊME `id`** pour que les deltas A/B/C soient
comparables.

| Champ | Valeur |
|-------|--------|
| `id` du spot | `153f6575-acc1-446a-b332-58e0e5714214` |
| Nom | Lago del Salto - CNSV |
| Nombre d'`image_urls` | **4** (max de la base ; cible ≥ 5 non atteignable actuellement) |
| Nombre d'avis avec avatar | **0** (0 avis sur ce spot ; 2 avis au total dans toute la DB, sur d'autres spots) |
| Nombre de sessions avec avatar | **0** (0 session sur ce spot ; 33 sessions au total dans la DB, aucune ici) |

**⚠️ Déviation documentée — plancher de données de l'instance de dev :** sur les 85 spots de
l'instance, **aucun** n'atteint ≥ 5 `image_urls` (max observé = 4), et la table `reviews` ne
contient que **2 lignes au total** dans toute la base (un avis chacun sur 2 spots distincts, aucun
avec plus d'une image). Aucun spot ne cumule donc « ≥ 5 images + plusieurs avis avec avatar » comme
visé initialement — c'est un **plancher de données réel de l'instance**, pas une erreur de sélection.

**Décision :** retenir le spot le plus riche en **images** (4) comme référence, car PERF-02 porte
sur le chargement des **images** (l'objet principal de la mesure). Les avis/sessions sont donc
mesurés à 0 en conséquence — **résultat réel, pas un oubli**. Cette limite de données (absence de
spot « riche » en avis) est **hors du contrôle du plan 03-05** et ne doit pas être interprétée
comme un échec de mesure : c'est un plancher représentatif de l'instance actuelle.

**Contrainte de reproductibilité :** l'`id` public ci-dessus (jamais de token/URL signée) sera
relu par le plan 03-05 pour rejouer les métriques sur le même spot.

---

## 3. Biais de mesure — cacheSpotImages()

**Faits vérifiés (Task 1, lecture directe du code) :**

- **Chemin réel :** `src/utils/offline.ts` — **PAS** `src/lib/offline.ts`.
  ⚠️ **Correction explicite de l'hypothèse A7 / Open Q6 de `03-RESEARCH.md`** qui citait
  `src/lib/offline.ts` : ce chemin est **inexact**, le fichier n'existe pas là.
- **Sites d'appel** (`src/context/FavoritesContext.tsx`) :
  - **`:47`** — `favSpots.forEach(s => cacheSpotImages(s.image_urls))` dans le `useEffect`
    déclenché à la connexion utilisateur (boucle sur **tous les spots favoris** au chargement).
  - **`:93`** — `if (spot) cacheSpotImages(spot.image_urls)` au **toggle d'un favori** (ajout).
- **Mécanisme :** `caches.open('updock-images-v1')` → pour chaque URL non déjà en cache,
  `fetch(url, { mode: 'cors' })` puis `cache.put(url, fetchResponse)` (Cache API).
- **Absence de service worker :** commande (c) `grep -rn "serviceWorker\|workbox" src/ index.html vite.config.ts`
  = **0 résultat**. Aucun service worker n'existe dans le projet.

**Conséquences pour la mesure :**

1. Comme aucun service worker n'intercepte les requêtes `<img>`, le Cache API `updock-images-v1`
   **n'est JAMAIS relu** par les balises `<img>` de l'app. Les entrées mises par `cacheSpotImages()`
   sont donc des requêtes réseau **supplémentaires**, sans effet sur le rendu des images.
2. Ces requêtes ont un `initiatorType === 'fetch'` (issues de `fetch()`), **pas** `'img'`.
3. **Neutralisation du biais :** l'instrument de comptage filtre sur `initiatorType === 'img'`,
   ce qui **exclut** mécaniquement les requêtes de `cacheSpotImages()`. Le compteur ne voit que
   les vraies requêtes d'affichage.
   > `performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img').length`
4. **Piège à éviter :** le filtre « Img » de l'onglet Network de Chrome classe par **type de
   contenu**, il peut donc **inclure** les `fetch` d'images de `cacheSpotImages` et polluer le
   comptage. → Préférer l'instrumentation `performance.getEntriesByType('resource')` filtrée sur
   `initiatorType`, pas le filtre visuel « Img ». En complément, vider le Cache Storage
   `updock-images-v1` (Application > Clear storage) élimine tout effet résiduel.

---

## 4. Métrique A — requêtes images à la navigation lightbox (AVANT)

Compteur : `performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img').length`,
relevé avant l'action puis 2 s après. Spot de référence (4 photos), cycle complet 1→2→3→4→1.
Cible **attendue APRÈS prefetch : 0-1 nouvelle requête** par navigation.

| Action | Nouvelles requêtes `img` | Délai perceptible |
|--------|--------------------------|-------------------|
| Ouverture lightbox (photo 1/4) | 0 (déjà chargée par la vignette de la fiche) | non |
| Next → photo 2/4 | 1 | **oui — 2509 ms** |
| Next → photo 3/4 | 1 | non — 882 ms |
| Next → photo 4/4 | 1 | non — 799 ms |
| Next → retour photo 1/4 | 0 (déjà en cache navigateur HTTP) | non |

**Total sur le cycle complet : 3 nouvelles requêtes réseau** (pas 4 — le retour à la photo 1 ne
re-fetch pas, elle est en cache HTTP navigateur). Le **premier `next` a un délai net (2509 ms)** :
c'est la cible d'amélioration prioritaire du prefetch/lazy en 03-05.

---

## 5. Métrique B — requêtes images au chargement initial (AVANT)

Même compteur `initiatorType === 'img'`, relevé avant → 2 s après montage de la surface, sans
interagir. Viewport mobile émulé 390×844×3.

| Surface | Nombre de requêtes `img` |
|---------|--------------------------|
| Fiche spot au snap 0.35 (mobile) | **2** |
| Profil authentifié (B-bis) | 1 (avatar propre) |
| Profil anonyme (B-bis) | 0 |
| B-ter — lightbox sous Slow 3G (optionnel) | **non mesuré** (sauté faute de temps ; qualifié « donnée, pas cible ») |

**Constat clé — Fiche au snap 0.35 = 2 requêtes :** la vignette `image_urls[0]` **ET** l'avatar
« Ajouté par » se chargent tous les deux, alors que **seul l'avatar est visuellement dans le
viewport** à ce snap. **Le DOM est monté en entier indépendamment du snap** (aucun montage
conditionnel par visibilité). Cela **confirme exactement le Pitfall 4 de `03-RESEARCH.md`** et
**justifie l'optimisation du plan 03-05** (lazy/conditionnel par snap).

**Note d'interprétation (à ne pas oublier au plan 03-05) :** un **delta nul APRÈS** sur les
surfaces profil (déjà à 0-1) est un **résultat légitime à documenter**, pas un échec — l'objet de
l'optimisation est la fiche au snap 0.35 (2 → cible réduite). Causes structurelles : seuil de
déclenchement du lazy-loading Chromium (~1250 px sous le viewport) + montage inconditionnel du DOM.

---

## 6. Métrique C — audit DOM img[loading="lazy"] (AVANT)

> À remplir en Task 2. Compteur : `document.querySelectorAll('img[loading="lazy"]').length`.
> **Baseline attendue : 0 partout** — preuve statique en Task 1 : `grep -rn 'loading="lazy"' src/`
> = **0 résultat** (aucun attribut `loading="lazy"` dans le code source à ce stade).

| Surface | Compte `img[loading="lazy"]` |
|---------|------------------------------|
| Fiche — onglet Info (snap 0.95) | 0 |
| Fiche — onglet Avis (snap 0.95) | 0 |
| Fiche — onglet Sessions (snap 0.95) | 0 |
| Profil authentifié | 0 |
| Profil anonyme | 0 |

**Confirme le grep statique de Task 1** (`grep -rn 'loading="lazy"' src/` = 0 occurrence) : baseline
AVANT validée à 0 sur toutes les surfaces testées.

---

## 7. Captures AVANT

Archivées sous `audit/screenshots/` avec le préfixe `03-before-` (réutilisation du dossier de
captures des Phases 1/2). Ces PNG vivent à la racine du **repo principal** (hors `.planning/`), donc
**hors du périmètre `files_modified` du plan** : ils restent des artefacts locaux non versionnés,
comme les captures des Phases 1/2 déjà présentes dans ce dossier — ils ne sont PAS ajoutés au commit.

| # | Surface | Chemin réel |
|---|---------|-------------|
| 1 | Fiche spot — snap 0.35 | `audit/screenshots/03-before-fiche-snap035.png` |
| 2 | Fiche spot — snap 0.95, onglet Info | `audit/screenshots/03-before-fiche-snap095-info.png` |
| 3 | Fiche spot — snap 0.95, onglet Avis | `audit/screenshots/03-before-fiche-snap095-avis.png` |
| 4 | Fiche spot — snap 0.95, onglet Sessions | `audit/screenshots/03-before-fiche-snap095-sessions.png` |
| 5 | Profil anonyme | `audit/screenshots/03-before-profil-anonyme.png` |
| 6 | Profil authentifié (email masqué via patch DOM temporaire avant capture, restauré après) | `audit/screenshots/03-before-profil-auth.png` |
| 7 | PremiumModal | `audit/screenshots/03-before-premium-modal.png` |
| 8 | CommunityStatsScreen | `audit/screenshots/03-before-community-stats.png` |

**Rappel sécurité (threat T-03-01-A) — appliqué :** aucune capture ne montre de JWT, token de
session ni URL signée Supabase Storage. La capture du profil authentifié a été prise avec l'adresse
email **masquée** (patch DOM temporaire avant capture, restauré après — `Profile.tsx:205`).
