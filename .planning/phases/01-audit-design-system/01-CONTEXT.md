# Phase 1: Audit & Design System - Context

**Gathered:** 2026-07-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Fonder le refactor v2.0 en produisant trois livrables, sans aucune nouvelle
fonctionnalité utilisateur et sans changement d'apparence des écrans :

1. **Audit chiffré (DS-03)** — un document décrivant l'état actuel (structure,
   dépendances, dette, incohérences UI) avec une baseline chiffrée
   (bundle, perf) servant de référence aux phases suivantes.
2. **Fichier de tokens unique (DS-01)** — couleurs, typographie, espacements,
   rayons, ombres centralisés ; aucune valeur de design en dur dans les
   composants du design system.
3. **Composants maîtres (DS-02)** — Button, Card, Input, Modal, Header,
   réutilisables, avec variantes, consommant exclusivement les tokens.

**Contrainte cardinale :** les tokens sont *extraits* des valeurs de design
réellement rendues dans l'app existante. Harmonisation de l'existant, **pas de
rebranding** — l'apparence des écrans reste inchangée.

</domain>

<decisions>
## Implementation Decisions

### Stratégie & emplacement des tokens
- **D-01:** La source unique des tokens est le bloc `@theme` de `src/index.css`,
  nettoyé et étendu. On exploite le fonctionnement natif de **Tailwind v4**
  (les classes utilitaires `bg-primary`, `rounded-lg`, etc. sont générées
  directement depuis `@theme`). Pas de couche d'indirection supplémentaire.
- **D-02:** Le conflit actuel (le bloc `@theme` définit une palette « Deep Ocean »
  sombre — `--color-background: #0f172a` — tandis que `:root` réoverride en
  thème clair — `background: #f8fafc`, `--color-primary: #0ea5e9`) est résolu en
  **canonisant sur les valeurs réellement rendues**. L'audit inspecte les écrans
  effectivement affichés (l'app tourne en clair : `color-scheme: light`, fond
  clair) et les tokens sont extraits de ces valeurs visibles. Les valeurs
  mortes ou contradictoires sont supprimées.
- **D-03:** Les tokens couvrent couleurs, typographie, espacements, rayons et
  ombres (périmètre DS-01). Les quelques couleurs consommées côté JS (ex.
  couleurs de markers dans `Map.tsx`) doivent pouvoir référencer les mêmes
  valeurs sources plutôt que rester en dur — à traiter au niveau tokens.

### Anatomie des composants maîtres
- **D-04:** Les composants maîtres vivent dans un **nouveau dossier `src/ui/`**
  (Button, Card, Input, Modal, Header), séparé des composants métier de
  `src/components/`. Frontière du design system nette.
- **D-05:** Les composants **codifient à l'identique** les patterns déjà en
  place : glass-morphism (`bg-white/10 backdrop-blur-xl border border-white/20`),
  Modal = pattern `AnimatePresence` + backdrop `bg-black/60 backdrop-blur-md` de
  l'actuel `AuthModal`, convention `isOpen`/`onClose`, handlers `handle*`.
  **Aucune invention visuelle** — le rendu doit rester pixel-identique.
- **D-06:** Jeu de variantes **complet / anticipé** : chaque composant expose les
  variantes courantes (ex. Button : primary / secondary / ghost / danger,
  tailles sm / md / lg, états loading / disabled), même si toutes ne sont pas
  encore consommées. **Contrainte :** le style de chaque variante est dérivé des
  tokens et des valeurs existantes — les variantes élargissent l'API, jamais
  l'apparence.

### Profondeur & outillage de l'audit (DS-03)
- **D-07:** Audit **exhaustif**. Outillage :
  - **Bundle** — `vite build` + `rollup-plugin-visualizer` (ou équivalent) pour
    la taille des bundles et la composition.
  - **Perf** — **Lighthouse mobile** + **Web Vitals** complets, plus **React
    Profiler** sur les écrans critiques (carte, écrans de navigation).
  - **Dépendances** — cartographie complète, deps inutilisées/obsolètes
    (ex. `depcheck`), incohérences de versions (cf. `CONCERNS.md` : Capacitor
    CLI v7 vs core v8).
  - **Incohérences UI** — inventaire des couleurs en dur, des patterns modaux
    dupliqués, des valeurs de design dispersées.
- **D-08:** **Baseline ferme + cibles directionnelles.** On fige les valeurs
  exactes de baseline (ex. taille de bundle actuelle en ko). Pour PERF-03 on
  pose une cible **directionnelle** (ex. −15 % de bundle) qui sera affinée en
  phase 5 quand le retirable sera connu — pas d'engagement chiffré à l'aveugle.

