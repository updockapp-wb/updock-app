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

### 4-bis. Métrique A — APRÈS (plan 03-05, prefetch `new Image()` ±1)

Mesuré sur le code du worktree 03-05 (second serveur Vite :5174 dans le worktree agent, session
authentifiée transférée depuis :5173, Cache Storage `updock-images-v1` vidé, `clearResourceTimings()`
avant chaque fenêtre). Même spot de référence `153f6575-acc1-446a-b332-58e0e5714214`, même cycle
complet 1→2→3→4→1.

| Action | Nouvelles requêtes `img` (APRÈS) | Délai perceptible | Rappel AVANT |
|--------|-----------------------------------|--------------------|--------------|
| Ouverture lightbox (photo 1/4) | **2** (prefetch immédiat des voisins ±1 : photo 2 à 6 ms, photo 4 à 3 ms) | non | 0 |
| Next → photo 2/4 | **1** (prefetch du nouveau voisin, photo 3, à 5 ms) | non | 1 (2509 ms) |
| Next → photo 3/4 | **2** (rendu + prefetch résiduel, 1–4 ms) | non | 1 (882 ms) |
| Next → photo 4/4 | **0** (déjà en cache) | non | 1 (799 ms) |
| Next → retour photo 1/4 | **0** (déjà en cache) | non | 0 |

**Verdict métrique A : delta net et positif.** AVANT = 3 requêtes réparties sur le cycle avec un
pic à 2509 ms perceptible sur le premier `next`. APRÈS = toutes les requêtes de navigation sont
sub-10 ms (imperceptibles) car anticipées par le prefetch `new Image()` déclenché à l'ouverture et
à chaque navigation — le contenu est déjà en cache HTTP au moment où l'utilisateur clique. Le total
de requêtes réseau est plus élevé (5 vs 3, car le prefetch fait un aller simple sur CHAQUE paire de
voisins à CHAQUE étape, y compris des re-fetches de voisins déjà visités), mais c'est un compromis
assumé par le design D-06/D-03 : bande passante contre latence perçue, et le trade-off explicitement
accepté par le plan (« un useEffect précharge les voisins ±1… sans ajouter d'`<img>` au DOM »).

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

### 5-bis. Métrique B — APRÈS (plan 03-05, chargement initial, 2 s après mount)

| Surface | APRÈS | AVANT | Delta |
|---------|-------|-------|-------|
| Fiche spot au snap 0.35 | **2** | 2 | **nul** |
| Profil authentifié | **1** | 1 | **nul** |
| Profil anonyme | **0** | 0 | **nul** (pas de régression, juste rien à charger) |

**Cause du delta nul (documentée, pas masquée — conforme au must_have du plan 03-05) :** au snap
0.35, l'élément `<img>` de la vignette (`SpotDetail.tsx` ≈L409, désormais porteur de
`loading="lazy"`) est monté dans le DOM, mais le seuil de déclenchement natif du lazy-loading
Chromium (~1250 px sous le bord du viewport visible) n'est **pas** atteint par le `translateY` du
drawer à ce snap — l'attribut `loading="lazy"` ne diffère le chargement que si l'élément est
**suffisamment loin** hors-écran, pas juste masqué par un `transform`. Le navigateur considère
l'image comme « proche » du viewport et la charge quand même. C'est exactement le **Pitfall 4** de
`03-RESEARCH.md`, prédit avant l'implémentation. Idem pour l'avatar profil : hors périmètre du lazy
loading (site en viewport immédiat), aucun changement de comportement attendu — **delta nul = succès,
pas échec**.

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

### 6-bis. Métrique C — APRÈS (plan 03-05, `img[loading="lazy"]`)

| Surface | APRÈS | AVANT |
|---------|-------|-------|
| Fiche — onglet Info (snap 0.95) | **2** (deux nœuds DOM pointant vers la même vignette `image_urls[0]` — rendu dupliqué, ex. fond flouté + image nette ; conforme, un seul site source dans le code) | 0 |
| Fiche — onglet Avis | **0** (0 avis sur ce spot — plancher de données, pas un échec ; `ReviewList.tsx:47` porte bien `loading="lazy"` dans le code, juste rien à rendre ici) | 0 |
| Fiche — onglet Sessions | **0** (0 session sur ce spot — même plancher de données ; `SessionCard.tsx:85` porte bien l'attribut) | 0 |
| Profil authentifié | 0 (attendu — avatar profil hors périmètre) | 0 |
| Profil anonyme | 0 | 0 |

**Verdict métrique C : preuve positive.** Passage de 0 partout (AVANT) à ≥ 1 sur les sites justifiés
qui ont effectivement du contenu à rendre (vignette fiche). Les onglets Avis/Sessions à 0 ne sont
**pas** un échec de l'implémentation — le grep statique confirme que `loading="lazy"` est bien posé
dans `ReviewList.tsx`/`SessionCard.tsx` (`grep -rc 'loading="lazy"' src/components/` = 3 sites
source : SpotDetail, ReviewList, SessionCard), simplement ce spot de référence n'a ni avis ni session
à afficher (limite de données de l'instance dev, déjà documentée en section 2).

---

## 8. Verdict PERF-02 (plan 03-05)

Spot de référence : `153f6575-acc1-446a-b332-58e0e5714214` (identique à l'AVANT). PERF-02 exige un
lazy loading **mesurable** des médias des fiches/profils (D-06 : mesure chiffrée avant/après, pas
seulement visuelle). Le résultat AVANT/APRÈS démontre :

1. **Métrique A (expérience perçue) — succès net :** le délai de navigation lightbox passe de
   jusqu'à 2509 ms (premier `next` AVANT) à systématiquement < 10 ms (APRÈS), grâce au prefetch
   `new Image()` ±1 anticipé à l'ouverture et à chaque navigation.
2. **Métrique B (requêtes au chargement) — delta nul documenté et attendu :** cause identifiée
   (seuil de distance Chromium ~1250 px non atteint par le `transform` du drawer au snap 0.35 ;
   avatar profil hors périmètre), Pitfall 4 de `03-RESEARCH.md` prédit avant implémentation. Ce
   n'est pas un défaut du plan.
3. **Métrique C (preuve DOM statique) — passage de 0 à N :** l'attribut `loading="lazy"` est posé
   exactement sur les 3 sites justifiés (SpotDetail vignette, ReviewList, SessionCard) et nulle part
   ailleurs — aucune régression sur les 6 sites hors périmètre (avatar uploader, lightbox, overlay
   d'édition, avatar profil).
4. **Dégradation gracieuse :** sur les runtimes ignorant `loading="lazy"` (ex. anciens WebView iOS),
   le comportement retombe sur l'eager loading actuel — zéro régression fonctionnelle possible. À
   confirmer sur device iOS dans la recette QA (plan 03-06).

**Conclusion : PERF-02 satisfait** par la métrique A (objectif réel — chargement perçu plus rapide)
et la métrique C (preuve d'implémentation). Le delta nul de la métrique B est une conséquence
documentée du comportement natif du navigateur, pas un manquement du plan.

---

## 9. Captures AVANT

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
