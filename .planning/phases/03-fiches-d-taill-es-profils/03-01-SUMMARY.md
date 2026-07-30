---
phase: 03-fiches-d-taill-es-profils
plan: 01
subsystem: testing
tags: [performance, baseline, images, lazy-loading, chrome-devtools-mcp, network-metrics, modal, offline-cache]

# Dependency graph
requires:
  - phase: 01-audit-design-system
    provides: "master Modal (src/ui/Modal) et convention de baseline chiffrée (01-AUDIT.md)"
  - phase: 02-navigation-vue-carte-spots
    provides: "dispositif de mesure instrumentée (chrome-devtools-mcp, viewport mobile émulé) réutilisé ici"
provides:
  - "03-BASELINE.md : baseline réseau images AVANT refactor (métriques A/B/C) rejouable au plan 03-05"
  - "id du spot de référence (153f6575-acc1-446a-b332-58e0e5714214) figé pour la mesure APRÈS"
  - "audit re-confirmé des consommateurs de src/ui/Modal (AuthModal, FiltersModal) — rétro-compat 03-02 prouvée"
  - "analyse du biais cacheSpotImages() (src/utils/offline.ts) neutralisant le comptage réseau"
  - "captures AVANT des 5 surfaces (03-before-*.png) pour la byte-identité UI-01/UI-02"
affects: [03-02-modal-extension, 03-03-fiche-profil-ui, 03-04-perf-images, 03-05-verification-perf]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Baseline PERF chiffrée AVANT toute modif source (GATE Wave 0), rejouable sur le même spot de référence"
    - "Comptage réseau via performance.getEntriesByType('resource') filtré initiatorType==='img' (neutralise le biais fetch de cacheSpotImages)"

key-files:
  created:
    - .planning/phases/03-fiches-d-taill-es-profils/03-BASELINE.md
  modified: []

key-decisions:
  - "Spot de référence = plus riche en images (4) faute de spot ≥5 images + avis dans l'instance (plancher de données réel, pas un échec)"
  - "Comptage sur initiatorType==='img' plutôt que le filtre 'Img' de l'onglet Network (ce dernier peut inclure les fetch de cacheSpotImages)"
  - "Captures 03-before-*.png hors périmètre versionné (artefacts locaux, comme phases 1/2) — non ajoutées au commit"

patterns-established:
  - "GATE Wave 0 : aucun fichier src/ touché tant que la baseline n'est pas capturée"
  - "Correction d'hypothèse RESEARCH consignée dans la baseline (A7 : offline.ts vit dans src/utils/, pas src/lib/)"

requirements-completed: [PERF-02, UI-01, UI-02]

# Metrics
duration: ~35min
completed: 2026-07-30
---

# Phase 03 Plan 01: Baseline réseau images & audit statique (AVANT refactor) Summary

**Baseline PERF-02 chiffrée AVANT refactor : lightbox = 3 requêtes/cycle (1er next à 2509 ms), fiche snap 0.35 = 2 img montées inconditionnellement (confirme Pitfall 4), 0 `loading="lazy"` partout ; Modal re-confirmé consommé par AuthModal+FiltersModal seuls ; biais `cacheSpotImages()` neutralisé.**

## Performance

- **Duration:** ~35 min (dont checkpoint humain instrumenté)
- **Completed:** 2026-07-30
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 1 créé (`03-BASELINE.md`), 0 fichier source

## Accomplishments

