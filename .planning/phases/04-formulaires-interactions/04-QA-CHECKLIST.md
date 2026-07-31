---
phase: 04-formulaires-interactions
plan: 06
type: qa-checklist
status: validated-100
created: 2026-07-31
---

# 04-QA-CHECKLIST — Recette de phase (formulaires & interactions)

> **Phase gate de la Phase 4.** Ce document consolide deux preuves de non-régression :
> (1) filet automatique `npm run build` — **fait ci-dessous** ; (2) recette manuelle mobile
> QA-01 à 100% sur device iOS physique — **à dérouler par l'utilisateur**.
>
> **Contrainte cardinale :** toute divergence de rendu ou régression fonctionnelle détectée
> pendant la recette est à corriger (retour en gap closure `/gsd:plan-phase 04 --gaps`), pas un
> arbitrage.

---

## 0. Filet automatique (build / lint)

**`npm run build`** (`tsc -b && vite build`) : ✅ **VERT** — `✓ built in ~4s`, aucune erreur TypeScript, aucune régression de type introduite par les waves 1/2.

**`npm run lint`** (`eslint .`) : ⚠️ **34 problèmes préexistants (27 erreurs, 7 warnings), tous antérieurs à la Phase 4.**

Cet acceptance criterion du plan 04-06 (« `npm run lint` sort sans erreur ») **ne peut pas être satisfait sans sortir du périmètre de la phase**. Détail :

- Base avant toute exécution de la phase (commit `a0dc289`) : dette de lint déjà présente (confirmé indépendamment par les 5 exécuteurs des plans 04-01 à 04-05, chacun via `npx eslint <fichier touché>` avant/après son diff).
- Chaque plan de la phase a vérifié que son propre diff est lint-clean sur les fichiers qu'il touche (`Input.tsx`, `AddSpotForm.tsx`, `SpotDetail.tsx`, `AdminDashboard.tsx`, `App.tsx`, `SpotsContext.tsx`, `FavoritesContext.tsx`) — voir `deferred-items.md` pour le détail par fichier.
- Les erreurs restantes vivent dans des fichiers **non modifiés** par la phase 4 (`ProfileContext.tsx`, `SessionsContext.tsx`, portions de `SpotsContext.tsx` hors des lignes touchées) — règles `@typescript-eslint/no-explicit-any`, `react-refresh/only-export-components`, `react-hooks/*`.
- **Aucune nouvelle erreur introduite par la phase 4.** Nettoyage recommandé en Phase 5 (CODE-01/CODE-02), déjà consigné dans `deferred-items.md`.

**Verdict section 0 : build vert (garde-fou pertinent honoré) ; lint stable, dette pré-existante documentée et non aggravée — ne bloque pas la recette.**

**`grep -rc "alert(" src/context/SpotsContext.tsx` → `0`** (aucun `alert()` natif restant sur les chemins migrés).

---

## 1. Scénarios de recette manuelle (device iOS physique)

> **Étape NON reproductible en desktop.** La gestuelle tactile, les toasts Capacitor natifs et
> le comportement offline réel exigent un **iPhone physique**. À dérouler par l'utilisateur.

| # | Scénario | Étapes | Résultat attendu | PASS/FAIL |
|---|----------|--------|-------------------|-----------|
| 1 | **Ajout de spot** | Ouvrir le formulaire d'ajout, remplir les champs | Champs rendus par `Input` (fond clair, `bg-slate-50`) ; submit avec état loading (`Button loading`) ; toast « Envoi du spot en cours… » (comportement `addSpot` existant, inchangé) | **PASS** (device réel) |
| 2 | **Validation ajout** | Soumettre avec nom vide/espaces, nom >100 car., description >2000 car., 0 type sélectionné | Message inline correspondant à chaque cas (« Le nom du spot est obligatoire. », message trop long, « Sélectionne au moins un type de spot. ») ; `addSpot` NON déclenché ; données du formulaire conservées | **PASS** (device réel) |
| 3 | **Confirmation « pas de photo » (D-04)** | Soumettre le formulaire d'ajout sans photo | Dialogue doux `Modal` (light+center) avec 2 actions : « Publier quand même » (publie) / « Ajouter une photo » (referme sans publier, sans `confirm()` natif) | **PASS** (device réel) |
| 4 | **Édition user (SpotDetail)** | Ouvrir l'édition inline d'un spot dont on est propriétaire, modifier puis sauvegarder ; retester en coupant le réseau | Champs via `Input` ; Save via `Button loading` ; validation identique au formulaire d'ajout ; échec réseau → erreur inline « Échec de l'envoi… », overlay reste ouvert, données conservées | **PASS** (device réel, après correctif commit `46c239a` — voir note gap-closure ci-dessous) |
| 5 | **Édition admin (AdminDashboard, D-09)** | Depuis le tableau de bord admin, éditer un spot en FR puis en EN ; retester en coupant le réseau | Champs via `Input` ; libellés corrects dans les 2 langues ; validation identique ; échec réseau → toast ; succès → overlay fermé | **PASS** (device réel) |
| 6 | **Favori add/remove** | Toggler le cœur favori depuis la fiche spot ET depuis la liste des favoris ; tester non connecté | Bouton = `Button iconOnly`, cible tactile confortable (≥44px), `aria-label` correct ; non connecté → ouverture de l'auth (SpotDetail) + badge cadenas visible | **PASS** (device réel) |
| 7 | **Favori offline (D-08)** | Couper le réseau puis toggler un favori | L'état visuel se met à jour immédiatement (optimiste) puis revert automatique + toast discret « Échec, réessaie. » | **PASS** (device réel) |
| 8 | **Non-régression** | Ouvrir AuthModal et FiltersModal ; parcourir tous les chemins migrés (1-7) | AuthModal (fond sombre, label uppercase) et FiltersModal (bottom-sheet) visuellement inchangés ; aucun `alert()` natif ne surgit sur aucun chemin migré | **PASS** (device réel) |

