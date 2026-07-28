---
phase: 5
slug: anonymous-access
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manuel (pas d'infra de tests automatisés dans le projet) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~30 seconds (build) + tests manuels |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (vérifie TypeScript, pas d'import cassés)
- **After every plan wave:** Test manuel de tous les scénarios ANON ci-dessous
- **Before `/gsd:verify-work`:** Build vert + walkthrough manuel complet
- **Max feedback latency:** ~30 seconds (build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-xx-01 | RLS migration | 1 | ANON-08 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 5-xx-02 | App.tsx refactor | 1 | ANON-01, ANON-02 | build | `npm run build` | ✅ | ⬜ pending |
| 5-xx-03 | LandingPage delete | 1 | ANON-02 | build | `npm run build` (pas d'erreur d'import) | ✅ | ⬜ pending |
| 5-xx-04 | NavBar auth gate | 1 | ANON-07 | manual | Cliquer Favorites tab sans login | ✅ | ⬜ pending |
| 5-xx-05 | SpotDetail lock CTAs | 2 | ANON-03, ANON-04 | manual | Ouvrir spot detail sans login | ✅ | ⬜ pending |
| 5-xx-06 | Profile anon screen | 2 | ANON-05 | manual | Naviguer vers Profile sans login | ✅ | ⬜ pending |
| 5-xx-07 | Traductions i18n | 2 | ANON-05 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Migration Supabase pour les politiques `anon` SELECT sur `reviews`, `sessions`, `session_attendees`
- [ ] Clés de traduction pour l'écran Profile anonyme (`fr.json` + `en.json`)

*Ces deux éléments sont des prérequis pour que les autres plans fonctionnent correctement.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App se lance sur la Map sans login | ANON-01 | Rendu conditionnel, pas de test auto | Ouvrir l'app sur device/simulateur sans être connecté → vérifier que la Map s'affiche |
| SpotDetail affiche reviews/sessions pour anon | ANON-03 | Dépend du RLS Supabase + rendu UI | Ouvrir un spot sans login → vérifier que les reviews et sessions se chargent |
| Bouton favori/review/session affiche lock + AuthModal | ANON-04 | Interaction UI | Cliquer sur favori/ajouter review/rejoindre session sans login → modal d'auth s'ouvre |
| Profile tab affiche écran login pour anon | ANON-05 | Navigation tab | Naviguer sur Profile sans login → écran de connexion avec paramètres de langue accessibles |
| Navigation GPS fonctionne pour anon | ANON-06 | Intégration Maps native | Cliquer "Naviguer" sur un spot sans login → app de navigation s'ouvre |
| Favorites tab déclenche AuthModal | ANON-07 | Interception tab | Cliquer l'onglet Favorites sans login → AuthModal s'ouvre |
| RLS autorise lecture anon reviews/sessions | ANON-08 | Dépend de la DB Supabase | Vérifier via Supabase Studio OU tester SpotDetail sans login |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (RLS migration + i18n keys)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
