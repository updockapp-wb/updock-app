---
phase: 03-fiches-d-taill-es-profils
plan: 01
type: baseline
status: scaffold
created: 2026-07-30
wave: 0
---

# 03-BASELINE — Baseline réseau images & audit statique (AVANT refactor)

> **GATE Wave 0.** Ce document doit être **entièrement renseigné** (chiffres A/B/B-bis/C +
> captures) avant que les plans 03-02, 03-03 et 03-04 ne touchent le moindre fichier sous `src/`.
>
> **État actuel : scaffold + audit statique (Task 1) fait. Chiffres runtime & captures (Task 2) =
> checkpoint humain instrumenté, non encore renseignés.**

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

> À remplir en Task 2 (mesure instrumentée). La mesure **APRÈS** (plan 03-05) devra porter sur le
> **MÊME `id`** pour que les deltas A/B/C soient comparables.

| Champ | Valeur |
|-------|--------|
| `id` du spot | _(à renseigner — Task 2)_ |
| Nom | _(à renseigner)_ |
| Nombre d'`image_urls` | _(à renseigner — cible ≥ 5, minimum 2)_ |
| Nombre d'avis avec avatar | _(à renseigner — cible : plusieurs)_ |
| Nombre de sessions avec avatar | _(à renseigner)_ |

**Contrainte de reproductibilité :** consigner l'`id` public du spot (jamais de token/URL signée).
Le plan 03-05 relira cet `id` pour rejouer les métriques sur le même spot.

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

> À remplir en Task 2. Compteur : `performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img').length`,
> relevé avant l'action puis 2 s après. Cible **attendue APRÈS prefetch : 0-1 nouvelle requête**.

| Action | Nouvelles requêtes `img` | Délai perceptible (oui/non) |
|--------|--------------------------|-----------------------------|
| Ouverture lightbox | _(à renseigner)_ | _(à renseigner)_ |
| Next 1 | _(à renseigner)_ | _(à renseigner)_ |
| Next 2 | _(à renseigner)_ | _(à renseigner)_ |
| Next 3 | _(à renseigner)_ | _(à renseigner)_ |
| Next 4 | _(à renseigner)_ | _(à renseigner)_ |

Baseline attendue ≈ 4 (1 requête par navigation, chargement à la demande).

---

## 5. Métrique B — requêtes images au chargement initial (AVANT)

> À remplir en Task 2. Même compteur `initiatorType === 'img'`, relevé avant → 2 s après montage
> de la surface, sans interagir.

| Surface | Nombre de requêtes `img` |
|---------|--------------------------|
| Fiche spot au snap 0.35 | _(à renseigner)_ |
| Profil authentifié (B-bis) | _(à renseigner)_ |
| Profil anonyme (B-bis) | _(à renseigner)_ |
| B-ter — lightbox sous Slow 3G (optionnel) | _(à renseigner — donnée, pas cible)_ |

**Note d'interprétation (à ne pas oublier au plan 03-05) :** un **delta nul APRÈS** sur cette
métrique est un **résultat légitime à documenter**, pas un échec. Causes probables :
montage conditionnel déjà en place (les images hors viewport ne sont pas montées) + seuil de
déclenchement du lazy-loading Chromium (~1250 px sous le viewport). `03-RESEARCH.md` Pitfall 4
prédit ce delta nul — d'où l'existence des trois métriques A/B/C plutôt qu'une seule.

---

## 6. Métrique C — audit DOM img[loading="lazy"] (AVANT)

> À remplir en Task 2. Compteur : `document.querySelectorAll('img[loading="lazy"]').length`.
> **Baseline attendue : 0 partout** — preuve statique en Task 1 : `grep -rn 'loading="lazy"' src/`
> = **0 résultat** (aucun attribut `loading="lazy"` dans le code source à ce stade).

| Surface | Compte `img[loading="lazy"]` |
|---------|------------------------------|
| Fiche — onglet Info | _(à renseigner — attendu 0)_ |
| Fiche — onglet Avis | _(à renseigner — attendu 0)_ |
| Fiche — onglet Sessions | _(à renseigner — attendu 0)_ |
| Profil | _(à renseigner — attendu 0)_ |

---

## 7. Captures AVANT

> À archiver en Task 2 sous `audit/screenshots/` avec le préfixe `03-before-` (réutilisation du
> dossier de captures des Phases 1/2). Renseigner chaque chemin réel une fois la capture prise.

| # | Surface | Chemin de capture (préfixe `03-before-`) |
|---|---------|------------------------------------------|
| 1 | Fiche spot — snap 0.35 | `audit/screenshots/03-before-fiche-snap035.png` _(à créer)_ |
| 2 | Fiche spot — snap 0.95, onglet Info | `audit/screenshots/03-before-fiche-snap095-info.png` _(à créer)_ |
| 3 | Fiche spot — snap 0.95, onglet Avis | `audit/screenshots/03-before-fiche-snap095-avis.png` _(à créer)_ |
| 4 | Fiche spot — snap 0.95, onglet Sessions | `audit/screenshots/03-before-fiche-snap095-sessions.png` _(à créer)_ |
| 5 | Profil anonyme | `audit/screenshots/03-before-profil-anonyme.png` _(à créer)_ |
| 6 | Profil authentifié (email masqué, cf. T-03-01-A) | `audit/screenshots/03-before-profil-auth.png` _(à créer)_ |
| 7 | PremiumModal | `audit/screenshots/03-before-premium-modal.png` _(à créer)_ |
| 8 | CommunityStatsScreen | `audit/screenshots/03-before-community-stats.png` _(à créer)_ |

**Rappel sécurité (threat T-03-01-A) :** ne jamais faire apparaître dans une capture un JWT, un
token de session, une URL signée Supabase Storage ni l'email du compte de test. La capture du
profil authentifié doit **masquer l'adresse email** affichée (`Profile.tsx:205`).