**⚠ Bug bloquant trouvé et corrigé pendant la recette (gap closure immédiat, scénario 4) :**

En testant l'édition d'un spot (item 4) tiroir ouvert en grand (snap 0.95), le bouton
« Enregistrer les modifications » était légèrement coupé en bas de l'écran.

**Cause racine :** l'overlay d'édition (`absolute inset-0` dans le tiroir `fixed bottom-0
h-full`) a son pied collé au bord physique bas de l'écran, sans réserver l'espace de la home
indicator iOS (`env(safe-area-inset-bottom)`) — contrairement à `NavBar.tsx` qui le fait déjà.
Probablement préexistant (jamais testé en Phase 3, dont la checklist ne couvrait pas l'édition
de spot au snap large).

**Correctifs appliqués et commités sur `main` :**
- `d1b3e14` : `shrink-0` sur le pied de l'overlay (tentative 1, sans effet visible seule — gardée,
  bonne pratique flexbox).
- `46c239a` : `pb-[env(safe-area-inset-bottom)]` sur le pied de l'overlay, même pattern que
  `NavBar.tsx` — **correctif effectif, confirmé par l'utilisateur sur device réel.**

**Autres constats de la recette — classés hors régression Phase 4, capturés en todos
(`.planning/todos/pending/`), ne bloquent pas la clôture :**
- Croix de fermeture décalée/coupée si nom de spot long (préexistant, hors périmètre 04-0x).
- Description de spot non obligatoire (nouveau besoin fonctionnel, pas une régression).
- Onglet « Pending » de l'admin non migré au DS (hors périmètre du plan 04-05, qui ne couvrait
  que le formulaire d'édition, pas les cartes d'approbation).
- Accent manquant sur « communauté » dans `fr.json` (préexistant, fichier non touché par la
  phase 4).

**Parité i18n :** pour chaque message affiché ci-dessus (validation, confirmation, erreurs, favori), vérifier qu'il s'affiche correctement en français **et** en anglais (bascule de langue de l'app).

---

## 2. Verdict de phase (UI-03 / ROBUST-01 / ROBUST-02 / QA-01)

| Exigence | Preuve | Statut |
|----------|--------|--------|
| **UI-03** — migration DS des formulaires | Section 1, scénarios 1-6 (AddSpotForm, SpotDetail, AdminDashboard, boutons favori) | **✅ satisfait** (6/6 PASS) |
| **ROBUST-01** — validation client + confirmation douce | Section 1, scénarios 2-3 | **✅ satisfait** (2/2 PASS) |
| **ROBUST-02** — feedback d'erreur (inline/toast, plus d'`alert()`) | Section 0 (`grep alert()` = 0) + Section 1, scénarios 4-5-7 | **✅ satisfait** (3/3 PASS) |
| **QA-01** — recette manuelle mobile 100% | Section 1 (8/8 scénarios) | **✅ satisfait (8/8 items PASS, 100%)** |

**Verdict de phase final : ✅ PHASE 4 VALIDÉE À 100%.** UI-03/ROBUST-01/ROBUST-02 prouvés (build
vert + 8/8 scénarios device), QA-01 à 100%. Un bug bloquant trouvé et corrigé en gap closure
immédiat pendant la recette (bouton Save coupé par la safe-area, commits `d1b3e14` + `46c239a`
sur `main`). Aucune autre régression fonctionnelle détectée ; 4 constats hors périmètre capturés
en todos pour une phase future. Le success criterion 4 du ROADMAP Phase 4 est honoré.
