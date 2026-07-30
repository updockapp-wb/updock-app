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

Échelle Tailwind v4 (base 4px) telle qu'utilisée verbatim dans les formulaires existants. Valeurs multiples de 4.

| Token | Value | Usage (verbatim existant) |
|-------|-------|---------------------------|
| xs | 4px | gaps fins, `p-1.5` boutons suppression photo (6px, exception ci-dessous) |
| sm | 8px | `gap-2` pills de type, `space-y-2` (label→champ), `mb-2` labels |
| md | 12px | `gap-3` grille photos 3-col, `py-3` rung `Button size=md` |
| lg | 16px | `p-4` intérieur des champs light + preview localisation, `py-4` submit (`Button size=lg`) |
| xl | 24px | `space-y-6` entre blocs de formulaire, `mb-6` en-tête, `p-6` sheet |
| 2xl | 32px | `p-8` panneau Modal glass/light-center |

Exceptions :
- **Cibles tactiles boutons icône (favori, fermeture) : min 44×44px** — les boutons `iconOnly` (coeur, X) doivent conserver une zone cliquable ≥44px même si l'icône fait 20px (accessibilité mobile, cible QA-01). `p-2` (8px) autour d'une icône 20px = 36px : ajouter le padding nécessaire pour atteindre 44px sur les boutons favori migrés (D-10).
- `p-1.5` (6px) sur le bouton de suppression de photo dans la grille : conservé verbatim (élément survol, non tactile-primaire) — ne pas « corriger ».
- `min-h-[100px]` sur la zone `<textarea>` description : conservé verbatim.

---

## Typography

Tailles et graisses extraites verbatim des formulaires. iOS impose `font-size: 16px` sur `input/textarea/select` (règle `src/index.css` L47-49) — **ne jamais descendre les champs sous 16px** (sinon zoom iOS au focus).

| Role | Size | Weight | Line Height | Usage verbatim |
|------|------|--------|-------------|----------------|
| Heading (titre form) | 24px (`text-2xl`) | 700 (`font-bold`) | 1.2 | `add.title`, `spot.edit_title` — `text-2xl font-bold text-slate-800` |
| Body / champ de saisie | 16px (`text-base`, forcé iOS) | 400 (`font-medium` sur `input` name = 500, voir exception) | 1.5 | valeur saisie dans input/textarea/select |
| Label de champ (surface light) | 14px (`text-sm`) | 500 (`font-medium`) | 1.5 | `block text-sm font-medium text-slate-700 mb-2` |
| Meta / label glass + pill | 12px (`text-xs`) | 700 (`font-bold`) | 1.5 | label glass `uppercase tracking-wider`, pills de type `text-xs font-bold`, compteur photos |

Graisses déclarées (2 dominantes) : **regular 400** (corps/valeurs), **bold 700** (titres, boutons, pills, labels glass).
Exception documentée : **medium 500** (`font-medium`) — réservé aux **labels de champ sur surface light** et à la valeur de l'`input name`. Préservé verbatim (zéro-régression) ; ne pas convertir en 400 ou 700.

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

Toute chaîne passe par `useLanguage().t(key)` et **doit** être ajoutée dans **`fr.json` ET `en.json`** (parité obligatoire — `t()` renvoie la clé brute si absente). Clés existantes réutilisées + nouvelles clés à créer.

| Element | Clé i18n | Copy (fr) |
|---------|----------|-----------|
| Primary CTA (submit ajout) | `add.submit` (existant) | « Proposer le Spot » |
| CTA en cours d'envoi | `add.sending` (existant) | « Envoi… » |
| CTA submit (édition) | `spot.edit_save` (existant) | « Enregistrer » |
| Empty state favoris | `fav.empty` (existant) | « Aucun favori pour le moment. » |
| Erreur — nom vide | `form.error.name_required` (NOUVEAU) | « Le nom du spot est obligatoire. » |
| Erreur — nom trop long | `form.error.name_too_long` (NOUVEAU) | « Le nom est trop long (100 caractères max). » |
| Erreur — description trop longue | `form.error.desc_too_long` (NOUVEAU) | « La description est trop longue (2000 caractères max). » |
| Erreur — aucun type (D-03) | `form.error.type_required` (NOUVEAU) | « Sélectionne au moins un type de spot. » |
| Erreur — échec soumission (D-07) | `form.error.submit_failed` (NOUVEAU) | « Échec de l'envoi. Tes informations sont conservées, réessaie. » |
| Toast revert favori (D-08) | `fav.error.revert` (NOUVEAU) | « Échec, réessaie. » |
| Confirmation « pas de photo » — titre (D-04) | `form.confirm.no_photo.title` (NOUVEAU) | « Publier sans photo ? » |
| Confirmation « pas de photo » — corps (D-04) | `form.confirm.no_photo.body` (NOUVEAU) | « Une photo aide les autres riders à repérer le spot en un coup d'œil. Tu pourras en ajouter une plus tard en modifiant le spot. » |
| Confirmation — action « publier quand même » (D-04) | `form.confirm.no_photo.confirm` (NOUVEAU) | « Publier quand même » |
| Confirmation — action « ajouter une photo » (D-04) | `form.confirm.no_photo.cancel` (NOUVEAU) | « Ajouter une photo » |
| aria-label favori (retirer) | `fav.remove` (NOUVEAU) | « Retirer des favoris » |
| aria-label favori (ajouter) | `fav.add` (NOUVEAU) | « Ajouter aux favoris » |

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
| Label de champ light | `<label class="text-sm font-medium text-slate-700">` | rendu par `Input surface="light"` | La variante light **ne doit pas** rendre le label glass `uppercase text-white/70` (régression directe) — reproduire `text-sm font-medium text-slate-700`. |
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
