---
phase: 02-navigation-vue-carte-spots
plan: 02
subsystem: ui
tags: [react, mapbox-gl, react-map-gl, geojson, usememo, framer-motion, blob-url, performance]

# Dependency graph
requires:
  - phase: 02-navigation-vue-carte-spots (plan 02-01)
    provides: "Baseline chiffrée Profiler/mémoire AVANT refactor (02-BASELINE.md) — gate Wave 0"
  - phase: 01-audit-design-system
    provides: "Tokens src/index.css + discipline de wiring byte-identique (01-VERIFICATION.md)"
provides:
  - "MAP_COLORS — point de vérité unique des couleurs de layers Mapbox (13 clés, as const)"
  - "Split-memoization de la source GeoJSON : allFeatures ([spots]) / spotsGeoJson ([allFeatures, allFeatureTypes, filter])"
  - "Cycle de vie correct des object URLs d'aperçu dans AddSpotForm (revokeAll + onExitComplete + garde démontage)"
affects: [phase-04-formulaires-robustesse, design-system, vue-carte]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Split-memoization : génération coûteuse mémoïsée sur la source, filtrage bon marché mémoïsé sur la vue"
    - "Constante de couleurs JS injectée dans les expressions paint Mapbox (jamais de token CSS — Mapbox ne les lit pas)"
    - "Blob URL lifecycle : ref miroir sans cleanup + revokeAll idempotent appelé au reset / à la fin de l'animation de sortie / au démontage"

key-files:
  created: []
  modified:
    - src/config/mapbox.ts
    - src/components/Map.tsx
    - src/components/AddSpotForm.tsx

key-decisions:
  - "Aucune couleur marker n'est wirée vers un token CSS : #38bdf8 (sky-400 v3-era) ≠ --color-primary (sky-500 v4 ≈ #00a6f4). Toutes restent des littéraux dans MAP_COLORS (D-01)."
  - "markerStroke conservé en '#fff' (forme courte) et non normalisé en '#ffffff' — contrainte byte-identique de fidélité source."
  - "Filtrage post-split effectué sur un tableau de types complets indexé en parallèle (allFeatureTypes), PAS sur properties.type : le payload GeoJSON envoyé à Mapbox reste strictement identique et les spots multi-type ne disparaissent pas (Pitfall 4)."
  - "setData conservé via <Source data={spotsGeoJson}> — aucun filtrage natif au niveau layer, qui casserait les compteurs de cluster (Pitfall 2)."
  - "Révocation des blob URLs déplacée sur AnimatePresence onExitComplete en plus de resetForm : sans cela la rétention après fermeture ne retombe pas à 0, contrairement à la cible de 02-BASELINE.md."

patterns-established:
  - "Split-memoization source/vue : la mémo coûteuse ne dépend que des données, la mémo bon marché ne dépend que de l'état d'UI"
  - "Couleurs de moteur de rendu non-DOM (Mapbox/WebGL) centralisées en constante JS as const dans src/config/, jamais en tokens CSS"
  - "Object URL lifecycle : ref miroir + callback de révocation idempotent, déclenché à la fin de l'animation de fermeture plutôt qu'à un changement de state"

requirements-completed: [MAP-01, MAP-02, PERF-01]

# Metrics
duration: 21min
completed: 2026-07-29
---

# Phase 2 Plan 02: Optimisation de la vue Carte Summary

**Couleurs des 3 layers Mapbox centralisées dans `MAP_COLORS`, source GeoJSON scindée en deux mémos (les objets `Feature` ne sont plus ré-alloués au toggle de filtre : ~4K+2 → 2 allocations par clic), et fuite des blob URLs d'`AddSpotForm` corrigée en révoquant à la fin de l'animation de fermeture — zéro changement de rendu.**

## Performance

