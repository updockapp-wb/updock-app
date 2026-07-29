# Phase 3 : Fiches Détaillées & Profils — Recherche

**Recherché :** 2026-07-30
**Domaine :** React 19 + Tailwind v4 + vaul/framer-motion — migration design system + lazy loading d'images, sans régression
**Confiance globale :** HIGH sur l'inventaire de code (lecture directe + grep exhaustif) / MEDIUM sur le comportement navigateur de `loading="lazy"` en WebView iOS (sources contradictoires, mesure empirique requise)

<user_constraints>
## Contraintes utilisateur (extraites de 03-CONTEXT.md)

### Décisions verrouillées

- **D-01 — Conteneur de SpotDetail :** le conteneur externe de `SpotDetail` reste **`vaul` (Drawer) + `createPortal`**, PAS `src/ui/Modal`. Raison : `vaul` fournit un drag-to-dismiss natif important sur un écran consulté très fréquemment ; le remplacer par la variante "sheet" de `Modal` DS perdrait ce comportement — régression UX interdite par la contrainte cardinale. Seul l'**intérieur** de `SpotDetail` (Header, badges, structure de contenu) migre vers les composants DS, la coque `vaul` reste intacte.
- **D-02 — Icônes de header SpotDetail :** les boutons icônes du header de `SpotDetail` (Partager, Favori, Fermer, Modifier) **restent des `<button>` natifs**, ne migrent PAS vers `src/ui/Button`. Raison : ce sont des icon-buttons de header (pas des CTA standards), `Button` n'a probablement pas de variant icon-only compact adapté — même logique que D-04 de la Phase 2 pour les onglets NavBar.
- **D-03 — Carrousel et onglets :** le carrousel photo plein écran de `SpotDetail` (fond noir, navigation prev/next, compteur) et les onglets Info/Avis/Sessions **restent tels quels**, hors périmètre de migration DS. Raisons : carrousel = viewer plein écran spécifique sans équivalent DS ; onglets = le DS n'a pas de composant Tabs, en créer un étendrait DS-02 au-delà de son périmètre Phase 1 (Button/Card/Input/Modal/Header uniquement) — un composant Tabs est explicitement DS-04, hors v2.0.
- **D-04 — Périmètre Profil :** UI-02 couvre `Profile.tsx` **ET** `CommunityStatsScreen.tsx` **ET** `PremiumModal.tsx`. `Profile.tsx` n'a actuellement AUCUN composant DS — migration large à faire. Le bouton d'entrée « Tableau de Bord Admin » (dans `Profile.tsx`) fait partie du périmètre — c'est un bouton du fichier migré, pas l'écran `AdminDashboard` lui-même (hors scope). Migration en **une seule passe complète** sur `Profile.tsx`.
- **D-05 — PremiumModal :** `PremiumModal.tsx` migre vers `src/ui/Modal` **dans cette phase** — il duplique exactement l'ancien pattern pré-Phase-2 (`AnimatePresence` custom, backdrop, pas `Modal` DS) et utilise déjà la forme glass-center supportée nativement par `Modal` depuis la Phase 1/2. Coût marginal faible, cohérent avec l'inclusion de `CommunityStatsScreen` (D-04).
- **D-06 — Lazy loading :** méthode = attribut natif HTML `loading="lazy"` sur les `<img>` (carrousel SpotDetail, avatar Profil, éventuelles images de CommunityStatsScreen). Pas d'Intersection Observer custom ni de placeholder blur. **Comportement carrousel :** l'image visible + les voisines immédiates (index ±1) sont chargées eagerly ; le reste en lazy natif. **Vérification :** mesure chiffrée avant/après (nombre de requêtes images au chargement initial de la fiche/profil), même méthodologie que `02-BASELINE.md` — pas seulement une vérification visuelle.
- **Contrainte cardinale (Phase 1/2) :** harmonisation de l'existant, pas de rebranding. Zéro régression fonctionnelle — en particulier, ne pas sacrifier le drag-to-dismiss de SpotDetail au nom de la cohérence visuelle. Tout wiring de token doit être prouvé **byte-identique**.

### Discrétion de Claude

- Détail technique du wiring exact des couleurs/tokens dans `SpotDetail.tsx` et `Profile.tsx` (quelles classes Tailwind correspondent 1:1 à quels tokens) — même discipline byte-identique qu'en Phase 1/2, mais le choix précis des correspondances est laissé au planner/exécuteur.
- Structure interne exacte de la migration Header/badges dans `SpotDetail` (D-01) — tant que la coque `vaul` externe et le drag-to-dismiss restent intacts.
- Méthode exacte de mesure avant/après du lazy loading (D-06) — reproduire l'esprit de `02-BASELINE.md` (chrome-devtools-mcp ou équivalent), le détail d'outillage est laissé à l'exécuteur.

### Idées différées (HORS SCOPE)

- **Composant Tabs maître** — écarté, candidat DS-04 (hors v2.0).
- **Extension de `Modal` DS avec drag-to-dismiss** — écartée, pas nécessaire tant que `vaul` fonctionne.
- **Migration Button pour les icônes de header** (D-02) — écartée pour cette phase.
- **AdminDashboard (écran complet)** — hors scope (héritage Phase 2) ; seul le bouton d'entrée dans `Profile.tsx` est dans le périmètre.
- **Todo `country-list-incomplete-other-emoji.md`** — bug de données/logique dans `CommunityStatsScreen.tsx`, pas une tâche d'harmonisation DS. Reste au backlog, non folded — sauf décision contraire explicite au moment du plan.
</user_constraints>

<phase_requirements>
## Exigences de la phase

| ID | Description | Support de recherche |
|----|-------------|----------------------|
| **UI-01** | La fiche détail spot utilise exclusivement les composants du design system (Card, Header, Button, Modal) | § Inventaire de la surface de migration DS → `SpotDetail` : **0 composant DS applicable byte-identique** (Header bloqué par `layoutId`, Card bloqué par `bg-slate-50`, Button bloqué par D-02 + gradient, Modal bloqué par D-01). UI-01 est honoré par le **wiring de tokens** + `rounded-[24px]`→`rounded-3xl`. Voir Pitfall 1 et Open Q1 — un **override documenté** sera nécessaire, précédent `01-VERIFICATION.md`. |
| **UI-02** | L'écran Profil utilise exclusivement les composants du design system | § Inventaire → `Profile` : `Card` ×2 (match exact), `Button variant="secondary"` ×1 (match exact) ; `PremiumModal` : `Modal` (après extension `light`+`center`) + `Header` ×1 (match exact) ; `CommunityStatsScreen` : **aucun composant DS applicable** (écran plein-écran, header app-bar sans forme DS) → wiring de tokens seul. |
| **PERF-02** | Les images/médias des fiches détaillées et des profils sont chargés en lazy loading | § Inventaire des images + PERF-02 → 9 sites `<img>` recensés, dont **6 déjà conditionnellement montés** (donc déjà « lazy » de fait) et **1 seul `<img>` dans le carrousel** (pas N). Le delta chiffré attendu sur « requêtes au chargement initial » est **≈ 0** — métrique alternative recommandée (§ Protocole de mesure). Voir Pitfall 4 et Open Q2. |
</phase_requirements>

## Résumé

Cette phase ressemble à la Phase 2 mais avec un rapport signal/bruit inversé : là où la Phase 2 avait une vraie surface de migration (FiltersModal → Modal, avec extension du master), **la Phase 3 découvre que la quasi-totalité du markup de `SpotDetail.tsx` et `Profile.tsx` n'a AUCUN équivalent byte-identique dans `src/ui/*`**. Un grep exhaustif des 4 fichiers du périmètre contre les chaînes de classes exactes des 5 composants maîtres donne seulement **7 sites de migration structurelle réellement byte-identiques** : 4 `Card` (Profile ×2, CommunityStats ×2), 1 `Button variant="secondary"` (le bouton « Log Out » de `Profile`, dont la variante `secondary` a littéralement été extraite en Phase 1), 1 `Header` (le titre de `PremiumModal`) et 1 `Modal` (la coque de `PremiumModal`, **après extension du master**). Tout le reste — badges de type de spot, cartes stats de `SpotDetail` (`bg-slate-50`, pas `bg-white`), rangées de réglages de `Profile`, header app-bar de `CommunityStatsScreen`, CTA gradient « Naviguer », toggles FR/EN, switch de notification — n'a soit aucun variant correspondant, soit une chaîne de classes qui diffère d'au moins un utilitaire (`shadow-sm` manquant, `mb-4` vs `mb-6`, `text-xl` vs `text-2xl`), ce qui rend la migration non byte-identique et donc interdite par la contrainte cardinale.

Trois découvertes bloquent une lecture naïve des décisions verrouillées et doivent être intégrées au plan :

1. **La prémisse factuelle de D-05 est fausse.** `PremiumModal` n'est **pas** un modal « glass-center » : c'est un dialog **blanc opaque** (`bg-white rounded-3xl p-8`) avec un backdrop `bg-slate-900/40 backdrop-blur-sm` animé en fondu et une animation `scale + y`. Le master `src/ui/Modal` n'expose que deux paires supportées (`glass`+`center` et `light`+`sheet`) et **rejette explicitement les paires mixtes** (dev-warning ligne 33-37). Le brancher sur `surface="glass"` produirait une carte translucide à texte blanc sur fond clair (illisible) ; sur `surface="light"` il deviendrait un bottom-sheet qui slide. → il faut **ajouter une 3ᵉ forme `light`+`center`** au master, extraite verbatim de `PremiumModal` — exactement le même travail que le Pitfall 1 de la Phase 2, rétro-compatible (défaut inchangé).

2. **D-03 et D-06 se contredisent sur le carrousel.** D-06 suppose que les N photos sont dans le DOM (« visible + voisines ±1 eager, le reste lazy »). Ce n'est pas le cas : la lightbox rend **un seul** `<motion.img key={currentPhotoIndex}>` (SpotDetail:721-730). Il n'y a aucune balise voisine sur laquelle poser `loading="lazy"`. Implémenter D-06 littéralement exigerait de restructurer la lightbox en bande multi-images — ce que D-03 interdit, et qui **augmenterait** le nombre de requêtes. → réinterprétation recommandée (§ Pattern 4) : le comportement actuel est déjà strictement meilleur que du lazy ; l'intention UX de D-06 (« pas de délai perceptible au clic next/prev ») s'obtient par un **prefetch des voisins ±1** (2 lignes de `useEffect`), sans toucher au DOM du carrousel.

3. **PERF-02 est déjà largement satisfait par le montage conditionnel existant**, donc la mesure chiffrée de D-06 risque de donner un delta nul. `Profile` n'est monté que quand `activeTab === 'profile'` (App.tsx:207), les avatars d'avis/sessions que quand l'onglet correspondant est actif, la grille photo d'édition que quand `isEditing`. Il ne reste que 2 images chargées à l'ouverture de la fiche (avatar uploader 20×20px + vignette `image_urls[0]`), toutes deux situées **à moins de 1250 px du viewport** — soit dans le seuil de déclenchement du lazy loading de Chromium, qui les chargera donc quand même. → le plan doit prévoir une **métrique alternative mesurable** (requêtes au clic next/prev dans la lightbox : 1 → 0) et un chemin d'override documenté si le delta « chargement initial » est nul.

