# Phase 1: Audit & Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-28
**Phase:** 1-audit-design-system
**Areas discussed:** Stratégie & emplacement des tokens, Anatomie des composants maîtres, Profondeur & outillage de l'audit, Portée de la phase

---

## Stratégie & emplacement des tokens

### Emplacement de la source unique
| Option | Description | Selected |
|--------|-------------|----------|
| Nettoyer/étendre le `@theme` de `index.css` | Natif Tailwind v4, un seul endroit, zéro indirection | ✓ |
| Fichier TS séparé (`tokens.ts`) + `@theme` généré | Flexible pour le JS mais étape de synchro/build | |
| Hybride : `@theme` UI + const TS pour le JS | Pragmatique mais deux endroits à aligner | |

### Résolution du conflit `@theme` sombre vs `:root` clair
| Option | Description | Selected |
|--------|-------------|----------|
| Canoniser sur le rendu réel, l'audit tranche | Extraire les tokens des valeurs effectivement affichées (app en clair) | ✓ |
| Garder les deux, préparer un theming clair/sombre | Hors scope du milestone, fige la dette | |
| Vérifier le rendu réel d'abord | Investiguer avant de trancher | |

**User's choice:** `@theme` nettoyé/étendu comme source unique + canonisation sur les valeurs rendues.
**Notes:** Le projet est en Tailwind v4 (pas de `tailwind.config.*`, config CSS-first). Conflit constaté : `@theme` définit une palette sombre « Deep Ocean » tandis que `:root` réoverride en clair.

---

## Anatomie des composants maîtres

### Emplacement & fidélité aux patterns
| Option | Description | Selected |
|--------|-------------|----------|
| Nouveau `src/ui/`, codifier l'existant à l'identique | Extrait les patterns en place, aucune invention visuelle | ✓ |
| Dans `src/components/` existant | Frontière design-system moins nette | |
| `src/ui/` mais repenser l'API | Risque d'écart visuel/comportemental | |

### Étendue des variantes
| Option | Description | Selected |
|--------|-------------|----------|
| Minimales : seulement ce qui existe | Évite le sur-engineering | |
| Complètes : anticiper les variantes courantes | primary/secondary/ghost/danger, tailles, états loading/disabled | ✓ |
| Décrire soi-même les variantes | Texte libre | |

**User's choice:** Nouveau `src/ui/` codifiant l'existant + jeu **complet** de variantes.
**Notes:** Tension notée — variantes non consommées = dette potentielle (CODE-01). Atténuée par la contrainte : le style des variantes est dérivé des tokens/valeurs existantes, jamais une nouvelle apparence.

---

## Profondeur & outillage de l'audit (DS-03)

### Niveau de profondeur / outillage
| Option | Description | Selected |
|--------|-------------|----------|
| Ciblé refactor, outils standards | vite build + visualizer, Profiler, depcheck | |
| Exhaustif (Lighthouse, analyse complète) | Lighthouse mobile + Web Vitals + cartographie complète | ✓ |
| Léger : baseline chiffrée minimale | Rapide mais moins de matière | |

### Cibles vs baseline
| Option | Description | Selected |
|--------|-------------|----------|
| Baseline ferme + cibles directionnelles | Fige la baseline, cible PERF-03 directionnelle affinée en phase 5 | ✓ |
| Cibles chiffrées fermes dès maintenant | Risque d'arbitraire avant exploration | |
| Baseline seule, cibles plus tard | Risque de non-conformité DS-03 | |

**User's choice:** Audit exhaustif + baseline ferme avec cibles directionnelles.

---

## Portée de la phase

| Option | Description | Selected |
|--------|-------------|----------|
| Librairie + audit + 1 écran-preuve minimal | Migre 1 écran pour prouver le design system, dé-risque phases 2-4 | ✓ |
| Librairie + audit seuls, zéro migration | Frontière nette mais composants non prouvés en vrai | |
| Choisir l'écran-preuve soi-même | Preuve sur un écran désigné | |

**User's choice:** Librairie + audit + 1 écran-preuve minimal. Écran-preuve = **AuthModal** (confirmé au moment de finaliser le contexte).
**Notes:** AuthModal préféré à WelcomeScreen car il exerce Modal + Input + Button + gestion d'erreur simultanément — meilleure preuve du design system. Apparence et flux auth strictement inchangés.

## Claude's Discretion

- Nommage précis des tokens (échelle d'espacements, rayons, ombres).
- Signatures d'API exactes et structure interne des composants `src/ui/`.
- Choix précis de l'outil de visualisation de bundle et du script d'audit.

## Deferred Ideas

- Theming clair/sombre intentionnel — hors scope (nouvelle direction visuelle).
- Migration des couleurs de markers `Map.tsx` vers tokens — Phase 2.
- Design system étendu (toasts, tabs, badges, skeletons) — DS-04, hors v2.0.
- Dette hors UI (typage `any`, stockage types de spot, offline, tests) — hors scope milestone.
