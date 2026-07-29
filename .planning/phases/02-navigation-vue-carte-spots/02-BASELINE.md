# Phase 2 — Baseline AVANT refactor (Profiler + mémoire + audit Modal)

> **But :** figer les métriques de performance/mémoire et l'audit des consommateurs de
> `src/ui/Modal` **AVANT tout changement de code**, pour rendre PERF-01 / MAP-01 / MAP-02
> mesurables (comparaison avant/après). Ce fichier est le **GATE Wave 0** : les Plans 02 et 03
> (Wave 1) ne doivent modifier aucun fichier source tant que les sections Profiler/mémoire/nav-shell
> ci-dessous ne sont pas remplies avec des chiffres réels (mesure humaine — Task 2).
>
> **Statut :** scaffold créé (Task 1, automatisé). Chiffres Profiler/mémoire/nav-shell **à capturer**
> par le dev en navigateur (Task 2, checkpoint `human-verify`). Voir § 4 « Protocole exact ».
>
> **Environnement de mesure :** dev build Vite (`npm run dev`) dans le navigateur avec l'extension
> React DevTools, **pas** le build iOS (RESEARCH Open Q3, RESOLVED).

---

## 1. Consommateurs de `src/ui/Modal`

**Commande exécutée (Task 1) :** `grep -rn "ui/Modal" src/`

```
src/components/AuthModal.tsx:5:import Modal from '../ui/Modal';
```

**Conclusion :** **`AuthModal.tsx` est l'unique consommateur** du master `src/ui/Modal`.

Le master `Modal` est actuellement codé en dur en **surface glass centrée** (cf. `src/ui/Modal.tsx`) :
- Backdrop : `fixed inset-0 z-[5000] … bg-black/60 backdrop-blur-md`
- Panneau : `bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-sm rounded-4xl p-8 shadow-2xl`
- Animation : `initial/exit scale: 0.95`, `animate scale: 1` (pas de slide)
- Aucune prop `surface` / `variant` / `layout` exposée (contrairement à `Header` qui a `surface="light"`).

**Impact pour le Plan 03 (D-02, Pitfall 1 du RESEARCH) :** puisque `AuthModal` est le seul
consommateur et qu'il utilise la surface glass, on peut étendre `Modal` avec une prop
`surface`/`layout` dont le **défaut = glass actuel**. C'est **rétro-compatible** (risque de régression
sur `AuthModal` : nul si le défaut reste glass), et cela débloque la migration bottom-sheet clair de
`FiltersModal` sans envelopper naïvement dans le master glass (ce qui provoquerait une régression
visuelle majeure). [VERIFIED: grep src/ ci-dessus — Open Q1 RESOLVED, Assumption A2 levée]

---

## 2. Baseline Profiler carte (AVANT refactor)

> **À remplir en Task 2 (mesure humaine).** Ne pas fabriquer de chiffres.
> Protocole : § 4 étapes 1-3. Composant cible : `MapComponent` (sous-arbre carte de `Map.tsx`).
> Toggler CHAQUE filtre 2× (All → Dockstart → Rockstart → Dropstart → Deadstart → Rampstart → Beachstart → All).

| Filtre togglé | Nb renders `MapComponent` | Durée (ms) | `<Source>`/layers re-render (oui/non) |
|---------------|---------------------------|------------|----------------------------------------|
| All → Dockstart | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| Dockstart → Rockstart | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| Rockstart → Dropstart | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| Dropstart → Deadstart | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| Deadstart → Rampstart | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| Rampstart → Beachstart | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| Beachstart → All | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| **Total (2 passes)** | _(à mesurer)_ | _(à mesurer)_ | — |

**Cible APRÈS refactor (split-memoization MAP-01) :** moins d'allocations/renders du sous-arbre carte
à chaque toggle de filtre, comportement de filtrage **identique** (même ensemble de markers visibles).
`setData` conservé (les compteurs de cluster doivent rester corrects — Pitfall 2).

---

## 3. Baseline mémoire (AVANT refactor) — MAP-02 / D-03

