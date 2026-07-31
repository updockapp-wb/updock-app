# Phase 5: Recette globale & nettoyage final - Context

**Gathered:** 2026-07-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Clôturer le milestone v2.0 : supprimer le code mort et les dépendances obsolètes/inutilisées (CODE-01), homogénéiser la gestion d'état entre les 6 contexts/providers (CODE-02), réduire la taille du bundle vers la cible chiffrée déjà fixée par l'audit Phase 1 (PERF-03 : -15% gzip JS, 504.17 → ≈428.5 kB), et valider la non-régression globale sur l'ensemble des flux critiques du milestone via une checklist de recette manuelle complète (QA-01). C'est la dernière phase du milestone — aucune nouvelle fonctionnalité utilisateur.

</domain>

<decisions>
## Implementation Decisions

### Périmètre du nettoyage de code (CODE-01)
- **D-01:** Le nettoyage couvre l'intégralité de la dette lint accumulée depuis la Phase 1 (34 problèmes actuels : 27 erreurs / 7 warnings — `@typescript-eslint/no-explicit-any` dans les contexts, `react-refresh/only-export-components`, `react-hooks/set-state-in-effect`, `react-hooks/exhaustive-deps`), pas seulement le code mort/deps au sens strict. `npm run lint` doit finir vert à la fin de la phase.
- **D-02:** Le fix de `cacheSpotImages()` (`src/utils/offline.ts`, boucle synchrone bloquant le thread principal — déféré en Phase 2, cf. `02-CONTEXT.md` § Deferred Ideas) est inclus dans le périmètre de cette phase.
- **D-03:** Les dépendances obsolètes = suppression des packages **inutilisés** uniquement (via `knip`/`depcheck`, déjà installés en devDependencies). Pas de mise à jour de version (mineure ou majeure) — évite tout risque de régression hors du périmètre "zéro régression" du milestone.

### Homogénéisation de la gestion d'état (CODE-02)
- **D-04:** Les 3 contexts qui exportent des non-composants dans le même fichier que leur Provider (`LanguageContext.tsx`, `SessionsContext.tsx`, `SpotsContext.tsx` — chacun déclenche `react-refresh/only-export-components`) doivent voir leurs hooks/constantes extraits vers des fichiers séparés, pour aligner la structure de fichiers sur les autres contexts (`AuthContext`, `FavoritesContext`, `ProfileContext`).
- **D-05:** Le pattern d'erreur harmonisé en Phase 4 pour `SpotsContext`/`FavoritesContext` (erreurs propagées/rethrow + `Toast`, plus d'`alert()` natif — cf. `04-CONTEXT.md` D-06/D-08) doit être audité et étendu aux contexts restants (`AuthContext`, `ProfileContext`, `SessionsContext`) là où ils en divergent encore.

### Stratégie de réduction du bundle (PERF-03)
- **D-06:** Stratégie principale = **code-splitting / lazy-load**, pas seulement suppression de deps + tree-shaking. Mapbox GL représente 54.5% du bundle gzip JS (le plus gros levier identifié par l'audit Phase 1) et doit passer en dynamic import.
- **D-07:** Pendant le chargement lazy du chunk Mapbox sur l'écran Carte (écran principal de l'app, affiché dès la connexion), afficher un **skeleton/spinner** sur la zone carte — pas de préchargement anticipé dès le login.
- **D-08:** Le code-splitting s'étend au-delà de Mapbox à **tous les écrans/modales non critiques** chargés conditionnellement : `AdminDashboard` (réservé admin), `PremiumModal`, et tout autre composant équivalent identifié au planning — via `React.lazy`.
- **D-09:** La vérification de la cible -15% reproduit **exactement** la méthodologie de l'audit Phase 1 : `audit/build-size.txt` + `audit/stats.html` (rollup-plugin-visualizer), métrique de référence = gzip total JS, comparée à la baseline firme de 504.17 kB.

### Checklist de recette globale (QA-01)
- **D-10:** La checklist est une **recette complète de régression globale** — fusion/reprise des checklists QA-01 des Phases 2/3/4 (carte+nav, fiche spot+profil, formulaires+favoris) **plus** les flux non couverts explicitement avant (avis, session, auth), pas une checklist ciblée sur les seuls changements de Phase 5.
- **D-11:** Recette testée sur **iOS + Android** (device réel) — divergence assumée par rapport aux Phases 3/4 (iOS uniquement) : c'est la recette de clôture du milestone entier, et le nettoyage/bundle/state touchent des fichiers transverses avec un risque de régression cross-platform non exclu.
- **D-12:** Les 2 bugs connus et hors périmètre (notifications push session non reçues sur iPhone — hors milestone, cf. `.planning/todos/push-notif-no-popup-iphone.md` ; liste pays incomplète dans `CommunityStatsScreen` — backlog, cf. `.planning/todos/country-list-incomplete-other-emoji.md`) sont listés explicitement dans la checklist comme **exclusions connues**, pour ne pas être comptés à tort comme régressions découvertes pendant la recette.
- **D-13:** La checklist QA-01 s'exécute en **une seule passe finale**, après que le nettoyage code (CODE-01/02) et le code-splitting (PERF-03) soient tous deux terminés — pas de recette intermédiaire après le bundle seul.

