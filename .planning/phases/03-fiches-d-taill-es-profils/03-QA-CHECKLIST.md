---
phase: 03-fiches-d-taill-es-profils
plan: 06
type: qa-checklist
status: awaiting-device-recette
created: 2026-07-30
reference_spot_id: 153f6575-acc1-446a-b332-58e0e5714214
---

# 03-QA-CHECKLIST — Recette de phase (byte-identité + visuel + device)

> **Phase gate de la Phase 3.** Ce document consolide les trois preuves de non-régression :
> (1) byte-identité CSS compilé des wirings de token — **automatisable, faite ci-dessous** ;
> (2) comparaison visuelle APRÈS/AVANT des 5 surfaces + AuthModal/FiltersModal — **rendu réel
> requis (chrome-devtools-mcp)** ; (3) recette manuelle mobile QA-01 à 100% — **device iOS
> physique requis**.
>
> **Contrainte cardinale :** toute divergence de rendu détectée est une régression à corriger
> (retour en gap closure), pas un arbitrage. Seuls écarts tolérés : `aria-label="Close"` de
> PremiumModal (invisible) et l'éventuel commentaire `src/index.css:41`.

---

## 1. Preuve byte-identité (CSS compilé) — ✅ COMPLET

**Méthodologie (`01-VERIFICATION.md`) :** `npm run build` → extraction des règles du CSS compilé
`dist/assets/index-CwYF5zEx.css`. Les tokens sémantiques sont **aliasés** aux variables de la
palette Tailwind v4 dans `src/index.css` `@theme`, donc byte-identiques **par construction**.

### 1.a — Définition des variables (le cœur de la preuve d'aliasing)

Chaque token sémantique est défini comme un `var()` pointant vers la variable de palette qu'il
remplace (extrait verbatim du CSS compilé) :

```
--color-text:var(--color-slate-800);
--color-muted:var(--color-slate-500);
--color-primary:var(--color-sky-500);
--color-background:var(--color-slate-50);
--color-accent:var(--color-rose-500);
--color-secondary:var(--color-slate-900);
--radius-3xl:1.5rem;   /* = 24px */
--radius-4xl:2rem;     /* = 32px */
```

Valeurs de palette résolues (une seule source `oklch()` pour les deux membres de chaque paire) :

```
--color-slate-800:oklch(27.9% .041 260.031)
--color-slate-500:oklch(55.4% .046 257.417)
--color-sky-500:oklch(68.5% .169 237.323)
--color-slate-50:oklch(98.4% .003 247.858)
--color-rose-500:oklch(64.5% .246 16.439)
--color-slate-900:oklch(20.8% .042 265.755)
```

### 1.b — Tableau de preuve par paire câblée

