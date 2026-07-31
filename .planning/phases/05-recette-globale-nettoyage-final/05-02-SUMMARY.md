---
phase: 05-recette-globale-nettoyage-final
plan: 02
subsystem: infra
tags: [knip, depcheck, dependencies, geojson, dead-code, capacitor]

# Dependency graph
requires:
  - phase: 05-recette-globale-nettoyage-final
    provides: knip/depcheck dead-code inventory verified 2026-07-31 (05-RESEARCH.md)
provides:
  - Nettoyage du graphe de dépendances CODE-01 (moitié dead-code/unused deps)
  - geojson déclaré explicitement en devDependency (résout le flag knip "unlisted")
  - autoprefixer supprimé (zéro référence fonctionnelle, build vert)
  - Disposition documentée (KEEP/REMOVE + justification) pour chaque flag knip
affects: [recette, code-audit, dependency-hygiene]

# Tech tracking
tech-stack:
  added: [geojson@^0.5.0 (devDependency, type-only)]
  patterns:
    - "Politique de suppression conservatrice : knip fait autorité, depcheck ignoré pour les décisions de retrait ; retrait uniquement avec preuve zéro-référence + build vert"

key-files:
  created: []
  modified: [package.json, package-lock.json]

key-decisions:
  - "geojson ajouté en devDependency (type-only, non bundlé) plutôt qu'en dependencies runtime — import type-only dans Map.tsx:12"
  - "autoprefixer supprimé : Tailwind v4 auto-préfixe en interne, postcss.config.js ne référence que @tailwindcss/postcss, zéro référence fonctionnelle"
  - "@capacitor/android, firebase, depcheck, @capacitor/assets et les deux edge functions supabase conservés — faux positifs knip / dépendances natives/serveur protégées"

patterns-established:
  - "Disposition auditée : chaque flag knip reçoit KEEP+raison ou REMOVE+preuve, pas de suppression aveugle"

requirements-completed: [CODE-01]

# Metrics
duration: ~12min
completed: 2026-07-31
---

# Phase 5 Plan 02 : Nettoyage dead-code / unused-deps (CODE-01) Summary

**Graphe de dépendances assaini : geojson déclaré explicitement, autoprefixer inutilisé retiré, et disposition justifiée (KEEP/REMOVE) documentée pour chaque flag knip — impact bundle web ~0 kB par conception.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-07-31
- **Tasks:** 2
- **Files modified:** 2 (package.json, package-lock.json)

## Accomplishments
- `geojson@^0.5.0` ajouté en devDependencies → résout le flag knip "unlisted dependency" pour l'import type-only de `Map.tsx:12`
- `autoprefixer` supprimé après preuve de zéro référence fonctionnelle et build vert (Tailwind v4 auto-préfixe en interne)
- Chaque flag knip restant reçoit une disposition documentée (voir table ci-dessous) ; toutes les dépendances requises (native/peer/serveur) préservées
- `npm run build` reste vert après tous les changements de dépendances

## Task Commits

1. **Task 1 : Suppression scratch mort + ajout devDependency geojson** — `b508594` (chore)
2. **Task 2 : Audit + disposition de chaque flag knip (retrait autoprefixer)** — `589b56d` (chore)

## Disposition des flags knip (Task 2)

Inventaire knip frais exécuté après l'ajout de geojson. `geojson` n'apparaît plus (flag "unlisted" résolu).

