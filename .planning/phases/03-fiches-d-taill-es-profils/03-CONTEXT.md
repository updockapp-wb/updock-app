# Phase 3: Fiches Détaillées & Profils - Context

**Gathered:** 2026-07-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Harmoniser visuellement la fiche détail spot (`SpotDetail.tsx`) et l'écran
Profil (`Profile.tsx`, + son écran satellite `CommunityStatsScreen.tsx` et
`PremiumModal.tsx`) via le design system construit en Phase 1, et charger
leurs médias en lazy loading — sans aucune régression fonctionnelle.

**Contrainte cardinale (héritée de Phase 1/2) :** harmonisation de l'existant,
pas de rebranding. Zéro régression fonctionnelle — en particulier, ne pas
sacrifier le comportement UX natif existant (drag-to-dismiss de SpotDetail)
au nom de la cohérence visuelle.

**Hérité de Phase 2 (02-CONTEXT.md) :** `SpotDetail` était explicitement
exclu de la Phase 2 et différé ici — confirmé, pas une nouvelle décision.
`AddSpotForm`/`AddSpotInfoModal` restent hors périmètre visuel (Phase 4).
`AdminDashboard` (l'écran lui-même, pas le bouton d'entrée) reste hors scope.

</domain>

<decisions>
## Implementation Decisions

### Conteneur de SpotDetail (D-01)
- **D-01:** Le conteneur externe de `SpotDetail` reste **`vaul` (Drawer) +
  `createPortal`**, PAS `src/ui/Modal`. Raison : `vaul` fournit un
  drag-to-dismiss natif important sur un écran consulté très fréquemment ;
  le remplacer par la variante "sheet" de `Modal` DS perdrait ce
  comportement — régression UX interdite par la contrainte cardinale.
  Seul l'**intérieur** de `SpotDetail` (Header, badges, structure de contenu)
  migre vers les composants DS, la coque `vaul` reste intacte.

### Icônes de header SpotDetail (D-02)
- **D-02:** Les boutons icônes du header de `SpotDetail` (Partager, Favori,
  Fermer, Modifier) **restent des `<button>` natifs**, ne migrent PAS vers
  `src/ui/Button`. Raison : ce sont des icon-buttons de header (pas des CTA
  standards), `Button` n'a probablement pas de variant icon-only compact
  adapté — même logique que D-04 de la Phase 2 pour les onglets NavBar.

### Carrousel photo et onglets (D-03)
- **D-03:** Le carrousel photo plein écran de `SpotDetail` (fond noir,
  navigation prev/next, compteur) et les onglets Info/Avis/Sessions
  **restent tels quels**, hors périmètre de migration DS. Raisons :
  - Carrousel : viewer plein écran spécifique, aucun composant DS équivalent.
  - Onglets : le DS n'a pas de composant Tabs — en créer un maintenant
    étendrait DS-02 au-delà de son périmètre fixé en Phase 1 (Button/Card/
    Input/Modal/Header uniquement). Un composant Tabs est explicitement
    DS-04, hors v2.0 (`REQUIREMENTS.md` § Future Requirements).

### Périmètre de l'écran Profil (D-04)
- **D-04:** UI-02 couvre `Profile.tsx` **ET** `CommunityStatsScreen.tsx`
  **ET** `PremiumModal.tsx` (tous deux atteints/déclenchés depuis Profil).
  `Profile.tsx` n'a actuellement AUCUN composant DS (0 import Card/Header/
  Button/Modal) — migration large à faire. Le bouton d'entrée « Tableau de
  Bord Admin » (dans `Profile.tsx`) fait partie du périmètre — c'est un
  bouton du fichier migré, pas l'écran `AdminDashboard` lui-même (qui reste
  hors scope, cf. héritage Phase 2).
- Migration en **une seule passe complète** sur `Profile.tsx` (450 lignes,
  taille gérable pour un seul plan, comme les composants de Phase 2).

### PremiumModal (D-05)
- **D-05:** `PremiumModal.tsx` migre vers `src/ui/Modal` **dans cette phase**
  — il duplique exactement l'ancien pattern pré-Phase-2 (`AnimatePresence`
  custom, backdrop `bg-black/60`, pas `Modal` DS) et utilise déjà la forme
  glass-center supportée nativement par `Modal` depuis la Phase 1/2. Coût
  marginal faible (petit fichier), cohérent avec l'inclusion de
  `CommunityStatsScreen` (D-04).

### Lazy loading des médias (D-06)
- **D-06:** Méthode = attribut natif HTML `loading="lazy"` sur les `<img>`
  (carrousel SpotDetail, avatar Profil, éventuelles images de
  CommunityStatsScreen). Pas d'Intersection Observer custom ni de
  placeholder blur — support navigateur natif suffisant (WebView Capacitor
  iOS 15.4+), zéro dépendance, zéro risque de régression.
- **Comportement carrousel :** l'image visible + les voisines immédiates
  (index ±1) sont chargées eagerly ; le reste en lazy natif — évite un délai
  perceptible au clic next/prev tout en limitant le chargement initial.
- **Vérification :** mesure chiffrée avant/après (nombre de requêtes images
  au chargement initial de la fiche/profil), même méthodologie que la
  baseline Phase 2 (`02-BASELINE.md`) — pas seulement une vérification
  visuelle.

### Claude's Discretion
- Détail technique du wiring exact des couleurs/tokens dans `SpotDetail.tsx`
  et `Profile.tsx` (quelles classes Tailwind correspondent 1:1 à quels
  tokens) — même discipline byte-identique qu'en Phase 1/2, mais le choix
  précis des correspondances est laissé au planner/exécuteur.