**Recommandation principale :** planifier 4 waves — Wave 0 `03-BASELINE.md` (gate chiffré, calqué sur `02-BASELINE.md`) ; Wave 1 extension `src/ui/Modal` (3ᵉ forme `light`+`center`, byte-identique) ; Wave 2 migration `PremiumModal` + `Profile` + `CommunityStatsScreen` (wiring tokens + 4×`Card` + 1×`Button` + 1×`Header`) ; Wave 3 `SpotDetail` (wiring tokens + `rounded-[24px]`→`rounded-3xl` + lazy/prefetch images). **Exclure explicitement l'overlay d'édition de `SpotDetail` (lignes 526-664) du périmètre** — c'est le formulaire d'édition de spot, donc UI-03 / Phase 4 (voir Open Q3).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Coque/gestuelle du bottom-sheet SpotDetail | `vaul` (Drawer, lib tierce) | React (state `snap`) | Le drag-to-dismiss et les snap points sont implémentés par `vaul` via des pointer events natifs ; le DS n'y touche pas (D-01). |
| Portails de rendu (lightbox, drawer) | Browser DOM (`createPortal` / `Drawer.Portal`) | React | Le choix du portail est **load-bearing** : la lightbox est rendue dans `Drawer.Portal` sur mobile précisément pour que ses touch events ne remontent pas au gesture handler de `vaul` (commentaire SpotDetail:668-670). Ne pas déplacer. |
| Surface visuelle / tokens | Tailwind v4 `@theme` (`src/index.css`) | `src/ui/*` masters | Les utilitaires `text-primary`/`text-text`/… sont générés depuis `@theme` ; les masters les consomment. |
| Structure de dialogue (backdrop, panneau, animation) | `src/ui/Modal` (master DS) | `framer-motion` (`AnimatePresence`) | Cible de la migration de `PremiumModal` (D-05), après extension. |
| Décision de charger une image | **Browser** (heuristique `loading="lazy"`, seuil ~1250 px) | React (montage conditionnel) | Point crucial : le levier le plus puissant dans cette app est le **montage conditionnel React** (déjà en place), pas l'attribut HTML. Le navigateur garde la décision finale sur le déclenchement. |
| Cache des images déjà vues | Browser HTTP cache | Supabase Storage (CDN) | Le prefetch des voisins ±1 (§ Pattern 4) s'appuie sur le cache HTTP, pas sur un cache applicatif. |
| Écran plein-écran CommunityStats | React (`fixed inset-0`) | — | Ce n'est pas un modal : aucune forme du master `Modal` ne s'y applique. |

## Standard Stack

**Aucun nouveau package.** La phase réutilise exclusivement l'existant, comme la Phase 2.

### Core (déjà présent — versions vérifiées dans `package.json`)

| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| `react` / `react-dom` | ^19.2.0 | UI runtime, `createPortal` | [VERIFIED: package.json] |
| `vaul` | ^1.1.2 | Bottom-sheet drag-to-dismiss de `SpotDetail` | [VERIFIED: package.json] — **conservé intact** (D-01) |
| `framer-motion` | ^12.23.25 | `AnimatePresence`, `layoutId` partagé, `motion.img` | [VERIFIED: package.json] |
| `lucide-react` | ^0.556.0 | Icônes | [VERIFIED: package.json] |
| `tailwindcss` + `@tailwindcss/postcss` | ^4.1.17 | Styling + tokens `@theme` | [VERIFIED: package.json] |
| `@capacitor/share` | ^8.0.0 | `handleShare` de SpotDetail | [VERIFIED: package.json] — non touché |
| `@supabase/supabase-js` | ^2.87.2 | Fetch reviews/profiles/stats | [VERIFIED: package.json] — non touché |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `loading="lazy"` natif | `IntersectionObserver` custom / lib (`react-lazy-load-image-component`) | ❌ Écarté par D-06. Donnerait un contrôle plus fin (seuil configurable, respect réel du clipping `overflow:hidden`) mais ajoute une dépendance + du code à maintenir pour un gain marginal dans une app où tout est déjà monté conditionnellement. |
| `vaul` pour SpotDetail | `Modal surface="light" layout="sheet"` | ❌ Écarté par D-01 — perte du drag-to-dismiss. |
| Restructurer la lightbox en bande multi-images | Prefetch `new Image()` des voisins ±1 | ✅ Le prefetch honore l'intention de D-06 sans violer D-03 ni augmenter les requêtes au chargement initial. |
| Créer un variant `Button` pour chaque bouton non-matchant | Garder les `<button>` natifs | ✅ Précédent Phase 2 D-04 (NavBar) + A4 (CTA FiltersModal) : « variants widen the API, never the appearance ». |

**Installation :** aucune. `npm install` non requis.

## Package Legitimacy Audit

**Non applicable** — cette phase n'installe aucun package externe. Aucun `npm install`, aucune nouvelle dépendance. Tous les modules utilisés sont déjà des dépendances vérifiées du projet (`package.json`, lu directement). Le protocole slopcheck n'a donc pas de cible.

⚠️ **Note d'hygiène (hors périmètre, pour information) :** `.mcp.json` configure `chrome-devtools-mcp` via `npx -y chrome-devtools-mcp@latest`, ce qui télécharge et exécute la dernière version publiée sans épinglage ni vérification. Config héritée de la Phase 2, pas introduite ici — signalée seulement parce que l'outillage de mesure de cette phase en dépend.

## Inventaire de la surface de migration DS

> **Méthode :** pour chaque site candidat, la chaîne de classes existante est comparée **caractère par caractère** à la chaîne produite par le composant maître. Un seul utilitaire divergent (`shadow-sm`, `mb-4` vs `mb-6`, `text-xl` vs `text-2xl`) = non byte-identique = **ne pas migrer** (contrainte cardinale). [VERIFIED: lecture directe des 4 fichiers + `src/ui/*.tsx` + grep des chaînes exactes]

### `Card` — 4 matches exacts, 0 ailleurs

`Card variant="light"` rend exactement `bg-white p-4 rounded-2xl border border-slate-100 shadow-sm` (Card.tsx:25).

| Site | Chaîne actuelle | Verdict |
|------|-----------------|---------|
| `Profile.tsx:265` (Spots Added) | `bg-white p-4 rounded-2xl border border-slate-100 shadow-sm` | ✅ **MATCH EXACT** → `<Card>` |
| `Profile.tsx:269` (Favorites) | idem | ✅ **MATCH EXACT** → `<Card>` |
| `CommunityStatsScreen.tsx:110` (KPI total spots) | idem | ✅ **MATCH EXACT** → `<Card>` |
| `CommunityStatsScreen.tsx:116` (KPI total users) | idem | ✅ **MATCH EXACT** → `<Card>` |
| `SpotDetail.tsx:377,382` (stats difficulté/hauteur) | `bg-slate-50 rounded-2xl p-4 border border-slate-100` | ❌ `bg-slate-50` ≠ `bg-white`, `shadow-sm` absent → régression visuelle garantie |
| `SpotDetail.tsx:452` (résumé note moyenne) | `bg-white rounded-2xl p-4 border border-slate-100` | ❌ `shadow-sm` absent → ajouterait une ombre |
| `Profile.tsx:311,325` / `CommunityStats:130` (conteneurs de rangées) | `bg-white rounded-3xl border border-slate-100 overflow-hidden` (ou `rounded-xl`/`rounded-2xl`) | ❌ `rounded-3xl`/`rounded-xl` ≠ `rounded-2xl`, pas de `p-4`, pas de `shadow-sm` ; en plus `Card` n'accepte pas `onClick` (rangée cliquable) |
| `Profile.tsx:279` (liste sessions à venir) | `bg-white rounded-xl border border-slate-100 overflow-hidden` | ❌ idem |

**Limitation d'API relevée :** `Card` (Card.tsx:3-8) n'expose que `variant`/`interactive`/`className`/`children` — **pas de `onClick`**. Les rangées cliquables de `Profile` (community-stats nav, Premium, Admin) ne peuvent donc pas devenir des `Card interactive` sans étendre l'API. Non recommandé (leurs classes ne matchent pas de toute façon).

### `Button` — 1 match exact

`Button variant="secondary" size="lg"` rend `bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-2xl transition-all` + `py-4` + `flex items-center justify-center gap-2`.

| Site | Chaîne actuelle | Verdict |
|------|-----------------|---------|
| `Profile.tsx:429-435` (Log Out) | `w-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-4 rounded-2xl transition-all mb-8 flex items-center justify-center gap-2` | ✅ **MATCH EXACT** → `<Button variant="secondary" size="lg" className="w-full mb-8" onClick={signOut}>` — la variante `secondary` a été extraite de cette ligne même en Phase 1 (commentaire Button.tsx:23 « Profile:431 ») |
| `Profile.tsx:94-99` (anon « Se connecter ») | `bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl … transition-colors` | ❌ `primary` ajoute `shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98]` → ajouterait une ombre et un scale |
| `Profile.tsx:102-107` (anon « Créer un compte ») | `bg-white border border-slate-200 text-slate-700 …` | ❌ aucun variant (outline) |
| `Profile.tsx:237-247` (Save nom) | `px-4 py-3 bg-sky-500 text-white rounded-xl font-medium` | ❌ `font-medium` ≠ `font-bold`, pas de hover/shadow |
| `Profile.tsx:388-399` (switch notif) | toggle custom (piste + pastille) | ❌ aucun variant, ce n'est pas un bouton textuel |
| `PremiumModal.tsx:49-54` (CTA) | `w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-all` | ❌ `py-3.5` hors échelle (`sm/md/lg` = py-2/3/4) **et** `bg-slate-900` sans variant — miroir exact du précédent A4 Phase 2 (CTA « Voir les résultats »). Garder custom, wirer `bg-slate-900` → `bg-secondary`. |
| `PremiumModal.tsx:31-36` (close) | `absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200` | ❌ `ghost` = `bg-white/5 hover:bg-white/10` (surface glass). Garder custom — précédent D-02. |
| `SpotDetail.tsx:318-324` (Naviguer) | `bg-gradient-to-r from-sky-500 to-blue-600 …` | ❌ gradient, aucun variant (Pitfall 5 Phase 2) |
| `SpotDetail.tsx:275-311` (Share/Favori/Close) | icon-buttons `w-10 h-10 rounded-full bg-slate-100` | ❌ **exclus par D-02** |
| `SpotDetail.tsx:484,510` (CTA verrouillés) | `bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500` | ❌ aucun variant |

### `Header` — 1 match exact

`Header surface="light"` (forme empilée, sans `onClose`) rend `<h2 className="text-2xl font-bold text-text mb-2">` — `text-text` alias `var(--color-slate-800)`, prouvé byte-identique en `01-VERIFICATION.md`.