### Claude's Discretion
- Nommage exact et emplacement des fichiers extraits pour D-04 (ex. `useSpots.ts` vs autre convention).
- Détail technique exact du découpage React.lazy / Suspense pour D-06/D-08 (granularité des chunks, points de `Suspense` boundary).
- Choix de l'outil exact entre `knip` et `depcheck` (ou les deux en croisement) pour identifier les deps mortes de D-03 — les deux sont déjà installés.
- Liste exacte et complémentaire des composants/modales inclus dans "écrans non critiques" au-delà d'AdminDashboard/PremiumModal (D-08) — à confirmer par lecture du code au planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Baseline & cible bundle (PERF-03)
- `.planning/phases/01-audit-design-system/01-AUDIT.md` §2-3 — baseline firme (504.17 kB gzip JS), composition du bundle (Mapbox GL = 54.5%), cible directionnelle -15% → ≈428.5 kB (D-06/D-09).
- `audit/build-size.txt`, `audit/stats.html` — artefacts de mesure Phase 1 à reproduire (D-09).

### Dette lint & deps (CODE-01/CODE-02)
- `.planning/phases/01-audit-design-system/deferred-items.md` — inventaire initial des 33 problèmes lint (any types, react-refresh, set-state-in-effect, exhaustive-deps, unused-vars), explicitement ciblés CODE-01/CODE-02 Phase 5.
- `.planning/phases/02-navigation-vue-carte-spots/deferred-items.md` — 2 items lint pré-existants supplémentaires (`App.tsx:47`, `FiltersModal.tsx`).
- `.planning/phases/04-formulaires-interactions/deferred-items.md` — confirmation à date (28 erreurs/7 warnings, `ProfileContext`/`SessionsContext`/`SpotsContext` listés) ; recommande explicitement "un plan de nettoyage lint dédié (candidat Phase 5 CODE-01/CODE-02)".
- `.planning/codebase/CONCERNS.md` § Tech Debt ("Type Safety and Any Types"), § Performance Bottlenecks ("Image Caching Strategy Not Optimized" = `cacheSpotImages()`, D-02) — **daté 2026-03-18, partiellement obsolète** (ex. le mismatch de version Capacitor CLI/core y décrit est déjà résolu dans `package.json` actuel — ne pas s'y fier pour les deps, seulement pour le contexte du bug perf).
- `package.json` — `knip` et `depcheck` déjà présents en devDependencies (D-03).

### Héritage Phase 2/4 (patterns à étendre)
- `.planning/phases/02-navigation-vue-carte-spots/02-CONTEXT.md` § Deferred Ideas — `cacheSpotImages()` explicitement noté "candidat Phase 5" (D-02).
- `.planning/phases/04-formulaires-interactions/04-CONTEXT.md` D-06/D-08 — pattern d'erreur harmonisé (rethrow + Toast) à étendre aux contexts restants (D-05).

### Todos hors périmètre à référencer dans QA-01
- `.planning/todos/push-notif-no-popup-iphone.md` (D-12).
- `.planning/todos/country-list-incomplete-other-emoji.md` (D-12).

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — CODE-01, CODE-02, PERF-03, QA-01 (périmètre de la phase) + § Out of Scope.
- `.planning/ROADMAP.md` § Phase 5 — goal et success criteria.

### Architecture & structure des contexts
- `.planning/codebase/ARCHITECTURE.md` § Layers "Context/State Management", § Key Abstractions "Context Hook Pattern" — 6 contexts existants (`AuthContext`, `SpotsContext`, `FavoritesContext`, `LanguageContext`, `ProfileContext`, `SessionsContext`), pattern actuel à homogénéiser (D-04/D-05).

No external ADR/PRD — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `knip` (^6.29.0) et `depcheck` (^1.4.7) déjà en devDependencies — outillage prêt pour l'identification de code/deps morts (D-03), probablement posé lors de l'audit Phase 1.
- Pattern `mapAuthError()` / erreur propagée + `Toast` déjà établi sur `SpotsContext`/`FavoritesContext` (Phase 4) — modèle direct pour l'extension D-05.

### Established Patterns
- Context Hook Pattern (`ARCHITECTURE.md`) : create context → create provider → create custom hook avec throw si hors provider. Le pattern lui-même est cohérent partout ; l'incohérence porte sur la **structure de fichier** (co-location hooks/provider) et la **gestion d'erreur**, pas sur le pattern React lui-même.
- `React.lazy`/`Suspense` pas encore utilisé dans le codebase (aucune occurrence trouvée) — introduction nouvelle pour D-06/D-08.

### Integration Points
- `src/components/Map.tsx` — point d'entrée du dynamic import Mapbox (D-06/D-07).
- `src/App.tsx` → `AdminDashboard`, `PremiumModal` — points de montage conditionnels, candidats `React.lazy` (D-08).
- `src/context/{Language,Sessions,Spots}Context.tsx` — fichiers à scinder (D-04).
- `src/context/{Auth,Profile,Sessions}Context.tsx` — fichiers à auditer pour la gestion d'erreur (D-05).
- `src/utils/offline.ts` (`cacheSpotImages()`) — fonction à corriger (D-02).

</code_context>

<specifics>
## Specific Ideas

- Cible bundle non négociable : -15% gzip JS depuis la baseline firme 504.17 kB (≈428.5 kB), fixée dès la Phase 1 — ce n'est pas une nouvelle discussion, juste l'exécution.
- La recette finale doit explicitement lister les 2 bugs connus hors scope pour ne pas polluer le comptage de régressions (D-12).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
- `.planning/todos/country-list-incomplete-other-emoji.md` — référencé comme exclusion connue dans la checklist QA-01 (D-12), mais pas corrigé dans cette phase (bug de données/logique, pas de nettoyage/perf/état).
- `.planning/todos/push-notif-no-popup-iphone.md` — référencé comme exclusion connue dans la checklist QA-01 (D-12), explicitement hors milestone (`REQUIREMENTS.md` § Out of Scope).

</deferred>

---

*Phase: 5-Recette globale & nettoyage final*
*Context gathered: 2026-07-31*
