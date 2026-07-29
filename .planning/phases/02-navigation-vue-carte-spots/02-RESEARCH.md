# Phase 2 : Navigation & Vue Carte / Spots — Recherche

**Recherché :** 2026-07-29
**Domaine :** React 19 + Mapbox GL (react-map-gl v7) — refactor UI/perf sans régression
**Confiance globale :** HIGH (findings issus majoritairement de la lecture directe du code + docs officielles Mapbox)

<user_constraints>
## Contraintes utilisateur (extraites de 02-CONTEXT.md)

### Décisions verrouillées

- **D-01 — Couleurs markers :** les 17 occurrences hex (12 couleurs distinctes) des layers Mapbox (`clusterLayer`, `clusterCountLayer`, `unclusteredPointLayer`) sont centralisées dans **une constante JS locale** (`MAP_COLORS`, dans `Map.tsx` ou `src/config/mapbox.ts`), **pas** des tokens CSS. Raison : Mapbox GL ne lit pas les custom properties CSS dans ses expressions `paint`, et ces couleurs encodent le **type de spot** — aucune correspondance 1:1 avec les 6 tokens sémantiques. Seule exception : une couleur qui matche **réellement** un token existant peut le référencer, avec vérification chaîne-CSS-prouvée byte-identique (comme Phase 1).
- **D-02 — Migration modaux carte :** `FiltersModal` migre vers `src/ui/Modal` + `src/ui/Header` + `src/ui/Button` **dans cette phase**. `AddSpotForm` et `AddSpotInfoModal` **restent hors périmètre visuel** (Phase 4). `AdminDashboard` et `SpotDetail` restent hors périmètre.
- **D-03 — Portée MAP-02 :** bug mémoire précis dans `AddSpotForm.tsx:62-66` (`useEffect` de cleanup mal scopé). Fix ciblé **sans aucune modification visuelle** du formulaire.
- **Contrainte cardinale (Phase 1) :** harmonisation de l'existant, pas de rebranding. Tout wiring de token doit être prouvé **byte-identique** — jamais forcer une valeur « pour faire joli ».

### Discrétion de Claude

- **Stratégie de mémoïsation MAP-01** — méthode d'implémentation libre (séparer génération de features du filtrage, `setFilter` natif vs régénération GeoJSON, etc.). Vérification obligatoire au React Profiler avant/après.
- **Nommage/emplacement de `MAP_COLORS`** (`Map.tsx` local vs `src/config/mapbox.ts`).
- **Structure interne du fix `useEffect`** de cleanup (D-03) — tant que le comportement observable est corrigé.
- **Refactor de la duplication `NavBar`** (desktop/mobile) — optionnel, acceptable si le wiring des tokens le justifie, sans changement de comportement.

### Idées différées (HORS SCOPE)