| Site | Chaîne actuelle | Verdict |
|------|-----------------|---------|
| `PremiumModal.tsx:43` | `text-2xl font-bold text-slate-800 mb-2` | ✅ **MATCH EXACT** → `<Header surface="light" title={t('premium.title')} />` (ne PAS passer `onClose` : cela basculerait sur la forme rangée-avec-close ; le close de PremiumModal est un bouton flottant absolu) |
| `PremiumModal.tsx:45` (desc) | `text-slate-500 mb-8 leading-relaxed` | ❌ la prop `subtitle` de `Header` rend `text-muted text-sm mb-8` — `text-sm` en plus, `leading-relaxed` en moins → garder le `<p>` custom, wirer `text-slate-500` → `text-muted` |
| `SpotDetail.tsx:224-229` (titre spot) | `motion.h2` + `layoutId={`spot-name-${spot.id}`}` + `text-2xl font-bold text-slate-900` | ❌ **DOUBLE BLOCAGE** : (a) `text-slate-900` ≠ `text-text` (slate-800) ; (b) le `layoutId` est **partagé avec `NearbySpotsList.tsx:63`** → animation d'élément partagé liste↔fiche. `Header` rend un `<h2>` nu : la migrer **casserait l'animation** [VERIFIED: `grep -rn "layoutId" src/` → 2 occurrences du même id] |
| `SpotDetail.tsx:535` (titre overlay édition) | `text-xl font-bold text-slate-800` + wrapper `mb-4` | ❌ `text-xl` ≠ `text-2xl`, `mb-4` ≠ `mb-6` — et hors périmètre (Open Q3) |
| `CommunityStatsScreen.tsx:90-98` (app bar) | `<h1 className="text-lg font-bold text-slate-800">` + `ArrowLeft` à gauche + `border-b bg-white` + `pt-[calc(1rem+env(safe-area-inset-top))]` | ❌ `h1`/`text-lg`, flèche retour **à gauche** : aucune des 2 formes de `Header` ne correspond. **Ne pas toucher au padding safe-area** (fix antérieur, cf. CONTEXT § Specifics) |
| `Profile.tsx:199` (nom utilisateur) | `text-2xl font-bold text-slate-800` **sans** `mb-2` | ❌ `Header` ajoute `mb-2` → décalerait le `<p>` email de 8 px |
| `Profile.tsx:278,323` / `CommunityStats:127` (sous-titres) | `text-sm`/`text-xs font-bold` | ❌ rôle sous-titre, `Header` est `text-2xl` |

### `Modal` — 1 site, nécessite une extension du master