| Flag knip | Catégorie | Disposition | Justification / Preuve |
|-----------|-----------|-------------|------------------------|
| `supabase/functions/notify-session-created/index.ts` | Unused file | **KEEP** | Edge function déployée côté serveur, hors du graphe client Vite ; la supprimer retirerait une fonction live (T-05-03) |
| `supabase/functions/send-session-reminders/index.ts` | Unused file | **KEEP** | Idem — edge function serveur déployée (T-05-03) |
| `@capacitor/android` | Unused dependency | **KEEP** | D-11 impose un build/test Android réel pour la recette ; dépendance de plateforme native |
| `firebase` (^12.11.0) | *(non flaggé par knip)* | **KEEP** | Peer requis de `@capacitor-firebase/messaging` (`peerDependencies: firebase ^12.6.0`) + importé dans `NotificationsContext.tsx` ; `npm ls firebase` → 12.11.0 direct + dédupliqué sous le plugin |
| `@capacitor/assets` | Unused devDependency | **KEEP** | CLI de génération d'assets exécuté manuellement ; référencé dans `README.md:62` (`npx @capacitor/assets generate`) et `STACK.md` ; binaire `capacitor-assets` présent |
| `depcheck` | Unused devDependency | **KEEP** | Auto-flag ; invoqué via `npx` (jamais importé) |
| `autoprefixer` | Unused devDependency | **REMOVE** | Zéro référence fonctionnelle : `postcss.config.js` n'utilise que `@tailwindcss/postcss` ; Tailwind v4 auto-préfixe en interne ; les seules occurrences hors `package.json` sont des docs de planification/audit historiques. Retiré → `npm run build` reste vert ; knip ne le flag plus |

**Faux positifs depcheck ignorés** (conformément à la recherche : depcheck bruité, knip fait autorité) : `@capacitor/ios`, `tailwindcss`, `postcss`, `@tailwindcss/postcss`, `knip`.

## Files Created/Modified
- `package.json` — ajout `geojson` en devDependencies ; suppression `autoprefixer` de devDependencies
- `package-lock.json` — synchronisé (geojson ajouté, arbre autoprefixer retiré)

## Decisions Made
- **geojson en devDependency (type-only)** : l'import `import type { Feature, FeatureCollection } from 'geojson'` est effacé à la compilation → aucun impact bundle. Placé en devDependencies, pas en dependencies runtime, conformément au plan.
- **Retrait d'autoprefixer** : politique de retrait conservatrice appliquée — supprimé uniquement après preuve zéro-référence fonctionnelle ET build vert vérifié.
- **Conservation des faux positifs knip** : les edge functions (serveur), `@capacitor/android` (native, D-11), `firebase` (peer natif), `depcheck` (npx) et `@capacitor/assets` (CLI manuel) sont des faux positifs intentionnels documentés, pas du code mort.

## Deviations from Plan

None - plan executed exactly as written.

Note de reconciliation (contexte worktree) : le fichier `test-fcm.mjs` que la Task 1 devait supprimer était un fichier scratch NON suivi dans l'arbre de travail principal ; il a été mis en stash par l'orchestrateur avec du travail non commité et n'existe donc pas dans ce worktree (absent au commit de base). La suppression est un **no-op** ici — aucun `git rm` possible, rien à supprimer. Aucune tentative de recréation. L'orchestrateur devra réconcilier cet état contre le stash plus tard. Les critères d'acceptation `test ! -f test-fcm.mjs` sont satisfaits (le fichier est absent).

## Known Stubs
None - aucun stub introduit (changements limités au graphe de dépendances).

## Issues Encountered
- **node_modules absent dans le worktree** : le worktree n'avait pas de `node_modules`. Résolu par un `npm install` initial depuis le lockfile avant les modifications (nécessaire pour `npm run build` et `npx knip`). Pas une déviation — étape d'environnement.
- **`npm ls geojson` initialement vide** : le plan supposait geojson "déjà transitif via @types/mapbox-gl", mais ce qui est transitif est `@types/geojson` (7946.0.16), pas le package runtime `geojson`. Version publiée courante de `geojson` = 0.5.0 (confirmée via `npm view`), donc `^0.5.0` correspond à l'exemple du plan et à l'audit de légitimité RESEARCH.md (github.com/caseycesari/geojson.js, ~1M dl/sem, ~9 ans). Aucun changement de disposition.

## Next Phase Readiness
- Moitié dead-code/unused-deps de CODE-01 satisfaite : dead code réel retiré (autoprefixer + test-fcm.mjs déjà absent), faux positifs documentés en KEEP intentionnels.
- Build vert, aucun flag knip actionnable restant (chaque flag résiduel a une raison de conservation documentée).
- Packages requis pour la recette préservés : `@capacitor/android` (build Android D-11), `firebase` (push natif), edge functions supabase.

---
*Phase: 05-recette-globale-nettoyage-final*
*Completed: 2026-07-31*
