---
phase: 2
slug: navigation-vue-carte-spots
status: draft
shadcn_initialized: false
preset: none
created: 2026-07-29
---

# Phase 2 — Contrat de Design UI

> Contrat visuel et d'interaction pour la migration Navigation & Vue Carte. Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.
>
> **Nature de la phase : refactor interne (harmonisation, pas de rebranding).**
> Contrainte cardinale héritée de Phase 1 : tout wiring de token doit être prouvé
> **byte-identique** au rendu existant. Ce contrat décrit l'apparence **déjà en place** ;
> il sert de garde-fou anti-régression, pas de nouvelle direction visuelle. Aucune
> valeur ci-dessous ne doit modifier le rendu utilisateur observable.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (système de tokens custom, établi Phase 1 — voir note) |
| Preset | not applicable |
| Component library | none (composants maîtres maison dans `src/ui/*`) |
| Icon library | lucide-react |
| Font | `system-ui` stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`) — source `src/index.css` `--font-sans` |

**Note shadcn gate :** `components.json` absent, mais un design system existe déjà
(`src/index.css` `@theme` + `src/ui/{Button,Card,Input,Modal,Header}.tsx`, Phase 1).
Le milestone v2.0 interdit explicitement rebranding et migration de framework
(REQUIREMENTS.md « Out of Scope » ; STATE.md Decisions). Initialiser shadcn serait
un scope creep hors périmètre — gate **non déclenché à raison**, pas par omission.

**Composants maîtres disponibles pour cette phase (Phase 1) :**
- `src/ui/Modal.tsx` — `isOpen`/`onClose`/`children`, `AnimatePresence`, backdrop `bg-black/60 backdrop-blur-md`, carte glass `bg-white/10 backdrop-blur-xl rounded-4xl p-8`.
- `src/ui/Header.tsx` — 2 formes : titre empilé (+subtitle) et rangée-avec-bouton-close ; prop `surface: 'glass' | 'light'`. Titre = `text-2xl font-bold`.
- `src/ui/Button.tsx` — variantes `primary | secondary | ghost | danger`, tailles `sm | md | lg`, `iconOnly` (exige `aria-label`), état `loading`.

---

## Hiérarchie visuelle (point focal)

**Point focal de l'écran principal (vue Carte) : la carte Mapbox elle-même.** C'est
l'ancre visuelle dominante, plein cadre, qui porte l'attention et l'interaction primaire
(exploration des spots via markers/clusters). La top bar (bouton filtre), la NavBar et
le FAB « Add Spot » sont du **chrome secondaire** superposé : ils encadrent la carte sans
lui disputer la hiérarchie. L'accent sky (voir Color) ne s'applique qu'à ce chrome pour
signaler l'état actif/primaire, jamais à la carte, ce qui préserve le point focal unique.

---

## Spacing Scale

Échelle réellement présente dans les composants migrés (multiples de 4) :

| Token | Value | Usage (existant) |
|-------|-------|-------|
| xs | 4px | `gap-1` (label + icône lock nav), écarts inline |
| sm | 8px | `p-2` (boutons icône top bar/nav), `gap-2` |
| md | 16px | `p-4` (lignes de filtre), `px-4` top bar, padding par défaut |
| lg | 24px | `p-6` (padding FiltersModal), `mb-6` (header modal) |
| xl | 32px | `p-8` (padding Modal maître), `mb-8` (sous-titre header) |

Exceptions (présentes dans l'existant — **à préserver, ne pas « corriger »** sous peine de régression visuelle) :
- **12px** (`p-3`, `gap-3`) — padding des items de la NavBar verticale et écart icône/label. Hors grille 8-point stricte mais partie intégrante du rendu Phase 1.
- **Cibles tactiles** : FAB central mobile `w-16 h-16` (64px) ; onglets nav mobile `w-14` (56px) ; boutons icône top bar `w-10 h-10` (40px). Le bouton filtre à 40px est sous le seuil confort 44px mais **inchangé** (contrainte byte-identique) — signalé, non modifié.

---

## Typography

Rôles réellement rendus dans les surfaces migrées (nav, top bar carte, FiltersModal).
Le couple canonique est **400 (corps) + 700 (emphase/titres)** :

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label / body-sm | 14px (`text-sm`) | 400 regular (→ 700 bold en état actif / emphase) | 1.5 (héritée `:root`) |
| Body / input | 16px (`text-base`) | 400 regular | 1.5 |
| Heading (titre modal) | 24px (`text-2xl`) | 700 bold | 1.2 (par défaut heading) |

**Poids canoniques : 400 + 700 uniquement.** Le corps est en 400, l'emphase et les titres
en 700. Aucun nouvel élément ne doit introduire d'autre poids.

**Contrainte iOS (existante) :** `input, textarea, select { font-size: 16px }` dans
`src/index.css` — anti-zoom au focus, ne pas descendre sous 16px sur les champs.

### Exceptions typographiques (legacy Phase 1 — hors couple canonique, à préserver)

Isolées ici — au même titre que l'exception 12px du Spacing — car héritées telles quelles
de Phase 1 sous contrainte byte-identique. **Non propageables** à de nouveaux éléments :

- **10px caption / micro-labels de la NavBar mobile** (`text-[10px] font-medium`) rendus en
  **500 medium**, line-height 1.5. Poids hors couple canonique 400/700 ; exception assumée,
  présente uniquement pour ne pas régresser l'existant.
- **Quelques labels d'état ponctuels de la NavBar** utilisent aussi **500 medium** — même
  statut d'exception legacy. À terme, tout nouveau libellé retombe sur 400/700.

---

## Color

Répartition 60/30/10 sur les surfaces de cette phase (nav + carte). Tokens sémantiques
de `src/index.css` (`@theme`), aliasés aux vars Tailwind v4 (garantis byte-identiques) :

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--color-background` = slate-50 (`#f8fafc`) + surfaces blanches (`bg-white`, `bg-white/95` top bar, nav bar) | Fond de page, barre de nav, top bar carte, fond des lignes de filtre inactives |
| Secondary (30%) | `--color-secondary` = slate-900 + gris texte slate-400/500/600 (`--color-muted` = slate-500) | Texte inactif/muted, bouton « Voir les résultats » (`bg-slate-900`), bordures `border-slate-100/200` |
| Accent (10%) | `--color-primary` = sky-500 (v4 ≈ `#00a6f4`) + halo sky-50/sky-100/sky-600 | Voir liste réservée ci-dessous |
| Destructive | `--color-accent` = rose-500 (`#f43f5e`) | Actions destructrices uniquement (variant `danger` du Button) — **aucune dans cette phase** |