### Portée de la phase
- **D-09:** Phase 1 = librairie + audit **+ un écran-preuve minimal**. Après
  avoir construit tokens et composants, on migre **`AuthModal`** vers les
  composants maîtres (à apparence strictement identique). `AuthModal` est choisi
  car il exerce Modal + Input + Button + gestion d'erreur d'un coup — c'est la
  meilleure preuve que le design system tient avant les phases 2-4. L'apparence
  et le comportement restent inchangés (aucune régression du flux auth).

### Claude's Discretion
- Nommage précis des tokens (échelle d'espacements, noms de rayons/ombres) —
  laissé au planner/exécuteur, tant que cohérent avec Tailwind v4 et extrait de
  l'existant.
- Signatures d'API exactes et structure interne des composants `src/ui/`.
- Choix précis de l'outil de visualisation de bundle et du script d'audit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/REQUIREMENTS.md` — DS-01, DS-02, DS-03 (périmètre de la phase) +
  section « Out of Scope » (pas de rebranding, pas de nouvelles fonctionnalités,
  pas d'infra de test, pas de refactor du stockage des types de spot).
- `.planning/ROADMAP.md` §Phase 1 — goal et success criteria.

### Source of truth design (à nettoyer)
- `src/index.css` — bloc `@theme` (tokens Tailwind v4) + `:root` en conflit ;
  cible du nettoyage / canonisation (D-01, D-02).

### Références de patterns à codifier
- `.planning/codebase/CONVENTIONS.md` — patterns UI existants : Tailwind CSS
  uniquement, Lucide React, Framer Motion, pattern Modal/Drawer, glass-morphism,
  conventions de nommage et d'API des composants.
- `src/components/AuthModal.tsx` — pattern Modal de référence (AnimatePresence +
  backdrop-blur, `mapAuthError`) ET écran-preuve à migrer (D-09).
- `.planning/codebase/STRUCTURE.md`, `.planning/codebase/STACK.md` — arborescence
  et stack (Tailwind v4, Vite, React, Capacitor).

### Matière pour l'audit (DS-03)
- `.planning/codebase/CONCERNS.md` — dette, dépendances à risque (Capacitor
  version mismatch, migration Tailwind v4 incomplète), incohérences.
  ⚠️ Ne couvrir que ce qui relève de ce milestone (UI/deps/bundle/perf) —
  ignorer les items hors scope (type coercion, offline, infra de test).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/index.css` `@theme`** : socle de tokens Tailwind v4 déjà présent —
  à nettoyer plutôt que recréer.
- **`src/components/AuthModal.tsx`** : source des patterns Modal + Input + Button
  et écran-preuve de la phase.
- **Patterns Framer Motion** (`AnimatePresence`, stagger `delay: index * 0.05`) :
  à conserver dans le Modal maître.

### Established Patterns
- **Styling :** Tailwind CSS v4 uniquement, pas de CSS-in-JS, pas de
  `tailwind.config.*` (config CSS-first via `@theme`).
- **Composants :** PascalCase, export default, props destructurées, interface
  `[Component]Props`, handlers préfixés `handle*`.
- **Modal :** `isOpen`/`onClose`, backdrop `bg-black/60 backdrop-blur-md`,
  surface glass `bg-white/10 backdrop-blur-xl border border-white/20`.
- **Imports relatifs** (pas d'alias de path configuré).

### Integration Points
- `src/ui/` (nouveau) — dossier des composants maîtres.
- `src/index.css` — point d'ancrage des tokens (source unique).
- `src/components/AuthModal.tsx` — premier consommateur (écran-preuve).
- Valeurs de couleurs en dur dans `src/components/Map.tsx` — à recenser dans
  l'audit ; migration réelle des markers reste pour les phases suivantes.

</code_context>

<specifics>
## Specific Ideas

- Écran-preuve explicitement choisi : **`AuthModal`** (exerce Modal + Input +
  Button + erreurs simultanément).
- Palette réellement rendue à extraire : thème **clair** (`color-scheme: light`,
  fond `#f8fafc`, primary `#0ea5e9`, etc.), pas la palette « Deep Ocean » sombre
  résiduelle du `@theme`.
- Cible PERF-03 directionnelle plutôt que ferme (affinée en phase 5).

</specifics>

<deferred>
## Deferred Ideas

- **Theming clair/sombre intentionnel** — conserver les deux palettes comme
  thèmes serait une nouvelle direction visuelle : hors scope du milestone v2.0.
- **Migration des couleurs de markers `Map.tsx` vers tokens** — recensée dans
  l'audit, mais la migration effective de la carte relève de la **Phase 2**.
- **Design system étendu** (toasts, tabs, badges, skeletons) — DS-04, hors v2.0.
- **Correction de la dette hors UI** (typage `any`, stockage des types de spot,
  offline, tests) — hors scope du milestone (cf. `REQUIREMENTS.md` Out of Scope).

</deferred>

---

*Phase: 1-audit-design-system*
*Context gathered: 2026-07-28*
