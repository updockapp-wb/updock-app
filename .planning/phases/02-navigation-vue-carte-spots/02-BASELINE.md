# Phase 2 — Baseline AVANT refactor (Profiler + mémoire + audit Modal)

> **But :** figer les métriques de performance/mémoire et l'audit des consommateurs de
> `src/ui/Modal` **AVANT tout changement de code**, pour rendre PERF-01 / MAP-01 / MAP-02
> mesurables (comparaison avant/après). Ce fichier est le **GATE Wave 0** : les Plans 02 et 03
> (Wave 1) ne doivent modifier aucun fichier source tant que les sections Profiler/mémoire/nav-shell
> ci-dessous ne sont pas remplies avec des chiffres réels (mesure humaine — Task 2).
>
> **Statut :** Task 1 (scaffold) et Task 2 (mesures) **complétées**. Chiffres Profiler/mémoire/nav-shell
> capturés via `chrome-devtools-mcp` (Chrome piloté automatiquement) plutôt que l'extension React
> DevTools (non installée dans cet environnement) — voir notes de méthodologie par section.
>
> **Environnement de mesure :** dev build Vite (`npm run dev`) dans Chrome, **pas** le build iOS
> (RESEARCH Open Q3, RESOLVED).

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

> **Méthodologie (déviation du protocole d'origine) :** l'extension React DevTools n'était pas
> disponible dans l'environnement de mesure. Mesure réalisée via `chrome-devtools-mcp` (navigateur
> Chrome piloté) + instrumentation temporaire `console.count('BASELINE:MapComponent render')` insérée
> en tête de `MapComponent` (`src/components/Map.tsx`), **retirée immédiatement après mesure** (aucun
> résidu dans `git diff` — vérifié). Cette méthode donne un **nombre de renders exact** (compte de
> commits React) mais **pas de durée en ms** (pas de profiling temporel sans l'onglet Profiler).
> **`React.StrictMode` est actif** (`src/main.tsx`) : chaque render réel apparaît **doublé** en dev
> (double-invoke volontaire de React). Les chiffres bruts ci-dessous incluent ce doublement ; le
> chiffre entre parenthèses est le render réel équivalent. **Reproduire la même méthode après
> refactor** pour une comparaison valide (le facteur ×2 StrictMode reste constant tant que le mode
> n'est pas retiré).
>
> Protocole exécuté : 2 passes complètes du cycle `Tous → Dockstart → Rockstart → Dropstart →
> Deadstart → Rampstart → Beachstart → Tous` (14 clics), via le panneau Filtres.

| Filtre togglé | Nb renders `MapComponent` (bruts StrictMode / réels) | Durée (ms) | `<Source>`/layers re-render (oui/non) |
|---------------|---------------------------------------------------------|------------|----------------------------------------|
| Chaque transition de filtre (14/14, passes 1 et 2 identiques) | 2 / **1** par clic | non mesuré (méthode = compteur de renders, pas de profiling temporel) | non mesuré directement (nécessiterait instrumentation additionnelle sur `<Source>`/`<Layer>`) |
| **Total (2 passes, 14 clics)** | 28 / **14** | — | — |

**Constat clé :** `MapComponent` re-render **à chaque clic filtre, sans exception** (1:1, comportement
attendu — le state `filter` est local à `MapComponent`). Aucun render superflu détecté au-delà de ce
qui est strictement nécessaire ; l'optimisation MAP-01 porte donc sur le **coût interne** de chaque
render (allocations, re-calcul `spotsGeoJson`, etc.) plutôt que sur des renders en excès à ce niveau.

**Cible APRÈS refactor (split-memoization MAP-01) :** moins d'allocations/renders du sous-arbre carte
à chaque toggle de filtre, comportement de filtrage **identique** (même ensemble de markers visibles).
`setData` conservé (les compteurs de cluster doivent rester corrects — Pitfall 2).

---

## 3. Baseline mémoire (AVANT refactor) — MAP-02 / D-03

> **Méthodologie (déviation du protocole d'origine) :** compte administrateur requis pour accéder à
> `AddSpotForm` (verrouillé sans session — testé, `Add Spot` et le cœur favori ouvrent `AuthModal`
> sans compte). Mesure réalisée via `chrome-devtools-mcp`, connecté avec le compte de test de
> l'utilisateur (`updock.app@gmail.com`, admin). Deux instruments complémentaires :
> 1. **Interception `URL.createObjectURL`/`revokeObjectURL`** (hook JS injecté en session, aucune
>    modification de code source) — compte exact des créations/révocations et des URLs encore "live".
> 2. **Heap snapshots Chrome DevTools Protocol** avant/après (taille totale du tas, proxy grossier).
>
> 5 images JPEG minimales (1×1 px, générées localement) utilisées pour chaque cycle.

- **Snapshot initial (heap, avant toute ouverture d'AddSpotForm) :** 38 794 121 bytes (~38.8 MB)
- **Actions :** ouvrir « ajouter un spot » depuis la carte → ajouter 5 images → fermer → répété **5 fois** (25 images uploadées au total, positions aléatoires sur la carte, jamais soumis/publié).
- **Snapshot après 5 cycles open/close :** 39 477 490 bytes (~39.5 MB) — **delta ≈ +683 KB** (croissance modeste sur 5 cycles ; pas un signal fort à lui seul, corroboré par le compteur Blob ci-dessous).
- **Compteur Blob/object URLs (source de vérité) :**

| Métrique | Valeur |
|---|---|
| `createObjectURL` appelés (5 cycles × 5 images) | 26 (25 images + 1 hors-cycle, une seule fois, cycle 1) |
| `revokeObjectURL` appelés | 71 *(inclut du bruit hors-AddSpotForm : Mapbox GL révoque aussi des blob URLs internes pour ses web workers — non filtrable proprement depuis l'extérieur)* |
| URLs encore "live" (non révoquées) après le **dernier** close, sans réouverture | **1** |

**Delta de rétention :** **1 URL Blob reste définitivement non révoquée après fermeture** (jusqu'à la
prochaine ouverture du formulaire, qui la nettoie incidemment — voir cause racine ci-dessous). Pas de
croissance *linéaire* observée cycle après cycle (le nombre live reste à 1, pas 5, 10, 15...) — la fuite
est **bornée à 1 URL par session** plutôt que non bornée, mais elle est **réelle et confirmée dans le
code**.

**Cause racine identifiée (lecture directe de `AddSpotForm.tsx:37-66`) :**
```tsx
useEffect(() => {
    if (isOpen) resetForm();      // resetForm() → setImagePreviews([]) — ne s'exécute qu'À L'OUVERTURE
}, [isOpen]);

useEffect(() => {
    return () => {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));   // cleanup à CHAQUE changement de imagePreviews
    };
}, [imagePreviews]);   // ⚠ pas un cleanup de démontage — se ré-exécute à chaque ajout/suppression d'image
```
Deux effets combinés :
1. Le composant `AddSpotForm` **ne démonte jamais réellement** à la fermeture (`isOpen` passe juste à
   `false`, probablement pour l'animation d'entrée/sortie) — confirmé empiriquement : fermer le
   formulaire ne déclenche **aucun** appel `revokeObjectURL` (0 changement de compteur observé juste
   après le clic de fermeture).
2. Le `useEffect(() => {...}, [imagePreviews])` a une dépendance sur le tableau entier, qui change de
   référence à **chaque** ajout d'image (`setImagePreviews(prev => [...prev, ...newPreviews])`) — son
   cleanup révoque donc le tableau **précédent** à chaque nouvel ajout, plutôt qu'au vrai démontage.
   Conséquence : après ajout de 5 images en séquence, seules les URLs du **dernier** ajout restent
   "live" (celles des ajouts 1 à 4 ont déjà été révoquées par le cleanup de l'ajout suivant). C'est ce
   qui explique le compteur "live=1" stable plutôt qu'une accumulation visible.
3. Comme le composant ne démonte jamais, cette dernière URL "live" **fuit réellement** jusqu'à la
   prochaine ouverture (`resetForm()` la nettoie alors incidemment via le même mécanisme).

**Cible APRÈS refactor (Pattern 3, révocation au reset + garde au démontage) :** rétention stable,
aucune URL "live" restante après fermeture (compteur doit retomber à 0, pas 1), et le cleanup ne doit
se déclencher que sur un vrai démontage ou une suppression explicite d'image (pas sur chaque ajout).

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

> **Méthodologie :** même approche que § 2 — `console.count('BASELINE:NavBar render (mobile|desktop)')`
> inséré en tête de `NavBar` (`src/components/NavBar.tsx`), instrumentation retirée après mesure.
> Chiffres bruts = commits React (doublés par `StrictMode`) ; réel = brut / 2. Compte non-authentifié
> (pas de session utilisateur active pendant la mesure — `user` prop = `null`/`undefined` sur toute
> la séquence).
>
> Note sur l'action 3 : « ajouter/retirer un favori » nécessite une session authentifiée
> (`AddSpotForm`/action favori verrouillés). Sans compte de test disponible, l'action mesurée est le
> clic sur le cœur favori **verrouillé**, qui ouvre `AuthModal` (puis fermeture sans compléter l'auth)
> — l'état d'auth final reste inchangé, donc l'action respecte bien la contrainte "ni onglet actif ni
> état d'auth" du protocole, mais mesure l'ouverture d'`AuthModal` plutôt que le toggle de favori
> proprement dit.

| Action non-nav déclenchée | Nb renders `NavBar` mobile (bruts/réels) | Nb renders `NavBar` desktop (bruts/réels) | `NavBar` re-render alors que ses props effectives n'ont pas changé (oui/non) |
|---------------------------|-------------------------------------------|----------------------------------------------|------------------------------------------------------------------------------|
| Ouvrir puis fermer SpotDetail | 4 / **2** (1 à l'ouverture, 1 à la fermeture) | 4 / **2** (idem) | **oui** — `activeTab` et `user` inchangés sur les deux commits |
| Toggler un filtre carte | 0 / **0** | 0 / **0** | N/A — aucun render déclenché (state `filter` local à `MapComponent`, ne remonte pas jusqu'à `App`) |
| Ouvrir/fermer `AuthModal` via le cœur favori verrouillé | 4 / **2** (1 à l'ouverture, 1 à la fermeture) | 4 / **2** (idem) | **oui** — `activeTab` et `user` inchangés sur les deux commits |

**Constat clé :** `NavBar` (mobile ET desktop) re-render inutilement quand `selectedSpot` ou
`isAuthModalOpen` changent dans `App.tsx`, alors qu'aucune de ses props effectives (`activeTab`,
`user`) n'a changé — confirme l'hypothèse PERF-01 « nav + carte » : `App` re-render globalement sur
ces changements d'état, et `NavBar` n'est pas mémoïsé pour absorber ce re-render parent. Le toggle de
filtre, lui, ne déclenche **aucun** render `NavBar` (le state est bien isolé dans `MapComponent`).

**Cible APRÈS refactor :** 0 render superflu de `NavBar` sur état non-nav (NavBar mémoïsé + callbacks
stabilisés). Toute valeur > 0 dans la colonne de droite avant refactor = re-render inutile à éliminer.

---

*Sections 2, 3 et 5 sont chiffrées (Task 2 complétée, 2026-07-29) via `chrome-devtools-mcp` — voir
`02-01-SUMMARY.md` pour le résumé d'exécution complet.*
