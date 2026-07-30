---
phase: 03-fiches-d-taill-es-profils
plan: 06
type: qa-checklist
status: in-progress
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

## 2. Comparaison visuelle APRÈS/AVANT — ⏳ EN ATTENTE (rendu réel : chrome-devtools-mcp)

> **Étape non automatisable en CLI.** Nécessite `npm run dev` + session Chrome authentifiée
> pilotée par chrome-devtools-mcp (comme pour les checkpoints des plans 03-01 et 03-05).
> Les captures `03-after-*` vivent sous `audit/screenshots/` (racine du repo principal, hors
> `.planning/`, non versionnées — mêmes conventions que les `03-before-*` de `03-BASELINE.md § 9`).
>
> **Rappel sécurité (T-03-06-02) :** masquer l'email du compte de test sur la capture du profil
> authentifié (`Profile.tsx:205`). Aucun JWT / token / URL signée Supabase Storage dans une capture.

Procédure : capturer chaque surface APRÈS (préfixe `03-after-`), comparer au pendant AVANT
(`03-BASELINE.md § 9`, préfixe `03-before-`), vérifier que le point focal (`03-UI-SPEC.md
§ Hiérarchie visuelle`) n'a pas bougé.

| # | Surface | Capture AVANT (réf.) | Capture APRÈS (à produire) | Point focal à confirmer inchangé | Verdict |
|---|---------|----------------------|-----------------------------|----------------------------------|---------|
| 1 | Fiche spot — snap 0.35 | `03-before-fiche-snap035.png` | `03-after-fiche-snap035.png` | Nom du spot + badge de type (cible `layoutId`) | _à remplir_ |
| 2 | Fiche — snap 0.95, onglet Info | `03-before-fiche-snap095-info.png` | `03-after-fiche-snap095-info.png` | Nom+badge, cartes stats, CTA Naviguer | _à remplir_ |
| 3 | Fiche — snap 0.95, onglet Avis | `03-before-fiche-snap095-avis.png` | `03-after-fiche-snap095-avis.png` | Bloc note moyenne / empty state | _à remplir_ |
| 4 | Fiche — snap 0.95, onglet Sessions | `03-before-fiche-snap095-sessions.png` | `03-after-fiche-snap095-sessions.png` | Empty state sessions | _à remplir_ |
| 5 | Profil anonyme (déconnecté) | `03-before-profil-anonyme.png` | `03-after-profil-anonyme.png` | Branche `!user` : titre `text-xl` + CTA Sign In/Join | _à remplir_ |
| 6 | Profil authentifié (email masqué) | `03-before-profil-auth.png` | `03-after-profil-auth.png` | Bloc identité (avatar 96×96 + nom `text-2xl`) | _à remplir_ |
| 7 | PremiumModal (ouvert depuis Profil) | `03-before-premium-modal.png` | `03-after-premium-modal.png` | Badge Sparkles 64×64 dégradé + titre centré | _à remplir_ |
| 8 | CommunityStatsScreen | `03-before-community-stats.png` | `03-after-community-stats.png` | 2 KPI (`text-2xl font-black`) sous l'app bar | _à remplir_ |
| 9 | **AuthModal** (non-régression master Modal) | capture Phase 1/2 | `03-after-authmodal.png` | Forme glass+center inchangée | _à remplir_ |
| 10 | **FiltersModal** (non-régression master Modal) | capture Phase 1/2 | `03-after-filtersmodal.png` | Bottom-sheet light+sheet inchangé | _à remplir_ |

**Écarts tolérés uniquement :** `aria-label="Close"` de PremiumModal (invisible), commentaire
`src/index.css:41`. Tout autre écart = régression → gap closure.

**Verdict section 2 :** _à écrire une fois les 10 lignes renseignées (« visuel validé » ou liste
des régressions)._

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
| 1 | **Fiche — gestuelle (chemin critique)** | Map → clic marker → SpotDetail au snap 0.35 → drag vers 0.95 → swipe-to-dismiss ferme ; morphing du nom (`layoutId` liste↔fiche) visible ; scroll interne sans accroc | _à remplir_ |
| 2 | **Lightbox** | Ouverture depuis la vignette → next/prev fluides (prefetch, pas de délai) → swipe DANS la lightbox ne déclenche PAS le drag-to-dismiss (portail isolé) → fermeture OK | _à remplir_ |
| 3 | **Onglets** Info/Avis/Sessions | Bascule OK ; avatars avis/sessions s'affichent (lazy) sans image manquante (Pitfall 5 sur device) | _à remplir_ |
| 4a | **Non-auth — vignette** | Déconnecté : vignette floutée (`blur-sm`) + cadenas | _à remplir_ |
| 4b | **Non-auth — cœur favori** | Le cœur favori ouvre l'auth (`onOpenAuth`, SpotDetail:288) | _à remplir_ |
| 4c | **Non-auth — lightbox** | L'ouverture de la lightbox ouvre l'auth (SpotDetail:397) | _à remplir_ |
| 4d | **Non-auth — rangée Admin** | « Tableau de Bord Admin » masquée pour un compte non-admin (Profile:154,414) | _à remplir_ |
| 5a | **Profil authentifié** | Avatar, 2 stats (Card), rangées de réglages, Log Out présents | _à remplir_ |
| 5b | **Profil anonyme** | Branche « Sign In / Join » | _à remplir_ |
| 5c | **PremiumModal** | Ouverture depuis « Devenir Premium » ; fermeture par le bouton close ET par clic sur le backdrop | _à remplir_ |
| 6 | **CommunityStatsScreen** | Ouverture depuis Profil ; titre NON masqué par la status bar (safe-area `pt-[calc(1rem+env(safe-area-inset-top))]` préservée) ; 2 KPI (Card) + liste pays | _à remplir_ |
| 7 | **Auth & Filtres (non-régression)** | `AuthModal` (connexion) et `FiltersModal` (filtres carte) fonctionnent comme avant l'extension du master Modal | _à remplir_ |

**Verdict section 3 :** _à écrire une fois tous les items renseignés (« recette 100% » ou liste des
FAIL → gap closure)._

---

## 4. Verdict de phase (UI-01 / UI-02 / PERF-02 / QA-01)

| Exigence | Preuve | Statut |
|----------|--------|--------|
| **UI-01 / UI-02** — byte-identité des wirings | Section 1 (CSS compilé, toutes paires IDENTIQUE) **+** section 2 (visuel APRÈS/AVANT) | CSS : **✅ prouvé** · Visuel : ⏳ en attente (section 2) |
| **PERF-02** — lazy loading mesurable | `03-BASELINE.md § 4-bis/5-bis/6-bis/8` (métriques A/B/C APRÈS + verdict) : métrique A < 10 ms (vs 2509 ms), métrique C 0→N, métrique B delta nul documenté | **✅ satisfait** (03-05) · dégradation gracieuse iOS à confirmer en section 3 item 3 |
| **QA-01** — recette manuelle mobile 100% | Section 3 (device iOS physique) | ⏳ en attente (section 3) |

**Note dégradation gracieuse iOS :** sur les WebViews ignorant `loading="lazy"` (cible
`platform :ios, '15.0'` / `IPHONEOS_DEPLOYMENT_TARGET 14.0-15.6`), le comportement retombe sur
l'eager loading actuel — zéro régression fonctionnelle, à confirmer en section 3 (item 3).

**Verdict de phase final :** _à sceller une fois les sections 2 et 3 à 100% (chaîne « 100% » à
inscrire dans le verdict de recette). Toute régression détectée déclenche un plan de gap closure,
pas un arbitrage._
