---
phase: 2
slug: navigation-vue-carte-spots
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Aucun — contrainte projet explicite « pas d'infra de test automatisé » (REQUIREMENTS.md « Out of Scope » ; CODE-03 futur) |
| **Config file** | none |
| **Quick run command** | `npm run dev` puis mesure manuelle / React DevTools Profiler |
| **Full suite command** | Recette manuelle mobile (checklist QA-01) après la phase |
| **Estimated runtime** | ~10-15 min (recette manuelle + captures Profiler) |

---

## Sampling Rate

- **Après chaque commit de tâche :** vérification visuelle rapide de l'écran touché (`npm run dev`).
- **Après chaque wave :** recette manuelle du flux impacté (carte / nav / ajout spot).
- **Avant `/gsd:verify-work` :** checklist QA-01 complète (carte, fiche spot, favoris, avis, session, ajout/édition spot, profil, auth) à 100% sur mobile + captures Profiler avant/après archivées.
- **Max feedback latency:** ~2 min (rebuild dev + interaction manuelle)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-W0-01 | 01 | 0 | PERF-01 / MAP-01 | — | N/A | manuel (Profiler) | `npm run dev` + React DevTools Profiler — capturer baseline AVANT refactor | ✅ | ⬜ pending |
| 02-W0-02 | 01 | 0 | D-02 | — | N/A | manuel (grep) | `grep -rn "ui/Modal" src/` — lister consommateurs existants avant extension | ✅ | ⬜ pending |
| 02-xx-NAV-01 | TBD | TBD | NAV-01 | — | N/A | visuelle byte-identique | Diff DevTools computed styles `text-sky-500` vs `text-primary` ; recette nav | ❌ manuel |
| 02-xx-MAP-01 | TBD | TBD | MAP-01 | — | N/A | React Profiler | Enregistrement Profiler : compter renders/durée du sous-arbre Map en togglant filtres, avant/après | ❌ manuel |
| 02-xx-MAP-02 | TBD | TBD | MAP-02 / D-03 | — | N/A | fonctionnel + mémoire | Ajouter 5 images, en retirer, réajouter → aucune image cassée ; heap snapshots stables après cycles open/close | ❌ manuel |
| 02-xx-PERF-01 | TBD | TBD | PERF-01 | — | N/A | React Profiler avant/après | Baseline capturée AVANT refactor, comparée APRÈS | ❌ manuel |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*TBD plan/task IDs finalized by the planner — this table is a coverage contract, not exact task numbering.*

---

## Wave 0 Requirements

- [ ] Capturer la **baseline Profiler + baseline mémoire** AVANT tout changement (sinon PERF-01/MAP-01 ne sont pas mesurables) :
  1. `npm run dev`, ouvrir React DevTools → Profiler.
  2. Démarrer l'enregistrement, toggler chaque filtre 2×, arrêter.
  3. Noter le nombre de renders du composant carte + durée, et si `<Source>`/layers re-render.
  4. Archiver cette baseline dans le phase dir (ex. `02-BASELINE.md` ou notes dans SUMMARY).
  5. Onglet Memory : snapshot → ajouter 5 images dans `AddSpotForm` → fermer → rouvrir ×5 → snapshot (baseline rétention Blob/object URLs).
- [ ] `grep -rn "ui/Modal" src/` — lister tous les consommateurs de `Modal` avant de l'étendre avec une variante `surface`/`layout` (actuellement `AuthModal` seul, glass) — évite de casser un consommateur non documenté.
- *(Pas de fichier de test à créer — contrainte projet « pas de tests ».)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| NavBar/bottom bar rendent identiquement après wiring des tokens | NAV-01 | Pas d'infra de test visuel automatisé (contrainte projet) | Diff DevTools computed styles `text-sky-500` (avant) vs `text-primary` (après) sur les 4 occurrences wirables ; recette nav desktop + mobile |
| Toggle filtre carte ne re-render pas les markers/clusters inutilement | MAP-01 | Nécessite React Profiler, pas testable par assertion unitaire dans ce projet | Enregistrement Profiler avant/après refactor : comparer nombre de renders + durée du sous-arbre carte en togglant les filtres 2× |
| Ajout/suppression de photos dans AddSpotForm ne casse pas les aperçus et ne fuit pas la mémoire | MAP-02 / D-03 | Bug de cycle de vie (blob URLs), vérifiable seulement par observation Memory + interaction | Ajouter 5 images → en retirer une → en réajouter → vérifier qu'aucune image affichée n'est cassée ; snapshot Memory avant/après 5 cycles open/close du formulaire |
| Re-renders inutiles éliminés sur nav + carte | PERF-01 | Métrique de performance runtime, pas de seuil testable en CI sans infra | Comparer les baselines Profiler capturées en Wave 0 avec des mesures identiques post-refactor |
| Migration FiltersModal vers `src/ui/Modal` sans régression visuelle (bottom-sheet vs glass) | D-02 | Changement de surface visuelle (Modal glass centré vs FiltersModal bottom-sheet clair) — jugement visuel humain requis | Ouvrir le filtre carte avant/après migration, comparer position/backdrop/animation ; vérifier `AuthModal` (seul autre consommateur de `Modal`) n'a pas régressé |
| Checklist QA-01 complète (carte, fiche spot, favoris, avis, session, ajout/édition spot, profil, auth) | Tous (gate de phase) | Recette manuelle mobile, pas d'E2E automatisé dans ce projet | Parcourir chaque flux listé sur device/simulateur mobile, confirmer 0 régression fonctionnelle |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies — N/A ici : contrainte projet sans infra de test ; substitué par le protocole manuel Wave 0 ci-dessus.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify — substitué par recette manuelle après chaque wave (voir Sampling Rate).
- [x] Wave 0 covers all MISSING references — baseline Profiler/mémoire + audit consommateurs `Modal` couverts.
- [x] No watch-mode flags
- [x] Feedback latency < 2 min
- [x] `nyquist_compliant: true` set in frontmatter — la contrainte "pas de tests" est documentée et compensée par un protocole de vérification manuelle explicite et traçable (Wave 0 + Manual-Only Verifications ci-dessus), conformément à la note du RESEARCH.md.

**Approval:** pending