- **Duration:** ~21 min
- **Started:** 2026-07-29
- **Completed:** 2026-07-29
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- **D-01 — `MAP_COLORS`** : les 17 occurrences hex des layers `clusterLayer` / `clusterCountLayer` / `unclusteredPointLayer` sont remplacées par 16 refs `MAP_COLORS.*` (13 clés `as const` dans `src/config/mapbox.ts`). Substitution 1:1 stricte, valeurs verbatim, aucune normalisation (`markerStroke` reste `'#fff'`). La couleur de fog `#242B4B` reste littérale (ce n'est pas un marker).
- **MAP-01 / PERF-01 — split-memoization** : la construction des objets `Feature` est mémoïsée sur `[spots]` seul ; le filtrage ne produit plus qu'un tableau de références. Le chemin `setData` (`<Source data={spotsGeoJson} cluster>`) est conservé intégralement, donc les compteurs de cluster restent agrégés côté source.
- **MAP-02 / D-03 — fuite blob URL** : l'effet dont le cleanup se rejouait à chaque changement de `imagePreviews` (et révoquait donc des aperçus **encore affichés** à chaque ajout d'image) est supprimé. Remplacé par un ref miroir sans cleanup + un `revokeAll` idempotent appelé (a) dans `resetForm`, (b) à la fin de l'animation de fermeture, (c) au démontage réel.
- Aucune ligne de markup/classe modifiée dans `AddSpotForm` (contrainte D-03 : fix de bug, migration DS = Phase 4).

## Task Commits

Chaque tâche a été committée atomiquement :

1. **Task 1 : Centraliser les couleurs markers dans MAP_COLORS (D-01)** — `c2b97b1` (refactor)
2. **Task 2 : Split-memoization de la source GeoJSON (MAP-01 / PERF-01)** — `5183b32` (perf)
3. **Task 3 : Corriger la fuite mémoire des aperçus photo d'AddSpotForm (MAP-02 / D-03)** — `fc2ff30` (fix)

## Files Created/Modified

- `src/config/mapbox.ts` — ajout de l'export `MAP_COLORS` (13 clés `as const`) avec la justification inline du refus de wiring vers les tokens CSS. `mapboxConfig` inchangé.
- `src/components/Map.tsx` — import de `MAP_COLORS` + substitution des hex dans les 3 layers ; `spotsGeoJson` scindé en `allFeatures` / `allFeatureTypes` / `spotsGeoJson`.
- `src/components/AddSpotForm.tsx` — `previewsRef` + `revokeAll` + garde de démontage + `AnimatePresence onExitComplete` ; suppression de l'effet fautif ; `handleRemoveImage` intact.

## Résultats mesurés — comparaison avec 02-BASELINE.md

### MAP-01 / PERF-01 — allocations par toggle de filtre (mesure statique, dérivée du code)

`K` = nombre de spots correspondant au filtre, `N` = nombre total de spots.