- **Baseline réseau images AVANT refactor capturée** (métriques A/B/C) sur un spot de référence figé (`153f6575-acc1-446a-b332-58e0e5714214`), rejouable à l'identique au plan 03-05 pour prouver le delta PERF-02 exigé par D-06.
- **Constat structurel clé (métrique B) :** la fiche au snap 0.35 émet **2 requêtes image** (vignette `image_urls[0]` + avatar « Ajouté par ») alors que seul l'avatar est dans le viewport → le DOM est monté **inconditionnellement** du snap. Confirme le Pitfall 4 de `03-RESEARCH.md` et justifie l'optimisation du plan 03-04/03-05.
- **Cible d'amélioration lightbox identifiée (métrique A) :** premier `next` à **2509 ms** de délai perceptible ; 3 requêtes réseau sur un cycle complet de 4 photos (le retour à la photo 1 est en cache HTTP).
- **Audit `src/ui/Modal` re-confirmé :** exactement **deux** consommateurs (`AuthModal` glass+center, `FiltersModal` light+sheet) ; aucun ne passe `light`+`center` → l'extension du master en 03-02 est rétro-compatible par construction (risque de régression nul).
- **Biais `cacheSpotImages()` documenté et neutralisé :** chemin réel `src/utils/offline.ts` (corrige l'hypothèse A7 de RESEARCH qui citait `src/lib/offline.ts`), requêtes en `initiatorType==='fetch'` exclues du comptage `img`, absence de service worker prouvée (grep = 0).
- **Gate Wave 0 levé** : les plans 03-02/03/04 peuvent démarrer.

## Task Commits

1. **Task 1: Scaffold 03-BASELINE.md + audit statique (offline.ts, consommateurs Modal, zéro-img CommunityStats)** — `93c9b2d` (docs)
2. **Task 2: Capturer les chiffres AVANT (métriques A/B/B-bis/C) + captures** — `ab30acf` (docs)
   _(checkpoint:human-verify — instrumentation runtime réalisée par l'orchestrateur via chrome-devtools-mcp, valeurs transcrites dans la baseline)_

## Files Created/Modified

- `.planning/phases/03-fiches-d-taill-es-profils/03-BASELINE.md` — Baseline complète : 7 sections (consommateurs Modal, spot de référence, biais cacheSpotImages, métriques A/B/C, captures AVANT). Aucun fichier sous `src/` modifié (invariant du plan respecté).
- `audit/screenshots/03-before-*.png` (×8) — Captures AVANT des 5 surfaces, artefacts locaux **non versionnés** (hors `.planning/`, convention héritée des phases 1/2).

## Chiffres clés de la baseline

| Métrique | Valeur AVANT |
|----------|--------------|
| A — lightbox (cycle 4 photos) | 3 requêtes réseau ; 1er next = **2509 ms** |
| B — fiche snap 0.35 (mobile) | **2** requêtes img (DOM monté inconditionnellement) |
| B-bis — profil authentifié / anonyme | 1 / 0 |
| C — `img[loading="lazy"]` (toutes surfaces) | **0** partout |
| Spot de référence | `153f6575-acc1-446a-b332-58e0e5714214` — « Lago del Salto - CNSV », 4 images |
| Consommateurs `src/ui/Modal` | `AuthModal.tsx`, `FiltersModal.tsx` (exactement 2) |

## Decisions Made

- **Spot de référence dégradé à 4 images :** aucun spot de l'instance (85 spots) n'atteint ≥ 5 `image_urls` (max = 4) et la table `reviews` ne compte que 2 lignes au total — plancher de données réel. Retenu le spot le plus riche en **images** car PERF-02 porte sur le chargement des images ; avis/sessions = 0 en conséquence (résultat réel).
- **Comptage sur `initiatorType==='img'`** via `performance.getEntriesByType('resource')` plutôt que le filtre « Img » de l'onglet Network (ce dernier peut inclure les `fetch` de `cacheSpotImages`), + purge du Cache Storage `updock-images-v1` avant chaque mesure.
- **Captures `03-before-*.png` non versionnées** (artefacts locaux à la racine du repo principal, hors `.planning/`, comme en phases 1/2).

## Deviations from Plan

### Constats documentés (non des auto-fixes de code)

**1. [Contrainte de données — section 2] Aucun spot ne satisfait « ≥ 5 images + plusieurs avis avec avatar »**
- **Found during:** Task 2 (mesure runtime)
- **Issue:** Sur 85 spots, max = 4 `image_urls` ; seulement 2 avis dans toute la DB. Le critère de sélection idéal du plan (≥ 5 photos, plusieurs avis) est inatteignable sur l'instance de dev.
- **Fix:** Spot le plus riche en images retenu (4 images), avis/sessions mesurés à 0. Déviation explicitement documentée en section 2 de `03-BASELINE.md` comme plancher de données hors du contrôle du plan 03-05, pas un échec de mesure.
- **Files modified:** `03-BASELINE.md` (section 2)
- **Committed in:** `ab30acf`

**2. [Correction d'hypothèse RESEARCH — section 3] Chemin de `cacheSpotImages()`**
- **Found during:** Task 1 (audit statique)
- **Issue:** `03-RESEARCH.md` (A7 / Open Q6) citait `src/lib/offline.ts` — chemin inexact.
- **Fix:** Chemin réel `src/utils/offline.ts` consigné, avec les deux sites d'appel `FavoritesContext.tsx:47` et `:93`. Correction explicitée en section 3.
- **Files modified:** `03-BASELINE.md` (section 3)
- **Committed in:** `93c9b2d`

**3. [Optionnel non exécuté] Métrique B-ter (Slow 3G)**
- **Issue:** Mesure lightbox sous throttling Slow 3G, marquée « donnée, pas cible » (optionnelle).
- **Fix:** Sautée faute de temps, marquée « non mesuré » en section 5. Sans impact sur le gate Wave 0 (optionnelle par conception).

---

**Total deviations:** 3 documentées (1 contrainte de données, 1 correction d'hypothèse, 1 optionnel sauté). Aucune modification de code source.
**Impact on plan:** Nul sur le périmètre. La baseline reste comparable au plan 03-05 sur le même spot ; les constats renforcent la justification de l'optimisation (Pitfall 4 confirmé). `git status --short src/` vide sur toute la durée du plan.

## Issues Encountered

- Checkpoint:human-verify atteint à la Task 2 (mesure réseau runtime + captures non scriptables en CLI) : l'exécuteur a STOPPÉ et retourné l'état structuré ; l'orchestrateur a réalisé l'instrumentation via chrome-devtools-mcp puis transmis les valeurs définitives, transcrites ici. Flux de checkpoint normal.

## User Setup Required

None — aucun service externe à configurer.

## Next Phase Readiness

- **Gate Wave 0 levé** : les plans 03-02 (extension Modal), 03-03 (UI fiche/profil) et 03-04 (perf images) peuvent démarrer en parallèle.
- **Ancrage 03-05** : `id` du spot de référence + chiffres AVANT (A/B/C) figés dans `03-BASELINE.md` pour la mesure APRÈS.
- **Point d'attention 03-05** : ne pas interpréter un delta nul sur les surfaces profil (déjà 0-1) comme un échec ; la cible d'optimisation prioritaire est la fiche snap 0.35 (2 img) et le premier `next` lightbox (2509 ms).

## Self-Check: PASSED

- **Fichier créé :** `.planning/phases/03-fiches-d-taill-es-profils/03-BASELINE.md` — FOUND
- **Commits :** `93c9b2d` (Task 1), `ab30acf` (Task 2) — vérifiés ci-dessous
- **Invariant :** `git status --short src/` vide sur toute la durée du plan — respecté

---
*Phase: 03-fiches-d-taill-es-profils*
*Completed: 2026-07-30*
