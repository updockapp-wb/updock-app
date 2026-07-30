---
phase: 03-fiches-d-taill-es-profils
plan: 03
subsystem: design-system-migration
tags: [ui, design-system, tokens, refactor, profile, community-stats]
requires:
  - "src/ui/Card.tsx (master, consumed as-is)"
  - "src/ui/Button.tsx (master, consumed as-is)"
  - "src/index.css @theme tokens (03-01)"
provides:
  - "Profile.tsx consuming Card ×2 + Button secondary, 1:1 tokens wired"
  - "CommunityStatsScreen.tsx consuming Card ×2, tokens wired, safe-area intact"
affects:
  - "src/components/Profile.tsx"
  - "src/components/CommunityStatsScreen.tsx"
tech-stack:
  added: []
  patterns:
    - "Byte-identical master migration (harmonisation, not rebranding)"
    - "1:1 token aliasing to Tailwind v4 @theme palette"
key-files:
  created: []
  modified:
    - "src/components/Profile.tsx"
    - "src/components/CommunityStatsScreen.tsx"
decisions:
  - "Dead-code bg-sky-500 (Profile ternary else, now L214) left literal — wiring has no observable effect (Pitfall 6)"
  - "text-slate-900 (Profile name-edit resting button) left literal — conservative UI-SPEC choice (token named for CTA background, not text)"
metrics:
  duration: "~5 min"
  completed: 2026-07-30
  tasks: 2
  files: 2
requirements: [UI-02]
---

# Phase 03 Plan 03: Migration Profil & Stats Communauté vers Design System — Summary

Migration byte-identique de `Profile.tsx` et `CommunityStatsScreen.tsx` vers les composants maîtres `Card`/`Button` (4 Card + 1 Button secondary) avec câblage de tous les tokens couleur/rayon à correspondance 1:1, sans aucun changement de rendu observable.

## What Was Done

### Task 1 — Profile.tsx (commit bd153ea)
Migrations structurelles (branche authentifiée uniquement) :
- 2× grille de stats (`Spots Added`, `Favorites`) : `<div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">` → `<Card>` (variant `light` par défaut = chaîne identique).
- Bouton `Log Out` : `<button className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-4 rounded-2xl transition-all mb-8 flex items-center justify-center gap-2">` → `<Button variant="secondary" size="lg" onClick={...} className="w-full mb-8">`. Enfants `<LogOut size={18} />` + libellé « Log Out » codé en dur préservés.
- Imports `Card` et `Button` ajoutés.

Wiring des tokens appliqué (correspondances 1:1) :
| Littéral | Token | Sites live câblés |
|----------|-------|-------------------|
| `text-sky-500` | `text-primary` | 8 |
| `bg-sky-500` | `bg-primary` | 3 (L96, L244, L391) |
| `focus:border-sky-500` | `focus:border-primary` | 1 |
| `border-sky-500` | `border-primary` | 1 (spinner) |
| `text-slate-800` | `text-text` | 6 |
| `text-slate-500` | `text-muted` | 3 |
| `bg-slate-50` | `bg-background` | 4 standalone |
| `hover:bg-slate-50` | `hover:bg-background` | 7 |
| `text-rose-500` | `text-accent` | 1 |

### Task 2 — CommunityStatsScreen.tsx (commit 53f879b)
Migrations structurelles :
- 2× cartes KPI (total spots, total users) : `<div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">` → `<Card>`.
- Import `Card` ajouté.

Wiring des tokens :
| Littéral | Token | Sites |
|----------|-------|-------|
| `bg-slate-50` | `bg-background` | 1 (fond plein écran L88) |
| `text-slate-800` | `text-text` | 4 standalone (h1 app bar + KPI + titre pays) |
| `hover:text-slate-800` | `hover:text-text` | 1 (bouton retour) |
| `text-slate-500` | `text-muted` | 1 |
| `border-sky-500` | `border-primary` | 1 (spinner) |

Zones gelées intactes : `pt-[calc(1rem+env(safe-area-inset-top))]` (safe-area iOS), app bar `<h1 className="text-lg font-bold …">` + `ArrowLeft` à gauche (non migrée vers `Header`), conteneurs de rangées pays, `border-slate-100` (≠ slate-50, non câblé).

## Résidu assumé (documenté par le plan)
- **`bg-sky-500` sur code mort** — Profile.tsx **L214** (ternaire else `{user ? … : …}` inatteignable après le retour anticipé `if (!user)` L71). Laissé littéral : le wiring y serait sans effet observable (Pitfall 6 / CODE-01 Phase 5). `grep -c 'bg-sky-500'` = 1, unique occurrence résiduelle.
- **`text-slate-900`** — Profile.tsx (bouton resting du champ nom, ≈L255) laissé littéral : choix conservateur verrouillé par `03-UI-SPEC.md` (token `text-secondary` nommé pour un fond de CTA, pas pour du texte). `grep -q 'text-slate-900'` réussit toujours.

## Deviations from Plan
None — plan exécuté exactement comme écrit. Aucune règle de déviation (1-4) déclenchée. Aucun `npm install`. Masters `Card`/`Button` consommés sans modification (`git status` vide sur `src/ui/`).

## Verification
- `npm run build` (typecheck `tsc -b` inclus) : vert après chaque tâche.
- Profile.tsx : 2 `<Card>`, 1 `<Button variant="secondary" size="lg">`, tous les littéraux 1:1 câblés (hors code mort + choix conservateur), `text-slate-800/text-slate-500/text-sky-500/border-sky-500/text-rose-500/bg-slate-50` = 0, `bg-primary` = 3.
- CommunityStatsScreen.tsx : 2 `<Card>`, tokens câblés, safe-area intact, app bar `text-lg`/`<h1>` non migrée, aucun `import Header`.
- Byte-identité CSS/visuelle et recette non-auth/non-admin (gardes `isAdmin` préservées) : déléguées au plan 03-06 (phase gate).

## Threat Flags
Aucun. Refactor de présentation pur : aucune nouvelle frontière de confiance, aucune garde d'accès déplacée (rangée « Tableau de Bord Admin » modifiée par wiring de token uniquement, garde `isAdmin` intacte — T-03-03-01 mitigé).

## Self-Check: PASSED
- `src/components/Profile.tsx` — FOUND
- `src/components/CommunityStatsScreen.tsx` — FOUND
- `03-03-SUMMARY.md` — FOUND
- Commit bd153ea (Task 1) — FOUND
- Commit 53f879b (Task 2) — FOUND