**Accent (sky) réservé strictement à :**
- Onglet de navigation **actif** (icône + label : `text-sky-500` mobile / `text-sky-600` + `bg-sky-50` desktop).
- CTA « Add Spot » (dégradé `from-sky-400/500 to-blue-500/600` — dégradé existant, hors token, à préserver tel quel).
- Bouton filtre de la top bar en **état actif** (`bg-sky-50 text-sky-600`) + label du filtre courant (`text-sky-500`).
- Ligne de filtre **sélectionnée** dans FiltersModal (bordure `border-sky-500`, fond `bg-sky-50`, pastille check `bg-sky-500`).
- Variant `primary` du Button maître.

> **Ne jamais** étendre l'accent à « tous les éléments interactifs ». Les éléments
> interactifs au repos sont slate (secondary/muted) ; sky signale l'état actif/primaire.

### Palette hors-contrat : couleurs des markers Mapbox (D-01)

**Séparée du 60/30/10** — ce sont des couleurs de **donnée** (type de spot), pas des
couleurs d'UI. Mapbox GL ne lit pas les custom properties CSS ; ces valeurs sont
centralisées dans **une constante JS locale** (ex. `MAP_COLORS`, emplacement au choix
planner/exécuteur : `Map.tsx` ou `src/config/mapbox.ts`), **pas** dans les tokens CSS.