| Paire (littéral → token) | Règle littéral (CSS) | Règle token (CSS) | Valeur résolue commune | Verdict |
|---|---|---|---|---|
| `text-slate-800` → `text-text` | `.text-slate-800{color:var(--color-slate-800)}` | `.text-text{color:var(--color-text)}` avec `--color-text:var(--color-slate-800)` | `oklch(27.9% .041 260.031)` | **IDENTIQUE** |
| `text-slate-500` → `text-muted` | `.text-slate-500{color:var(--color-slate-500)}` | `.text-muted{color:var(--color-muted)}` avec `--color-muted:var(--color-slate-500)` | `oklch(55.4% .046 257.417)` | **IDENTIQUE** |
| `text-sky-500` → `text-primary` | `.text-sky-500{color:var(--color-sky-500)}` | `.text-primary{color:var(--color-primary)}` avec `--color-primary:var(--color-sky-500)` | `oklch(68.5% .169 237.323)` | **IDENTIQUE** |
| `bg-slate-50` → `bg-background` | `.bg-slate-50{background-color:var(--color-slate-50)}` | `.bg-background{background-color:var(--color-background)}` avec `--color-background:var(--color-slate-50)` | `oklch(98.4% .003 247.858)` | **IDENTIQUE** |
| `text-rose-500` → `text-accent` | `.text-rose-500{color:var(--color-rose-500)}` | `.text-accent{color:var(--color-accent)}` avec `--color-accent:var(--color-rose-500)` | `oklch(64.5% .246 16.439)` | **IDENTIQUE** |
| `fill-rose-500` → `fill-accent` | `.fill-rose-500{fill:var(--color-rose-500)}` | `.fill-accent{fill:var(--color-accent)}` | `oklch(64.5% .246 16.439)` | **IDENTIQUE** |
| `border-sky-500` → `border-primary` | `.border-sky-500{border-color:var(--color-sky-500)}` | `.border-primary{border-color:var(--color-primary)}` | `oklch(68.5% .169 237.323)` | **IDENTIQUE** |
| `focus:border-sky-500` → `focus:border-primary` | `.focus\:border-sky-500:focus{border-color:var(--color-sky-500)}` | `.focus\:border-primary:focus{border-color:var(--color-primary)}` | `oklch(68.5% .169 237.323)` | **IDENTIQUE** |
| `bg-slate-900` → `bg-secondary` | `.bg-slate-900{background-color:var(--color-slate-900)}` | `.bg-secondary{background-color:var(--color-secondary)}` avec `--color-secondary:var(--color-slate-900)` | `oklch(20.8% .042 265.755)` | **IDENTIQUE** |
| `bg-slate-900/40` → `bg-secondary/40` (backdrop Modal) | `.bg-slate-900\/40{background-color:#0f172b66}` / `color-mix(in oklab,var(--color-slate-900)40%,transparent)` | `.bg-secondary\/40{background-color:#0f172b66}` / `color-mix(in oklab,var(--color-secondary)40%,transparent)` | fallback hex `#0f172b66` identique + `color-mix` ne diffère que par le nom de variable aliasée | **IDENTIQUE** |
| `rounded-[24px]` → `rounded-3xl` | (arbitraire = 24px) | `.rounded-3xl{border-radius:var(--radius-3xl)}` avec `--radius-3xl:1.5rem` | `1.5rem = 24px` | **IDENTIQUE** |
| `rounded-t-[32px]` → `rounded-t-4xl` | (arbitraire = 32px) | `.rounded-t-4xl{border-top-left-radius:var(--radius-4xl);border-top-right-radius:var(--radius-4xl)}` avec `--radius-4xl:2rem` | `2rem = 32px` | **IDENTIQUE** |

**Confirmation croisée avec 03-02-SUMMARY :** le backdrop `bg-secondary/40` du master Modal
reproduit exactement le résultat consigné par le plan 03-02 (fallback `#0f172b66` identique).

### 1.c — Non câblé par choix conservateur (aucune preuve requise)

- **`text-slate-900` → `text-secondary` : NON câblé (choix conservateur, verrouillé par
  `03-UI-SPEC.md`).** Le token `--color-secondary` est nommé pour un fond de CTA, pas pour du
  texte de titre : bien que byte-identique par valeur, le wiring est sémantiquement bancal.
  Occurrences laissées **littérales** (vérifié en source) : `SpotDetail.tsx:241` (titre gelé),
  `SpotDetail.tsx:469` (note moyenne), `Profile.tsx:257` (bouton resting du champ nom).
  `text-secondary` est **absent** des 4 fichiers du périmètre (confirmé). Pas de preuve requise.

### 1.d — Résidus littéraux hors périmètre (attendus, pas des DIVERGENT)

Les seuls littéraux de couleur/bordure non câblés restants dans le périmètre vivent dans
l'**overlay d'édition de spot** de `SpotDetail.tsx` (à partir de L548, `bg-white z-50 …
rounded-[24px]`), explicitement **hors périmètre → Phase 4 / UI-03** (`03-UI-SPEC.md` § Hors
périmètre) : `text-slate-800` (L551), `bg-slate-50` (L565, L599), `border-sky-500` /
`focus:border-sky-500` (L565, L584, L599, L611), `rounded-[24px]` (L548). Ce sont des
non-migrations documentées, pas des régressions.

### Verdict section 1