- Extension des tokens CSS aux couleurs de type de spot (serait DS-04, hors v2.0).
- Migration `AddSpotForm`/`AddSpotInfoModal`/`AdminDashboard`/`SpotDetail` vers `src/ui/Modal` (Phases 3/4 ou hors milestone).
- Refactor duplication NavBar (Claude's Discretion, non imposé).
- Optimisation `cacheSpotImages()` (offline.ts) — écarté au profit du bug AddSpotForm ; candidat Phase 5.
</user_constraints>

<phase_requirements>
## Exigences de la phase

| ID | Description | Support de recherche |
|----|-------------|----------------------|
| NAV-01 | La navigation globale et la bottom bar utilisent composants + tokens du DS | § NAV-01 — surface de wiring de token réelle (minimale) identifiée ; seul `text-sky-500` → `text-primary` est byte-identique. Gradients + sky-50/100/400/600 restent littéraux. |
| MAP-01 | La vue Carte ne re-render pas les markers dont les données n'ont pas changé (mémoïsation vérifiée au profiler) | § MAP-01 — approche « split memoization » validée ; `setFilter` natif écarté (régression des compteurs de cluster, confirmée par Mapbox). |
| MAP-02 | Cache/médias optimisés, pas de fuite mémoire sur les aperçus | § D-03 — root cause exacte + piège du composant jamais démonté documentés. |
| PERF-01 | Re-renders inutiles éliminés (avant/après React Profiler) | § MAP-01 + § Architecture de validation — protocole de mesure Profiler + mémoire. |
</phase_requirements>

## Résumé

Cette phase est un **refactor interne à risque de régression élevé** sur l'écran le plus critique de l'app (vue Carte). Les quatre chantiers sont indépendants et peuvent être planifiés en waves séparées : (1) centralisation des couleurs markers, (2) mémoïsation de la source GeoJSON, (3) migration `FiltersModal` vers le DS, (4) wiring tokens `NavBar`, plus le fix mémoire `AddSpotForm`.

La recherche a mis au jour **trois pièges structurants** que le planner doit absolument intégrer, sinon la contrainte byte-identique / zéro-régression sera violée :

1. **Le master `src/ui/Modal` est une carte glass centrée** (`bg-white/10 backdrop-blur-xl`, texte blanc, `rounded-4xl p-8`, animation scale, backdrop `bg-black/60 backdrop-blur-md`, `z-5000`). `FiltersModal` est un **bottom-sheet clair** (`bg-white`, texte slate, `rounded-t-3xl`, slide `y:100%`, backdrop `bg-black/20 backdrop-blur-sm`, `z-3000`). Envelopper naïvement `FiltersModal` dans le master `<Modal>` produirait une **régression visuelle majeure**. Le master `Modal` n'expose **aucune** prop `surface`/`variant` (contrairement à `Header` qui a `surface="light"`). → Il faut **étendre `Modal`** avec une variante clair/bottom-sheet extraite verbatim des classes actuelles de `FiltersModal`, sinon la migration est impossible byte-identique.

2. **`setFilter` natif Mapbox casse les compteurs de cluster.** Confirmé par plusieurs issues Mapbox : sur une source GeoJSON clusterisée, `setFilter` sur un layer n'affecte que l'affichage, **pas** l'agrégation ; les compteurs de cluster continuent de compter les points filtrés. L'approche actuelle (régénérer le GeoJSON filtré → `setData` → re-cluster) est donc **sémantiquement correcte** et ne doit pas être remplacée par `setFilter`. La mémoïsation MAP-01 doit **conserver `setData`** et se limiter à éviter la ré-allocation des objets features quand seul le filtre change.

3. **`AddSpotForm` n'est jamais démonté** (rendu inconditionnellement dans `Map.tsx`, seul son contenu interne est conditionné par `isOpen`). Un fix « déplacer le cleanup vers le démontage » — le pattern réflexe — **réintroduirait une fuite** car le cleanup de démontage ne s'exécuterait jamais en usage normal. Le fix doit révoquer les URLs **à la fermeture/reset**, pas seulement au démontage.

**Recommandation principale :** planifier 4 waves quasi-indépendantes ; pour D-02, étendre `src/ui/Modal` avec une variante `surface`/`sheet` byte-identique avant de migrer `FiltersModal` ; pour MAP-01, split-memoization sans toucher à `setData` ; pour D-03, révoquer les URLs au reset ET au démontage.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rendu markers/clusters | Mapbox GL (moteur natif WebGL) | React (react-map-gl bindings) | Le clustering et le paint sont calculés côté moteur Mapbox, pas React ; React ne fait que piloter `source.setData()` et les props de layer. |
| Filtrage par type de spot | React state (`filter`) → Source data | Mapbox (re-cluster) | Le filtre doit régénérer les données source pour des compteurs de cluster corrects (voir MAP-01). |
| Mémoïsation des features | React (`useMemo`) | — | Purement côté client React ; optimisation d'allocation. |
| Chrome UI (top bar, NavBar, modaux) | React + Tailwind v4 tokens | — | Composants React consommant les tokens `src/index.css`. |
| Aperçus photo (blob URLs) | Browser (`URL.createObjectURL`) | React lifecycle | Ressource navigateur dont le cycle de vie doit être piloté explicitement par React. |

## Standard Stack

Aucun nouveau package à installer. La phase réutilise exclusivement l'existant.

### Core (déjà présent — versions vérifiées dans `package.json`)
| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| `react` | ^19.2.0 | UI runtime | [VERIFIED: package.json] |
| `react-map-gl` | ^7.1.7 | Bindings React pour Mapbox GL | [VERIFIED: package.json] — API `<Source data>`/`<Layer filter>` utilisée |
| `mapbox-gl` | ^2.15.0 | Moteur carto WebGL | [VERIFIED: package.json] |
| `framer-motion` | ^12.23.25 | Animations modaux (`AnimatePresence`) | [VERIFIED: package.json] |
| `lucide-react` | ^0.556.0 | Icônes | [VERIFIED: package.json] |
| `tailwindcss` + `@tailwindcss/postcss` | ^4.1.17 | Styling + tokens `@theme` | [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `setData` (régénération GeoJSON filtré) | `map.setFilter()` sur les layers | ❌ Casse les compteurs de cluster sur source clusterisée (confirmé Mapbox). **Ne pas utiliser** — régression. |
| Fix cleanup au démontage seul | Révocation au reset/close + garde au démontage | ✅ Nécessaire : `AddSpotForm` n'est jamais démonté (voir Pitfall 3). |

**Installation :** aucune (`npm install` non requis).

## Package Legitimacy Audit

**Non applicable** — cette phase n'installe aucun package externe. Aucun `npm install`. Tous les modules utilisés sont déjà des dépendances vérifiées du projet (`package.json`).

## Architecture Patterns

### Diagramme de flux — vue Carte (état cible)

```
                 spots (SpotsContext, immuable pour cette phase)
                        │
                        ▼
        useMemo([spots])  ──►  allFeatures: Feature[]        ← allocation coûteuse, 1× par changement de spots
                        │
   filter (useState) ──►│
                        ▼
   useMemo([allFeatures, filter]) ──► filteredCollection     ← simple .filter(), pas de ré-allocation d'objets
                        │
                        ▼
   <Source data={filteredCollection} cluster>                ← react-map-gl : ref change → source.setData()
        │                                                       (re-cluster côté Mapbox = compteurs corrects)
        ├─► <Layer clusterLayer/>        (paint: MAP_COLORS)
        ├─► <Layer clusterCountLayer/>   (paint: MAP_COLORS)
        └─► <Layer unclusteredPointLayer/> (paint: MAP_COLORS)
                        │
        clic ──► onMapClick (useCallback) ──► getClusterExpansionZoom / onSpotClick
```

Points de décision : `filter === 'All'` → collection complète (pas de `.filter()`) ; sinon sous-ensemble. La frontière React↔Mapbox est `source.setData()` : tout ce qui est en amont est React (mémoïsable), tout ce qui est en aval est moteur natif.

### Pattern 1 : Split-memoization source/filtre (MAP-01)
**What :** séparer la génération (coûteuse) des objets `Feature` du filtrage (bon marché).
**When to use :** dès qu'un état d'UI (`filter`) déclenche une régénération de collection GeoJSON dont la majorité des données est stable.
**Example (état actuel → cible) :**
```typescript
// ACTUEL (Map.tsx:141-159) — filter + map ré-exécutés à chaque changement de filtre
const spotsGeoJson = useMemo(() => {
  const filtered = filter === 'All' ? spots : spots.filter(s => s.type.includes(filter));
  return { type: 'FeatureCollection', features: filtered.map(spot => ({...})) };
}, [spots, filter]);

// CIBLE — allocation des features seulement quand `spots` change
const allFeatures = useMemo<Feature[]>(() =>
  spots.map(spot => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [spot.position[1], spot.position[0]] },
    properties: { id: spot.id, name: spot.name, type: spot.type[0], is_approved: spot.is_approved },
  })), [spots]);

const spotsGeoJson = useMemo<FeatureCollection>(() => ({
  type: 'FeatureCollection',
  features: filter === 'All'
    ? allFeatures
    : allFeatures.filter(f => /* filtrer sur properties, cf. note ci-dessous */),
}), [allFeatures, filter]);
```
> **Note de fidélité :** le filtre actuel teste `s.type.includes(filter)` sur le tableau complet des types, alors que la feature ne stocke que `type: spot.type[0]` (premier type). Pour rester byte-identique côté comportement de filtrage, il faut soit filtrer sur `spots` (garder l'index), soit stocker le tableau complet des types dans les properties. **Le planner doit vérifier au profiler ET par recette manuelle que le filtrage produit exactement le même ensemble de markers qu'avant.**

**Source :** issues Mapbox #2476, #7887, #10722 (cluster + filter) ; lecture directe `src/components/Map.tsx`.

### Pattern 2 : Centralisation des couleurs Mapbox (D-01)
**What :** objet JS injecté dans les expressions `paint`.
```typescript
// src/config/mapbox.ts (ou local Map.tsx) — [ASSUMED emplacement, cf. Claude's Discretion]
export const MAP_COLORS = {
  clusterSmall: '#22d3ee',   // cyan-400  (< 5)
  clusterMedium: '#38bdf8',  // sky-400   (5-20)  ⚠ ≠ --color-primary (sky-500 v4 ≈ #00a6f4)
  clusterLarge: '#ffffff',   // (> 20)
  clusterTextLight: '#ffffff',
  clusterTextDark: '#0f172a',
  pending: '#f97316',        // orange (is_approved == false)
  Dockstart: '#38bdf8',
  Rockstart: '#f472b6',
  Dropstart: '#2dd4bf',
  Deadstart: '#818cf8',
  Rampstart: '#fbbf24',
  Beachstart: '#f59e0b',
  markerStroke: '#ffffff',   // '#fff' actuel — byte-identique
} as const;
// Injection : ['step', ['get','point_count'], MAP_COLORS.clusterSmall, 5, MAP_COLORS.clusterMedium, 20, MAP_COLORS.clusterLarge]
```
**When to use :** toujours pour cette phase — les layers restent des constantes module `LayerProps`, seules les valeurs hex sont remplacées par des refs `MAP_COLORS`.

### Pattern 3 : Cleanup de blob URLs scopé au reset ET au démontage (D-03)
```typescript
// AddSpotForm.tsx — remplacer l'effet fautif (lignes 62-66)
const previewsRef = useRef<string[]>([]);
useEffect(() => { previewsRef.current = imagePreviews; }, [imagePreviews]); // miroir sans cleanup

const revokeAll = useCallback(() => {
  previewsRef.current.forEach(URL.revokeObjectURL);
}, []);

// resetForm() doit révoquer AVANT de vider (le composant n'étant jamais démonté)
const resetForm = () => {
  revokeAll();
  setName(''); setType(['Dockstart']); /* ... */ setImagePreviews([]);
};

// Filet de sécurité au démontage réel (rare mais correct)
useEffect(() => () => revokeAll(), [revokeAll]);
```
> `handleRemoveImage` (lignes 56-60) révoque déjà correctement l'URL retirée — **le conserver tel quel**.

### Anti-Patterns to Avoid
- **`map.setFilter()` sur source clusterisée** pour filtrer par type → compteurs de cluster faux (régression). Utiliser `setData` avec collection filtrée.
- **Envelopper `FiltersModal` dans le master `<Modal>` glass sans variante clair** → régression visuelle (surface, texte, animation, backdrop, radius tous différents).
- **Déplacer le cleanup blob URL vers un `useEffect(() => cleanup, [])` de démontage seul** → fuite, car `AddSpotForm` n'est jamais démonté.
- **Wirer `#38bdf8` → `--color-primary`** → valeurs distinctes (sky-400 vs sky-500 v4). Non byte-identique.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clustering des markers | Algo de clustering custom | `cluster: true` sur `<Source>` (déjà en place) | Supercluster natif Mapbox, optimisé WebGL. |
| Animation d'ouverture modal | Transition CSS manuelle | `framer-motion` `AnimatePresence` (déjà utilisé) | Gère le montage/démontage + exit. |
| Shell modal (backdrop, close, layout) | Nouveau markup ad hoc | Étendre `src/ui/Modal` + `src/ui/Header` | Cohérence DS + a11y (aria-label enforced dans Button). |
| Filtrage de source Mapbox | Boucle de re-add source | `<Source data>` (react-map-gl appelle `setData`) | react-map-gl diffe par référence et appelle `source.setData()`. |

**Key insight :** la valeur du refactor est de **supprimer** du code custom (couleurs éparses, cleanup manuel fautif, shell modal dupliqué), pas d'en ajouter. Chaque chantier remplace du hand-rolled par le DS ou l'API native.

## Runtime State Inventory

> Phase de refactor — inventaire requis. Tous les changements sont **code-only** ; aucun état runtime distant n'encode les chaînes modifiées.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — les couleurs markers, la logique de mémoïsation et la migration modal sont purement front. Aucune clé DB/collection ne référence ces valeurs. Vérifié : `spots` vient de Supabase mais aucune couleur/token n'y est stocké. | Aucune |
| Live service config | **None** — aucun service externe (Mapbox style, Supabase) ne référence `MAP_COLORS`, `FiltersModal`, ni les classes NavBar. Le style Mapbox est `mapbox://styles/mapbox/satellite-streets-v12` (hébergé, non modifié). | Aucune |
| OS-registered state | **None** — aucun renommage de tâche/process. | Aucune |
| Secrets/env vars | **None** — `mapboxConfig.accessToken` reste inchangé. Aucun nom de secret touché. | Aucune |
| Build artifacts | **None** — pas de renommage de package ni de génération d'artefact. Le build Vite/Capacitor n'est pas impacté structurellement. | Aucune |

**Conclusion :** cette phase ne comporte **aucune migration de données ni de config runtime** — uniquement des éditions de code. Le filet de sécurité est la recette manuelle QA-01.

## Common Pitfalls

### Pitfall 1 : Le master `Modal` ne supporte pas la surface claire de `FiltersModal`
**What goes wrong :** migration D-02 produit une régression visuelle (glass sombre + texte blanc + scale + `bg-black/60` au lieu du bottom-sheet clair `bg-white` + slide + `bg-black/20`).
**Why it happens :** `src/ui/Modal` est codé en dur en glass (`bg-white/10 backdrop-blur-xl rounded-4xl p-8`, `z-5000`, animation `scale`). Il n'a **pas** de prop `surface` (alors que `Header` en a une, `surface="light"` — incohérence Phase 1).
**How to avoid :** avant de migrer `FiltersModal`, **étendre `Modal`** avec une variante (`surface: 'glass' | 'light'` et/ou `layout: 'center' | 'sheet'`) dont les classes sont **extraites verbatim** de `FiltersModal` actuel : conteneur `items-end sm:items-center`, backdrop `bg-black/20 backdrop-blur-sm`, panneau `bg-white w-full max-w-sm sm:rounded-3xl rounded-t-3xl p-6`, animation `initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}`, `z-[3000]`. Vérifier byte-identique (même méthodo que 01-VERIFICATION.md).
**Warning signs :** si le plan mappe directement `FiltersModal` → `<Modal>` sans étape d'extension, il y a régression garantie.
**Impact sur les autres consommateurs — VÉRIFIÉ :** `grep -rn "ui/Modal" src/` → **un seul consommateur, `AuthModal.tsx`** (surface glass). Ajouter une prop `surface`/`layout` avec **défaut = glass** est donc rétro-compatible et sûr. [VERIFIED: grep src/]

### Pitfall 2 : `setFilter` natif casse les compteurs de cluster
**What goes wrong :** on remplace `setData` par `setFilter` « pour éviter le re-cluster » ; les nombres affichés dans les clusters comptent alors les spots filtrés → chiffres faux.
**Why it happens :** le clustering opère au niveau **source**, pas layer. `setFilter` n'agit que sur l'affichage.
**How to avoid :** garder `setData` (via `<Source data>`). Optimiser uniquement l'allocation React en amont (split-memoization).
**Warning signs :** un cluster affichant « 12 » alors que le filtre ne laisse que 3 spots visibles.
**Source :** Mapbox GL JS issues #2476, #7887, #10722.

### Pitfall 3 : `AddSpotForm` n'est jamais démonté → cleanup de démontage inutile
**What goes wrong :** le fix « idiomatique » (cleanup dans `useEffect(..., [])` au démontage) ne s'exécute jamais → fuite persistante à chaque fermeture du formulaire.
**Why it happens :** `Map.tsx` rend `<AddSpotForm .../>` **inconditionnellement** (ligne 358) ; c'est `AnimatePresence>{isOpen && ...}` **à l'intérieur** qui monte/démonte le contenu, pas le composant fonction lui-même. Le composant reste monté toute la session.
**How to avoid :** révoquer les URLs dans `resetForm()` (appelé à l'ouverture et après submit) **et** garder une garde au démontage. Ne pas se reposer sur le seul démontage.
**Warning signs :** après avoir ajouté puis fermé le formulaire plusieurs fois, la mémoire (onglet Memory / `performance.memory`) croît de façon monotone.

### Pitfall 4 : filtrage sur `type[0]` vs `type.includes()`
**What goes wrong :** en déplaçant la génération de features hors du filtre, on filtre sur `properties.type` (= `spot.type[0]`, premier type seulement) alors que l'actuel filtre sur `spot.type.includes(filter)` (tous les types). Un spot multi-type disparaîtrait du filtre → régression du set de markers.
**How to avoid :** soit filtrer sur `spots` (conserver l'accès au tableau complet), soit stocker `spot.type` complet dans les properties. Recette : comparer les markers visibles avant/après pour chaque filtre.

### Pitfall 5 : surface de wiring NAV-01 sur-estimée
**What goes wrong :** on tente de wirer sky-50/sky-100/sky-400/sky-600/gradients vers `--color-primary` « pour homogénéiser ».
**Why it happens :** seul `--color-primary = sky-500` existe comme token. sky-50/100/400/600 et les gradients `from-sky-500 to-blue-600` n'ont **aucun** slot de token → doivent rester littéraux (comme Phase 1).
**How to avoid :** ne wirer que les occurrences **exactement** `sky-500` (voir § NAV-01). Tout le reste reste littéral, signalé mais non modifié.

## Code Examples

### NAV-01 — surface de wiring réelle (byte-identique)
```typescript
// NavBar.tsx — SEULES occurrences sky-500 pures wirables → text-primary
// Mobile actif (lignes 82, 93, 125, 133) :
//   'text-sky-500'  →  'text-primary'   ✅ --color-primary aliase var(--color-sky-500), rendu identique
//
// NON wirables (aucun token correspondant — RESTENT littéraux) :
//   desktop actif : 'bg-sky-50 text-sky-600'      (sky-50/600 sans token)
//   CTA gradient  : 'from-sky-500 to-blue-600', 'from-sky-400 to-blue-500'
//                   'shadow-sky-500/25', 'shadow-sky-500/30'  (gradients/ombres, préservés cf. UI-SPEC)
```

### D-02 — mapping des sous-composants de FiltersModal
```
FiltersModal actuel                 →  Cible DS
─────────────────────────────────────────────────────────────
header (lignes 38-43, close X)      →  <Header title={t('filters.title')} onClose surface="light" />
                                        (forme « rangée-avec-close », classes close déjà identiques)
shell (backdrop + panneau sheet)    →  <Modal variant/surface="light|sheet"> (À ÉTENDRE — Pitfall 1)
lignes de filtre (48-71)            →  RESTENT custom (aucun variant Button ne correspond)
bouton « Voir les résultats »       →  ⚠ bg-slate-900 rounded-2xl : AUCUN variant Button ne matche
  (lignes 75-80)                        (secondary=slate-200, primary=sky). → garder custom OU
                                        étendre Button d'un variant. Ne PAS forcer un variant existant.
```

### D-01 — vérification #38bdf8 vs token (réponse à la question du planner)
```
#38bdf8 = sky-400 (hex v3-era).
--color-primary = var(--color-sky-500) ; en Tailwind v4, sky-500 ≈ #00a6f4 (OKLCH), PAS #38bdf8.
Source : src/index.css lignes 8-13 (commentaire explicite : « v4's sky-500 renders ~#00a6f4 »).
=> #38bdf8 N'EST PAS byte-identique à --color-primary. Conclusion : garder #38bdf8 en littéral
   dans MAP_COLORS. AUCUNE couleur marker ne matche un token → tout reste en constante JS.
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Régénérer `features.map()` à chaque changement de filtre | Split-memoization (`allFeatures` sur `[spots]`, filtre sur `[allFeatures, filter]`) | Moins d'allocations/GC ; `setData` conservé pour compteurs corrects. |
| Hex épars dans 3 layers | Constante `MAP_COLORS` | Point de vérité unique, prépare DS-04 futur. |
| Shell modal dupliqué (FiltersModal, AuthModal, AddSpotForm…) | Master `src/ui/Modal` + `Header` + `Button` | Cohérence, mais **le master doit gagner une variante `surface`** (voir Pitfall 1). |
| Cleanup blob URL sur `[imagePreviews]` | Révocation au reset + garde démontage | Corrige la révocation prématurée des images encore affichées. |

**Déprécié/à corriger :**
- L'effet `useEffect(() => () => imagePreviews.forEach(revoke), [imagePreviews])` (AddSpotForm:62-66) : le cleanup s'exécute **avant chaque re-run** (à chaque changement de `imagePreviews`), révoquant les URLs du set précédent — dont des images **encore affichées**. À remplacer (voir Pattern 3).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Emplacement de `MAP_COLORS` (Map.tsx vs src/config/mapbox.ts) laissé au planner | D-01 / Pattern 2 | Faible — cosmétique, discrétion explicite. |
| A2 | ~~Le master `src/ui/Modal` n'a qu'un seul consommateur~~ **RÉSOLU** : grep confirme un unique consommateur `AuthModal.tsx` (glass) ; défaut `glass` rétro-compatible | Pitfall 1 | Faible (levé) |
| A3 | Le filtrage doit être corrigé pour tester tous les types (`type.includes`) et non `type[0]` | Pitfall 4 | Moyen — sinon régression silencieuse du set de markers pour spots multi-type. |
| A4 | Aucun variant `Button` ne couvre `bg-slate-900` (« Voir les résultats ») | Code Examples D-02 | Faible — vérifié dans src/ui/Button.tsx (variants : primary/secondary/ghost/danger). |
| A5 | Tailwind v4 sky-400 ≠ sky-500 en OKLCH ; #38bdf8 est bien sky-400 v3-era | D-01 | Faible — corroboré par le commentaire de src/index.css. À confirmer par inspection DevTools au moment de l'impl. |

## Open Questions (RESOLVED)

1. **Comment étendre `src/ui/Modal` sans régresser ses consommateurs actuels ? — RÉSOLU**
   - Vérifié : `grep -rn "ui/Modal" src/` → **unique consommateur `AuthModal.tsx`** (surface glass).
   - Recommandation : ajouter une prop `surface`/`layout` avec **défaut = glass actuel** (rétro-compatible avec AuthModal), puis brancher `FiltersModal` sur la variante claire bottom-sheet. Risque de régression sur AuthModal : nul si le défaut est glass.

2. **Le bouton « Voir les résultats » (bg-slate-900) doit-il devenir un variant `Button` ? — RESOLVED**
   - Ce qu'on sait : aucun variant existant ne matche.
   - RESOLVED: garder custom (byte-identique, zéro risque). Aucun variant `Button` ne couvre `bg-slate-900` (variants = primary/secondary/ghost/danger, cf. A4), et en inventer un violerait le principe DS D-06 (« variants widen the API, never the appearance »). Décision entérinée dans 02-03-PLAN Task 2 (CTA conservé custom).

3. **La mesure PERF-01 « avant/après » se fait sur quel support ? — RESOLVED**
   - RESOLVED: React DevTools Profiler dans le navigateur (dev build Vite `npm run dev`), pas sur le build iOS. Baseline capturée AVANT refactor (Wave 0, 02-01-PLAN) puis rejouée APRÈS — pour le sous-arbre carte (toggle filtres) ET le nav-shell (App.tsx/NavBar), conformément au périmètre PERF-01 « nav + carte » (ROADMAP success criterion 4).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm (dev server Vite) | Lancer `npm run dev` pour profiler | ✓ (projet actif) | — | — |
| React DevTools (extension navigateur) | Mesure PERF-01 (re-renders) | À installer par le dev si absent | — | Chrome Performance tab + `console` re-render counters manuels |
| Chrome/Safari DevTools — onglet Memory / `performance.memory` | Vérif fuite D-03 | ✓ (navigateur) | — | Heap snapshots comparés avant/après |
| Aucun package npm nouveau | — | n/a | — | — |

**Missing dependencies with no fallback :** aucune bloquante — la phase est code-only.
**Note :** la mesure se fait en **dev navigateur** (Vite), pas sur device iOS ; la recette fonctionnelle finale (QA-01) reste manuelle sur mobile.

## Validation Architecture

> `nyquist_validation: true` dans config.json, **mais** contrainte projet explicite « pas d'infra de test automatisé » (REQUIREMENTS.md « Out of Scope » ; CODE-03 futur). La validation de cette phase est donc **manuelle + instrumentée au profiler**, pas via un framework de test.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **Aucun** (contrainte projet — recette manuelle QA-01) |
| Config file | none |
| Quick run command | `npm run dev` puis mesure Profiler manuelle |
| Full suite command | Recette manuelle mobile (checklist QA-01) après la phase |

### Phase Requirements → Vérification
| Req ID | Behavior | Type de vérif | Commande / méthode | Automatisé ? |
|--------|----------|---------------|--------------------|--------------|
| NAV-01 | NavBar/bottom bar rendent identiquement, tokens câblés | Visuelle byte-identique | Diff DevTools computed styles `text-sky-500` vs `text-primary` ; recette nav | ❌ manuel |
| MAP-01 | Toggle filtre ne ré-alloue pas les features inutilement | React Profiler | Enregistrement Profiler : compter renders/durée du sous-arbre Map en togglant filtres, avant/après | ❌ manuel (Profiler) |
| MAP-02 / D-03 | Ajout/suppression d'images ne casse pas les aperçus ; mémoire stable | Fonctionnel + mémoire | Ajouter 5 images, en retirer, réajouter → aucune image cassée ; heap snapshots stables après cycles open/close | ❌ manuel |
| PERF-01 | Re-renders inutiles éliminés (nav + carte) | React Profiler avant/après | Baseline capturée AVANT refactor, comparée APRÈS | ❌ manuel |

### Sampling Rate
- **Par commit de tâche :** vérif visuelle rapide de l'écran touché (`npm run dev`).
- **Par merge de wave :** recette du flux impacté (carte / nav / ajout spot).
- **Phase gate :** checklist QA-01 complète (carte, fiche spot, favoris, avis, session, ajout/édition spot, profil, auth) à 100% sur mobile + captures Profiler avant/après archivées.

### Protocole de mesure PERF-01 (à exécuter AVANT de commencer le refactor)
1. `npm run dev`, ouvrir React DevTools → Profiler.
2. Démarrer l'enregistrement, toggler chaque filtre 2×, arrêter.
3. Noter : nombre de renders du composant `MapComponent` + durée, et si `<Source>`/layers re-render.
4. Archiver cette baseline dans le phase dir.
5. Refaire la même séquence après refactor → comparer. Cible : moins d'allocations/renders, comportement identique.
6. Pour D-03 : onglet Memory, snapshot → ajouter 5 images → fermer → rouvrir ×5 → snapshot. La rétention de `Blob`/object URLs ne doit pas croître.

### Wave 0 Gaps
- [ ] Capturer la **baseline Profiler + baseline mémoire** AVANT tout changement (sinon PERF-01/MAP-01 non mesurables — cf. Blocker STATE.md sur les baselines chiffrées).
- [ ] `grep -rn "ui/Modal" src/` pour lister les consommateurs de `Modal` avant extension (Pitfall 1 / Open Q1).
- *(Pas de fichier de test à créer — contrainte « pas de tests ».)*

## Security Domain

> `security_enforcement` absent de config.json (= activé par défaut), mais cette phase est un **refactor UI/perf** sans nouveau flux d'auth, d'input serveur ni de crypto. Les vulnérabilités listées dans CONCERNS.md (validation d'input `AddSpotForm`, upload non vérifié) relèvent explicitement de **Phase 4 (ROBUST-01/02)** et sont **hors scope ici** (D-03 ne touche que le cycle de vie des blob URLs, pas la validation).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | non (cette phase) | Différé Phase 4 — `AddSpotForm` non touché visuellement/validation |
| V6 Cryptography | non | — |
| Autres (V2/V3/V4) | non | Aucun changement d'auth/session/access |

### Notes de sécurité pertinentes (contexte, non traité ici)
| Pattern | Mitigation | Phase |
|---------|-----------|-------|
| Blob URLs non révoquées (fuite ressource navigateur) | Révocation scopée (D-03) | **Cette phase** ✅ |
| Input `AddSpotForm` non validé (nom/desc/coords) | Validation client + limites | Phase 4 (ROBUST-01) |
| Upload fichier non vérifié (MIME/taille) | Validation type + taille max | Phase 4 |

## Sources

### Primary (HIGH confidence)
- Lecture directe du code : `src/components/{Map,FiltersModal,AddSpotForm,NavBar}.tsx`, `src/ui/{Modal,Header,Button}.tsx`, `src/index.css`, `src/config/mapbox.ts`, `package.json`.
- `.planning/phases/01-audit-design-system/01-*` + `02-CONTEXT.md` + `02-UI-SPEC.md` + `.planning/codebase/CONCERNS.md`.
- [Mapbox GL JS — Cluster not updating when filter applied (#2476)](https://github.com/mapbox/mapbox-gl-js/issues/2476)
- [Mapbox GL JS — Cluster counts wrong when filters enabled (#7887)](https://github.com/mapbox/mapbox-gl-js/issues/7887)
- [Mapbox GL JS — setFilter method for GeoJSONSource (#10722)](https://github.com/mapbox/mapbox-gl-js/issues/10722)

### Secondary (MEDIUM confidence)
- [react-map-gl — documentation officielle](https://visgl.github.io/react-map-gl/docs) (comportement `<Source data>` → `setData` par référence).

### Tertiary (LOW confidence)
- Valeur exacte OKLCH de sky-400/sky-500 en Tailwind v4 — corroborée par le commentaire de `src/index.css` mais à confirmer par inspection DevTools au moment de l'impl (A5).

## Metadata

**Confidence breakdown :**
- Standard stack : HIGH — versions lues dans package.json, aucun nouvel install.
- Architecture / MAP-01 : HIGH — comportement cluster+filter confirmé par issues Mapbox + lecture code.
- D-02 (migration modal) : HIGH sur le diagnostic (incompatibilité surface), MEDIUM sur la solution (extension Modal à valider vs consommateurs).
- D-03 (fuite mémoire) : HIGH — root cause tracée ligne à ligne, y compris le piège du composant jamais démonté.
- NAV-01 : HIGH — surface de wiring dérivée directement des classes du fichier.
- Pitfalls : HIGH.

**Research date :** 2026-07-29
**Valid until :** ~2026-08-28 (stack stable ; re-vérifier si mise à jour majeure react-map-gl/mapbox-gl).