> **À remplir en Task 2 (mesure humaine).** Ne pas fabriquer de chiffres.
> Protocole : § 4 étape 6. Cible : rétention des `Blob` / object URLs (`URL.createObjectURL`)
> après cycles open/close d'`AddSpotForm` (bug `AddSpotForm.tsx:62-66`, jamais démonté — Pitfall 3).

- **Snapshot initial (heap, avant toute ouverture d'AddSpotForm) :** _(à mesurer — taille heap + nb de Blob/object URLs)_
- **Actions :** ouvrir « ajouter un spot » depuis la carte → ajouter 5 images → fermer → rouvrir/refermer ×5.
- **Snapshot après 5 cycles open/close :** _(à mesurer — taille heap + nb de Blob/object URLs)_
- **Delta de rétention Blob/object URLs :** _(à mesurer — les URLs révoquées doivent ≈ celles créées ; croissance monotone = fuite)_

**Cible APRÈS refactor (Pattern 3, révocation au reset + garde au démontage) :** rétention stable,
aucune croissance monotone des Blob/object URLs entre snapshots.

---

## 4. Protocole exact (verbatim RESEARCH.md § Protocole de mesure PERF-01)

> Copié verbatim pour que le dev rejoue **exactement la même séquence** avant ET après refactor.

1. `npm run dev`, ouvrir React DevTools → Profiler.
2. Démarrer l'enregistrement, toggler chaque filtre 2×, arrêter.
3. Noter : nombre de renders du composant `MapComponent` + durée, et si `<Source>`/layers re-render.
4. Archiver cette baseline dans le phase dir (ce fichier, `02-BASELINE.md`).
5. Refaire la même séquence après refactor → comparer. Cible : moins d'allocations/renders, comportement identique.
6. Pour D-03 : onglet Memory, snapshot → ajouter 5 images → fermer → rouvrir ×5 → snapshot. La rétention de `Blob`/object URLs ne doit pas croître.

**Complément nav-shell (PERF-01 « nav + carte », ROADMAP success criterion 4) :**
- Onglet Profiler : démarrer l'enregistrement, effectuer 3 actions qui NE changent NI l'onglet actif
  NI l'état d'auth (ex. ouvrir puis fermer SpotDetail, toggler un filtre carte, ajouter/retirer un favori),
  arrêter.
- Noter le nombre de renders de `NavBar` (instances mobile ET desktop) déclenchés par ces changements
  d'état non-nav. Cible APRÈS refactor : 0 render superflu (NavBar mémoïsé + callbacks stabilisés).

---

## 5. Baseline nav-shell (AVANT refactor) — PERF-01 « nav + carte »

> **À remplir en Task 2 (mesure humaine).** Ne pas fabriquer de chiffres.
> Protocole : § 4 complément nav-shell. Cible : renders des instances `NavBar` (mobile ET desktop)
> déclenchés par des changements d'état **non-nav** (ni onglet actif, ni auth).

| Action non-nav déclenchée | Nb renders `NavBar` mobile | Nb renders `NavBar` desktop | `NavBar` re-render alors que ses props effectives n'ont pas changé (oui/non) |
|---------------------------|----------------------------|-----------------------------|------------------------------------------------------------------------------|
| Ouvrir puis fermer SpotDetail | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| Toggler un filtre carte | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |
| Ajouter/retirer un favori | _(à mesurer)_ | _(à mesurer)_ | _(à mesurer)_ |

**Cible APRÈS refactor :** 0 render superflu de `NavBar` sur état non-nav (NavBar mémoïsé + callbacks
stabilisés). Toute valeur > 0 dans la colonne de droite avant refactor = re-render inutile à éliminer.

---

*Sections 2, 3 et 5 restent volontairement non chiffrées : leur remplissage requiert une mesure
runtime interactive (React DevTools Profiler + onglet Memory) impossible en CLI. Voir Task 2 du
`02-01-PLAN.md` (checkpoint `human-verify`, resume-signal : « baseline capturée »).*
