# Phase 4: Formulaires & Interactions - Context

**Gathered:** 2026-07-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrer les formulaires d'ajout/édition de spot (AddSpotForm, édition inline dans SpotDetail, édition inline dans AdminDashboard) et le système de favoris (toggle + affichage) vers le design system (Input, Button, Modal), tout en fiabilisant la validation des données saisies et la gestion des erreurs API — sans aucune régression fonctionnelle (contrainte milestone v2.0). Requirements couverts : UI-03, ROBUST-01, ROBUST-02.

</domain>

<decisions>
## Implementation Decisions

### Extension du composant Input
- **D-01:** Claude's discretion — décider en planification si le composant Input maître doit être étendu (variantes textarea, sélection type/difficulté, fond clair) ou si les champs non-texte restent des éléments natifs stylés aux tokens. Le précédent établi en Phase 2/3 est d'étendre les composants existants (Modal) plutôt que d'en créer de nouveaux — privilégier cette cohérence sauf risque de régression visuelle identifié.

### Validation des formulaires (ROBUST-01)
- **D-02:** Claude's discretion sur les limites exactes de longueur pour nom et description (options considérées : nom max 100 / desc max 2000 [recommandation CONCERNS.md], ou nom max 50 / desc max 500). Choisir des limites raisonnables au planning.
- **D-03:** Le champ type de spot reste à sélection multiple avec au moins 1 type obligatoire (comportement existant conservé). Ajouter un message d'erreur explicite si jamais 0 type sélectionné (edge case théorique, actuellement géré silencieusement).
- **D-04:** Les photos restent optionnelles à la soumission (zéro régression fonctionnelle). Si l'utilisateur soumet sans photo, afficher une confirmation douce (pas bloquante) du type : *"Vous n'avez pas mis de photo, êtes-vous sûr de vouloir publier ?"* — expliquer qu'une photo aide les autres utilisateurs à voir à quoi ressemble le spot, et qu'il pourra en ajouter une plus tard en modifiant le spot. Ton engageant et encourageant, pas culpabilisant.
- **D-05:** Pas de validation de type de fichier (image/*) ni de taille max sur les photos uploadées dans cette phase — hors scope, se concentrer sur la validation des champs texte.

### Pattern de feedback d'erreur API (ROBUST-02)
- **D-06:** Claude's discretion sur le pattern de remplacement des `alert()` natifs (ex: `SpotsContext.tsx` `alert('Failed to approve.')`) dans le périmètre formulaires/favoris : message inline (réutiliser le pattern déjà existant dans `AuthModal.tsx` — `{error && <div>{error}</div>}`) ou introduction d'un toast. **Contrainte à réconcilier :** le toggle favori (D-08 ci-dessous) requiert déjà un toast discret en cas d'échec — si un toast minimal est introduit pour les favoris, envisager de le réutiliser pour la cohérence du feedback d'erreur des formulaires plutôt que de maintenir deux patterns distincts.
- **D-07:** Pas de bouton "Réessayer" explicite. En cas d'échec (soumission de spot, édition, upload), le formulaire garde ses données saisies et l'utilisateur relance manuellement via le bouton de soumission normal.
- **D-08:** Le toggle favori (optimistic update) : en cas d'échec, revert de l'état visuel (comportement existant) **+ toast discret** ("Échec, réessaie" ou équivalent) en plus du revert silencieux actuel.

### Périmètre exact du formulaire/favoris
- **D-09:** L'édition de spot dans `AdminDashboard.tsx` (formulaire inline, inputs natifs, réservé à l'admin) **fait partie** du périmètre de migration UI-03 — cohérence totale sur tous les formulaires d'édition de spot, y compris ceux réservés à l'admin.
- **D-10:** Tous les boutons favori (coeur) migrent vers le composant `Button` (variante `iconOnly`) : celui de la liste favoris dans `App.tsx` (~ligne 177-181) et celui de `SpotDetail.tsx` (~ligne 307-313).
- **D-11:** L'icône coeur dans `NavBar.tsx` (onglet de navigation "Favoris") est **hors périmètre** de cette phase — élément de navigation déjà traité en Phase 2 (NAV-01), ce n'est pas une action favori ni un formulaire.

### Claude's Discretion
Récapitulatif des points laissés à la discrétion de Claude au planning : D-01 (extension Input vs natif), D-02 (limites exactes de longueur), D-06 (pattern inline vs toast pour l'erreur API générale — en tenant compte de la contrainte D-08).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Concerns & dette technique (contexte des décisions ROBUST-01/02)
- `.planning/codebase/CONCERNS.md` — Section "Unstructured Error Handling" (alert() natifs, échecs silencieux), section "Missing Input Validation on User-Generated Content" (limites recommandées nom/desc), section "Unverified File Upload" (validation fichier — explicitement écartée cette phase par D-05)

### Conventions & composants existants
- `.planning/codebase/CONVENTIONS.md` — Section "Error Handling" (pattern `mapAuthError`, optimistic UI avec fallback, `{error && <div>{error}</div>}`)
- `.planning/codebase/STRUCTURE.md` — Emplacement des composants concernés (`src/components/AddSpotForm.tsx`, `src/components/AdminDashboard.tsx`, `src/components/SpotDetail.tsx`, `src/context/FavoritesContext.tsx`)

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — UI-03, ROBUST-01, ROBUST-02
- `.planning/ROADMAP.md` — Phase 4: Formulaires & Interactions (goal, success criteria)

No external specs (ADR/PRD) — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/Button.tsx` — supporte déjà `variant`, `size`, `loading`, `disabled`, `iconOnly` (avec garde-fou `aria-label` obligatoire) : couvre directement le besoin de bouton favori icon-only et de bouton submit avec état loading.
- `src/ui/Input.tsx` — composant texte simple avec label, icon optionnel, styles fond sombre (pensé pour `AuthModal`) ; ne supporte ni textarea ni select — voir D-01.
- Pattern `mapAuthError()` (`AuthModal.tsx:23-28`) — traduction d'erreurs backend en messages utilisateur, réutilisable comme modèle pour les erreurs de formulaire spot.

### Established Patterns
- Extension de composant plutôt que duplication (Modal étendu en Phase 2 avec variante light/sheet, en Phase 3 avec variante light+center) — précédent direct pour la décision D-01.
- Optimistic UI avec revert silencieux déjà en place dans `FavoritesContext.tsx:66-103` — D-08 l'étend avec un toast, sans changer le mécanisme de revert lui-même.
- Validation avant soumission actuellement minimale (`if (!position) return`) — aucune validation de longueur/contenu n'existe encore.

### Integration Points
- `addSpot` et `updateSpot` (`src/context/SpotsContext.tsx`) — points d'entrée pour toute nouvelle validation côté formulaire avant appel API.
- `toggleFavorite`/`isFavorite` (`src/context/FavoritesContext.tsx`) — point d'intégration pour le toast de revert (D-08).
- Formulaire d'édition inline dans `SpotDetail.tsx` (`editForm`, `handleSaveEdit` ~ligne 196-224) et dans `AdminDashboard.tsx` (`editingSpot`, ~ligne 18-262) — deux implémentations séparées de la même logique d'édition de spot, toutes deux dans le périmètre (D-09).

</code_context>

<specifics>
## Specific Ideas

- Message de confirmation "pas de photo" (D-04) : ton demandé par l'utilisateur — engageant, pas culpabilisant, explique la valeur d'une photo pour les autres riders, rappelle qu'on peut en ajouter une plus tard via l'édition du spot.
- Toast de revert favori (D-08) : discret, éphémère ("Échec, réessaie" ou équivalent) — pas une notification intrusive.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Formulaires & Interactions*
*Context gathered: 2026-07-30*