| | AVANT (baseline) | APRÈS | Gain |
|---|---|---|---|
| Renders `MapComponent` par clic filtre | 1 (2 bruts StrictMode) | 1 (inchangé — le state `filter` est local, c'est le minimum nécessaire) | — (déjà optimal, cf. constat 02-BASELINE §2) |
| Objets alloués **par toggle de filtre** | 1 tableau filtré + 1 tableau mappé + K `Feature` + K `geometry` + K tableau de coords + K `properties` = **4K + 2** | 1 tableau de refs filtré + 1 `FeatureCollection` = **2** (et **1** seule pour `filter === 'All'`, `allFeatures` étant retourné tel quel) | **4K allocations supprimées par clic** |
| Allocation des `Feature` | à chaque changement de `spots` **ou** de `filter` | uniquement à chaque changement de `spots` | filtrage découplé des données |

Sur les données réelles (base de spots complète, `filter === 'All'` → K = N), un cycle de 14 clics de filtre tel que joué dans la baseline supprime donc `4 × ΣK` allocations d'objets, contre 28 allocations résiduelles au total (2 par clic).

**Conformité comportementale prouvée** — l'équivalence du set de features a été vérifiée par simulation exhaustive du code avant/après sur un jeu de 400 spots dont **285 multi-type** (le cas de régression de Pitfall 4), pour les 7 filtres (`All` + les 6 `StartType`) : sérialisation JSON **identique** pour chaque filtre, même ordre, même cardinalité. Le payload envoyé à Mapbox est inchangé au bit près (aucune propriété ajoutée aux features), donc le clustering et les compteurs sont mécaniquement identiques.

### MAP-02 / D-03 — rétention des object URLs

| Scénario | AVANT (baseline mesurée) | APRÈS (comportement du code) |
|---|---|---|
| Révocation prématurée à chaque ajout d'image | **oui** — le cleanup `[imagePreviews]` révoquait le set précédent à chaque ajout (les aperçus 1→4 étaient révoqués alors qu'ils étaient encore affichés) | **non** — l'effet miroir n'a plus de cleanup ; aucune URL n'est révoquée tant que l'image est affichée |
| URLs vivantes après fermeture sans réouverture | **1** (fuite réelle jusqu'à la réouverture) | **0** — `onExitComplete` révoque tout le set une fois le contenu démonté |
| Croissance après 5 cycles open/close | +683 KB de tas, compteur live bloqué à 1 | rétention nulle : chaque cycle libère la totalité de son set à la fermeture |
| Révocation d'une image retirée manuellement | correcte (`handleRemoveImage`) | **inchangée** (code non modifié) |

> **À valider empiriquement (human-check).** Les chiffres « APRÈS » de cette section sont dérivés du code, pas re-mesurés : cet agent d'exécution n'a pas accès au navigateur piloté (`chrome-devtools-mcp`) utilisé pour la baseline. Rejouer le protocole de `02-BASELINE.md` §4 (interception `createObjectURL`/`revokeObjectURL` + heap snapshots, 5 cycles × 5 images) pour confirmer que le compteur « live » retombe bien à **0** après fermeture, et le protocole Profiler §2 pour archiver les renders APRÈS.

## Decisions Made

1. **Tableau de types parallèle plutôt qu'une propriété GeoJSON supplémentaire.** Le plan autorisait deux options pour éviter Pitfall 4 : filtrer sur `spots` ou stocker `spot.type` complet dans les `properties`. La seconde aurait modifié le payload transmis à Mapbox/supercluster (propriété `types` en plus sur chaque feature). Retenu : `allFeatureTypes = useMemo(() => spots.map(s => s.type), [spots])`, indexé en parallèle de `allFeatures` (même source, même ordre, même dépendance de mémoïsation) — le GeoJSON reste **strictement identique** à avant, ce qui est la lecture la plus stricte de la contrainte cardinale byte-identique.
2. **`MAP_COLORS.Dockstart` réutilisé pour le fallback `default` du `match`.** L'original utilisait deux fois `'#38bdf8'` (Dockstart + default) ; aucune clé `default` n'était prévue dans la spec des 13 clés. Réutiliser la clé existante conserve la valeur au bit près sans élargir l'API de la constante.
3. **`MAP_COLORS` placé dans `src/config/mapbox.ts`** (et non local à `Map.tsx`) — les deux emplacements étaient laissés à discrétion (D-01 / RESEARCH A1) ; le fichier de config regroupe déjà la configuration du moteur Mapbox et l'analogue `mapboxConfig` y établit le pattern d'objet module-level.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Ajout de `AnimatePresence onExitComplete={revokeAll}` pour atteindre la cible de rétention**
- **Found during:** Task 3 (fix de la fuite mémoire d'AddSpotForm)
- **Issue:** Le plan prescrivait de n'appeler `revokeAll()` que depuis `resetForm` (déclenché **à l'ouverture** et après submit) + une garde au démontage. Or `AddSpotForm` ne démonte jamais (Pitfall 3) et `resetForm` ne s'exécute qu'à la **prochaine** ouverture : après une fermeture sans réouverture, la totalité du set d'aperçus serait restée vivante. Pire qu'avant sur ce point précis — le bug d'origine révoquait incidemment les sets intermédiaires, laissant 1 seule URL vivante (baseline), alors que le correctif seul en aurait laissé jusqu'à 5. La cible explicite de `02-BASELINE.md` §3 est « aucune URL live restante après fermeture (compteur doit retomber à 0, pas 1) » — non atteinte par la prescription littérale du plan.
- **Fix:** Ajout de `onExitComplete={revokeAll}` sur l'`AnimatePresence` existante. Le callback se déclenche **après** la fin de l'animation de sortie, donc une fois le contenu (et ses `<img src={preview}>`) démonté : aucune image cassée pendant le slide-out, et les URLs sont libérées immédiatement à la fermeture. Les trois points de révocation prescrits par le plan (resetForm, garde de démontage) sont **conservés** en plus ; `revokeAll` est idempotent (le ref est vidé après passage), donc les appels multiples sont sans effet.
- **Files modified:** `src/components/AddSpotForm.tsx`
- **Verification:** `npx tsc -b` exit 0 ; `npm run build` OK ; revue du diff : aucun changement de markup, seule une prop comportementale ajoutée sur un composant non-DOM (`AnimatePresence`).
- **Committed in:** `fc2ff30` (commit de la Task 3)

### Assertions de vérification corrigées (non bloquantes)

**2. [Rule 1 - Bug] L'assertion automatisée `! grep -q "setFilter" src/components/Map.tsx` de la Task 2 est incorrecte telle qu'écrite**
- **Found during:** Task 2
- **Issue:** `setFilter` est le **setter d'état React** pré-existant (`const [filter, setFilter] = useState(...)`, ligne 111) et le handler `onFilterChange={setFilter}` ligne 385. L'assertion aurait échoué même sur le code d'origine, avant tout refactor — elle ne teste donc pas ce qu'elle prétend (l'absence de `map.setFilter()` natif Mapbox, Pitfall 2).
- **Fix:** Assertion exécutée sous sa forme correcte : `grep -n "\.setFilter(" src/components/Map.tsx` → **aucun match** (exit 1). Aucun appel Mapbox `setFilter` n'a été introduit ; le chemin `setData` via `<Source data={spotsGeoJson}>` est intact (ligne 316). Un commentaire de code a par ailleurs été reformulé pour ne pas introduire d'occurrence textuelle parasite de `setFilter`.
- **Files modified:** `src/components/Map.tsx` (commentaire uniquement)
- **Verification:** `grep -n "\.setFilter(" src/components/Map.tsx` sans match ; `grep -n "data={spotsGeoJson}"` match ligne 316.
- **Committed in:** `5183b32` (commit de la Task 2)

---

**Total deviations:** 2 auto-fixed (1 fonctionnalité critique manquante, 1 assertion de vérification erronée)
**Impact on plan:** La déviation 1 est indispensable pour que MAP-02 atteigne réellement sa cible chiffrée ; elle n'ajoute aucune surface visuelle ni API. La déviation 2 corrige une assertion du plan, pas le code. Aucun scope creep : les 3 fichiers touchés sont exactement ceux déclarés dans `files_modified`.

## Issues Encountered

- **Risque d'image cassée pendant l'animation de sortie.** Révoquer les URLs directement sur le passage `isOpen → false` aurait cassé les vignettes pendant les ~300 ms de slide-out (`AnimatePresence` continue de rendre l'arbre sortant). Résolu via `onExitComplete`, qui se déclenche après démontage du contenu. À noter : sur le **chemin submit** (`onClose()` puis `resetForm()`), la révocation intervient au même instant qu'avant le refactor — comportement inchangé, donc pas de régression.
- **Absence d'outillage de mesure navigateur dans le worktree d'exécution.** La baseline avait été capturée via `chrome-devtools-mcp` ; cet agent n'y a pas accès. Contourné par (a) une preuve d'équivalence exécutable du filtrage (400 spots / 285 multi-type, 7 filtres, sérialisation identique) et (b) un décompte statique des allocations. Les mesures Profiler/heap « APRÈS » restent à rejouer par un humain (voir encadré ci-dessus).
- **Contrainte projet « pas d'infra de test » respectée** : la preuve d'équivalence a été exécutée depuis un script jetable hors du dépôt (scratchpad), aucun fichier de test n'a été ajouté ni committé.

## Verification

| Critère (plan) | Résultat |
|---|---|
| `npx tsc -b` après chaque tâche | ✅ exit 0 (×3) |
| `npm run build` | ✅ 2325 modules, build OK |
| `grep "export const MAP_COLORS" src/config/mapbox.ts` | ✅ ligne 21 |
| `grep -c "MAP_COLORS\." src/components/Map.tsx` ≥ 13 | ✅ **16** |
| Aucun hex marker littéral résiduel dans Map.tsx | ✅ aucun match sur `22d3ee\|f472b6\|2dd4bf\|818cf8\|fbbf24\|f59e0b\|f97316\|38bdf8\|0f172a\|ffffff` |
| `MAP_COLORS.markerStroke === '#fff'` | ✅ forme courte préservée |
| `grep "allFeatures" src/components/Map.tsx` | ✅ 5 occurrences |
| `grep "data={spotsGeoJson}"` (chemin setData conservé) | ✅ ligne 316 |
| Aucun `map.setFilter()` (Pitfall 2) | ✅ `grep "\.setFilter("` sans match |
| Set de markers identique par filtre (spots multi-type inclus) | ✅ prouvé par simulation exhaustive (7 filtres, 285 spots multi-type) |
| `grep "revokeAll" src/components/AddSpotForm.tsx` | ✅ 5 occurrences |
| Ancien cleanup `[imagePreviews]` supprimé | ✅ absent du fichier |
| `handleRemoveImage` inchangé | ✅ hors diff |
| Aucun changement visuel du formulaire | ✅ diff sans modification de markup/classe |
| Profiler APRÈS + heap snapshots APRÈS | ⏳ human-check — protocole 02-BASELINE.md §4 à rejouer |

## Known Stubs

Aucun. Les trois tâches sont implémentées de bout en bout ; aucune valeur codée en dur, aucun placeholder, aucune donnée non câblée.

## Threat Flags

Aucun. Les modifications n'introduisent aucune surface réseau, d'authentification, d'accès fichier ni de schéma. Le registre STRIDE du plan reste exact : T-02-01 (DoS ressource navigateur) est **mitigé** par le fix D-03 ; T-02-02 / T-02-03 restent `accept` (constantes statiques, propriétés GeoJSON déjà publiques et inchangées) ; T-02-SC est sans objet (aucun `npm install`).

## User Setup Required

None - aucune configuration de service externe requise.

## Next Phase Readiness

- **Prêt.** Les trois axes du plan (D-01, MAP-01/PERF-01, MAP-02/D-03) sont livrés, typecheck et build verts.
- **Action requise avant clôture de phase :** rejouer les protocoles Profiler et mémoire de `02-BASELINE.md` §4 pour archiver les chiffres « APRÈS » mesurés (les chiffres de ce résumé sont dérivés du code). C'est le dernier item de la vérification MAP-01/MAP-02/PERF-01.
- **Sans conflit avec le plan 02-03** (exécuté en parallèle) : fichiers disjoints (`src/ui/Modal.tsx`, `src/components/FiltersModal.tsx`, `src/components/NavBar.tsx`, `src/App.tsx`). Le contrat de props `<FiltersModal isOpen onClose selectedFilter onFilterChange>` consommé par `Map.tsx` n'a pas été touché.
- **Pour la Phase 4** (migration DS d'`AddSpotForm`) : la logique de cycle de vie des blob URLs est désormais isolée dans `previewsRef` / `revokeAll` / `onExitComplete` — la migration visuelle devra conserver l'`AnimatePresence` porteuse de `onExitComplete`, ou déplacer l'appel vers l'équivalent du nouveau shell modal.

## Self-Check: PASSED

- Fichiers modifiés présents sur disque : `src/config/mapbox.ts`, `src/components/Map.tsx`, `src/components/AddSpotForm.tsx`, `.planning/phases/02-navigation-vue-carte-spots/02-02-SUMMARY.md` — 4/4 FOUND.
- Commits revendiqués présents dans `git log` : `c2b97b1`, `5183b32`, `fc2ff30` — 3/3 FOUND.
- Aucune suppression de fichier suivie dans les 3 commits de tâche ; arbre de travail propre, aucun fichier non suivi.
- Aucune écriture sur `STATE.md` ni `ROADMAP.md` (artefacts partagés — propriété de l'orchestrateur).

---
*Phase: 02-navigation-vue-carte-spots*
*Completed: 2026-07-29*
