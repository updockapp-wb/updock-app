# Phase 2: Navigation & Vue Carte / Spots - Context

**Gathered:** 2026-07-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrer la navigation globale (NavBar desktop/mobile) et la vue Carte vers le
design system construit en Phase 1 (tokens + `src/ui/*`), et éliminer les
re-renders inutiles + la fuite mémoire identifiée dans le flux d'ajout de spot
— sans aucune régression fonctionnelle sur l'écran le plus critique de l'app.

**Contrainte cardinale (héritée de Phase 1) :** harmonisation de l'existant,
pas de rebranding. Tout wiring de tokens doit être prouvé byte-identique
(comme établi en Phase 1 : ne câbler que les correspondances 1:1 réelles,
jamais forcer une valeur pour "faire joli").

</domain>

<decisions>
## Implementation Decisions

### Couleurs des markers Mapbox (D-01)
- **D-01:** Les 17 occurrences hex (12 couleurs distinctes) dans les layers
  Mapbox (`clusterLayer`, `clusterCountLayer`, `unclusteredPointLayer`) sont
  centralisées dans **une constante JS locale** (ex. `MAP_COLORS` dans
  `Map.tsx` ou `src/config/mapbox.ts`), pas des tokens CSS. Raison : Mapbox GL
  ne peut pas lire nativement les variables CSS custom properties dans ses
  expressions `paint`, et la majorité de ces couleurs encodent le **type de
  spot** (Dockstart/Rockstart/Dropstart/etc.) — elles n'ont **aucune**
  correspondance 1:1 avec les 6 tokens sémantiques actuels
  (`--color-primary/secondary/accent/text/muted/background`). Étendre les
  tokens CSS pour ces couleurs serait un scope creep hors DS-01, et risquerait
  le même drift OKLCH/hex découvert en Phase 1. Seule exception : les couleurs
  qui matchent réellement un token existant (ex. `#38bdf8`/sky pourrait référencer
  `--color-primary` si jugé pertinent au moment de l'implémentation) peuvent
  utiliser le token — à l'appréciation du planner/exécuteur, avec la même
  discipline de vérification qu'en Phase 1 (chaîne CSS prouvée identique, pas
  supposée).