**Toutes les paires câblées de la phase sont prouvées IDENTIQUES en CSS compilé. Aucune ligne
DIVERGENT.** `text-slate-900` documenté comme non câblé (choix conservateur). Les résidus
littéraux restants sont tous dans l'overlay d'édition hors périmètre (Phase 4). **UI-01/UI-02
satisfaits côté preuve CSS** ; il reste la confrontation au rendu réel (sections 2 et 3).

---

## 2. Comparaison visuelle APRÈS/AVANT — ✅ VALIDÉ (rendu réel : chrome-devtools-mcp)

> **Étape non automatisable en CLI.** Exécutée par l'orchestrateur via `npm run dev` sur `:5173`
> (branche `main` avec waves 1+2 mergées = état APRÈS complet) + session Chrome authentifiée
> (compte `updock.app@gmail.com`), viewport mobile émulé 390×844×3 (comme 03-01/03-05).
> Captures `03-after-*` sous `audit/screenshots/` (racine du repo principal, hors `.planning/`,
> non versionnées — mêmes conventions que les `03-before-*` de `03-BASELINE.md § 9`).
>
> **Rappel sécurité (T-03-06-02) — appliqué :** email du compte de test masqué sur la capture du
> profil authentifié via patch DOM temporaire, restauré après capture (même procédure que
> 03-01/03-05). Aucun JWT / token / URL signée Supabase Storage dans une capture.
>
> **Méthode de comparaison :** comparaison structurelle (AX tree — mêmes headings/boutons/layout)
> + comparaison pixel visuelle sur 3 paires échantillonnées (fiche snap 0.35, community-stats) +
> inspection de toutes les autres surfaces. **Aucune divergence détectée.**

