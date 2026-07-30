---
phase: 03-fiches-d-taill-es-profils
plan: 05
subsystem: perf-lazy-media
tags: [performance, lazy-loading, prefetch, spot-detail, PERF-02]
requires:
  - "03-01 (baseline AVANT + spot de référence 153f6575-acc1-446a-b332-58e0e5714214)"
  - "03-04 (SpotDetail tokens/rayons câblés — le diff 03-05 s'applique par-dessus)"
provides:
  - "loading=\"lazy\" natif sur les 3 sites médias justifiés (vignette fiche, avatar avis, avatar session)"
  - "Prefetch hors DOM des voisins ±1 de la lightbox (new Image()) — latence de navigation <10ms"
  - "03-BASELINE.md complété (sections APRÈS A/B/C + verdict PERF-02)"
affects:
  - "src/components/SpotDetail.tsx"
  - "src/components/ReviewList.tsx"
  - "src/components/SessionCard.tsx"
  - ".planning/phases/03-fiches-d-taill-es-profils/03-BASELINE.md"
tech-stack:
  added: []
  patterns:
    - "Attribut natif loading=\"lazy\" posé uniquement hors-viewport (vignette scroll, avatars de liste)"
    - "Prefetch new Image() des voisins ±1 (wrap-around modulo) : remplit le cache HTTP sans <img> au DOM (D-03)"
    - "Mesure chiffrée avant/après (D-06) contre un spot de référence fixe, delta nul documenté au lieu de masqué"
key-files:
  created:
    - ".planning/phases/03-fiches-d-taill-es-profils/03-05-SUMMARY.md"
  modified:
    - "src/components/SpotDetail.tsx"
    - "src/components/ReviewList.tsx"
    - "src/components/SessionCard.tsx"
    - ".planning/phases/03-fiches-d-taill-es-profils/03-BASELINE.md"
decisions:
  - "loading=\"lazy\" posé sur EXACTEMENT 3 sites (vignette SpotDetail L409, avatar ReviewList L47, avatar SessionCard L85) — jamais sur les images en viewport/lightbox/overlay (bug Safari 15.4 + LCP)"
  - "Prefetch réinterprète D-06 (préchargement multi-images) sans violer D-03 (lightbox = un seul <img>) : new Image() hors DOM au lieu de <img> ajoutés ou <link rel=preload>"
  - "Delta nul sur métrique B assumé et documenté (seuil de distance Chromium ~1250px non atteint au snap 0.35), pas un échec"
metrics:
  duration: "~15 min (hors mesure runtime déléguée à l'orchestrateur)"
  tasks-completed: 2
  files-modified: 4
  completed: 2026-07-30
---

# Phase 3 Plan 05 : Lazy loading des médias + prefetch lightbox Summary

Lazy loading natif des médias des fiches/profils sur les 3 sites justifiés + prefetch hors DOM des voisins ±1 de la lightbox (`new Image()`), avec mesure chiffrée avant/après contre `03-BASELINE.md` (PERF-02 / D-06). Zéro régression : coque `vaul`, `layoutId` et DOM de la lightbox intacts.

## What Was Built

### Task 1 — Lazy + prefetch (commit `b73a77d`)

**A) `loading="lazy"` sur les 3 sites justifiés (aucun autre) :**

| Fichier | Site | Rôle | Conteneur pré-dimensionné |
|---------|------|------|---------------------------|
| `SpotDetail.tsx` ≈L409 | vignette `image_urls[0]` | sous la ligne de flottaison | `aspect-video` |
| `ReviewList.tsx` L47 | avatar auteur d'avis | N simultanés au scroll | `w-8 h-8` |
| `SessionCard.tsx` L85 | avatar créateur de session | N simultanés au scroll | `w-8 h-8` |

Aucun `width`/`height` ajouté (conteneurs déjà dimensionnés → zéro risque de CLS). `src`/`alt`/`className` inchangés.

**B) NON lazy (raisons contractuelles), laissés eager :** avatar uploader `SpotDetail:246` (en viewport dès snap 0.35 — bug Safari 15.4), `motion.img` lightbox `SpotDetail:721` (contenu/LCP), overlay d'édition L610/622 (hors périmètre Phase 4), avatar profil `Profile.tsx:164` (fichier non ouvert, hors `files_modified`).