### Migration des modaux de la vue Carte (D-02)
- **D-02:** `FiltersModal` (lancé depuis la top bar de `Map.tsx`) migre vers
  `src/ui/Modal` + `src/ui/Header` + `src/ui/Button` **dans cette phase** —
  il fait partie du périmètre "vue Carte" (NAV-01/MAP-01) et duplique
  exactement le pattern que Phase 1 vient d'extraire (backdrop `bg-black/60
  backdrop-blur-md` + `AnimatePresence`, cf. audit 6.2).
- `AddSpotForm` et `AddSpotInfoModal` (également lancés depuis `Map.tsx`)
  **restent hors périmètre visuel** de cette phase — leur migration design
  system est Phase 4 (UI-03, formulaires). Seul le bug mémoire de
  `AddSpotForm` est traité ici (D-03), sans toucher à son apparence.
- `AdminDashboard` et `SpotDetail` (les 2 autres composants dupliquant le
  pattern modal, cf. audit 6.2) restent également hors périmètre — pas
  déclenchés directement depuis la vue Carte/nav, traités dans leurs phases
  respectives (3 pour SpotDetail, hors scope explicite pour AdminDashboard).

### Portée exacte de MAP-02 — fix du bug mémoire (D-03)
- **D-03:** MAP-02 ("cache/médias de la vue Carte optimisé... plus de fuite
  mémoire sur les aperçus") correspond à un bug précis et identifié dans
  `src/components/AddSpotForm.tsx` (lignes 62-66) : le `useEffect` de nettoyage
  des URLs d'aperçu photo (`URL.revokeObjectURL`) se déclenche à **chaque**
  changement de `imagePreviews` (pas seulement au démontage), révoquant les
  URLs de la fermeture précédente — donc des photos **encore affichées**
  dès qu'une nouvelle image est ajoutée. Fix ciblé attendu : ne révoquer que
  les URLs réellement retirées (ex. dans `handleRemoveImage`, qui le fait déjà
  correctement) et un cleanup véritablement scopé au démontage du composant,
  pas à chaque changement de state. **Aucune modification visuelle** du
  formulaire — c'est un fix de bug, pas une migration design system.
- Ce fix est déclenché depuis le flux carte (tap map → "ajouter un spot" →
  ce formulaire), ce qui justifie son inclusion dans MAP-02 malgré le
  périmètre visuel différé de `AddSpotForm` (D-02).

### Claude's Discretion
- **Stratégie technique de mémoïsation (MAP-01)** : comment éliminer les
  re-renders des markers exactement (séparer génération de features du
  filtrage, utiliser `setFilter` natif Mapbox plutôt que régénérer tout le
  GeoJSON, etc.) — laissé au planner/exécuteur. CONCERNS.md documente déjà
  la piste ("update layer filter property instead of rebuilding features").
  Vérification obligatoire au React Profiler avant/après (cf. success
  criteria ROADMAP), mais la méthode d'implémentation est libre.
- Nommage exact de la constante de couleurs markers et son emplacement
  précis (`Map.tsx` local vs `src/config/mapbox.ts`).
- Structure interne de la refonte du `useEffect` de cleanup dans
  `AddSpotForm.tsx` (D-03) — tant que le comportement observable est corrigé.
- Refactor de la duplication `NavBar` (rendu deux fois, desktop/mobile, cf.
  CONCERNS.md "Fragile Areas") — pas explicitement demandé, mais si le
  planner juge que le wiring de tokens le justifie naturellement, c'est
  acceptable tant qu'aucun comportement ne change.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/REQUIREMENTS.md` — NAV-01, MAP-01, MAP-02, PERF-01 (périmètre de
  la phase) + section « Out of Scope ».
- `.planning/ROADMAP.md` §Phase 2 — goal et success criteria.

### Héritage Phase 1 (design system)
- `.planning/phases/01-audit-design-system/01-CONTEXT.md` — décisions D-01 à
  D-09 sur les tokens et composants maîtres ; D-03 en particulier annonce déjà
  la migration des couleurs de markers vers Phase 2.
- `.planning/phases/01-audit-design-system/01-AUDIT.md` §6 (UI-Incoherence
  Inventory) — inventaire exact : 17 hex/12 couleurs distinctes dans
  `Map.tsx`, 6 composants dupliquant le pattern modal.
- `.planning/phases/01-audit-design-system/01-VERIFICATION.md` — méthodologie
  de vérification byte-identique des tokens (override documenté sur DS-02),
  à reproduire pour tout nouveau wiring de couleur en Phase 2.
- `src/index.css` — source unique des tokens (primary/secondary/accent/
  text/muted/background, radius-4xl), aliasés aux variables Tailwind
  natives — ne pas réintroduire de valeurs hex figées.
- `src/ui/{Modal,Header,Input,Button,Card}.tsx` — composants maîtres
  disponibles pour NAV-01/FiltersModal.

