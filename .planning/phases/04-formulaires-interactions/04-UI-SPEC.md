---
phase: 4
slug: formulaires-interactions
status: draft
shadcn_initialized: false
preset: none
created: 2026-07-30
---

# Phase 4 — Contrat de design UI (Formulaires & Interactions)

> Contrat visuel et d'interaction pour la migration des formulaires (ajout/édition de spot) et du système de favoris vers le design system. Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.
>
> **Nature :** refactor interne, **zéro régression** (milestone v2.0). Les valeurs ci-dessous sont **extraites verbatim** de l'existant (`src/index.css`, `src/ui/*`, `AddSpotForm.tsx`) — aucune valeur de design inventée. UI-03 / ROBUST-01 / ROBUST-02.
>
> **Contexte contraignant (04-RESEARCH.md) :** le projet ne possède **aucun test automatisé** et impose une contrainte **zéro-régression stricte** sur le rendu visuel existant. Les composants activement migrés par cette phase (`AddSpotForm`, boutons favori) sont alignés sur le design system ci-dessous ; les autres composants maîtres non touchés (Modal, Header, Card, parties intactes d'AuthModal) restent verbatim.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | **custom** — design system propre au projet (construit en Phase 1, tokens `src/index.css` + composants maîtres `src/ui/*`). **shadcn non applicable** : pas de `components.json`, et l'introduire violerait la contrainte zéro-régression / no-rebranding du milestone (Out of Scope REQUIREMENTS.md). |
| Preset | not applicable |
| Component library | none — composants internes `src/ui/{Button,Input,Modal,Header,Card}.tsx` (Tailwind v4 + framer-motion, sans Radix/base-ui) |
| Icon library | `lucide-react` 0.556.0 (Heart, X, Save, Camera, Trash2, MapPin, Loader2) |
| Font | `--font-sans` = system-ui stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`) |

**Note gate shadcn :** `components.json` absent **par conception**. Le projet possède déjà un DS mature adopté écran par écran (Phases 1→3). Aucune initialisation shadcn demandée — registry safety gate **non applicable** (aucun registre tiers).

---

## Spacing Scale

Échelle Tailwind v4 (base 4px) telle qu'utilisée verbatim dans les formulaires existants.

| Token | Value | Usage (verbatim existant) |
|-------|-------|---------------------------|
| xs | 4px | gaps fins entre éléments |
| sm | 8px | `gap-2` pills de type, `space-y-2` (label→champ), `mb-2` labels, `p-2` bouton de suppression de photo (survol) |
| md | 12px | `gap-3` grille photos 3-col, `py-3` rung `Button size=md` — **hors set standard, exception justifiée ci-dessous** |
| lg | 16px | `p-4` intérieur des champs light + preview localisation, `py-4` submit (`Button size=lg`) |
| xl | 24px | `space-y-6` entre blocs de formulaire, `mb-6` en-tête, `p-6` sheet |
| 2xl | 32px | `p-8` panneau Modal glass/light-center |

Set 8-point de référence : **4, 8, 16, 24, 32, 48, 64**. Les valeurs qui en sortent sont listées et justifiées ci-dessous.

### Exceptions justifiées (décisions assumées, hors set standard)

Le projet n'a **aucun test automatisé** et impose une contrainte **zéro-régression** sur le rendu visuel existant (04-RESEARCH.md). Les valeurs ci-dessous sont extraites verbatim du code de production. Elles sortent du set 8-point mais sont **conservées et justifiées explicitement comme décisions développeur**, plutôt que modifiées au risque d'une régression visuelle observable et non détectable par des tests.

| Valeur hors-set | Où | Justification (décision assumée) |
|-----------------|-----|----------------------------------|
| **12px** (`md`, `gap-3` / `py-3`) | grille photos 3-col, padding vertical `Button size=md` | Échelon natif Tailwind v4 (`*-3`), présent verbatim dans le DS existant (Phases 1→3) et dans les formulaires. Le remonter à 8px ou 16px élargirait/rétrécirait boutons et grille photos = régression visuelle directe sur des écrans déjà livrés. **Conservé — décision zéro-régression assumée.** |
| **44px** (cible tactile) | boutons icône favori (coeur) et fermeture (`iconOnly`) | **Exigence WCAG 2.1 AA — cible tactile ≥44×44px** (cible QA-01 / D-10). `p-2` (8px) autour d'une icône 20px = 36px : ajouter le padding nécessaire pour atteindre 44px sur les boutons favori migrés. Non négociable pour l'accessibilité mobile ; prime volontairement sur l'alignement au set 8-point. |

Autres valeurs arbitraires conservées verbatim (dans le set ou multiples de 4, pas d'écart de contrat) :
- `min-h-[100px]` (100px, multiple de 4) sur la zone `<textarea>` description — conservé verbatim.
- **Bouton de suppression de photo** (survol, dans la grille) : passe de `p-1.5` (6px, hors set) à **`p-2` (8px)** — composant activement migré par cette phase, aligné sur le set 8-point. Le badge de suppression reste positionné en absolu sur la vignette ; l'écart de 2px est absorbé par le positionnement `absolute` sans décalage visible.

---

## Typography

Tailles et graisses extraites verbatim des formulaires. iOS impose `font-size: 16px` sur `input/textarea/select` (règle `src/index.css` L47-49) — **ne jamais descendre les champs sous 16px** (sinon zoom iOS au focus).

| Role | Size | Weight | Line Height | Usage verbatim |
|------|------|--------|-------------|----------------|
| Heading (titre form) | 24px (`text-2xl`) | 700 (`font-bold`) | 1.2 | `add.title`, `spot.edit_title` — `text-2xl font-bold text-slate-800` |
| Body / champ de saisie | 16px (`text-base`, forcé iOS) | 400 (`font-normal`) | 1.5 | valeur saisie dans input/textarea/select |
| Label de champ (surface light) | 14px (`text-sm`) | 400 (`font-normal`) | 1.5 | `block text-sm font-normal text-slate-700 mb-2` |
| Meta / label glass + pill | 12px (`text-xs`) | 700 (`font-bold`) | 1.5 | label glass `uppercase tracking-wider`, pills de type `text-xs font-bold`, compteur photos |

### Graisses déclarées — 2 graisses

- **regular 400** (`font-normal`) — corps / valeurs des champs de saisie **et** labels de champ sur surface light.
- **bold 700** (`font-bold`) — titres, boutons, pills, labels glass.

> Le contrat déclare **exactement 2 graisses** (400 + 700), conforme à la règle « 2 graisses max ». Les labels de champ light et la valeur de l'`input name` — qui étaient en `font-medium` (500) dans le code existant — sont **normalisés à `font-normal` (400)** dans le cadre de la migration de `AddSpotForm` vers le design system. Choix : `font-normal` (et non `font-bold`) pour les labels, car les labels sont volontairement dé-emphasés relativement aux valeurs et au titre ; la hiérarchie repose désormais sur la taille (14px label vs 16px valeur vs 24px titre) et sur la couleur (`slate-700` label vs `slate-800` titre), pas sur la graisse. Composants concernés activement migrés par cette phase — ajustement de graisse légitime, dans le périmètre.

---

## Color

Modèle 60/30/10 mappé sur les tokens sémantiques de `src/index.css` (aliasés à la palette Tailwind v4, byte-identiques).

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `slate-50` `#f8fafc` (`--color-background`) | Fond de page, surface des champs (`bg-slate-50`), preview localisation |
| Secondary (30%) | `white` + `slate-100/200` | Sheets/panneaux formulaires (`bg-white`), bordures de champ (`border-slate-100`), pills inactifs (`bg-white text-slate-400`), poignée de sheet (`bg-slate-200`) |
| Accent (10%) | `sky-500` `#00a6f4` (`--color-primary`) | **liste réservée ci-dessous** |
| Destructive | `rose-500` `#fb2c36` (`--color-accent`) | **liste réservée ci-dessous** |

Accent (`sky-500`) réservé à — **et à rien d'autre** :
- Bouton submit primaire du formulaire (`Button variant="primary"` / `bg-primary`).
- État **sélectionné** d'un pill de type de spot (`border-sky-500 bg-sky-50 text-sky-600`).
- Anneau/bordure de **focus** des champs (`focus:border-sky-500`, `focus:ring-primary`).
- Icône `MapPin` de la preview de localisation (`text-sky-500`).

Destructive (`rose-500`) réservé à — **et à rien d'autre** :
- Remplissage du coeur favori actif (`fill-rose-500 text-rose-500`).
- Bouton de suppression de photo dans la grille (`bg-rose-500 hover:bg-rose-600`).
- Actions admin destructrices (supprimer un spot — `Button variant="danger"`).
- Message d'erreur inline **sur surface light** : adapter la classe sombre `bg-red-500/20 text-red-200` d'`AuthModal` en variante claire `bg-red-50 border border-red-200 text-red-600` (extraction cohérente tokens, pas de sombre sur fond clair — voir RESEARCH Code Examples).

Interdits (anti-régression) : ne pas introduire de nouvelle couleur, ne pas utiliser l'accent pour « tous les éléments interactifs » (les pills inactifs, la poignée de sheet et les bordures neutres restent slate).

---

## Copywriting Contract

Toute chaîne passe par `useLanguage().t(key)` et **doit** être présente dans **`fr.json` ET `en.json`** (parité obligatoire — `t()` renvoie la clé brute si absente). Clés existantes réutilisées + nouvelles clés à créer.

| Element | Clé i18n | Copy (fr) | Copy (en) |
|---------|----------|-----------|-----------|
| Primary CTA (submit ajout) | `add.submit` (existant) | « Proposer le Spot » | "Submit Spot" |
| CTA en cours d'envoi | `add.sending` (existant) | « Envoi… » | "Sending…" |
| CTA submit (édition) | `spot.edit_save` (existant — **fr à mettre à jour**) | « Enregistrer les modifications » | "Save Changes" (déjà conforme) |
| Empty state favoris | `fav.empty` (existant) | « Aucun favori pour le moment. » | "No favorites yet." |
| Erreur — nom vide | `form.error.name_required` (NOUVEAU) | « Le nom du spot est obligatoire. » | "Spot name is required." |
| Erreur — nom trop long | `form.error.name_too_long` (NOUVEAU) | « Le nom est trop long (100 caractères max). » | "Name is too long (100 characters max)." |
| Erreur — description trop longue | `form.error.desc_too_long` (NOUVEAU) | « La description est trop longue (2000 caractères max). » | "Description is too long (2000 characters max)." |
| Erreur — aucun type (D-03) | `form.error.type_required` (NOUVEAU) | « Sélectionne au moins un type de spot. » | "Select at least one spot type." |
| Erreur — échec soumission (D-07) | `form.error.submit_failed` (NOUVEAU) | « Échec de l'envoi. Tes informations sont conservées, réessaie. » | "Submission failed. Your details are saved, try again." |
| Toast revert favori (D-08) | `fav.error.revert` (NOUVEAU) | « Échec, réessaie. » | "Failed, try again." |
| Confirmation « pas de photo » — titre (D-04) | `form.confirm.no_photo.title` (NOUVEAU) | « Publier sans photo ? » | "Publish without a photo?" |
| Confirmation « pas de photo » — corps (D-04) | `form.confirm.no_photo.body` (NOUVEAU) | « Une photo aide les autres riders à repérer le spot en un coup d'œil. Tu pourras en ajouter une plus tard en modifiant le spot. » | "A photo helps other riders spot it at a glance. You can add one later by editing the spot." |
| Confirmation — action « publier quand même » (D-04) | `form.confirm.no_photo.confirm` (NOUVEAU) | « Publier quand même » | "Publish anyway" |
| Confirmation — action « ajouter une photo » (D-04) | `form.confirm.no_photo.cancel` (NOUVEAU) | « Ajouter une photo » | "Add a photo" |
| aria-label favori (retirer) | `fav.remove` (NOUVEAU) | « Retirer des favoris » | "Remove from favorites" |
| aria-label favori (ajouter) | `fav.add` (NOUVEAU) | « Ajouter aux favoris » | "Add to favorites" |

**Correctif copywriting `spot.edit_save` :** le libellé fr existant est le verbe nu « Enregistrer » (équivalent du générique bloqué « Save »). Il est remplacé par le libellé **verbe + nom « Enregistrer les modifications »**. La version en.json (`"Save Changes"`) est déjà conforme et sert de référence de parité — le planner doit **mettre à jour `fr.json` L144** (`"spot.edit_save": "Enregistrer les modifications"`). Changement de copie assumé (amélioration de clarté, pas une régression fonctionnelle).

**Limites de longueur (D-02 — tranché) :** nom **max 100**, description **max 2000** (aligné CONCERNS.md, RESEARCH A1). Le planner peut ajuster à 50/500 si l'utilisateur le demande, sinon 100/2000 est le contrat.

Actions destructrices de cette phase :
- **Suppression de photo** (grille formulaire) : action immédiate au clic, réversible par re-upload — **pas** de confirmation (comportement existant conservé, zéro-régression).
- **Suppression de spot (admin, D-09)** : conserve la confirmation existante (`confirm()` → à migrer en feedback cohérent) ; le **feedback d'échec** passe du `alert()` natif au **toast Capacitor** (retirer aussi le préfixe `[DEBUG]` de `deleteSpot`).
- **Confirmation « pas de photo » (D-04)** : dialogue **doux, non bloquant** — 2 actions positives (« Publier quand même » / « Ajouter une photo »), ton encourageant, jamais culpabilisant. **Pas** un `confirm()` natif : utiliser le master `Modal surface="light" layout="center"`.

---

## Component Contract (inventaire de migration)

| Zone | Avant (natif) | Après (DS) | Décision |
|------|---------------|------------|----------|
| Champs texte nom/description | `<input>` / `<textarea>` inline | `Input surface="light"` (+ `multiline` pour desc) | D-01 — **étendre** `Input` (prop `surface: 'glass' \| 'light'`, défaut `glass` ; `multiline`, `maxLength`, `error`). Classes light extraites verbatim de `AddSpotForm` L206/L218. |
| Label de champ light | `<label class="text-sm font-medium text-slate-700">` | rendu par `Input surface="light"` en `text-sm font-normal text-slate-700` | La variante light **ne doit pas** rendre le label glass `uppercase text-white/70` (régression directe) — reproduire `text-sm text-slate-700 mb-2`, graisse normalisée à `font-normal` (contrat 2 graisses). |
| Pills type de spot | `<button>` toggle stylé | **restent des `<button>` stylés aux tokens** | D-01 / A4 — `Button` n'a pas de variante « pill sélectionnable » ; toggles de sélection ≠ actions. Conserver verbatim (`border-sky-500 bg-sky-50` actif / `border-slate-100 bg-white text-slate-400` inactif). |
| Difficulté | `<select>` natif (AddSpotForm) | harmoniser en **pills** comme SpotDetail/Admin | A5 — changement UI voulu par UI-03 (cohérence), pas une régression. À confirmer au planner. |
| Bouton submit | `<button>` + `Loader2` custom | `Button variant="primary" size="lg" loading` | UI-03 — `Button` gère déjà spinner + disabled. |
| Boutons favori (coeur) | `<button aria-label>` manuel | `Button iconOnly` + `aria-label` (D-10) | `App.tsx` (~L174-182) + `SpotDetail.tsx` (~L300-320). **Vérifier le rendu sur fond clair** : `variant="ghost"` = `bg-white/5` (pensé fond sombre) → adapter la classe hover claire via `className` (RESEARCH Code Examples). Respecter la cible tactile 44px. |
| Icône coeur NavBar | onglet navigation | **HORS PÉRIMÈTRE** (D-11) | Traité en Phase 2 / NAV-01 — ne pas toucher. |
| Enveloppe du formulaire d'ajout | shell `AnimatePresence` `max-w-lg` propre | **conservée telle quelle** (voir Résolution Q1) | Ne PAS migrer vers master `Modal light+sheet` (`max-w-sm`) → rétrécirait le form (Pitfall 1). |
| Dialogue confirmation « pas de photo » | néant / `confirm()` | **master `Modal surface="light" layout="center"`** (D-04) | Seul usage du master `Modal` requis dans cette phase — cohérence DS pour le dialogue. |

---

## Interaction & States Contract

**Feedback d'erreur — deux contextes, deux patterns (précédents codebase, aucune incohérence introduite) :**

| Contexte | Pattern | Où | Source |
|----------|---------|-----|--------|
| Échec **soumission de formulaire** (add/edit spot) | **inline** `{error && <div>}` — conserve les données saisies (D-07) | dans le formulaire ouvert, sous le submit | `AuthModal.tsx:149-153` (adapter classe claire) |
| Échec **action transitoire** (revert favori D-08, approve/delete admin) | **toast natif** `@capacitor/toast` — éphémère `duration:'short'` | hors formulaire | `SpotsContext.addSpot` (déjà en place) |

**États obligatoires par surface :**
- **Loading** : bouton submit → `Button loading` (spinner `Loader2` + disabled). Pas de bouton « Réessayer » (D-07) — relance via le submit normal.
- **Erreur validation** : message inline **avant** appel API (nom vide/trim, longueurs, ≥1 type) ; le champ concerné peut recevoir `error` (bordure/message sous le champ).
- **Erreur API** : inline (form) ou toast (favori/admin) ; **jamais** de crash ni d'état bloqué ; **données conservées** (D-07).
- **Optimistic + revert (favori D-08)** : MAJ visuelle immédiate → sur échec, revert de l'état **+ toast** `fav.error.revert`.
- **Confirmation douce (D-04)** : après validation OK, si 0 photo → `Modal light+center` non bloquant.

**Résolution des questions ouvertes (additional_context) :**

1. **`Modal` obligatoire sur `AddSpotForm` ?** → **NON.** UI-03 (« composants du design system : Input, Button, Modal ») est satisfait par la migration des **champs** (`Input`) et des **boutons** (`Button`) ; le formulaire conserve son shell `max-w-lg` propre (option (a) du Pitfall 1 = moindre risque de régression). Le master **`Modal` est bien utilisé dans la phase**, mais pour le **dialogue de confirmation « pas de photo » (D-04)** en `surface="light" layout="center"` — ce qui couvre le « Modal » de UI-03 sans rétrécir le formulaire. Si le verifier exige que l'enveloppe du form soit elle-même `Modal`, **fallback** : ajouter un prop de largeur (`max-w-lg`) au master `Modal` par extraction verbatim, **jamais** rétrécir en `max-w-sm`.

2. **Où déclencher le toast favori (D-08) pour rester i18n-cohérent ?** → **Depuis le composant**, pas depuis `FavoritesContext` (qui n'a pas accès à `t()` — Pitfall 4). Les handlers de toggle dans `App.tsx` et `SpotDetail.tsx` appellent `toggleFavorite` et, sur promesse rejetée, déclenchent `Toast.show({ text: t('fav.error.revert'), duration: 'short' })`. Alternative acceptable : passer le message déjà traduit au context. Interdit : coder la chaîne en dur en français dans le context (perpétue l'incohérence i18n existante). Clé `fav.error.revert` à ajouter dans `fr.json` **et** `en.json`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| — (aucun registre) | — | not applicable — aucun composant tiers ; DS 100% interne (`src/ui/*`), aucune installation npm dans cette phase (RESEARCH § Package Legitimacy Audit) |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
