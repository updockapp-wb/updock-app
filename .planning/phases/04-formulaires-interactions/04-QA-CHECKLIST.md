---
phase: 04-formulaires-interactions
plan: 06
type: qa-checklist
status: draft
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
| 1 | **Ajout de spot** | Ouvrir le formulaire d'ajout, remplir les champs | Champs rendus par `Input` (fond clair, `bg-slate-50`) ; submit avec état loading (`Button loading`) ; toast « Envoi du spot en cours… » (comportement `addSpot` existant, inchangé) | ☐ |
| 2 | **Validation ajout** | Soumettre avec nom vide/espaces, nom >100 car., description >2000 car., 0 type sélectionné | Message inline correspondant à chaque cas (« Le nom du spot est obligatoire. », message trop long, « Sélectionne au moins un type de spot. ») ; `addSpot` NON déclenché ; données du formulaire conservées | ☐ |
| 3 | **Confirmation « pas de photo » (D-04)** | Soumettre le formulaire d'ajout sans photo | Dialogue doux `Modal` (light+center) avec 2 actions : « Publier quand même » (publie) / « Ajouter une photo » (referme sans publier, sans `confirm()` natif) | ☐ |
| 4 | **Édition user (SpotDetail)** | Ouvrir l'édition inline d'un spot dont on est propriétaire, modifier puis sauvegarder ; retester en coupant le réseau | Champs via `Input` ; Save via `Button loading` ; validation identique au formulaire d'ajout ; échec réseau → erreur inline « Échec de l'envoi… », overlay reste ouvert, données conservées | ☐ |
| 5 | **Édition admin (AdminDashboard, D-09)** | Depuis le tableau de bord admin, éditer un spot en FR puis en EN ; retester en coupant le réseau | Champs via `Input` ; libellés corrects dans les 2 langues ; validation identique ; échec réseau → toast ; succès → overlay fermé | ☐ |
| 6 | **Favori add/remove** | Toggler le cœur favori depuis la fiche spot ET depuis la liste des favoris ; tester non connecté | Bouton = `Button iconOnly`, cible tactile confortable (≥44px), `aria-label` correct ; non connecté → ouverture de l'auth (SpotDetail) + badge cadenas visible | ☐ |
| 7 | **Favori offline (D-08)** | Couper le réseau puis toggler un favori | L'état visuel se met à jour immédiatement (optimiste) puis revert automatique + toast discret « Échec, réessaie. » | ☐ |
| 8 | **Non-régression** | Ouvrir AuthModal et FiltersModal ; parcourir tous les chemins migrés (1-7) | AuthModal (fond sombre, label uppercase) et FiltersModal (bottom-sheet) visuellement inchangés ; aucun `alert()` natif ne surgit sur aucun chemin migré | ☐ |

**Parité i18n :** pour chaque message affiché ci-dessus (validation, confirmation, erreurs, favori), vérifier qu'il s'affiche correctement en français **et** en anglais (bascule de langue de l'app).

---

## 2. Verdict de phase (UI-03 / ROBUST-01 / ROBUST-02 / QA-01)

| Exigence | Preuve | Statut |
|----------|--------|--------|
| **UI-03** — migration DS des formulaires | Section 1, scénarios 1-6 (AddSpotForm, SpotDetail, AdminDashboard, boutons favori) | ⏳ en attente de recette device |
| **ROBUST-01** — validation client + confirmation douce | Section 1, scénarios 2-3 | ⏳ en attente de recette device |
| **ROBUST-02** — feedback d'erreur (inline/toast, plus d'`alert()`) | Section 0 (`grep alert()` = 0) + Section 1, scénarios 4-5-7 | ⏳ en attente de recette device |
| **QA-01** — recette manuelle mobile 100% | Section 1 (8/8 scénarios) | ⏳ en attente de recette device |

**Statut : recette à dérouler sur device iOS physique par l'utilisateur — cocher chaque item de la section 1 puis renseigner PASS/FAIL global.**