**C) `useEffect` de prefetch dans `SpotDetail.tsx`** (contrat exact) :
- Garde : `if (!isImageOpen || !spot?.image_urls || spot.image_urls.length < 2) return;`
- Cible : index `+1` et `-1` avec wrap-around modulo `n = spot.image_urls.length`.
- Mécanisme : `const img = new Image(); img.src = url;` — remplit le cache HTTP, **aucun `<img>` ajouté au DOM** (D-03), pas de `<link rel="preload">`.
- Dépendances : `[isImageOpen, currentPhotoIndex, spot?.id]`.
- Placé près des autres hooks, JSX de la lightbox et coque `vaul` non touchés.

`npm run build` (typecheck `tsc -b` inclus) : vert.

### Task 2 — Mesure APRÈS + verdict PERF-02 (commit `f55d461`)

Étape runtime instrumentée (chrome-devtools-mcp, session authentifiée `updock.app@gmail.com`, second serveur Vite :5174 dans le worktree, Cache Storage `updock-images-v1` vidé) exécutée par l'orchestrateur sur le **même** spot de référence que l'AVANT (`153f6575-acc1-446a-b332-58e0e5714214`). Sections APRÈS de `03-BASELINE.md` (4-bis / 5-bis / 6-bis) + verdict PERF-02 (§8) renseignés.

**Chiffres clés APRÈS :**

- **Métrique A (lightbox) — succès net :** navigation systématiquement `< 10 ms` (imperceptible) APRÈS, contre jusqu'à **2509 ms** sur le premier `next` AVANT. Le contenu est déjà en cache HTTP au clic grâce au prefetch. Trade-off assumé : total réseau 5 vs 3 requêtes (re-fetch de voisins déjà visités) contre latence perçue quasi nulle.
- **Métrique B (chargement initial) — delta nul documenté :** fiche snap 0.35 = 2 (AVANT 2), profil auth = 1 (AVANT 1), profil anonyme = 0 (AVANT 0). Cause écrite : seuil de déclenchement Chromium (~1250 px hors-viewport) non atteint par le `transform` du drawer au snap 0.35 (Pitfall 4 prédit). Résultat légitime, pas un échec.
- **Métrique C (audit DOM) — preuve positive :** onglet Info = 2 `img[loading="lazy"]` (rendu dupliqué de la vignette), Avis/Sessions = 0 (0 avis / 0 session sur ce spot — plancher de données documenté § 2, l'attribut est bien posé dans le code). AVANT = 0 partout.
- **Verdict PERF-02 : satisfait** par la métrique A (objectif réel) + la métrique C (preuve d'implémentation) ; delta B nul = conséquence documentée du navigateur, pas un manquement. Dégradation gracieuse iOS assumée (attribut ignoré = eager = comportement actuel).

## Zones gelées / intégrité préservée

- `layoutId` : count = 1, intact (animation d'élément partagé liste↔fiche).
- Coque `vaul` (`Drawer.Content`, `snapPoints`, handlers touch) : non touchée.
- DOM de la lightbox (`motion.img` unique, `key={currentPhotoIndex}`, portail, handlers `onTouch*`) : inchangé — le prefetch vit hors DOM (D-03).
- `Profile.tsx` : non ouvert, `git status --short src/components/Profile.tsx` vide.
- Aucun `<link rel="preload">` ajouté (`grep -c 'rel="preload"'` = 0).

## Deviations from Plan

None — plan exécuté exactement comme écrit. Aucune règle de déviation (1-4) déclenchée. Aucun `npm install` (threat T-03-SC : aucune cible). Task 2 (checkpoint:human-verify) résolue via mesure runtime déléguée à l'orchestrateur (chrome-devtools-mcp indisponible dans le sandbox de l'exécuteur) — flux de checkpoint normal, pas une déviation.

## Verification

- `npm run build` : vert.
- `grep -c 'loading="lazy"'` = 1 pour SpotDetail, ReviewList, SessionCard (3 au total, ni plus ni moins).
- `grep -q 'new Image()'` réussit ; deps `[isImageOpen, currentPhotoIndex, spot?.id]` + garde `length < 2` présentes.
- `grep -c 'rel="preload"'` = 0 ; `grep -c 'layoutId'` = 1 ; `grep -q 'Drawer.Content'` réussit.
- `git status --short src/components/Profile.tsx` vide.
- `03-BASELINE.md` : sections APRÈS A/B/C renseignées sur le même spot de référence + verdict PERF-02 écrit.
- Recette device iOS (bug Safari 15.4, comportement lazy réel) : déléguée au plan 03-06.

## Known Stubs

None.

## Threat Flags

None — aucune nouvelle surface (attribut HTML natif + préchargement d'URLs Supabase déjà servies, même origine/validation). Prefetch borné à 2 images, hors DOM, éligible au GC (T-03-05-01 mitigé par design).