| Élément | Hex | Note |
|---------|-----|------|
| Cluster < 5 | `#22d3ee` (cyan-400) | |
| Cluster 5-20 | `#38bdf8` (sky-400) | |
| Cluster > 20 | `#ffffff` | texte cluster : `#0f172a` sinon `#ffffff` |
| Spot en attente | `#f97316` (orange) | `is_approved == false` |
| Dockstart | `#38bdf8` | défaut / type |
| Rockstart | `#f472b6` | |
| Dropstart | `#2dd4bf` | |
| Deadstart | `#818cf8` | |
| Rampstart | `#fbbf24` | |
| Beachstart | `#f59e0b` | |
| Cercle marker (contour) | `#242B4B` | |

Seule exception autorisée : si une couleur matche **réellement** un token existant
(ex. `#38bdf8` sky-400 vs `--color-primary` sky-500 — attention, valeurs distinctes),
le token peut être référencé **uniquement** avec la même vérification chaîne-CSS-prouvée
qu'en Phase 1. Par défaut : garder les hex dans la constante JS.

---

## Copywriting Contract

**Contrainte refactor :** tout le texte user-facing est en **français**, servi via
`LanguageContext` (`useLanguage` / `t()`). Cette phase **ne crée aucune nouvelle copy** —
les libellés existants sont préservés à l'identique. Table = inventaire des clés en jeu.

| Element | Copy |
|---------|------|
| Primary CTA (FiltersModal) | `t('filters.show_results')` — « Voir les résultats » (bouton `bg-slate-900`) |
| CTA nav | « Add Spot » (libellé codé en dur dans `NavBar.tsx` — **préservé tel quel**, ne pas franciser : hors scope, risque de régression sur une string non-i18n) |
| Titre modal filtres | `t('filters.title')` |
| Label section filtres | `t('filters.start_type')` (fallback « Start Type ») |
| Labels nav | `t('nav.map')`, `t('nav.favorites')`, `t('nav.list')`, `t('nav.profile')` |
| Empty state | Non applicable — aucun nouvel état vide introduit dans cette phase (refactor). La carte affiche toujours des markers ; le filtrage sans résultat conserve le comportement existant. |
| Error state | Non applicable — aucun nouveau flux d'erreur. La gestion d'erreur robuste est le périmètre de Phase 4 (ROBUST-01/02), explicitement différée. |
| Destructive confirmation | Aucune action destructrice dans cette phase (nav + carte + fix mémoire). Le fix D-03 (`AddSpotForm` cleanup) est un bug backend-side sans UI. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | aucun (pas de shadcn dans ce projet) | not applicable |
| tiers | aucun | not applicable |

Aucun registre déclaré. Composants exclusivement maison (`src/ui/*`) et lucide-react
(déjà dépendance du projet). Gate de vetting : sans objet.

---

## Périmètre visuel de la phase (récapitulatif exécuteur)

**Migrent vers le design system cette phase :**
- `src/components/NavBar.tsx` — wiring tokens couleur (sky-500 → `--color-primary`, etc.), même discipline byte-identique qu'en Phase 1. Duplication desktop/mobile : refactor **optionnel** (Claude's Discretion), sans changement de comportement.
- `src/components/FiltersModal.tsx` — migration vers `src/ui/Modal` + `src/ui/Header` (forme rangée-avec-close, `surface="light"`) + `src/ui/Button`. Duplique exactement le pattern extrait en Phase 1.
- `src/components/Map.tsx` — centralisation des couleurs markers (D-01) + top bar (bouton filtre).

**Hors périmètre visuel (inchangés) :**
- `AddSpotForm.tsx` — **seul** le bug mémoire `useEffect` (lignes 62-66, D-03) est corrigé ; **aucune** modification visuelle. Migration DS = Phase 4.
- `AddSpotInfoModal.tsx`, `AdminDashboard.tsx`, `SpotDetail.tsx` — hors scope (Phases 3/4 ou hors milestone).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
