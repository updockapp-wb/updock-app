---
phase: 3
slug: fiches-d-taill-es-profils
status: draft
shadcn_initialized: false
preset: none
created: 2026-07-30
---

# Phase 3 — Contrat de Design UI

> Contrat visuel et d'interaction pour l'harmonisation des fiches détaillées et des profils.
> Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.
>
> **Nature de la phase : refactor interne d'HARMONISATION — aucune création d'UI.**
> Contrainte cardinale héritée des Phases 1/2 : tout wiring de token et toute migration de
> composant doit être prouvé **byte-identique** au rendu existant. Ce contrat décrit
> l'apparence **déjà en place** ; il sert de garde-fou anti-régression, pas de nouvelle
> direction visuelle. **Aucune valeur ci-dessous ne doit modifier le rendu observable par
> l'utilisateur** — la seule exception explicitement autorisée est l'ajout d'un
> `aria-label` (a11y, zéro effet visuel, § Écarts assumés).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (système de tokens custom, établi Phase 1 — voir note gate) |
| Preset | not applicable |
| Component library | none (composants maîtres maison dans `src/ui/*`) |
| Icon library | `lucide-react` ^0.556.0 |
| Font | stack `system-ui` (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`) — source `src/index.css` `--font-sans` |
| Animation | `framer-motion` ^12.23.25 (`AnimatePresence`, `layoutId`, `motion.img`) |
| Gestuelle bottom-sheet | `vaul` ^1.1.2 (SpotDetail uniquement — **gelé**, D-01) |

**Note shadcn gate — non déclenché à raison, pas par omission :** `components.json` est
absent, mais un design system existe déjà (`src/index.css` `@theme` + `src/ui/{Button,Card,
Input,Modal,Header}.tsx`, Phase 1, étendu Phase 2). `REQUIREMENTS.md` § Out of Scope
interdit explicitement « Nouvelle direction visuelle / rebranding » et « Migration de
framework / réécriture majeure ». Initialiser shadcn serait un scope creep hors périmètre.
Même résolution qu'en Phase 2 (`02-UI-SPEC.md`).

**Composants maîtres disponibles (état à l'entrée de cette phase) :**

| Composant | Formes/variantes exposées | Chaîne rendue |
|-----------|---------------------------|---------------|
| `Card` | `light` (défaut), `glass`, `interactive` | light : `bg-white p-4 rounded-2xl border border-slate-100 shadow-sm` |
| `Button` | `primary` / `secondary` / `ghost` / `danger` × `sm`/`md`/`lg` × `iconOnly` × `loading` | secondary : `bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-2xl transition-all` + `py-4` (lg) + base `flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none` |
| `Header` | titre empilé (+`subtitle`), rangée-avec-close ; `surface: glass \| light` | light empilé : `<h2 class="text-2xl font-bold text-text mb-2">` |
| `Modal` | `glass`+`center` (défaut), `light`+`sheet` — **`light`+`center` À AJOUTER cette phase** | voir § Contrat du nouveau composant |
| `Input` | glass-only | **inutilisable sur surface claire cette phase** — variante `light` = Phase 4 (UI-03) |

---

## Contrat de périmètre — override documenté UI-01 / UI-02

**À lire avant toute planification.** Le libellé littéral de UI-01/UI-02 (« utilise
exclusivement les composants du design system ») est **inatteignable sans régression
visuelle** sur cette base de code : l'inventaire exhaustif de `03-RESEARCH.md` (comparaison
caractère par caractère des chaînes de classes contre les 5 masters) ne relève que
**7 sites byte-identiques**. `SpotDetail.tsx` et `CommunityStatsScreen.tsx` n'ont contribué
**aucune** ancre à `src/ui/*` — leurs formes n'existent tout simplement pas dans le DS.

**Critère atteignable qui remplace le libellé littéral** (précédent : override documenté de
DS-01 en `01-VERIFICATION.md`, tracé dans `REQUIREMENTS.md` § Traceability) :

> UI-01/UI-02 sont satisfaits lorsque, sur les 4 fichiers du périmètre :
> 1. **tout markup ayant un équivalent byte-identique dans `src/ui/*` a été migré** — les
>    7 sites énumérés au § Inventaire des migrations structurelles, ni plus ni moins ;
> 2. **toute couleur / tout rayon ayant une correspondance 1:1 avec un token a été câblé** —
>    les occurrences énumérées au § Contrat de wiring de tokens ;
> 3. **le markup restant n'a aucun équivalent DS** et le migrer relèverait de l'invention
>    visuelle (donc du rebranding, interdit) — il reste custom, avec ses tokens câblés là
>    où c'est possible.

**Interdits explicites :** forcer une migration non byte-identique pour gonfler le score ;
inventer un variant DS pour faire matcher une forme existante ; rétrécir silencieusement le
critère sans le documenter. L'inventaire de `03-RESEARCH.md` sert de **preuve
d'exhaustivité** à joindre à la vérification.

---

## Hiérarchie visuelle (point focal)

**Fiche détail spot (`SpotDetail`)** — point focal : le **nom du spot + son badge de type**,
en haut du bottom-sheet, visible dès le snap 0.35. C'est la cible de l'animation d'élément
partagé (`layoutId`) qui morphe depuis la carte de `NearbySpotsList` : la continuité
visuelle liste → fiche EST la hiérarchie. Le CTA « Naviguer » (dégradé sky→blue) est le
second niveau ; la vignette photo, les cartes stats et les onglets sont du contenu tertiaire
sous la ligne de flottaison.

**Écran Profil (`Profile`)** — point focal : le **bloc identité** (avatar 96×96 cerclé du
dégradé sky→blue + nom en `text-2xl font-bold`). La grille de stats (2 `Card`) est le second
niveau ; les rangées de réglages et le bouton Log Out sont du chrome de bas de page
(`mt-auto`).

**`CommunityStatsScreen`** — point focal : les **2 KPI** (`text-2xl font-black`) en haut,
sous l'app bar. La liste des pays est du contenu de parcours.

**`PremiumModal`** — point focal : le **badge Sparkles 64×64 en dégradé**, puis le titre.
Composition strictement centrée (`flex flex-col items-center text-center`).

> Aucun de ces points focaux ne change dans cette phase. Ils sont énoncés pour que le
> checker et l'auditeur puissent vérifier qu'une migration ne les a pas déplacés.

---

## Spacing Scale

Échelle réellement rendue dans les 4 fichiers du périmètre (relevé exhaustif). Multiples de 4 :

| Token | Value | Usage constaté |
|-------|-------|----------------|
| xs | 4px | `gap-1`, `mb-1`, `mt-1`, `p-1` (anneau avatar Profil) |
| sm | 8px | `p-2` (boutons icône), `gap-2`, `py-2`, `mb-2`, `mt-2` |
| md | 16px | `p-4` (padding `Card` + rangées de réglages, **19 occurrences — le pas dominant**), `px-4`, `gap-4`, `mb-4`, `py-4` (Log Out), `pb-4` |
| lg | 24px | `p-6` (padding de page Profil, wrapper `PremiumModal`), `px-6`, `mb-6` (11 occ.), `mt-6`, `space-y-6` |
| xl | 32px | `p-8` (panneau `PremiumModal`), `mb-8` (5 occ.), `mt-8`, `pb-8` |
| 2xl | 48px | `py-12` (padding vertical des états vides) |

**Exceptions présentes dans l'existant — à PRÉSERVER, ne pas « corriger »** (toute
normalisation = régression visuelle interdite) :

- **12px** (`p-3`, `px-3`, `py-3`, `gap-3`, `mb-3`, `mt-3`) — écart icône/label des rangées
  de réglages et des lignes de session. Même statut d'exception legacy qu'en Phase 2.
- **2px** (`py-0.5`, `gap-0.5`, `mt-0.5`) et **6px** (`px-1.5`, `gap-1.5`, `py-1.5`) —
  micro-écarts des badges et compteurs.
- **14px** (`py-3.5`) — **uniquement** le CTA de `PremiumModal`. Hors de l'échelle
  `Button` (`sm`/`md`/`lg` = `py-2`/`py-3`/`py-4`) : c'est **la** raison pour laquelle ce
  CTA ne migre PAS vers `src/ui/Button` (§ Inventaire).
- **20px** (`space-y-5`).

**Cibles tactiles (constatées, inchangées) :**

| Élément | Taille | Note |
|---------|--------|------|
| Icon-buttons du header `SpotDetail` (Partager / Favori / Fermer / Modifier) | `w-10 h-10` = **40px** | Sous le seuil confort 44px — **signalé, non modifié** (contrainte byte-identique + D-02). Identique au constat Phase 2 sur le bouton filtre. |
| Bouton close `PremiumModal` | `p-2` + icône 20px ≈ **36px** | idem — préservé tel quel |
| Badge appareil photo (Profil) | `p-2` + icône 14px ≈ **30px** | idem |
| Badge Sparkles `PremiumModal` | `w-16 h-16` = 64px | décoratif, non interactif |
| Avatar Profil | `w-24 h-24` = 96px | conteneur, le bouton actif est le badge photo |

---

## Typography

Rôles réellement rendus dans les 4 fichiers. Couple canonique **400 (corps) + 700 (titres/
emphase)**, identique à la Phase 2 :

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label / caption | 12px (`text-xs`) | 700 bold (labels majuscules de stats) / 400 | 1.5 (héritée `:root`) |
| Body / label courant | 14px (`text-sm`) | 400 regular (→ 700 en emphase) | 1.5 |
| Body large / input | 16px (`text-base`) | 400 regular | 1.5 |
| Heading | 24px (`text-2xl`) | 700 bold | 1.2 |

**Poids canoniques : 400 + 700 uniquement.** Aucun nouvel élément ne doit introduire
d'autre poids.

**Contrainte iOS (existante, `src/index.css:47-49`) :** `input, textarea, select
{ font-size: 16px }` — anti-zoom au focus. Ne jamais descendre sous 16px sur un champ.

### Exceptions typographiques legacy (héritées, à PRÉSERVER — non propageables)

Isolées ici au même titre que l'exception 12px du Spacing. Présentes uniquement pour ne pas
régresser l'existant ; **aucun nouvel élément ne doit les réutiliser** :

- **10px** (`text-[10px] font-bold uppercase tracking-wider`) — badge de type de spot
  (`SpotDetail:230`) et labels des cartes stats (`SpotDetail:379,384`). Valeur arbitraire
  hors échelle Tailwind.
- **18px** (`text-lg font-bold`) — titre `<h1>` de l'app bar `CommunityStatsScreen:97`.
  C'est l'une des deux raisons pour lesquelles cette app bar ne peut PAS devenir un
  `src/ui/Header` (qui rend `text-2xl` sur un `<h2>`).
- **30px** (`text-3xl font-bold`) — note moyenne du bloc Avis (`SpotDetail:453`).
- **500 medium** (`font-medium`, 17 occurrences) — libellés des rangées de réglages du
  Profil. Hors couple canonique 400/700 ; exception legacy assumée.
- **900 black** (`font-black`, 4 occurrences) — chiffres des KPI/stats
  (`Profile:267,271`, `CommunityStatsScreen:114,120`), toujours en `text-2xl`. Ce poids vit
  **dans le contenu** des `Card` migrées, jamais dans le master : `Card` ne rend aucun texte.
- **20px** (`text-xl`) — `Profile:84` (titre de la branche anonyme) et `SpotDetail:535`
  (titre de l'overlay d'édition, **hors périmètre**).

---

## Color

Répartition 60/30/10 sur les surfaces de cette phase. Tokens sémantiques de
`src/index.css` `@theme`, aliasés aux vars de la palette Tailwind v4 (donc garantis
byte-identiques aux littéraux qu'ils remplacent) :

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--color-background` = slate-50 (`#f8fafc`) + surfaces blanches (`bg-white`) | Fond de page Profil (`Profile:156`), fond plein écran `CommunityStatsScreen:88`, fonds des `Card`/rangées/panneau `PremiumModal`, cartes stats `SpotDetail` (`bg-slate-50`) |
| Secondary (30%) | `--color-text` = slate-800, `--color-muted` = slate-500, `--color-secondary` = slate-900 + gris hors token (slate-100/200/300/400/600/700) | Texte et bordures : titres (`text-text`), texte secondaire (`text-muted`), CTA sombre de `PremiumModal` (`bg-secondary`), backdrop du modal (`bg-secondary/40`), bordures `border-slate-100` |
| Accent (10%) | `--color-primary` = sky-500 (v4 ≈ `#00a6f4`) + dégradés sky→blue hors token | Voir liste réservée ci-dessous |
| Highlight secondaire | `--color-accent` = rose-500 (`#f43f5e`) | Voir note ci-dessous — **pas un usage destructif dans cette phase** |

**Accent (sky) réservé strictement à :**

- Icônes des rangées de réglages du Profil (`text-sky-500` — `Profile:292,315,329,357,383`)
  et icônes de métadonnée de `SpotDetail` (`SpotDetail:263,378`).
- Anneau dégradé de l'avatar Profil (`from-sky-400 to-blue-600`) et badge appareil photo
  (`text-sky-500`).
- CTA « Naviguer » de `SpotDetail` (dégradé `from-sky-500 to-blue-600`) — **dégradé, hors
  token, à préserver littéralement**.
- Badge Sparkles de `PremiumModal` (dégradé `from-sky-400 to-blue-500`).
- Bouton « Enregistrer » du nom d'affichage (`bg-sky-500`) et focus du champ
  (`focus:border-sky-500`).
- Piste **active** du switch de notifications (`bg-sky-500`).
- Spinners de chargement (`border-sky-500` — `Profile:374`, `CommunityStatsScreen:104`).
- Variant `primary` du `Button` maître.

> **Ne jamais** étendre l'accent à « tous les éléments interactifs ». Au repos, les éléments
> interactifs sont slate (secondary/muted) ; sky signale l'état actif/primaire.

**Note sur `--color-accent` (rose-500) — divergence assumée avec le template :** dans le
périmètre de cette phase, rose n'est **pas** une couleur destructive. Ses 2 seules
occurrences sont des **highlights d'état** : cœur favori actif (`fill-rose-500
text-rose-500`, `SpotDetail:298`) et icône de la rangée « Devenir Premium »
(`Profile:408`). Le seul consommateur destructif du token est le variant `danger` du
`Button` (`AdminDashboard`, **hors périmètre**). **Aucune action destructive de cette phase
n'utilise de couleur destructive** — voir § Copywriting.

**Couleurs hors token — rester littérales** (aucune correspondance 1:1 ; précédent Pitfall 5
de la Phase 2) : `slate-100/200/300/400/600/700`, `border-slate-50/100/200`,
`sky-50/100/400/600/700`, `hover:bg-sky-400`, `from-sky-500 to-blue-600`,
`from-sky-400 to-blue-500/600`, `shadow-sky-500/25`, `shadow-sky-200`,
`shadow-blue-500/30`, `emerald-500/600`, `amber-400/100/700`, `teal-500/100/700`,
`pink-100/700`, `bg-black/60`, `bg-black/95`, `bg-white/70`, `white/10`, `white/20`.

> ⛔ **Interdit :** wirer `border-slate-100` → `bg-background`/`--color-background`.
> slate-100 ≠ slate-50 : nuances distinctes (précédent explicite `01-VERIFICATION.md`).

---

## Copywriting Contract

**Cette phase ne crée AUCUNE nouvelle copy.** Tout le texte user-facing est en français,
servi via `LanguageContext` (`useLanguage` / `t()`), fichiers `src/translations/{fr,en}.json`.
La table est un **inventaire des clés en jeu**, à préserver à l'identique.

| Element | Copy |
|---------|------|
| Primary CTA (PremiumModal) | `t('premium.btn')` — « Me prévenir » (bouton `bg-secondary`, `py-3.5`) |
| Primary CTA (SpotDetail) | « Naviguer » (CTA dégradé) |
| CTA secondaire (Profil) | « Log Out » — **libellé codé en dur, non i18n** : préservé tel quel, ne pas franciser (hors scope, risque de régression sur une string non traduite) |
| Titre premium | `t('premium.title')` — « Bientôt Disponible » → migre dans `<Header surface="light" title={…} />` |
| Description premium | `t('premium.desc')` — « Nous travaillons dur pour vous apporter des fonctionnalités exclusives comme les cartes hors-ligne et les vidéos de spots. Stay tuned! » → reste un `<p>` custom (la prop `subtitle` de `Header` ajouterait `text-sm` et retirerait `leading-relaxed`) |
| Titre stats communauté | `t('community_stats.title')` — « La communaute » |
| Labels KPI | `t('community_stats.total_spots')` « Spots publies », `t('community_stats.total_users')` « Riders inscrits » |
| Labels stats Profil | « Spots Added », « Favorites » — **codés en dur, non i18n** : préservés tels quels |
| Rangées de réglages | `t('profile.settings')`, `t('profile.language')`, `t('profile.notifications')`, `t('profile.go_premium')` « Devenir Premium », `t('profile.admin_dashboard')` « Tableau de Bord Admin » |
| Empty state (Avis) | `t('review.no_reviews')` — « Aucun avis pour le moment. Soyez le premier ! » — **existant, inchangé** |
| Empty state (Sessions) | `t('session.no_sessions')` — « Aucune session prévue. Soyez le premier ! » — **existant, inchangé** |
| Empty state (Profil anonyme) | Branche `!user` de `Profile` (retour anticipé L71) — titre `text-xl` + CTA « Sign In / Join ». **Inchangée** |
| Error state | **Aucun nouveau flux d'erreur créé.** Les messages existants (`session.join_error`, `session.leave_error`, `session.cancel_error`, `session.create_error`, `session.past_date_error`) restent inchangés. La gestion d'erreur robuste (loading / erreur / retry) est le périmètre de **Phase 4 (ROBUST-01/02)**, explicitement différée. |
| Destructive confirmation — Log Out | **Aucune confirmation aujourd'hui** (`Profile:429` → `signOut()` direct). ⛔ **NE PAS EN AJOUTER** : ce serait un changement de comportement, interdit par la contrainte zéro-régression. Signalé comme dette UX, pas traité ici. |
| Destructive confirmation — Supprimer un avis | `t('review.confirm_delete')` — « Supprimer votre avis ? » (vit dans `ReviewList.tsx`, **touché uniquement pour `loading="lazy"`**, aucun changement visuel) |
| Destructive confirmation — Annuler une session | `t('session.cancel_confirm')` « Annuler cette session ? » + `t('session.cancel_confirm_yes')` « Oui, annuler » / `t('session.cancel_confirm_no')` « Garder » (vit dans `SessionCard.tsx`, même statut) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | aucun (pas de shadcn dans ce projet) | not applicable |
| tiers | aucun | not applicable |

Aucun registre déclaré, aucun bloc tiers, **aucun package installé cette phase**
(`03-RESEARCH.md` § Package Legitimacy Audit : pas de cible). Composants exclusivement
maison (`src/ui/*`) + `lucide-react`, `framer-motion`, `vaul` — toutes dépendances déjà
présentes et vérifiées dans `package.json`. Gate de vetting : sans objet.

---

## Contrat du nouveau composant — `Modal surface="light" layout="center"`

**Prérequis bloquant de la migration `PremiumModal` (D-05).** À livrer **avant** toute
migration du consommateur (miroir exact du Pitfall 1 de la Phase 2).

**Origine des classes :** extraites **verbatim** de `PremiumModal.tsx:16-30`. Aucune valeur
n'est inventée. Le master actuel n'expose que `glass`+`center` et `light`+`sheet`, et son
dispatch (`Modal.tsx:30`, `surface === 'light' || layout === 'sheet'`) **route
`surface="light"` seul vers le bottom-sheet** avec un dev-warning : brancher `PremiumModal`
sans cette 3ᵉ forme produit une régression majeure garantie.

### Spécification exacte

| Couche | Élément | Classes / valeurs |
|--------|---------|-------------------|
| Wrapper | `<div>` | `fixed inset-0 z-[5000] flex items-center justify-center p-6` |
| Backdrop | `<motion.div>` **animé**, `onClick={onClose}` | `absolute inset-0 bg-slate-900/40 backdrop-blur-sm` |
| Panneau | `<motion.div>` | `relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl overflow-hidden` |
| Contenu | `{children}` | aucun close intégré (voir ci-dessous) |

| Dimension | Valeur résolue |
|-----------|----------------|
| Padding wrapper | 24px (`p-6`) |
| Largeur max panneau | 384px (`max-w-sm` = 24rem) |
| Padding panneau | 32px (`p-8`) |
| Rayon panneau | 24px (`rounded-3xl`) |
| z-index | 5000 |
| Ombre | `shadow-2xl` |

| Animation | initial | animate | exit |
|-----------|---------|---------|------|
| Backdrop | `{ opacity: 0 }` | `{ opacity: 1 }` | `{ opacity: 0 }` |
| Panneau | `{ scale: 0.95, opacity: 0, y: 20 }` | `{ scale: 1, opacity: 1, y: 0 }` | `{ scale: 0.95, opacity: 0, y: 20 }` |

> Aucune prop `transition` n'est spécifiée : conserver la transition par défaut de
> `framer-motion`, exactement comme aujourd'hui. Le tout est enveloppé dans
> `<AnimatePresence>{isOpen && …}</AnimatePresence>`, comme les 2 formes existantes.

**Pas de bouton close intégré.** Le close de `PremiumModal` est un bouton **flottant
absolu** dans le contenu ; il s'appuie sur le `relative` porté par le panneau (présent dans
la spec ci-dessus). Précédent : la forme `light`+`sheet` n'a pas non plus de close intégré
(celui de `FiltersModal` vit dans `<Header onClose>`).

### Différences entre les 3 formes — load-bearing, à NE PAS « harmoniser »

| Aspect | `glass` + `center` | `light` + `sheet` | **`light` + `center` (nouveau)** |
|--------|--------------------|-------------------|----------------------------------|
| Padding wrapper | `p-4` | — (`items-end sm:items-center`) | **`p-6`** |
| Backdrop | classes statiques sur le wrapper, `bg-black/60 backdrop-blur-md` | enfant statique `bg-black/20 backdrop-blur-sm` | **enfant `motion.div` animé en fondu, `bg-slate-900/40 backdrop-blur-sm`** |
| Panneau | `bg-white/10 backdrop-blur-xl border border-white/20 rounded-4xl p-8` | `bg-white … rounded-t-3xl p-6` | **`bg-white rounded-3xl p-8`** |
| Animation | `scale` seul | `y: 100%` | **`scale` + `y: 20`** |
| z-index | `z-[5000]` | `z-[3000]` | **`z-[5000]`** |
| Close intégré | oui (`<Button ghost iconOnly>`) | non | **non** |

### Contraintes d'implémentation

- **Rétro-compatibilité : les 2 formes existantes restent strictement inchangées.** La paire
  `glass`+`sheet` reste non supportée (conserver le dev-warning pour ce cas).
- **Risque de régression nul, vérifié :** les seuls consommateurs de `Modal` sont
  `AuthModal` (défauts glass/center) et `FiltersModal` (light/sheet explicite). Aucun ne
  passe `light`+`center` → la nouvelle branche leur est inatteignable.
  À re-confirmer en Wave 0 : `grep -rn "from '../ui/" src/`.
- **Wiring de token dans le master (optionnel, à prouver avant commit) :**
  `bg-slate-900/40` → `bg-secondary/40` est byte-identique (Tailwind v4 compile le
  modificateur d'opacité en `color-mix(in oklab, var(--color-secondary) 40%, transparent)`
  et `--color-secondary: var(--color-slate-900)`). **Prouver en CSS compilé** (méthodo
  `01-VERIFICATION.md`) avant de committer, sinon garder le littéral.

---

## Inventaire des migrations structurelles — les 7 sites (exhaustif)

**Ce sont les SEULS remplacements de markup autorisés dans cette phase.** Toute migration
non listée ici est non byte-identique donc interdite.

| # | Site | Composant cible | Preuve byte-identique |
|---|------|-----------------|------------------------|
| 1 | `Profile.tsx:265` (KPI « Spots Added ») | `<Card>` | chaîne actuelle = `bg-white p-4 rounded-2xl border border-slate-100 shadow-sm` = sortie exacte de `Card` light |
| 2 | `Profile.tsx:269` (KPI « Favorites ») | `<Card>` | idem |
| 3 | `CommunityStatsScreen.tsx:110` (KPI spots) | `<Card>` | idem |
| 4 | `CommunityStatsScreen.tsx:116` (KPI users) | `<Card>` | idem |
| 5 | `Profile.tsx:429-435` (Log Out) | `<Button variant="secondary" size="lg" className="w-full mb-8">` | le variant `secondary` a été extrait de **cette ligne même** en Phase 1 (`Button.tsx:23-24`). `Button` fournit déjà `flex items-center justify-center gap-2` + `py-4` ; seuls `w-full mb-8` passent par `className` |
| 6 | `PremiumModal.tsx:43` (titre) | `<Header surface="light" title={t('premium.title')} />` | `text-2xl font-bold text-slate-800 mb-2` = sortie exacte de la forme empilée light. ⚠️ **ne PAS passer `onClose`** (basculerait sur la forme rangée-avec-close) |
| 7 | `PremiumModal.tsx:14-59` (coque) | `<Modal surface="light" layout="center">` | après l'extension ci-dessus, classes verbatim |

### Non-migrations — motifs (à ne pas re-litiger)

| Site | Pourquoi il reste custom |
|------|--------------------------|
| `SpotDetail:377,382` cartes stats | `bg-slate-50` ≠ `bg-white` **et** `shadow-sm` absent → `Card` ajouterait une ombre et changerait le fond |
| `SpotDetail:452` résumé note | `shadow-sm` absent |
| `Profile:311,325` / `CommunityStats:130` rangées | `rounded-3xl`/`rounded-xl` ≠ `rounded-2xl`, pas de `p-4`, pas de `shadow-sm` — **et** `Card` n'expose pas `onClick` (rangées cliquables) |
| `SpotDetail:224-229` titre du spot | **DOUBLE BLOCAGE** : `text-slate-900` ≠ `text-text` (slate-800) **et** `layoutId={spot-name-${spot.id}}` partagé avec `NearbySpotsList.tsx:63` → migrer casse l'animation d'élément partagé. `Header` rend un `<h2>` DOM nu, sans prop pour transmettre `layoutId` |
| `CommunityStatsScreen:90-98` app bar | `<h1>` + `text-lg` + flèche **à gauche** : aucune des 2 formes de `Header` ne correspond |
| `Profile:199` nom utilisateur | `Header` ajouterait `mb-2` → décalerait le `<p>` email de 8px |
| `PremiumModal:45` description | `subtitle` de `Header` rend `text-muted text-sm mb-8` : ajoute `text-sm`, retire `leading-relaxed` |
| `PremiumModal:49-54` CTA | `py-3.5` hors échelle `Button` **et** `bg-slate-900` sans variant correspondant (précédent A4 Phase 2) |
| `PremiumModal:31-36` close | `ghost` = `bg-white/5 hover:bg-white/10` (surface glass) ≠ `bg-slate-100` |
| `SpotDetail:318-324` CTA Naviguer | dégradé, aucun variant (précédent Pitfall 5 Phase 2) |
| `SpotDetail:275-311` icon-buttons header | **exclus par D-02** |
| `SpotDetail` onglets Info/Avis/Sessions | **exclus par D-03** — pas de composant Tabs au DS (= DS-04, hors v2.0) |
| `SpotDetail` carrousel/lightbox | **exclu par D-03** — viewer plein écran sans équivalent DS |
| `SpotDetail` coque `vaul` | **exclue par D-01** — drag-to-dismiss |
| `Profile:225-236` champ nom | `src/ui/Input` est **glass-only** (fond sombre, texte blanc, `focus:ring`) : incompatible avec la surface claire. Variante `light` d'`Input` = **Phase 4 (UI-03)** |

---

## Contrat de wiring de tokens

Correspondances 1:1 **prouvées par valeur** (les tokens sont aliasés aux vars de la palette
Tailwind v4 dans `src/index.css` `@theme`, donc byte-identiques par construction).

**Protocole de preuve obligatoire par wiring** (méthodo `01-VERIFICATION.md`) :

```bash
npm run build
grep -oE "\.(text-slate-800|text-text)\{[^}]*\}" dist/assets/*.css
# Attendu : chaîne var() différente, valeur oklch() IDENTIQUE.
# Puis getComputedStyle sur l'élément, avant/après.
```

| Fichier | Wiring | Occurrences (lignes) |
|---------|--------|----------------------|
| `SpotDetail.tsx` | `text-sky-500` → `text-primary` | 263, 378 |
| | `text-slate-800` → `text-text` | 380, 385, 391, 440 |
| | `text-slate-500` → `text-muted` | 238, 252, 486, 512 |
| | `bg-slate-50` → `bg-background` | 377, 382, 441, 486, 512 |
| | `fill-rose-500 text-rose-500` → `fill-accent text-accent` | 298 |
| | `rounded-[24px]` → `rounded-3xl` ✅ | 218, 741 |
| | `rounded-t-[32px]` → `rounded-t-4xl` ✅ | 763 (`Drawer.Content` — **autorisé**, voir note) |
| `Profile.tsx` | `text-sky-500` → `text-primary` | 80, 127, 178, 292, 315, 329, 357, 383 |
| | `bg-sky-500` → `bg-primary` | 96, 244, 391 |
| | `focus:border-sky-500` → `focus:border-primary` | 233 |
| | `border-sky-500` → `border-primary` | 374 (spinner) |
| | `text-slate-800` → `text-text` | 84, 199, 267, 271, 278, 294 |
| | `text-slate-500` → `text-muted` | 89, 225, 366 |
| | `bg-slate-50` → `bg-background` | 76, 157, 233, 255 |
| | `hover:bg-slate-50` → `hover:bg-background` | 104, 125, 311, 327, 354, 405, 417 |
| | `text-rose-500` → `text-accent` | 408 |
| `CommunityStatsScreen.tsx` | `bg-slate-50` → `bg-background` ✅ | 88 (fond plein écran — usage sémantiquement parfait) |
| | `text-slate-800` → `text-text` | 97, 114, 120, 127 |
| | `hover:text-slate-800` → `hover:text-text` | 93 |
| | `text-slate-500` → `text-muted` | 139 |
| | `border-sky-500` → `border-primary` | 104 (spinner) |
| `PremiumModal.tsx` | `text-slate-800` → absorbé par `<Header>` | 43 |
| | `text-slate-500` → `text-muted` | 33, 45 |
| | `bg-slate-900` → `bg-secondary` | 51 (CTA) |
| | `bg-slate-900/40` → `bg-secondary/40` | 22 (backdrop — **migre dans le master `Modal`**) |

**Gain « valeur arbitraire » gratuit (sert DS-01 directement) :** `rounded-[24px]` →
`rounded-3xl` est byte-identique (`--radius-3xl: 1.5rem` = 24px, défaut Tailwind v4) ; idem
`rounded-t-[32px]` → `rounded-t-4xl` (`--radius-4xl: 2rem`, présent dans les défauts v4 et
redéclaré à l'identique dans `src/index.css:21`).

> **Note `Drawer.Content` (`SpotDetail:763`) :** le wiring du rayon y est **autorisé**.
> D-01 gèle la **structure et le comportement** de la coque `vaul`, pas ses chaînes de
> classes ; changer un rayon n'affecte aucune gestuelle.

⚠️ **`text-slate-900` → `text-secondary` : NON câblé (choix conservateur).** Byte-identique
par valeur, mais sémantiquement bancal (le token est nommé pour un fond de CTA, pas pour du
texte de titre). Les occurrences concernées (`SpotDetail:226,453`, `Profile:255`) **restent
littérales**. Si le planner veut inverser cette décision, elle doit être documentée
explicitement — elle n'est pas laissée à l'exécuteur.

---

## Contrat d'interaction & médias (PERF-02)

### Règles de placement de `loading="lazy"`

| Décision | Sites | Motif |
|----------|-------|-------|
| ✅ **POSER** | `SpotDetail.tsx:409` (vignette `image_urls[0]`, `aspect-video`) | contenu sous la ligne de flottaison |
| ✅ **POSER** | `ReviewList.tsx:47` (avatar auteur d'avis) | **N images simultanées** dans un conteneur scrollable — la seule vraie surface d'action du lazy natif |
| ✅ **POSER** | `SessionCard.tsx:85` (avatar créateur de session) | idem |
| ❌ **NE PAS POSER** | `SpotDetail.tsx:246` (avatar uploader 20×20) | en viewport dès le snap 0.35 : aucun gain + expose au bug Safari 15.4 |
| ❌ **NE PAS POSER** | `Profile.tsx:164` (avatar profil 96×96) | `Profile` est monté conditionnellement (`App.tsx:207`) : quand il existe, l'avatar est en viewport |
| ❌ **NE PAS POSER** | `SpotDetail.tsx:721` (`motion.img` lightbox) | c'est LE contenu du viewer (LCP de la lightbox) |
| ❌ **INUTILE** | `SpotDetail.tsx:622` (aperçus `blob:`) | source locale, aucune requête réseau — **et hors périmètre** |
| ⛔ **HORS PÉRIMÈTRE** | `SpotDetail.tsx:610` (grille photo d'édition) | overlay d'édition = Phase 4 |
| — **n/a** | `CommunityStatsScreen.tsx` | **zéro `<img>`** : les drapeaux sont des emoji unicode (`countryCodeToFlag()`). La clause « éventuelles images de CommunityStatsScreen » de D-06 se résout à zéro — à documenter explicitement |

**Extension de périmètre assumée :** `ReviewList.tsx` et `SessionCard.tsx` ne sont pas cités
par D-06 mais sont rendus **à l'intérieur** de la fiche détail (onglets Avis/Sessions), donc
couverts par le libellé de PERF-02 (« images des fiches détaillées »). Sans eux, PERF-02
n'a pratiquement aucune surface d'action réelle. **2 lignes, 2 fichiers, zéro changement
visuel** (conteneurs `w-8 h-8` pré-dimensionnés).

**Aucun risque de CLS :** tous les conteneurs sont pré-dimensionnés par classes
(`aspect-video`, `w-5 h-5`, `w-8 h-8`, `w-24 h-24`) et les `<img>` portent
`w-full h-full object-cover`. L'avertissement MDN « toujours mettre width/height sur les
images lazy » ne s'applique pas ici.

### Contrat du carrousel — prefetch des voisins ±1

**Le DOM du carrousel ne change PAS** (D-03). La lightbox rend **un seul**
`<motion.img key={currentPhotoIndex}>` — il n'existe aucune balise voisine sur laquelle
poser `loading="lazy"`. L'intention de D-06 (« pas de délai perceptible au clic
next/prev ») est honorée **hors DOM**, par un préchargement en `useEffect` :

- Déclenchement : lightbox ouverte (`isImageOpen`) **et** `image_urls.length >= 2`.
- Cible : index `+1` et `-1` avec **wrap-around modulo**, reproduisant exactement le
  comportement des boutons prev/next (`SpotDetail:701,711`).
- Mécanisme : `new Image()` + `.src` (remplit le cache HTTP, ne touche pas le `<head>`,
  aucun avertissement « preloaded but not used » à la fermeture).
- Dépendances : `[isImageOpen, currentPhotoIndex, spot?.id]`.
- ⛔ **Interdit** : `<link rel="preload">`, cache applicatif, service worker, restructuration
  de la lightbox en bande multi-images (violerait D-03 **et augmenterait** les requêtes).

### Métriques de vérification (le comptage « chargement initial » seul ne suffit pas)

| Métrique | Mesure | Attendu |
|----------|--------|---------|
| **A** (recommandée) | Requêtes image au clic next/prev dans la lightbox (4 clics) | avant ≈ 4 → après ≈ **0-1** — delta garanti non nul |
| **B** (demandée par D-06) | Requêtes image au chargement initial de la fiche / du profil | delta possiblement **0** — résultat **légitime à documenter** avec sa cause (montage conditionnel déjà en place + seuil de déclenchement Chromium ~1250px), pas un échec à masquer |
| **C** (preuve d'implémentation) | `document.querySelectorAll('img[loading="lazy"]').length` par écran | 0 → N |

**Support iOS — à énoncer, pas à masquer :** la cible de déploiement du projet est
`IPHONEOS_DEPLOYMENT_TARGET = 14.0/15.6` et `platform :ios, '15.0'`. Les sources se
contredisent sur le support réel (WebKit blog : 15.4 / caniuse : 16.4). Sur les WebViews qui
ignorent l'attribut, l'image se charge eagerly = **comportement actuel** → dégradation
gracieuse, **aucun risque de régression fonctionnelle**, mais aucun gain non plus sur ces
appareils.

---

## Zones gelées — ne pas toucher

| Zone | Fichier / lignes | Raison |
|------|------------------|--------|
| Coque `vaul` (`Drawer.Root`/`Portal`/`Content`, `snapPoints`, `modal={false}`) | `SpotDetail` | D-01 — drag-to-dismiss. Seule exception : le wiring de `rounded-t-[32px]` |
| Portail de la lightbox (`Drawer.Portal` mobile / `createPortal(document.body)` desktop) | `SpotDetail:668-670, 769-770` | **load-bearing** : isole les touch events du gesture handler `vaul`. Structure délibérée, documentée en commentaire |
| Handlers `onPointerDown`/`onTouchStart`/`onTouchEnd` + `stopPropagation` | `SpotDetail:680-682` | même dispositif d'isolation |
| `motion.h2` + `layoutId={spot-name-${spot.id}}` | `SpotDetail:225` ↔ `NearbySpotsList:63` | animation d'élément partagé liste↔fiche — se casse **silencieusement** |
| Onglets Info/Avis/Sessions | `SpotDetail` | D-03 — pas de Tabs au DS |
| `pt-[calc(1rem+env(safe-area-inset-top))]` | `CommunityStatsScreen:90` | fix safe-area antérieur — régression iOS garantie si touché |
| Gardes d'accès `!user` | `SpotDetail:288` (favori), `:397` (lightbox), `:412-421` (`blur-sm` + cadenas), `:253` (droit d'édition) ; `Profile:154,414` (`isAdmin`) | ⚠️ contrôles côté client (UX ; l'autorité reste les RLS Supabase) — **ne pas les régresser** en réorganisant le JSX. Recette explicitement **non authentifiée** requise |
| Rayons distincts `rounded-3xl` (Profile) vs `rounded-2xl` (Card) | — | `Card.tsx:15` documente que la non-unification est **intentionnelle** |

---

## Hors périmètre de cette phase

| Élément | Renvoi |
|---------|--------|
| **Overlay d'édition de spot** `SpotDetail.tsx:526-664` (champs nom/description, multi-select de type, sélecteur de difficulté, grille photo, bouton Save) | **Phase 4 / UI-03** — c'est un formulaire d'édition de spot. Retire ~140 lignes et évite d'avoir à étendre `src/ui/Input` d'une surface claire. À énoncer dans la vérification pour qu'il ne compte pas comme un manque |
| `AdminDashboard` (l'écran) | hors scope (héritage Phase 2). Seul le **bouton d'entrée** dans `Profile.tsx` est dans le périmètre |
| `AddSpotForm` / `AddSpotInfoModal` | Phase 4 |
| Variante `light` de `src/ui/Input` | Phase 4 (UI-03 cite explicitement Input pour les formulaires) |
| Composant `Tabs` maître | DS-04, hors v2.0 |
| `URL.createObjectURL` en rendu, jamais révoqué (`SpotDetail:622`) | bug de fuite mémoire préexistant — **ne pas régresser, ne pas corriger opportunément** ici (mélangerait un fix de bug et une migration DS). À consigner pour la Phase 4 |
| Branches inatteignables de `Profile.tsx` (L200-218, gardes `{user && …}` après le retour anticipé L71) | **CODE-01 / Phase 5**. Ne pas migrer du code mort ; le wiring de `bg-sky-500` sur L212 est sans effet observable |
| Todo `country-list-incomplete-other-emoji.md` | bug de données dans `CommunityStatsScreen`, pas une tâche d'harmonisation DS — reste au backlog |

---

## Écarts assumés (les seuls changements observables autorisés)

| Écart | Nature | Statut |
|-------|--------|--------|
| `aria-label="Close"` ajouté au bouton close de `PremiumModal` | a11y, **zéro effet visuel** | **Autorisé** — cohérent avec le contrat d'`iconOnly` de `Button` (`Button.tsx:51-55`). Peut être omis si l'exécuteur veut du zéro-changement strict |
| Commentaire erroné `src/index.css:41` (`--glass-bg`/`--glass-border` « consumed by DS-02 components » — faux, le vrai consommateur est `SpotDetail:417` `bg-white/70`) | correction de **commentaire**, pas de valeur | **Optionnel** — au jugement du planner |

Aucun autre écart n'est autorisé. Toute divergence de rendu détectée en recette est une
régression à corriger, pas un arbitrage.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