### Dette et bugs pertinents
- `.planning/codebase/CONCERNS.md` §Performance Bottlenecks ("Map Clustering
  Re-renders on Spot Filter Changes") — piste technique pour MAP-01.
- `.planning/codebase/CONCERNS.md` §Known Bugs ("Image Upload Memory Leak in
  AddSpotForm") — description du bug ciblé par MAP-02 (D-03).
- `.planning/codebase/CONCERNS.md` §Fragile Areas ("Mobile-Only NavBar
  Duplication") — contexte sur la duplication desktop/mobile de NavBar,
  pertinent si le planner touche à sa structure.

### Code à modifier
- `src/components/Map.tsx` — layers Mapbox (couleurs), logique de mémoïsation
  `spotsGeoJson`, top bar (bouton filtre → migration Modal).
- `src/components/FiltersModal.tsx` — migration vers `src/ui/Modal`.
- `src/components/AddSpotForm.tsx` lignes 62-66 — fix du useEffect de cleanup
  (D-03 uniquement, pas de changement visuel).
- `src/components/NavBar.tsx` — wiring des tokens couleur (sky-500 → primary,
  etc., même discipline byte-identique qu'en Phase 1).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/{Modal,Header,Button}.tsx` (Phase 1) — prêts à consommer pour
  `FiltersModal`.
- `spotsGeoJson` déjà mémoïsé via `useMemo([spots, filter])` dans `Map.tsx` —
  base existante à affiner, pas à réécrire de zéro.
- `MapProps` interface et handlers déjà proprement séparés
  (`onMapClick`, `onMouseEnter/Leave` via `useCallback`).

### Established Patterns
- Mapbox layers définis comme constantes `LayerProps` au niveau module
  (`clusterLayer`, `clusterCountLayer`, `unclusteredPointLayer`) — pattern à
  conserver pour la centralisation des couleurs (D-01).
- NavBar dupliqué (version `isVertical` desktop + version mobile bottom bar)
  dans le même fichier avec un flag conditionnel — état actuel à respecter
  sauf refactor jugé nécessaire par le planner (Claude's Discretion).
- Modal pattern déjà unifié dans `src/ui/Modal` (Phase 1) : `isOpen`/`onClose`,
  `AnimatePresence`, backdrop `bg-black/60 backdrop-blur-md`.

### Integration Points
- `src/components/Map.tsx` → `FiltersModal` (prop `isOpen`/`onClose`/
  `selectedFilter`/`onFilterChange`) — point d'intégration pour D-02.
- `src/context/SpotsContext.tsx` — source de `spots`, alimente
  `spotsGeoJson` ; toute optimisation MAP-01 doit rester compatible avec ce
  contexte sans le modifier (hors scope de cette phase).
- `App.tsx` → `NavBar` (deux instances, desktop sidebar + mobile bottom) —
  point d'intégration pour NAV-01.

</code_context>

<specifics>
## Specific Ideas

- Bug MAP-02 localisé précisément : `src/components/AddSpotForm.tsx:62-66`,
  cleanup `useEffect` mal scopé sur `imagePreviews` au lieu du démontage seul.
- FiltersModal est le seul modal carte migré cette phase ; AddSpotForm/
  AddSpotInfoModal restent visuellement inchangés (Phase 4).

</specifics>

<deferred>
## Deferred Ideas

- **Extension des tokens CSS aux couleurs de type de spot** — envisagée
  puis écartée pour cette phase (D-01) ; resterait un scope creep DS-01.
  Si un futur besoin de theming des types de spot émerge, ce serait DS-04
  (design system étendu, hors v2.0).
- **Migration AddSpotForm/AddSpotInfoModal/AdminDashboard/SpotDetail vers
  `src/ui/Modal`** — les 3 modaux carte restants + SpotDetail, hors périmètre
  de cette phase (Phase 3 pour SpotDetail, Phase 4 pour AddSpotForm).
- **Refactor de la duplication NavBar mobile/desktop** — signalé comme zone
  fragile dans CONCERNS.md, pas explicitement demandé ; laissé à
  l'appréciation du planner (Claude's Discretion) plutôt qu'imposé.
- **Optimisation `cacheSpotImages()` (offline.ts)** — bloque le thread
  principal, pas de retry ; envisagé comme candidat MAP-02 puis écarté au
  profit du bug AddSpotForm (correspondance plus précise avec la formulation
  du roadmap "fuite mémoire sur les aperçus"). Pourrait être repris en
  Phase 5 (nettoyage final) si jugé pertinent.

</deferred>

---

*Phase: 2-navigation-vue-carte-spots*
*Context gathered: 2026-07-29*