- Structure interne exacte de la migration Header/badges dans `SpotDetail`
  (D-01) — tant que la coque `vaul` externe et le comportement drag-to-dismiss
  restent intacts.
- Méthode exacte de mesure avant/après du lazy loading (D-06) — reproduire
  l'esprit de `02-BASELINE.md` (chrome-devtools-mcp ou équivalent), le detail
  d'outillage est laissé à l'exécuteur.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/REQUIREMENTS.md` — UI-01, UI-02, PERF-02 (périmètre de la
  phase) + § Out of Scope + § Future Requirements (DS-04, hors v2.0).
- `.planning/ROADMAP.md` § Phase 3 — goal et success criteria.

### Héritage Phase 1/2 (design system)
- `.planning/phases/01-audit-design-system/01-CONTEXT.md` — décisions D-01 à
  D-09 sur les tokens et composants maîtres.
- `.planning/phases/02-navigation-vue-carte-spots/02-CONTEXT.md` — D-02 en
  particulier : SpotDetail explicitement différé à cette phase ; D-04 :
  précédent de composants natifs non-migrés (NavBar) qui justifie D-02/D-03
  de ce fichier.
- `.planning/phases/02-navigation-vue-carte-spots/02-BASELINE.md` —
  méthodologie de mesure avant/après à reproduire pour PERF-02 (D-06).
- `src/index.css` — source unique des tokens.
- `src/ui/{Modal,Header,Input,Button,Card}.tsx` — composants maîtres
  disponibles, `Modal` supporte désormais `surface="glass"` (défaut,
  centré) et `surface="light"`/`layout="sheet"` (bottom-sheet, depuis
  Phase 2 D-02).

### Dette et bugs pertinents
- `.planning/codebase/CONCERNS.md` § Known Bugs ("Admin Dashboard Preview
  Modal State Leak") — hors périmètre (AdminDashboard exclu), mais à
  connaître si jamais touché incidemment.

### Code à modifier
- `src/components/SpotDetail.tsx` (780 lignes) — intérieur uniquement
  (Header, badges), coque `vaul`/`createPortal` intacte (D-01/D-02/D-03).
- `src/components/Profile.tsx` (450 lignes) — migration complète en une
  passe (D-04).
- `src/components/CommunityStatsScreen.tsx` — inclus dans le périmètre
  (D-04) ; son header a déjà reçu un fix de padding safe-area
  (`pt-[calc(1rem+env(safe-area-inset-top))]`) lors d'une session précédente
  — ne pas le régresser lors de la migration DS.
- `src/components/PremiumModal.tsx` — migration vers `src/ui/Modal` (D-05).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/{Modal,Header,Button,Card}.tsx` (Phase 1, étendu Phase 2) — prêts
  à consommer pour Profile.tsx et PremiumModal.
- `Modal` supporte déjà `surface="glass"`/`layout="center"` (défaut) et
  `surface="light"`/`layout="sheet"` — couvre le besoin de `PremiumModal`
  (glass-center) sans extension supplémentaire.

### Established Patterns
- Pattern D-04 de Phase 2 (composants natifs non-migrés quand aucun variant
  DS ne correspond à la forme) — applicable à D-02/D-03 de cette phase pour
  les icônes de header et le carrousel de SpotDetail.
- Pattern de mesure avant/après établi en Phase 2 (`02-BASELINE.md`,
  `chrome-devtools-mcp`) — à reproduire pour PERF-02.

### Integration Points
- `src/App.tsx` → `SpotDetail` (prop `spot`/`onClose`/`onOpenAuth`) — le
  point de montage ne change pas (D-01 : coque externe intacte).
- `src/components/Profile.tsx` → `CommunityStatsScreen` et `PremiumModal`
  (déclenchés depuis Profil) — les trois fichiers migrent ensemble (D-04/D-05).

</code_context>

<specifics>
## Specific Ideas

- `SpotDetail.tsx:33` (`currentPhotoIndex`) et `image_urls[]` : structure du
  carrousel confirmée par lecture directe du code — image visible + voisines
  ±1 chargées eagerly (D-06).
- `CommunityStatsScreen.tsx` : header déjà corrigé pour le safe-area avant
  cette discussion — vérifier que la migration DS ne le régresse pas.

</specifics>

<deferred>
## Deferred Ideas

- **Composant Tabs maître** — envisagé pour les onglets Info/Avis/Sessions
  de SpotDetail (D-03), écarté pour cette phase. Candidat naturel pour
  DS-04 (design system étendu, hors v2.0) si le besoin se confirme ailleurs
  dans l'app.
- **Extension de `Modal` DS avec drag-to-dismiss** — envisagée comme
  alternative à garder `vaul` (D-01), écartée : scope technique plus large
  qu'un simple wiring, pas nécessaire tant que `vaul` fonctionne bien.
- **Migration Button pour les icônes de header** (D-02) — écartée pour
  cette phase, resterait pertinente si un futur variant icon-only est
  ajouté à `Button` (pas demandé actuellement).
- **AdminDashboard (écran complet)** — reste hors scope (héritage Phase 2),
  seul le bouton d'entrée dans `Profile.tsx` est dans le périmètre (D-04).

### Reviewed Todos (not folded)
- `.planning/todos/country-list-incomplete-other-emoji.md` — le bug vit
  dans `CommunityStatsScreen.tsx` (inclus au périmètre via D-04), mais c'est
  un bug de données/logique (liste de pays incomplète), pas une tâche
  d'harmonisation design system. Reste dans le backlog, pas folded dans
  cette phase — sauf décision contraire explicite au moment du plan.

</deferred>

---

*Phase: 3-fiches-d-taill-es-profils*
*Context gathered: 2026-07-29*