| Site | État | Verdict |
|------|------|---------|
| `PremiumModal.tsx:14-59` | dialog **blanc centré** : wrapper `fixed inset-0 z-[5000] flex items-center justify-center p-6`, backdrop **animé en fondu** `absolute inset-0 bg-slate-900/40 backdrop-blur-sm`, panneau `relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl overflow-hidden`, animation `{scale:0.95,opacity:0,y:20}` → `{scale:1,opacity:1,y:0}` | ⚠️ **EXTENSION REQUISE** : ajouter la 3ᵉ forme `surface="light"` + `layout="center"` au master (§ Pattern 1). Voir Pitfall 1. |
| `CommunityStatsScreen.tsx:88` | `fixed inset-0 z-50 bg-slate-50 overflow-y-auto` — écran plein, pas de backdrop, pas d'animation, pas de panneau | ❌ aucune forme `Modal` ne correspond (ce n'est pas un dialogue). Garder la coque custom, wirer `bg-slate-50` → `bg-background` (sémantiquement exact : c'est un fond de page). |
| `SpotDetail.tsx` (coque) | `vaul` + `createPortal` | ❌ **exclu par D-01** |
| `SpotDetail.tsx:526-664` (overlay édition) | `absolute inset-0 bg-white z-50 p-6 … rounded-[24px]` (overlay interne, pas un modal portalisé) | ❌ pas un modal ; et hors périmètre (Open Q3) |

### `Input` — 0 match (master inutilisable sur surface claire)

`src/ui/Input` est **glass-only** : label `text-xs font-bold text-white/70 uppercase tracking-wider ml-1`, champ `bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary`.

| Site | Chaîne actuelle | Verdict |
|------|-----------------|---------|
| `Profile.tsx:225-236` (nom d'affichage) | label `block text-sm font-medium text-slate-500 mb-2` + champ `p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none font-medium` | ❌ **incompatible** : surface claire vs sombre, `border-2` vs `border`, `focus:border` vs `focus:ring`, label totalement différent. Migrer = régression visuelle majeure. → garder custom + wirer les tokens. Même nature de problème que `Modal` en Phase 2, mais **ici l'extension n'est PAS recommandée** : `Input` n'apparaît pas dans la liste UI-02 comme obligatoire, et une variante `light` d'`Input` relève naturellement de la Phase 4 (UI-03 cite explicitement Input pour les formulaires). |
| `SpotDetail.tsx:545-584` (overlay édition) | `p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500` | ❌ idem, et hors périmètre (Open Q3) |

### Surface de wiring de tokens (byte-identique par valeur)

Tokens disponibles (`src/index.css` §`@theme`) : `--color-primary`=sky-500, `--color-secondary`=slate-900, `--color-accent`=rose-500, `--color-text`=slate-800, `--color-muted`=slate-500, `--color-background`=slate-50, `--radius-4xl`=2rem.

| Fichier | Wirable → token | Occurrences (lignes) |
|---------|-----------------|----------------------|
| `SpotDetail.tsx` | `text-sky-500` → `text-primary` | 263, 378 |
| | `text-slate-800` → `text-text` | 380, 385, 391, 440 |
| | `text-slate-500` → `text-muted` | 238, 252, 486, 512 |
| | `bg-slate-50` → `bg-background` | 377, 382, 441, 486, 512 |
| | `text-slate-900` → `text-secondary` ⚠️ | 226 (titre — **bloqué**, voir note), 453 |
| | `fill-rose-500 text-rose-500` → `fill-accent text-accent` | 298 |
| | `rounded-[24px]` → `rounded-3xl` ✅ | 218, 741 (532 = overlay édition, hors périmètre) |
| | `rounded-t-[32px]` → `rounded-t-4xl` ⚠️ | 763 (sur `Drawer.Content` — zone grise D-01, voir Open Q4) |
| `Profile.tsx` | `text-sky-500` → `text-primary` | 80, 127, 178, 292, 315, 329, 357, 383 |
| | `bg-sky-500` → `bg-primary` | 96, 244, 391 (+212 = code mort, voir Pitfall 6) |
| | `focus:border-sky-500` → `focus:border-primary` | 233 |
| | `border-sky-500` → `border-primary` | 374 (spinner) |
| | `text-slate-800` → `text-text` | 84, 199, 267, 271, 278, 294 |
| | `text-slate-500` → `text-muted` | 89, 225, 366 |
| | `text-slate-900` → `text-secondary` ⚠️ | 255 |
| | `bg-slate-50` → `bg-background` | 76, 157 (fonds de page — sémantiquement exact), 233, 255 |
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
| | `bg-slate-900/40` → `bg-secondary/40` | 22 (backdrop — migre dans le master `Modal`) |

⚠️ **Note `text-slate-900` → `text-secondary` :** byte-identique **par valeur** (`--color-secondary: var(--color-slate-900)`), mais sémantiquement bancal (le token est nommé pour un fond de CTA, pas pour du texte de titre). Le précédent Phase 1 (`01-VERIFICATION.md`) note que `--color-secondary` avait « zéro consommateur possible » dans `src/ui/*` ; cette phase serait son premier consommateur. **Décision laissée au planner** — les deux options sont défendables ; ne PAS wirer est le choix conservateur. Sur `SpotDetail.tsx:226` le point est de toute façon académique : cette ligne reste un `motion.h2` (voir `Header`, blocage `layoutId`), donc seule sa classe couleur pourrait changer.

⚠️ **Non wirable — rester littéral** (aucun token correspondant, précédent Pitfall 5 Phase 2) : `slate-400` (29 occurrences cumulées), `slate-300`, `slate-600`, `slate-700`, `slate-100`/`200`, `border-slate-100`/`50`, `sky-50`/`100`/`600`/`700`, `hover:bg-sky-400`, `from-sky-500 to-blue-600`, `from-sky-400 to-blue-500/600`, `shadow-sky-500/25`, `shadow-sky-200`, `shadow-blue-500/30`, `emerald-500`/`600`, `amber-400`/`100`/`700`, `teal-500`/`100`/`700`, `pink-100`/`700`, `bg-black/60`, `bg-black/95`, `bg-white/70`, `white/10`, `white/20`.

✅ **Gain « valeur arbitraire » gratuit :** `rounded-[24px]` → `rounded-3xl` est byte-identique car Tailwind v4 définit `--radius-3xl: 1.5rem` = 24 px par défaut [VERIFIED: `node_modules/tailwindcss/theme.css`]. Idem `rounded-t-[32px]` → `rounded-t-4xl` (`--radius-4xl: 2rem`, présent à la fois dans les défauts v4 **et** redéclaré à l'identique dans `src/index.css:21` — redondance inoffensive). Supprimer ces valeurs arbitraires sert directement DS-01 (« aucune valeur de design en dur »).

## Architecture Patterns

### Diagramme de flux — périmètre Phase 3 (état cible)

```
  App.tsx
   ├─ activeTab === 'profile' ──► <Profile>                      ← MONTÉ CONDITIONNELLEMENT (clé PERF-02)
   │                                ├─ if (!user) → branche anonyme (retour anticipé, L71-152)
   │                                │     └─ avatar? non · 0 <img>
   │                                └─ branche authentifiée (L156-449)
   │                                      ├─ <img avatar>  ────────────────► loading="lazy" ? gain ≈ 0 (en viewport)
   │                                      ├─ grid stats ──► <Card> ×2       ✅ MATCH EXACT
   │                                      ├─ rangées réglages (custom)      → wiring tokens seul
   │                                      ├─ « Log Out » ──► <Button secondary>  ✅ MATCH EXACT
   │                                      ├─ <PremiumModal>  ──► <Modal surface="light" layout="center">  ⚠️ À CRÉER
   │                                      │        └─ <Header surface="light" title>  ✅ MATCH EXACT
   │                                      └─ <CommunityStatsScreen>  (fixed inset-0, PAS un Modal)
   │                                               ├─ KPI ──► <Card> ×2     ✅ MATCH EXACT
   │                                               └─ liste pays · 0 <img> (drapeaux = emoji unicode)
   │
   └─ selectedSpot ──► <SpotDetail>                              ← MONTÉ CONDITIONNELLEMENT (AnimatePresence)
          ├─ desktop : motion.div sidebar  ──► {content}
          ├─ mobile  : vaul Drawer.Root/Portal/Content ──► {content}     🔒 INTACT (D-01)
          │                └─ Drawer.Portal ──► {lightbox}   🔒 portail load-bearing (touch isolation)
          └─ {content}
               ├─ header : motion.h2 layoutId 🔒 (partagé NearbySpotsList) + badge type + icon-buttons 🔒 (D-02)
               │     └─ <img avatar uploader>  ──► en viewport dès snap 0.35 → NE PAS lazy (Pitfall 5)
               ├─ CTA « Naviguer » (gradient, custom)
               ├─ onglets Info/Avis/Sessions 🔒 (D-03, pas de Tabs DS)
               ├─ Info  : 2 cartes stats (bg-slate-50 → PAS Card) + <img image_urls[0]>  ──► loading="lazy" candidat
               ├─ Avis  : <ReviewList> ──► N × <img avatar>      ← seule vraie surface lazy (Open Q5)
               ├─ Sess. : <SessionList>/<SessionCard> ──► N × <img avatar>   ← idem
               └─ overlay édition (L526-664) ──► ⛔ RECOMMANDÉ HORS PÉRIMÈTRE (UI-03 / Phase 4, Open Q3)

  lightbox : UN SEUL <motion.img key={index}> ─────► prefetch voisins ±1 (Pattern 4), pas de lazy
```

Chemin critique à tracer pour la recette : `Map → clic marker → SpotDetail s'ouvre au snap 0.35 → drag vers 0.95 → onglet Avis → ouverture lightbox → next/prev → fermeture`. Toute régression de gestuelle apparaît sur ce chemin.

### Pattern 1 — Extension de `src/ui/Modal` avec une 3ᵉ forme `light` + `center` (prérequis D-05)

**What :** ajouter la paire supportée `surface="light"` + `layout="center"`, classes extraites **verbatim** de `PremiumModal.tsx:16-30`.
**When to use :** avant toute migration de `PremiumModal`. C'est le miroir exact du Pitfall 1 de la Phase 2.

État actuel du dispatch (Modal.tsx:30-37) — à remplacer :

```tsx
// ACTUEL : dispatch binaire, rejette les paires mixtes
const isLightSheet = surface === 'light' || layout === 'sheet';
if (isLightSheet) {
    if (import.meta.env.DEV && (surface !== 'light' || layout !== 'sheet')) {
        console.warn('Modal: `surface="light"` and `layout="sheet"` are only supported together; …');
    }
    /* … forme bottom-sheet claire … */
}
/* … forme glass centrée (défaut) … */
```

Cible — dispatch 3 voies (les 2 formes existantes restent **inchangées** ; `glass`+`sheet` reste non supportée) :

```tsx
// Nouvelle forme : light + center — classes verbatim de PremiumModal.tsx:16-30.
// Pas de bouton close intégré : celui de PremiumModal est un bouton flottant absolu
// dans le contenu (précédent : la forme light+sheet n'en a pas non plus, cf. FiltersModal
// où le close vit dans <Header onClose>).
if (surface === 'light' && layout === 'center') {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
```

**Différences à ne PAS « harmoniser »** (elles sont load-bearing) :

| Aspect | glass + center | light + sheet | **light + center (nouveau)** |
|--------|----------------|---------------|------------------------------|
| padding wrapper | `p-4` | — (`items-end sm:items-center`) | **`p-6`** |
| backdrop | classes statiques sur le wrapper, `bg-black/60 backdrop-blur-md` | enfant statique `bg-black/20 backdrop-blur-sm` | **enfant `motion.div` animé en fondu, `bg-slate-900/40 backdrop-blur-sm`** |
| panneau | `bg-white/10 backdrop-blur-xl border border-white/20 rounded-4xl p-8` | `bg-white … rounded-t-3xl p-6` | **`bg-white rounded-3xl p-8`** |
| animation | `scale` seul | `y: 100%` | **`scale` + `y: 20`** |
| z-index | `z-[5000]` | `z-[3000]` | **`z-[5000]`** |
| close intégré | oui (`<Button ghost iconOnly>`) | non | **non** |

**Rétro-compatibilité — VÉRIFIÉE :** consommateurs actuels de `src/ui/Modal` = `AuthModal.tsx` (défauts `glass`/`center`) et `FiltersModal.tsx` (`surface="light" layout="sheet"` explicite). Aucun ne passe `light`+`center`. La nouvelle branche est donc **inatteignable** pour eux → risque de régression nul. [VERIFIED: `grep -rn "from '../ui/" src/`]

**Option de wiring de token dans le master :** `bg-slate-900/40` → `bg-secondary/40` et `bg-slate-900` → `bg-secondary` sont byte-identiques (Tailwind v4 compile le modificateur d'opacité en `color-mix(in oklab, var(--color-secondary) 40%, transparent)`, et `--color-secondary: var(--color-slate-900)`). À prouver en CSS compilé selon la méthodo `01-VERIFICATION.md` avant de committer.

### Pattern 2 — Migration `PremiumModal` (cible complète)

```tsx
import Modal from '../ui/Modal';
import Header from '../ui/Header';

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
    const { t } = useLanguage();
    return (
        <Modal isOpen={isOpen} onClose={onClose} surface="light" layout="center">
            {/* close : reste custom (aucun variant Button ne matche — précédent D-02 / A4) */}
            <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-muted hover:bg-slate-200 transition-colors"
            >
                <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
                    <Sparkles size={32} className="text-white" />
                </div>

                {/* MATCH EXACT : Header light rend `text-2xl font-bold text-text mb-2` */}
                <Header surface="light" title={t('premium.title')} />

                {/* <p> custom : subtitle de Header ajouterait text-sm et retirerait leading-relaxed */}
                <p className="text-muted mb-8 leading-relaxed">{t('premium.desc')}</p>

                {/* CTA custom : py-3.5 hors échelle + bg-slate-900 sans variant */}
                <button onClick={onClose} className="w-full py-3.5 bg-secondary text-white font-bold rounded-xl active:scale-95 transition-all">
                    {t('premium.btn')}
                </button>
            </div>
        </Modal>
    );
}
```

⚠️ Le `<button>` close est `absolute` : il dépend du `relative` porté par le panneau du master (présent dans la nouvelle forme, `relative w-full max-w-sm …`). Vérifier visuellement.
⚠️ `aria-label="Close"` est un **ajout** (le bouton actuel n'en a pas). C'est une amélioration a11y sans effet visuel, cohérente avec le contrat de `Button` (Button.tsx:51-55). Signaler comme écart assumé, ou omettre si l'exécuteur veut du strict zéro-changement.

### Pattern 3 — `loading="lazy"` : où le poser, où NE PAS le poser

```tsx
// ✅ POSER — image de contenu, sous la ligne de flottaison du drawer/scroll (SpotDetail:409)
<img src={spot.image_urls[0]} alt={spot.name} loading="lazy" className="w-full h-full object-cover …" />

// ✅ POSER — avatars d'une liste scrollable potentiellement longue (ReviewList:47, SessionCard:85)
<img src={review.profiles!.avatar_url!} alt={displayName} loading="lazy" className="w-8 h-8 rounded-full object-cover" />

// ❌ NE PAS POSER — image en viewport dès l'ouverture : aucun gain + risque du bug Safari 15.4 (Pitfall 5)
<img src={uploaderProfile.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />   // SpotDetail:246
<img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />            // Profile:164

// ❌ NE PAS POSER — c'est LE contenu du viewer plein écran (LCP de la lightbox)
<motion.img key={currentPhotoIndex} src={spot.image_urls[currentPhotoIndex]} … />               // SpotDetail:721

// ❌ INUTILE — src = blob: local, aucun réseau (et bug de leak préexistant, cf. Pitfall 7)
<img src={URL.createObjectURL(file)} … />                                                        // SpotDetail:622
```

**Aucun risque de CLS :** tous les conteneurs sont pré-dimensionnés par des classes (`aspect-video`, `w-5 h-5`, `w-8 h-8`, `w-24 h-24`) et les `<img>` portent `w-full h-full object-cover`. Le rendu ne dépend donc pas des dimensions intrinsèques — l'avertissement MDN « toujours mettre width/height sur les images lazy » ne s'applique pas ici. [CITED: developer.mozilla.org — « explicit width and height … especially important for lazy-loaded » ; VERIFIED: lecture des conteneurs]

### Pattern 4 — Prefetch des voisins ±1 du carrousel (réinterprétation de D-06, résout la contradiction avec D-03)

**Problème :** D-06 demande « visible + voisines ±1 eager, reste lazy », mais la lightbox ne contient **qu'une** balise `<img>` (SpotDetail:721-730, `key={currentPhotoIndex}` → remontage à chaque navigation). Il n'y a pas de voisines à marquer. Restructurer en bande multi-images violerait D-03 **et augmenterait** les requêtes.

**Solution — préchargement hors DOM, zéro impact sur la structure :**

```tsx
// SpotDetail.tsx — précharge les voisines quand la lightbox est ouverte.
// Aucun <img> ajouté au DOM → D-03 respecté (carrousel « tel quel »).
// Aucune requête au chargement initial de la fiche → PERF-02 non dégradé.
useEffect(() => {
    if (!isImageOpen || !spot?.image_urls || spot.image_urls.length < 2) return;
    const n = spot.image_urls.length;
    const neighbours = [
        spot.image_urls[(currentPhotoIndex + 1) % n],
        spot.image_urls[(currentPhotoIndex - 1 + n) % n],
    ];
    neighbours.forEach(src => { const img = new Image(); img.src = src; });
}, [isImageOpen, currentPhotoIndex, spot?.id]);
```

**Pourquoi `new Image()` et pas `<link rel="preload">` :** `new Image()` remplit le cache HTTP sans manipuler le `<head>`, sans dépendance, et sans avertissement console « preloaded but not used » si l'utilisateur ferme la lightbox. Le modulo reproduit exactement le wrap-around déjà implémenté par les boutons prev/next (SpotDetail:701, 711).

**Bénéfice mesurable (métrique PERF-02 recommandée) :** aujourd'hui, chaque clic next/prev déclenche une requête réseau au moment du clic (délai perceptible). Après prefetch : **0 nouvelle requête** au clic (servie depuis le cache) → c'est un delta avant/après **réellement non nul**, contrairement au comptage « au chargement initial » (voir Pitfall 4).

### Anti-Patterns à éviter

- **Envelopper `PremiumModal` dans `<Modal>` sans ajouter la forme `light`+`center`** → carte glass translucide + texte blanc sur fond clair = illisible, ou bottom-sheet qui slide. Régression majeure garantie (Pitfall 1).
- **Migrer `motion.h2 layoutId` vers `<Header>`** → casse l'animation d'élément partagé `NearbySpotsList` ↔ `SpotDetail` (Pitfall 2).
- **Migrer les cartes stats de `SpotDetail` vers `<Card>`** → `bg-slate-50` devient `bg-white` + ajout de `shadow-sm`. Régression visuelle.
- **Déplacer la lightbox hors de `Drawer.Portal` sur mobile** → les touch events remontent au gesture handler de `vaul` (le commentaire SpotDetail:668-670 documente que cette structure est délibérée). Régression de gestuelle.
- **Poser `loading="lazy"` sur les avatars en viewport** → aucun gain + expose au bug Safari 15.4 d'images qui ne se chargent jamais (Pitfall 5).
- **Restructurer la lightbox en bande de N `<img>`** pour « pouvoir appliquer D-06 littéralement » → viole D-03 et **augmente** le nombre de requêtes.
- **Wirer `border-slate-100` → `bg-background`/`--color-background`** → slate-100 ≠ slate-50, nuances distinctes. Précédent explicite `01-VERIFICATION.md`.
- **« Harmoniser » `rounded-3xl` (Profile) et `rounded-2xl` (Card)** → Card.tsx:15 documente que les rayons distincts sont **intentionnellement non unifiés**.
- **Toucher au `pt-[calc(1rem+env(safe-area-inset-top))]` de `CommunityStatsScreen.tsx:90`** → fix safe-area antérieur, régression iOS (CONTEXT § Specifics).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Différer le chargement des images | `IntersectionObserver` custom, placeholders blur, lib de lazy-load | Attribut natif `loading="lazy"` (D-06) + **montage conditionnel React déjà en place** | Zéro dépendance, zéro code à maintenir ; dans cette app le montage conditionnel fait déjà 90 % du travail. |
| Précharger les images voisines | Cache applicatif, `Map<string, Blob>`, service worker | `new Image().src = url` + cache HTTP du navigateur | 2 lignes, pas d'état à invalider, réutilise le CDN Supabase. |
| Drag-to-dismiss du bottom-sheet | Handler `onPointerMove`/`transform` maison | `vaul` (déjà en place, D-01) | Gère la vélocité, les snap points, le scroll interne, l'accessibilité. |
| Animation d'élément partagé liste↔fiche | Calcul de `getBoundingClientRect` + transitions manuelles | `framer-motion` `layoutId` (déjà en place) | Déjà fonctionnel ; le casser est la principale régression latente de cette phase. |
| Coque de dialogue (backdrop, panneau, animation, z-index) | Nouveau markup ad hoc dans `PremiumModal` | Étendre `src/ui/Modal` d'une 3ᵉ forme | C'est précisément l'objet de DS-02 ; l'extension bénéficie aux futurs dialogues clairs. |
| Cartes de statistiques | Nouvelle div stylée | `<Card>` (match exact ×4) | Le seul endroit où le master s'applique littéralement. |

**Key insight :** comme en Phase 2, la valeur de cette phase est de **supprimer** du markup dupliqué et des valeurs arbitraires — pas d'en ajouter. Le corollaire inconfortable est que la surface de suppression est petite (7 sites) : le reste du gain UI-01/UI-02 est du **wiring de tokens**, et il faut l'assumer explicitement dans le plan plutôt que de forcer des migrations non byte-identiques pour gonfler le score.

## Runtime State Inventory

> Phase de refactor — inventaire requis. Tous les changements sont **code-only**.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | **Aucun** — aucune classe Tailwind, nom de composant ni token n'est persisté. Les données touchées en lecture (`spots`, `reviews`, `profiles`, `sessions` via Supabase) ne stockent aucune valeur de design. Les `avatar_url`/`image_urls` sont des URLs Supabase Storage inchangées. [VERIFIED: lecture des requêtes `supabase.from(...)` dans les 4 fichiers] | Aucune |
| **Live service config** | **Aucun** — pas de workflow n8n, dashboard ou ACL référençant ces composants. Supabase Storage (buckets `spots`, avatars) n'est pas reconfiguré. | Aucune |
| **OS-registered state** | **Aucun** — aucun renommage de tâche/process/plist. | Aucune |
| **Secrets/env vars** | **Aucun** — aucun nom de secret ni de variable d'env touché. `__APP_VERSION__` (injecté par `vite.config.ts`) est consommé en lecture par `Profile.tsx:149,439` et reste inchangé. | Aucune |
| **Build artifacts** | **Aucun** — pas de renommage de package. `dist/` sera régénéré normalement par `npm run build`. Aucun `egg-info`/binaire compilé concerné. | Aucune |
| **Cache navigateur / device** | ⚠️ **Un point de vigilance** : `src/lib/offline.ts` expose `cacheSpotImages()` (relevé en Phase 2 comme candidat MAP-02 écarté, différé Phase 5). Si ce cache pré-charge des images de spots, il pourrait **masquer** l'effet du lazy loading dans la mesure PERF-02. **À vérifier au moment du plan** : si `cacheSpotImages()` est appelé au démarrage, la baseline doit soit le neutraliser, soit en tenir compte explicitement. [ASSUMED — fichier non lu dans cette recherche, hors périmètre déclaré] | Vérification au plan |

**Conclusion :** aucune migration de données ni de config runtime. Le filet de sécurité est la recette manuelle QA-01.

## Inventaire des images (base factuelle de PERF-02)

[VERIFIED: `grep -rn "<img\|motion.img" src/components/ src/ui/`]

| # | Site | Élément | Chargée quand | Nb simultané | Candidat lazy ? |
|---|------|---------|---------------|--------------|-----------------|
| 1 | `SpotDetail.tsx:246` | avatar uploader (20×20 px) | ouverture de la fiche, **en viewport** dès snap 0.35 | 1 | ❌ non (Pitfall 5) |
| 2 | `SpotDetail.tsx:409` | vignette `image_urls[0]` (`aspect-video`) | ouverture de la fiche, onglet Info, **sous la ligne de flottaison** | 1 | ✅ oui — mais gain probablement nul (Pitfall 4) |
| 3 | `SpotDetail.tsx:610` | photos existantes, grille 3 col. | uniquement si `isEditing` | jusqu'à 5 | ⛔ hors périmètre recommandé (Open Q3) |
| 4 | `SpotDetail.tsx:622` | aperçus nouvelles photos (`blob:`) | uniquement si `isEditing` | jusqu'à 5 | ❌ inutile (blob local) + bug de leak (Pitfall 7) |
| 5 | `SpotDetail.tsx:721` | `motion.img` lightbox | uniquement si `isImageOpen` | **1 (jamais N)** | ❌ non — c'est le contenu ; cible du prefetch (Pattern 4) |
| 6 | `Profile.tsx:164` | avatar profil (96×96 px) | uniquement si `activeTab === 'profile'`, **en viewport** | 1 | ❌ non (gain nul, Pitfall 5) |
| 7 | `ReviewList.tsx:47` | avatar auteur d'avis | uniquement si onglet Avis actif | **N** (1/avis) | ✅ meilleure surface réelle (Open Q5) |
| 8 | `SessionCard.tsx:85` | avatar créateur de session | uniquement si onglet Sessions actif | **N** (1/session) | ✅ idem (Open Q5) |
| 9 | `CommunityStatsScreen.tsx` | **aucune `<img>`** — les drapeaux sont des emoji unicode calculés par `countryCodeToFlag()` | — | 0 | — n/a, à documenter explicitement |

**Conséquences directes pour le plan :**
- La clause de D-06 « éventuelles images de CommunityStatsScreen » se résout à **zéro image** — le confirmer explicitement dans le plan plutôt que de laisser l'ambiguïté.
- 6 des 9 sites sont **déjà** protégés par du montage conditionnel : PERF-02 est en grande partie déjà satisfait avant toute modification.
- `Profile` monté conditionnellement (App.tsx:207 `{activeTab === 'profile' && …}`) ⇒ `loading="lazy"` sur l'avatar du profil n'économise **rien** : quand le composant existe, l'avatar est dans le viewport.

## Common Pitfalls

### Pitfall 1 — La prémisse de D-05 est factuellement fausse : `PremiumModal` n'est pas un modal glass
**What goes wrong :** on suit D-05 littéralement (« utilise déjà la forme glass-center supportée nativement ») et on écrit `<Modal isOpen onClose>{…}</Modal>`. Résultat : panneau `bg-white/10 backdrop-blur-xl` translucide avec bordure blanche, backdrop `bg-black/60 backdrop-blur-md`, rayon 32 px au lieu de 24, `p-4` au lieu de `p-6`, animation sans `y`, **et** un bouton close en `<X className="text-white/70">` injecté par le master par-dessus le close existant. Le contenu (`text-slate-800` sur `bg-white/10`) devient quasi illisible.
**Why it happens :** `PremiumModal` est un dialog **blanc opaque** (`bg-white rounded-3xl p-8`) avec backdrop `bg-slate-900/40 backdrop-blur-sm` — la forme `light`+`center`, qui **n'existe pas** dans le master. Le dispatch actuel (`surface === 'light' || layout === 'sheet'`) route `surface="light"` seul vers le **bottom-sheet**, avec un dev-warning explicite que les paires mixtes ne sont pas supportées.
**How to avoid :** ajouter la 3ᵉ forme AVANT de migrer (§ Pattern 1), classes verbatim, puis vérifier byte-identique (méthodo `01-VERIFICATION.md`).
**Warning signs :** un plan qui migre `PremiumModal` sans tâche préalable d'extension de `Modal` ⇒ régression garantie. C'est le miroir exact du Pitfall 1 de la Phase 2 (`FiltersModal`).
**Impact rétro-compat — VÉRIFIÉ :** seuls `AuthModal` (défauts glass/center) et `FiltersModal` (light/sheet explicite) consomment `Modal`. La nouvelle branche leur est inatteignable → risque nul.

### Pitfall 2 — Migrer le titre de `SpotDetail` casse l'animation d'élément partagé
**What goes wrong :** on remplace `<motion.h2 layoutId={...}>` par `<Header title={spot.name} />`. L'animation morphing du nom du spot depuis la carte de `NearbySpotsList` vers la fiche disparaît silencieusement — aucune erreur, juste une transition en moins.
**Why it happens :** `layoutId={`spot-name-${spot.id}`}` existe à **deux** endroits : `NearbySpotsList.tsx:63` et `SpotDetail.tsx:225`. `framer-motion` apparie ces deux nœuds pour interpoler la transition. `src/ui/Header` rend un `<h2>` DOM nu, sans `motion` ni `layoutId`, et n'expose aucune prop pour les transmettre. [VERIFIED: `grep -rn "layoutId" src/`]
**How to avoid :** garder le `motion.h2` tel quel. Secondairement, `text-slate-900` ≠ `text-text` (slate-800) : même sans `layoutId`, la migration ne serait pas byte-identique.
**Warning signs :** un plan qui liste « migrer le header de SpotDetail vers `src/ui/Header` » comme tâche. La formulation de D-01 (« Seul l'intérieur … Header, badges, structure de contenu migre ») invite à cette erreur — le mot « Header » y désigne la **zone** de header, pas le composant `src/ui/Header`.

### Pitfall 3 — UI-01/UI-02 disent « exclusivement les composants du DS » mais la surface byte-identique est de 7 sites
**What goes wrong :** pour satisfaire le critère littéral, on force des migrations non byte-identiques (cartes stats `bg-slate-50` → `Card`, input du nom → `Input` glass, header app-bar → `Header`) et on livre une phase visuellement régressée. Ou, symétriquement, on livre honnêtement et la vérification échoue sur le libellé.
**Why it happens :** `src/ui/*` a été extrait de `AuthModal` (surface glass) + de quelques ancres (`Profile:265`, `Profile:431`, `NearbySpotsList:18`, `FiltersModal:38-43`, `AdminDashboard:439`). `SpotDetail` et `CommunityStatsScreen` n'ont **contribué aucune** ancre — leurs formes n'existent donc pas dans le DS.
**How to avoid :** planifier explicitement un **override documenté** sur la formulation littérale, en suivant le précédent `01-VERIFICATION.md` (DS-01/DS-02 fermés par override après épuisement de tous les matches 1:1). Le plan doit énoncer le critère atteignable : *« tout markup ayant un équivalent byte-identique dans `src/ui/*` a été migré (7 sites, énumérés) ; toute couleur/rayon ayant une correspondance 1:1 avec un token est câblé ; le reste n'a aucun équivalent DS et resterait une invention visuelle »*. Fournir le tableau d'inventaire ci-dessus comme preuve d'exhaustivité.
**Warning signs :** un plan qui promet « SpotDetail utilise Card, Header, Button, Modal » sans qualifier — il ne pourra pas tenir sans régression.

### Pitfall 4 — La mesure PERF-02 « requêtes au chargement initial » donnera très probablement un delta nul
**What goes wrong :** Wave 0 capture la baseline, le lazy loading est implémenté correctement, la mesure « après » donne **le même nombre de requêtes** → PERF-02 semble non atteint alors que le code est correct.
**Why it happens :** trois causes cumulées :
1. **Montage conditionnel déjà en place** — 6 des 9 sites d'images ne sont montés que quand leur écran/onglet est actif (App.tsx:207 pour `Profile`, `activeTab` pour Avis/Sessions, `isEditing` pour la grille d'édition, `isImageOpen` pour la lightbox). `loading="lazy"` n'a rien à différer.
2. **Le seuil de déclenchement de Chromium est d'environ 1250 px sous le viewport en 4G** (2500 px en 3G) [CITED: web.dev/articles/browser-level-image-lazy-loading]. Le `Drawer.Content` de `vaul` fait `h-full` (100 vh) et est positionné `fixed bottom-0` avec un translate ; au snap 0.35, le contenu sous la ligne de flottaison dépasse le bas de l'écran d'au plus ~65 vh (≈ 600 px sur un iPhone). La vignette `image_urls[0]` tombe donc **dans** le seuil → Chrome la charge quand même.
3. **Le clipping `overflow: hidden` n'est pas fiablement honoré** par l'implémentation native (des retours contradictoires existent : `display:none` empêche le chargement, `opacity:0` non ; le cas `overflow:hidden` n'est pas spécifié) [MEDIUM confidence — sources communautaires, pas de spec].
**How to avoid :** définir dans le plan une métrique **qui bouge réellement**, en plus du comptage initial :
- **Métrique A (recommandée, delta garanti non nul) :** requêtes image déclenchées **au clic next/prev dans la lightbox**. Avant = 1 requête réseau par navigation ; après prefetch ±1 (Pattern 4) = **0**. Directement aligné sur l'intention de D-06 (« évite un délai perceptible au clic next/prev »).
- **Métrique B :** requêtes au chargement initial de la fiche/du profil (le comptage demandé par D-06) — à capturer, en documentant honnêtement un delta possible de 0 avec sa cause.
- **Métrique C :** audit DOM — nombre de `<img>` portant `loading="lazy"` (0 → N), preuve d'implémentation.
- Optionnel : rejouer la métrique B avec throttling **Slow 3G** *et* la vérification que le montage conditionnel n'a pas régressé.
**Warning signs :** un plan dont le seul critère PERF-02 est « moins de requêtes au chargement initial » — il est probablement invérifiable sur cette base de code.

### Pitfall 5 — `loading="lazy"` peut empêcher une image de s'afficher (bug Safari 15.4) et le support iOS est plus tardif qu'annoncé
**What goes wrong :** un avatar ou une vignette ne s'affiche jamais sur certains iPhones — régression fonctionnelle silencieuse, et invisible en test Chrome desktop.
**Why it happens :** deux faits :
- Des rapports documentés indiquent que sur **Safari/Chrome iOS 15.4**, le lazy loading échoue de manière intermittente sur les premières images de la page. [MEDIUM confidence — issues WP-Rocket #4961, Jetpack #23553]
- **Le support iOS est incertain** : le WebKit blog annonce la fonctionnalité en **Safari 15.4** ; caniuse indique le support complet sur **Safari iOS à partir de 16.4** (désactivé par défaut de 13.4 à 16.3). Les deux sources se contredisent. Et surtout, la cible de déploiement de ce projet est **plus basse que 15.4** : `IPHONEOS_DEPLOYMENT_TARGET = 14.0` (deux configurations) / `15.6` (une), `platform :ios, '15.0'` dans le `Podfile`. [VERIFIED: `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/Podfile`]
**How to avoid :**
- **Dégradation gracieuse acquise :** sur un WebView qui ignore l'attribut, l'image se charge eagerly = comportement actuel. **Aucun risque de régression fonctionnelle** de ce côté.
- **Ne poser `loading="lazy"` que sur des images non critiques** (vignette dans un scroll, avatars de liste) — jamais sur l'avatar uploader ni sur l'avatar du profil, qui sont le contenu visible immédiat. Cela neutralise l'exposition au bug 15.4.
- Corriger la prémisse de D-06 dans le plan : « support natif suffisant (WebView Capacitor iOS 15.4+) » est optimiste — sur iOS 14.0–15.3 (voire < 16.4) l'attribut est simplement ignoré, donc PERF-02 n'apporte aucun gain sur ces appareils. À énoncer, pas à masquer.
**Warning signs :** vérification faite uniquement au navigateur desktop, sans passage sur device iOS dans la checklist QA-01.

### Pitfall 6 — `Profile.tsx` contient du code mort qu'il ne faut pas migrer
**What goes wrong :** on « harmonise » des branches inatteignables : effort gaspillé, diff gonflé, et un futur lecteur croit que ce code est vivant.
**Why it happens :** `Profile.tsx:71` fait un retour anticipé `if (!user) { return <branche anonyme /> }`. Après cette ligne, `user` est **toujours** truthy. Or la branche authentifiée contient encore : le ternaire `{user ? … : <bouton "Sign In / Join">}` (L202-218 — le `else` est mort), et les gardes `{user && …}` (L174, L223, L276, L428) qui sont toujours vraies. La chaîne `'Guest'` (L200) est également inatteignable.
**How to avoid :** ne pas migrer les branches mortes ; les signaler pour **CODE-01 (Phase 5)** plutôt que de les supprimer ici (la suppression de code mort est explicitement Phase 5). Le wiring de `bg-sky-500` → `bg-primary` sur L212 est sans effet observable — le mentionner comme tel.
**Warning signs :** une tâche de plan qui compte L212 dans les occurrences « à vérifier visuellement » — il n'y a rien à voir.

### Pitfall 7 — `URL.createObjectURL` appelé en rendu dans l'overlay d'édition (même famille de bug que MAP-02)
**What goes wrong :** `SpotDetail.tsx:622` fait `<img src={URL.createObjectURL(file)} />` **directement dans le JSX**. Un nouveau blob URL est créé à **chaque rendu** de l'overlay et **jamais** révoqué → fuite mémoire non bornée pendant l'édition.
**Why it happens :** exactement le même anti-pattern que celui corrigé en Phase 2 dans `AddSpotForm` (MAP-02/D-03), sous une forme plus grave (création en rendu, zéro révocation).
**How to avoid :** **hors périmètre de cette phase** (c'est un bug fonctionnel dans le formulaire d'édition ⇒ Phase 4 / UI-03, voir Open Q3). Deux règles pour le plan : (1) **ne pas le régresser** ; (2) le **consigner** comme todo ou le signaler au planner Phase 4. Ne pas le corriger opportunément ici — cela mélangerait un fix de bug avec une migration DS, contre le précédent Phase 2 (D-03 isolé dans son propre plan).
**Warning signs :** une tâche qui « nettoie » l'overlay d'édition en passant.

### Pitfall 8 — Toucher au portail de la lightbox ou à la coque `vaul` casse la gestuelle
**What goes wrong :** en « harmonisant » la structure de `SpotDetail`, on déplace la lightbox hors de `Drawer.Portal`, ou on modifie les classes de `Drawer.Content`. Le drag-to-dismiss se déclenche alors quand l'utilisateur swipe dans la lightbox, ou les snap points cassent.
**Why it happens :** la structure est délibérée et documentée en commentaire (SpotDetail:668-670, 769-770) : la lightbox est rendue **dans** `Drawer.Portal` sur mobile pour que ses pointer events n'atteignent pas le gesture handler de `vaul`, et via `createPortal(document.body)` sur desktop. Les `onPointerDown`/`onTouchStart`/`onTouchEnd` avec `stopPropagation` (L680-682) font partie du même dispositif.
**How to avoid :** traiter la coque `vaul` + les portails + les handlers de touch comme **gelés** (D-01). Le seul changement admissible dans cette zone est `rounded-t-[32px]` → `rounded-t-4xl` sur `Drawer.Content` (classe pure) — et même celui-là est une zone grise (Open Q4).
**Warning signs :** un diff qui touche `Drawer.Root`/`Drawer.Portal`/`Drawer.Content`, `snapPoints`, `modal={false}`, ou l'un des handlers `onTouch*`.

## Code Examples

### `Profile.tsx` — les 3 migrations structurelles (byte-identiques)

```tsx
import Card from '../ui/Card';
import Button from '../ui/Button';

// 1+2. Grille de stats (L264-273) — Card light rend exactement la chaîne actuelle
<div className="grid grid-cols-2 gap-4 mb-8">
    <Card>
        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Spots Added</p>
        <p className="text-2xl font-black text-text">{spotsCount}</p>
    </Card>
    <Card>
        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Favorites</p>
        <p className="text-2xl font-black text-text">{favorites.length}</p>
    </Card>
</div>

// 3. Log Out (L429-435) — variant `secondary` extrait de CETTE ligne en Phase 1 (Button.tsx:23)
<Button variant="secondary" size="lg" onClick={() => signOut()} className="w-full mb-8">
    <LogOut size={18} />
    Log Out
</Button>
```

> `Button` applique déjà `flex items-center justify-center gap-2` (base) + `py-4` (`size="lg"`) + la chaîne `secondary`. Seuls `w-full mb-8` passent par `className`. ⚠️ `Button` ajoute `disabled:opacity-50 disabled:pointer-events-none` à la classe : sans `disabled`/`loading`, ces variantes ne produisent aucun style → rendu identique. À confirmer en DevTools.

### `CommunityStatsScreen.tsx` — KPI + tokens, coque et safe-area intacts

```tsx
// L88 — fond plein écran : bg-background est ici sémantiquement PARFAIT (--color-background = page bg)
<div className="fixed inset-0 z-50 bg-background overflow-y-auto">

  {/* L90 — NE PAS TOUCHER au pt-[calc(...)] : fix safe-area antérieur (CONTEXT § Specifics) */}
  <div className="flex items-center gap-3 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-slate-100 bg-white">
      <button onClick={onClose} className="text-slate-600 hover:text-text transition-colors">
          <ArrowLeft size={24} />
      </button>
      {/* h1 text-lg + flèche à gauche : aucune forme de src/ui/Header ne correspond → reste custom */}
      <h1 className="text-lg font-bold text-text">{t('community_stats.title')}</h1>
  </div>

  {/* L109-122 — les 2 seuls Card exacts de ce fichier */}
  <div className="grid grid-cols-2 gap-4">
      <Card>
          <p className="text-slate-400 text-xs font-bold uppercase mb-1">{t('community_stats.total_spots')}</p>
          <p className="text-2xl font-black text-text">{fmt(totalSpots)}</p>
      </Card>
      {/* … idem total_users … */}
  </div>
```

### Protocole de vérification byte-identique (à rejouer pour chaque wiring, méthodo `01-VERIFICATION.md`)

```bash
# 1. Build CSS et extraire la valeur résolue des deux classes (littérale vs token)
npm run build
grep -oE "\.(text-slate-800|text-text)\{[^}]*\}" dist/assets/*.css

# 2. En DevTools (chrome-devtools-mcp) : comparer getComputedStyle sur l'élément avant/après
#    Attendu : chaîne var() différente, valeur oklch() IDENTIQUE.
#    Exemple prouvé en Phase 1 : .text-text et .text-slate-800 → oklch(27.9% .041 260.031)
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Coque de dialogue dupliquée dans chaque composant (`AnimatePresence` + backdrop + panneau) | Master `src/ui/Modal` à 3 formes (`glass`+`center`, `light`+`sheet`, **`light`+`center` — nouveau**) | Après cette phase, il ne reste que `AddSpotForm`/`AddSpotInfoModal`/`AdminDashboard` à migrer (Phase 4 / hors scope). |
| `rounded-[24px]` / `rounded-t-[32px]` (valeurs arbitraires) | `rounded-3xl` / `rounded-4xl` (échelle Tailwind v4) | Sert DS-01 sans risque : `--radius-3xl: 1.5rem` et `--radius-4xl: 2rem` sont des défauts v4 [VERIFIED: node_modules/tailwindcss/theme.css]. |
| Lazy loading par lib JS (`lazysizes`, `react-lazy-load-image-component`) | Attribut natif `loading="lazy"` | Standard depuis Chrome 77 / Safari 15.4–16.4 ; zéro dépendance. Contrepartie : seuil non configurable (~1250 px), d'où le delta faible ici. |
| Préchargement par `<link rel="preload">` dans le `<head>` | `new Image().src` déclenché par `useEffect` | Adapté à un préchargement conditionnel/éphémère (lightbox ouverte) sans avertissement « preloaded but not used ». |
| Verification visuelle « ça a l'air pareil » | Preuve en CSS compilé + `getComputedStyle` (`01-VERIFICATION.md`) | Méthodo établie en Phase 1, reconduite ici. |

**Déprécié / à corriger (hors périmètre, signalé) :**
- `SpotDetail.tsx:622` — `URL.createObjectURL` en rendu, jamais révoqué (Pitfall 7). Phase 4.
- `Profile.tsx:200-218` — branches inatteignables après le retour anticipé L71 (Pitfall 6). CODE-01 / Phase 5.
- `src/index.css:41` — le commentaire prétend que `--glass-bg`/`--glass-border` sont « consumed by DS-02 components » ; c'est faux, et `01-VERIFICATION.md` note que leur vrai consommateur est `SpotDetail.tsx:417` (`bg-white/70`). Ce fichier étant touché dans cette phase, c'est l'occasion de **corriger le commentaire** (pas les valeurs) si le planner le juge opportun — sinon le laisser.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `loading="lazy"` ne différera pas la vignette de `SpotDetail` en pratique, car elle tombe dans le seuil ~1250 px de Chromium | Pitfall 4 | **Moyen** — si la mesure montre un vrai delta, tant mieux : le critère de D-06 est atteint tel quel et la métrique A devient un bonus. Aucune décision irréversible n'en dépend. |
| A2 | Le clipping `overflow: hidden` du `Drawer.Content` n'est pas fiablement honoré par le lazy loading natif | Pitfall 4 | Faible — la mesure Wave 0/après tranche empiriquement. |
| A3 | Support iOS : contradiction entre WebKit blog (15.4) et caniuse (16.4) non résolue | Pitfall 5 | Faible — dans les deux cas la dégradation est gracieuse (attribut ignoré ⇒ eager ⇒ comportement actuel). Impacte seulement l'ampleur du gain réel sur device. |
| A4 | Le bug Safari 15.4 (images lazy intermittentes) est réel et pertinent | Pitfall 5 | Faible — la mitigation recommandée (ne pas lazy-loader les images en viewport) est de toute façon la bonne pratique. |
| A5 | L'overlay d'édition de `SpotDetail` (L526-664) relève d'UI-03 / Phase 4, pas d'UI-01 | Open Q3 | **Moyen** — si le planner l'inclut, la phase grossit d'environ 140 lignes et ~10 occurrences de wiring, et `src/ui/Input` devra être étendu d'une surface claire (travail non prévu). Décision de périmètre à trancher. |
| A6 | Wirer `text-slate-900` → `text-secondary` est acceptable malgré le décalage sémantique | § wiring de tokens | Faible — byte-identique par valeur ; le choix conservateur (ne pas wirer) est également valide. |
| A7 | `src/lib/offline.ts` / `cacheSpotImages()` pourrait fausser la mesure PERF-02 | Runtime State Inventory | **Moyen** — si ce cache précharge les images de spots au démarrage, la baseline est biaisée. **Fichier non lu** : à vérifier en Wave 0. |
| A8 | `Button` avec `disabled:*` non déclenché ne change pas le rendu du bouton Log Out | Code Examples | Faible — vérifiable en DevTools en 30 s. |
| A9 | Ajouter `aria-label="Close"` au bouton close de `PremiumModal` est un écart acceptable (a11y, zéro visuel) | Pattern 2 | Faible — peut être omis si l'exécuteur veut du zéro-changement strict. |

## Open Questions

1. **UI-01/UI-02 « exclusivement les composants du DS » : comment formuler un critère atteignable ?**
   - Ce qu'on sait : la surface byte-identique est de 7 sites, énumérés et prouvés exhaustivement (§ Inventaire). Aucun composant DS ne s'applique à `SpotDetail` ni à `CommunityStatsScreen`.
   - Ce qui est flou : le libellé du ROADMAP (« utilise exclusivement les composants du design system (Card, Header, Button, Modal) ») est littéralement inatteignable sans régression visuelle.
   - Recommandation : reproduire le mécanisme d'**override documenté** de `01-VERIFICATION.md`. Le plan énonce le critère réel (tous les matches 1:1 migrés + tous les tokens câblés + inventaire d'exhaustivité en annexe) et prépare l'override. **Ne pas** narrower silencieusement, **ne pas** forcer de migration non byte-identique. Candidat à une validation utilisateur rapide via `/gsd:discuss-phase` si le planner préfère verrouiller ce point.

2. **La contradiction D-03 ↔ D-06 sur le carrousel : quelle interprétation retenir ?**
   - Ce qu'on sait : la lightbox ne rend **qu'une** `<img>`. « Voisines ±1 eager, reste lazy » n'a pas de support DOM. Restructurer violerait D-03 et augmenterait les requêtes.
   - Recommandation (Pattern 4) : conserver la lightbox telle quelle + prefetch `new Image()` des voisines quand elle est ouverte. Cela honore l'intention explicite de D-06 (« évite un délai perceptible au clic next/prev ») et respecte D-03. **À confirmer avec l'utilisateur** si le planner considère que réinterpréter une décision verrouillée dépasse sa latitude — l'écart est de forme, pas d'intention.

3. **L'overlay d'édition de `SpotDetail` (L526-664) est-il dans le périmètre de cette phase ?**
   - Ce qu'on sait : c'est le **formulaire d'édition de spot** (champs nom/description, multi-select de type, sélecteur de difficulté, grille photo, bouton Save). `REQUIREMENTS.md` UI-03 = « Les formulaires d'ajout/édition de spot … utilisent les composants du DS (Input, Button, Modal) » → Phase 4. Précédent Phase 2 D-02 : `AddSpotForm` visuellement différé à la Phase 4 tout en vivant dans un fichier du périmètre carte.
   - Recommandation : **exclure** (Phase 4). Retire ~140 lignes, ~10 occurrences de wiring, et évite d'avoir à étendre `src/ui/Input` d'une surface claire dans cette phase. À énoncer explicitement dans le plan pour que la vérification ne le compte pas comme un manque.

4. **`rounded-t-[32px]` sur `Drawer.Content` (SpotDetail:763) : wiring autorisé par D-01 ?**
   - Ce qu'on sait : D-01 gèle la coque `vaul` pour préserver le drag-to-dismiss. Changer une classe de rayon n'affecte aucun comportement gestuel, et `rounded-t-4xl` est byte-identique (2rem = 32px).
   - Recommandation : wirer (gain DS-01 réel, risque nul), en documentant que « coque intacte » porte sur la **structure et le comportement**, pas sur les chaînes de classes. Si le planner préfère la lecture strictement littérale, laisser tel quel — coût : une valeur arbitraire résiduelle.

5. **Les avatars de `ReviewList.tsx:47` et `SessionCard.tsx:85` sont-ils dans le périmètre de PERF-02 ?**
   - Ce qu'on sait : ils sont rendus **à l'intérieur** de la fiche détail (onglets Avis/Sessions), donc couverts par le libellé « images des fiches détaillées ». Mais D-06 ne les cite pas (il ne cite que « carrousel SpotDetail, avatar Profil, images CommunityStats »). Ce sont pourtant les **seuls** sites avec N images simultanées dans un conteneur scrollable — la seule surface où le lazy loading natif peut réellement différer quelque chose.
   - Recommandation : **inclure** (2 lignes, 2 fichiers, zéro risque visuel — conteneurs `w-8 h-8` pré-dimensionnés). Sans eux, PERF-02 n'a pratiquement aucune surface d'action réelle. À signaler comme extension mineure de périmètre plutôt que de l'appliquer en silence.

6. **`cacheSpotImages()` (`src/lib/offline.ts`) fausse-t-il la baseline PERF-02 ?**
   - Ce qu'on sait : relevé en Phase 2 comme candidat MAP-02 écarté (« bloque le thread principal, pas de retry »), différé Phase 5. Fichier non lu dans cette recherche.
   - Recommandation : le lire en **Wave 0** avant de figer la baseline. S'il précharge des images de spots au démarrage, la neutraliser ou la documenter dans `03-BASELINE.md`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm | `npm run dev`, `npm run build` | ✓ | Node **v26.0.0**, npm 11.12.1 | — |
| `chrome-devtools-mcp` | Mesure PERF-02 avant/après (méthodo `02-BASELINE.md`) | ✓ configuré | `.mcp.json` → `npx -y chrome-devtools-mcp@latest` (non épinglé) | Onglet Network de Chrome à la main + `performance.getEntriesByType('resource')` |
| Chrome (DevTools Network / throttling) | Comptage des requêtes image, Slow 3G | ✓ | — | — |
| React DevTools (extension) | Non requis cette phase (pas de travail Profiler) | ✗ | — | n/a — la Phase 2 s'en est passée via `console.count` |
| Device iOS (recette QA-01 + vérif lazy sur WebView réelle) | Pitfall 5 (bug Safari 15.4, support < 16.4) | ⚠️ humain requis | — | **Aucun** — la vérification desktop ne couvre pas ce risque |
| Compte de test admin (`updock.app@gmail.com`) | Ouvrir l'overlay d'édition, tester les avatars d'avis/sessions authentifiés | ✓ (utilisé en Phase 2) | — | Certains chemins sont verrouillés sans session |
| `slopcheck` | Audit de légitimité de packages | n/a | — | Aucun package installé cette phase |

**Missing dependencies with no fallback :** vérification sur device iOS réelle (nécessite une action humaine dans la checklist QA-01) — c'est le seul moyen de couvrir Pitfall 5.
**Note :** le blocker `STATE.md` « cap doctor/sync requièrent Node >= 22 (env actuel v20) » est **résolu** — l'environnement est maintenant en Node v26.0.0. [VERIFIED: `node --version`]

## Validation Architecture

> `nyquist_validation` absent de `.planning/config.json` (⇒ activé par défaut), **mais** contrainte projet explicite « pas d'infra de test automatisé » (`REQUIREMENTS.md` § Out of Scope ; CODE-03 futur). La validation est donc **manuelle + instrumentée**, comme en Phase 2.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **Aucun** (contrainte projet — recette manuelle QA-01) |
| Config file | none |
| Quick run command | `npm run build` (typecheck `tsc -b` + build) puis `npm run dev` + vérif visuelle de l'écran touché |
| Full suite command | Recette manuelle mobile (checklist QA-01) + comparaison `03-BASELINE.md` avant/après |

### Phase Requirements → Vérification

| Req ID | Behavior | Type de vérif | Commande / méthode | Automatisé ? |
|--------|----------|---------------|--------------------|--------------|
| UI-01 | `SpotDetail` : tout match 1:1 migré, tous les tokens câblés, rendu inchangé | Byte-identique CSS + visuelle | `npm run build` + `grep` des classes dans `dist/assets/*.css` + `getComputedStyle` avant/après ; captures avant/après de la fiche (snap 0.35 et 0.95, 3 onglets) | ❌ manuel |
| UI-01 | Drag-to-dismiss, snap points, lightbox, `layoutId` liste↔fiche intacts | Fonctionnelle (gestuelle) | Recette : `Map → marker → drag 0.35↔0.95 → swipe to dismiss → lightbox next/prev → close` sur device | ❌ manuel (device) |
| UI-02 | `Profile` : 2×`Card` + 1×`Button secondary` + tokens ; `PremiumModal` : `Modal light/center` + `Header` ; `CommunityStats` : tokens | Byte-identique CSS + visuelle | idem ; captures avant/après des 3 écrans (dont profil anonyme **et** authentifié) | ❌ manuel |
| UI-02 | `Modal light/center` ne régresse ni `AuthModal` ni `FiltersModal` | Non-régression | Ouvrir les deux modaux, comparer aux captures Phase 1/2 (`audit/screenshots/`) | ❌ manuel |
| UI-02 | Safe-area de `CommunityStatsScreen` non régressée | Visuelle device | Ouvrir l'écran sur iPhone à encoche, vérifier que le titre n'est pas sous la status bar | ❌ manuel (device) |
| PERF-02 | Métrique A — requêtes au clic next/prev de la lightbox : **1 → 0** | Réseau chiffré | DevTools Network filtré `Img`, cache désactivé, ouvrir la lightbox d'un spot à 5 photos, cliquer next ×4, compter les requêtes | ❌ manuel (chrome-devtools-mcp) |
| PERF-02 | Métrique B — requêtes image au chargement initial fiche/profil (métrique demandée par D-06) | Réseau chiffré | idem ; delta possiblement 0 → documenter la cause (Pitfall 4) | ❌ manuel |
| PERF-02 | Métrique C — audit DOM : nombre de `<img loading="lazy">` | Scriptable | `document.querySelectorAll('img[loading="lazy"]').length` sur chaque écran | ❌ manuel (1 ligne) |
| QA-01 | Zéro régression fonctionnelle sur fiche spot + profil | Recette manuelle mobile | Checklist QA-01 (carte, fiche spot, favoris, avis, session, profil, auth, premium, stats communauté) | ❌ manuel |

### Sampling Rate

- **Par commit de tâche :** `npm run build` (le typecheck `tsc -b` attrape les erreurs de props sur les composants DS) + vérif visuelle de l'écran touché en `npm run dev`.
- **Par merge de wave :** recette du flux impacté (fiche spot / profil / premium / stats) + comparaison de captures.
- **Phase gate :** `03-BASELINE.md` renseigné avant/après (métriques A/B/C) + checklist QA-01 à 100 % sur mobile réel + `getComputedStyle` prouvant chaque wiring de token.

### Protocole de mesure PERF-02 (à exécuter AVANT toute modification — GATE Wave 0)

Calqué verbatim sur l'esprit de `02-BASELINE.md` (dev build Vite dans Chrome piloté par `chrome-devtools-mcp`, **pas** le build iOS).

1. `npm run dev`. Ouvrir Chrome via `chrome-devtools-mcp`. Se connecter avec le compte de test admin.
2. **Neutraliser les biais :** DevTools → Network → cocher « Disable cache ». Vérifier l'effet de `cacheSpotImages()` (`src/lib/offline.ts`, Open Q6) et le documenter.
3. **Choisir un spot de référence** ayant le maximum de photos (idéalement 5, via `image_urls`) **et** plusieurs avis avec avatars. Consigner son `id` dans `03-BASELINE.md` — la mesure « après » doit porter sur le **même** spot.
4. **Métrique B (chargement initial de la fiche) :** vider le cache, recharger, aller sur la carte, cliquer le marker. Compter les requêtes de type `Img` déclenchées **avant** toute interaction (snap 0.35). Instrument scriptable recommandé :
   `performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img').length`
   — relevé juste avant le clic puis 2 s après l'ouverture ; la différence est le compte.
5. **Métrique B bis (profil) :** recharger, aller sur l'onglet Profil, compter de la même façon.
6. **Métrique A (navigation dans la lightbox) :** ouvrir la lightbox, réinitialiser le compteur, cliquer « next » 4×, compter les nouvelles requêtes `Img`. Baseline attendue ≈ 4 (une par navigation). Cible après prefetch ≈ 0-1.
7. **Métrique C (audit DOM) :** `document.querySelectorAll('img[loading="lazy"]').length` sur la fiche (chaque onglet) et sur le profil. Baseline attendue : 0 partout.
8. **Métrique B ter (optionnelle, throttling) :** rejouer l'étape 4 en « Slow 3G » — le seuil de déclenchement du lazy passe à ~2500 px, ce qui **réduit** encore les chances de différer. À consigner comme donnée, pas comme cible.
9. Archiver tout cela dans `.planning/phases/03-fiches-d-taill-es-profils/03-BASELINE.md`. **Aucun fichier source ne doit être modifié avant que ce fichier soit rempli de chiffres réels** (gate Wave 0, même discipline que Phase 2).
10. Rejouer les étapes 4-7 après refactor → comparer. **Un delta nul sur la métrique B est un résultat légitime à documenter** (avec sa cause : montage conditionnel déjà en place + seuil Chromium), pas un échec à masquer.

### Wave 0 Gaps

- [ ] Créer `03-BASELINE.md` et le renseigner avec des chiffres réels (métriques A, B, B bis, C) **avant** toute modification de source.
- [ ] Lire `src/lib/offline.ts` / `cacheSpotImages()` et documenter son effet sur la baseline (Open Q6 / A7).
- [ ] Choisir et consigner le spot de référence (≥ 5 photos, plusieurs avis avec avatars).
- [ ] `grep -rn "from '../ui/" src/` pour re-confirmer la liste des consommateurs de `Modal` avant extension (attendu : `AuthModal`, `FiltersModal`).
- [ ] Trancher Open Q3 (overlay d'édition dans le périmètre ou non) et Open Q5 (avatars avis/sessions) — ces deux décisions changent le découpage des plans.
- [ ] Archiver les captures « avant » des 5 surfaces : fiche (3 onglets, snap 0.35 et 0.95), profil anonyme, profil authentifié, PremiumModal, CommunityStats.
- *(Aucun fichier de test à créer — contrainte « pas de tests ».)*

## Security Domain

> `security_enforcement` absent de `.planning/config.json` (⇒ activé par défaut). Cette phase est un **refactor UI/perf** : aucun nouveau flux d'auth, aucune nouvelle entrée serveur, aucune crypto.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | non | `useAuth`/`signOut` consommés à l'identique, aucun changement de flux |
| V3 Session Management | non | Aucun changement |
| V4 Access Control | ⚠️ **à ne pas régresser** | Les gardes existantes doivent survivre au refactor : `!user → onOpenAuth()` sur le cœur favori (SpotDetail:288) et sur l'ouverture de la lightbox (SpotDetail:397) ; `blur-sm` + overlay cadenas sur la vignette pour les non-connectés (SpotDetail:412-421) ; droit d'édition `user?.id === spot.user_id \|\| user?.email === 'updock.app@gmail.com'` (SpotDetail:253) ; `isAdmin` pour la rangée Admin (Profile:154, 414). **Contrôles côté client uniquement — c'est de l'UX, l'autorité reste les RLS Supabase.** À vérifier en recette non-authentifiée. |
| V5 Input Validation | non (cette phase) | Différé Phase 4 (ROBUST-01) — recommandation d'exclure l'overlay d'édition (Open Q3) va dans ce sens |
| V6 Cryptography | non | — |

### Known Threat Patterns pour ce stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Contrôle d'accès côté client contourné (vignette floutée / lightbox verrouillée) | Elevation of Privilege | Les RLS Supabase restent l'autorité ; le flou est cosmétique. **Ne pas régresser** les gardes, mais ne pas les considérer comme une frontière de sécurité. |
| `URL.createObjectURL` non révoquée (fuite de ressource navigateur) | Denial of Service (local) | Pitfall 7 — **hors périmètre**, à consigner pour la Phase 4 |
| Image distante non validée injectée via `avatar_url`/`image_urls` | Tampering | Contexte préexistant : ce sont des URLs Supabase Storage. Ajouter `loading="lazy"` ne modifie ni l'origine ni la validation. Aucun changement de surface d'attaque. |
| `window.location.href = 'app-settings:'` (Profile:352) | — | Schéma iOS existant, non touché |

**Conclusion :** aucun travail de sécurité actif dans cette phase. Le seul point de vigilance est de **ne pas casser les gardes `!user`** en réorganisant le JSX — à couvrir par une passe de recette explicitement non authentifiée.

## Sources

### Primary (HIGH confidence)

- Lecture directe du code : `src/components/{SpotDetail,Profile,CommunityStatsScreen,PremiumModal,FiltersModal,AuthModal,ReviewList,SessionCard,NearbySpotsList}.tsx`, `src/ui/{Modal,Header,Button,Card,Input}.tsx`, `src/index.css`, `src/App.tsx`, `package.json`, `vite.config.ts`.
- Greps exhaustifs : `grep -rn "layoutId" src/` (2 occurrences du même id), `grep -rn "from '../ui/" src/` (2 consommateurs de `Modal`), `grep -rn "<img\|motion.img"` (9 sites), `grep -n "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" -r src/` (4 matches exacts + le master).
- `node_modules/tailwindcss/theme.css` — `--radius-3xl: 1.5rem`, `--radius-4xl: 2rem` (défauts v4).
- `ios/App/App.xcodeproj/project.pbxproj` (`IPHONEOS_DEPLOYMENT_TARGET = 14.0 / 15.6`), `ios/App/Podfile` (`platform :ios, '15.0'`).
- Artefacts de planification : `03-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` § Phase 3/4, `.planning/STATE.md`, `01-CONTEXT.md`, `01-PATTERNS.md`, `01-VERIFICATION.md` (méthodo byte-identique + précédent d'override), `02-CONTEXT.md`, `02-RESEARCH.md`, `02-BASELINE.md`, `02-UI-SPEC.md`, `.planning/todos/country-list-incomplete-other-emoji.md`.

### Secondary (MEDIUM confidence)

- [web.dev — Browser-level image lazy loading](https://web.dev/articles/browser-level-image-lazy-loading) — seuils de déclenchement (~1250 px en 4G, ~2500 px en 3G) ; recommandation de ne pas lazy-loader les images en viewport / LCP ; note sur `display:none` vs `opacity:0`.
- [MDN — `<img>` (attribut `loading`)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) — sémantique `eager`/`lazy`, avertissement width/height & CLS, le report ne s'applique que si JS est activé.
- [WebKit — New WebKit Features in Safari 15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/) — annonce du support de `loading="lazy"`.
- [caniuse — loading-lazy-attr](https://caniuse.com/loading-lazy-attr) — indique un support complet Safari iOS à partir de **16.4** (désactivé par défaut 13.4→16.3) ; **contredit** le blog WebKit → traité comme incertitude explicite (A3).

### Tertiary (LOW confidence — signalé pour validation)

- [wp-media/wp-rocket #4961](https://github.com/wp-media/wp-rocket/issues/4961) et [Automattic/jetpack #23553](https://github.com/Automattic/jetpack/issues/23553) — rapports d'images lazy ne se chargeant pas sur Safari/Chrome iOS 15.4 (Pitfall 5, A4).
- [Drupal #3087472](https://www.drupal.org/project/image_lazy_loader/issues/3087472) — « images don't lazy load if element has overflow: hidden » (A2) : signal communautaire, pas une spec ; à trancher empiriquement en Wave 0.

## Metadata

**Confidence breakdown :**
- **Inventaire de la surface de migration DS : HIGH** — comparaison caractère par caractère des chaînes de classes réelles contre les masters, greps exhaustifs, aucune extrapolation.
- **Blocages structurels (`layoutId`, `Card`/`bg-slate-50`, prémisse D-05, forme `Modal` manquante) : HIGH** — vérifiés par lecture directe + grep, pas par supposition.
- **Wiring de tokens : HIGH** sur la valeur (chaîne `var()` prouvée en Phase 1) / **MEDIUM** sur l'opportunité sémantique de `text-secondary` et `bg-background` (jugement, pas un fait).
- **Comportement de `loading="lazy"` (seuils, clipping, support iOS) : MEDIUM** — sources officielles sur les seuils, sources contradictoires sur le support iOS, signal communautaire seulement sur `overflow:hidden`. La mesure Wave 0 est l'arbitre.
- **Prédiction d'un delta nul sur la métrique B : MEDIUM** — le raisonnement (montage conditionnel + géométrie du drawer vs seuil 1250 px) est solide, mais c'est une prédiction, pas une mesure. C'est exactement pourquoi le gate Wave 0 existe.
- **Périmètre (overlay d'édition, avatars avis/sessions) : décisions de périmètre, pas des faits** — remontées en Open Q3/Q5.

**Research date :** 2026-07-30
**Valid until :** ~2026-08-29 (30 jours — base de code stable, aucun package nouveau ; à re-vérifier si `src/ui/*` évolue entre-temps)