| # | Surface | Capture AVANT (réf.) | Capture APRÈS | Point focal confirmé inchangé | Verdict |
|---|---------|----------------------|----------------|-------------------------------|---------|
| 1 | Fiche spot — snap 0.35 | `03-before-fiche-snap035.png` | `03-after-fiche-snap035.png` | Nom du spot + badge de type (cible `layoutId`) | **IDENTIQUE** (pixel-à-pixel vérifié) |
| 2 | Fiche — snap 0.95, onglet Info | `03-before-fiche-snap095-info.png` | `03-after-fiche-snap095-info.png` | Nom+badge, cartes stats, CTA Naviguer | **IDENTIQUE** |
| 3 | Fiche — snap 0.95, onglet Avis | `03-before-fiche-snap095-avis.png` | `03-after-fiche-snap095-avis.png` | Empty state « Aucun avis pour le moment » | **IDENTIQUE** |
| 4 | Fiche — snap 0.95, onglet Sessions | `03-before-fiche-snap095-sessions.png` | `03-after-fiche-snap095-sessions.png` | Empty state « Aucune session prévue » | **IDENTIQUE** |
| 5 | Profil anonyme (déconnecté) | `03-before-profil-anonyme.png` | `03-after-profil-anonyme.png` | Branche `!user` : « Se connecter » / « Créer un compte » | **IDENTIQUE** |
| 6 | Profil authentifié (email masqué) | `03-before-profil-auth.png` | `03-after-profil-auth.png` | Bloc identité (avatar 96×96 + nom `text-2xl`) | **IDENTIQUE** (email masqué à la capture) |
| 7 | PremiumModal (ouvert depuis Profil) | `03-before-premium-modal.png` | `03-after-premium-modal.png` | Badge Sparkles 64×64 dégradé + titre centré | **IDENTIQUE** — `aria-label="Close"` confirmé (écart toléré attendu, rien d'autre) |
| 8 | CommunityStatsScreen | `03-before-community-stats.png` | `03-after-community-stats.png` | 2 KPI (`text-2xl font-black`) sous l'app bar | **IDENTIQUE** (pixel-à-pixel vérifié, 2 KPI Card + liste pays) |
| 9 | **AuthModal** (non-régression master Modal) | capture Phase 1/2 | `03-after-authmodal.png` | Forme glass+center inchangée | **IDENTIQUE** — « Bon retour », champs email/mot de passe, CTA « Se Connecter » |
| 10 | **FiltersModal** (non-régression master Modal) | capture Phase 1/2 | `03-after-filtersmodal.png` | Bottom-sheet light+sheet inchangé | **IDENTIQUE** — « Filtres », liste TYPE DE DÉPART, CTA « Voir les Résultats » (bg-secondary confirmé visuellement) |

**Écarts tolérés uniquement :** `aria-label="Close"` de PremiumModal (invisible), commentaire
`src/index.css:41`. Tout autre écart = régression → gap closure.

**Verdict section 2 : ✅ visuel validé, 10/10 surfaces IDENTIQUES. Aucune régression détectée.**
Seul écart observé = `aria-label="Close"` de PremiumModal (surface 7), conforme aux écarts tolérés
du plan. AuthModal et FiltersModal confirmés non régressés par l'extension du master Modal
(3e forme `light`+`center`). Les 10 captures `03-after-*` produites sous `audit/screenshots/`.

---

## 3. Recette QA-01 (device iOS physique) — ⏳ EN ATTENTE (device réel : utilisateur)

> **Étape NON reproductible en desktop ni par aucun outil navigateur.** La gestuelle tactile
> (`vaul` drag-to-dismiss, snap points, `layoutId`), le comportement réel de `loading="lazy"` en
> WebView iOS et la safe-area exigent un **iPhone physique**. À dérouler par l'utilisateur.
>
> **Garde-fous de recette (T-03-06 register) :** compte de test réel, interactions réversibles
> uniquement (favori/join/leave) ; ne pas créer de données parasites persistantes.

| # | Item de recette | Attendu | PASS/FAIL |
|---|-----------------|---------|-----------|
| 1 | **Fiche — gestuelle (chemin critique)** | Map → clic marker → SpotDetail au snap 0.35 → drag vers 0.95 → swipe-to-dismiss ferme ; morphing du nom (`layoutId` liste↔fiche) visible ; scroll interne sans accroc | **PASS** (device réel, confirmé par l'utilisateur) |
| 2 | **Lightbox** | Ouverture depuis la vignette → next/prev fluides (prefetch, pas de délai) → swipe DANS la lightbox ne déclenche PAS le drag-to-dismiss (portail isolé) → fermeture OK | **PASS** (device réel, après correctif — voir note gap-closure ci-dessous) |
| 3 | **Onglets** Info/Avis/Sessions | Bascule OK ; avatars avis/sessions s'affichent (lazy) sans image manquante (Pitfall 5 sur device) | _à remplir — session suspendue_ |
| 4a | **Non-auth — vignette** | Déconnecté : vignette floutée (`blur-sm`) + cadenas | _à remplir — session suspendue_ |
| 4b | **Non-auth — cœur favori** | Le cœur favori ouvre l'auth (`onOpenAuth`, SpotDetail:288) | **PASS** (device réel, après correctif) |
| 4c | **Non-auth — lightbox** | L'ouverture de la lightbox ouvre l'auth (SpotDetail:397) | **PASS** (device réel, après correctif, y compris en visualisant les photos une fois connecté) |
| 4d | **Non-auth — rangée Admin** | « Tableau de Bord Admin » masquée pour un compte non-admin (Profile:154,414) | _à remplir — session suspendue_ |
| 5a | **Profil authentifié** | Avatar, 2 stats (Card), rangées de réglages, Log Out présents | _à remplir — session suspendue_ |
| 5b | **Profil anonyme** | Branche « Sign In / Join » | _à remplir — session suspendue_ |
| 5c | **PremiumModal** | Ouverture depuis « Devenir Premium » ; fermeture par le bouton close ET par clic sur le backdrop | _à remplir — session suspendue_ |
| 6 | **CommunityStatsScreen** | Ouverture depuis Profil ; titre NON masqué par la status bar (safe-area `pt-[calc(1rem+env(safe-area-inset-top))]` préservée) ; 2 KPI (Card) + liste pays | _à remplir — session suspendue_ |
| 7 | **Auth & Filtres (non-régression)** | `AuthModal` (connexion) et `FiltersModal` (filtres carte) fonctionnent comme avant l'extension du master Modal | _à remplir — session suspendue (non-régression re-vérifiée sur desktop après le correctif, voir note)_ |

**⚠ Bug bloquant trouvé et corrigé pendant la recette (gap closure immédiat, hors périmètre des plans 03-0X) :**

En testant les items 2/4b/4c, l'utilisateur a découvert qu'ouvrir `AuthModal` depuis un cadenas/cœur alors que `SpotDetail` est ouvert rendait la modale **derrière** le tiroir (invisible ou partiellement masquée selon le snap), la rendant inutilisable.

**Cause racine (pré-existante, aucun rapport avec les plans 03-0X) :** `#root` porte `isolation: isolate` (`src/index.css`, introduit en v1.1.1, jamais touché par la phase 3). `SpotDetail.tsx` utilise `shouldScaleBackground` sur son `Drawer.Root` (vaul), pré-existant également. Tout élément `position: fixed` rendu comme enfant React normal de `#root` (comme `AuthModal`) reste plafonné dans le contexte d'empilement isolé de `#root`, tandis que le portail natif de Vaul (`Drawer.Content`) s'échappe directement dans `<body>` et passe donc au-dessus, peu importe les valeurs de z-index.

**Correctif appliqué et commité sur `main` (hors de ce worktree, commit `497f347`) :**
- `src/ui/Modal.tsx` : les 3 formes (glass+center, light+sheet, light+center) sont maintenant rendues via `createPortal(..., document.body)`, échappant proprement à l'isolation de `#root` — corrige `AuthModal`, `PremiumModal` et `FiltersModal` d'un coup.
- `src/App.tsx` : `AuthModal`/`AdminDashboard`/`WelcomeScreen` déplacés hors de `vaul-drawer-wrapper` (ceinture-et-bretelles pour `AdminDashboard`/`WelcomeScreen`, qui n'utilisent pas le `Modal` partagé).
- Vérifié : build vert, non-régression confirmée sur desktop (chrome-devtools-mcp) pour AuthModal/PremiumModal/FiltersModal (structure + rendu identiques), puis confirmé fonctionnel sur device réel par l'utilisateur (items 2/4b/4c → PASS).

Ce correctif vit sur `main`, **en dehors** de ce worktree et du périmètre `files_modified` déclaré par 03-06 — il devra être pris en compte lors du merge final de ce plan (déjà présent sur `main`, rien à merger côté worktree pour ce fix ; seul `03-QA-CHECKLIST.md` reste à committer ici).

**Verdict section 3 :** _en cours — 4/12 items testés (tous PASS), session suspendue par l'utilisateur avant la fin de la recette. Reprendre avec les items 3, 4a, 4d, 5a, 5b, 5c, 6, 7._

---

## 4. Verdict de phase (UI-01 / UI-02 / PERF-02 / QA-01)

| Exigence | Preuve | Statut |
|----------|--------|--------|
| **UI-01 / UI-02** — byte-identité des wirings | Section 1 (CSS compilé, toutes paires IDENTIQUE) **+** section 2 (visuel APRÈS/AVANT, 10/10 IDENTIQUE) | CSS : **✅ prouvé** · Visuel : **✅ validé** (10/10 surfaces) |
| **PERF-02** — lazy loading mesurable | `03-BASELINE.md § 4-bis/5-bis/6-bis/8` (métriques A/B/C APRÈS + verdict) : métrique A < 10 ms (vs 2509 ms), métrique C 0→N, métrique B delta nul documenté | **✅ satisfait** (03-05) · dégradation gracieuse iOS à confirmer en section 3 item 3 |
| **QA-01** — recette manuelle mobile 100% | Section 3 (device iOS physique) | ⏳ en attente (section 3) |

**Note dégradation gracieuse iOS :** sur les WebViews ignorant `loading="lazy"` (cible
`platform :ios, '15.0'` / `IPHONEOS_DEPLOYMENT_TARGET 14.0-15.6`), le comportement retombe sur
l'eager loading actuel — zéro régression fonctionnelle, à confirmer en section 3 (item 3).

**Verdict de phase final :** _à sceller une fois les sections 2 et 3 à 100% (chaîne « 100% » à
inscrire dans le verdict de recette). Toute régression détectée déclenche un plan de gap closure,
pas un arbitrage._
