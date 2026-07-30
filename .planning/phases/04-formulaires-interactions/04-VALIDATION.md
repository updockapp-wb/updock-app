---
phase: 04
slug: formulaires-interactions
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-30
---

# Phase 04 — Validation Strategy

> Contrat de validation par phase pour l'échantillonnage de feedback pendant l'exécution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Aucun (décision projet : recette manuelle — aucun `vitest`/`jest`/`*.test.*` détecté) |
| **Config file** | none |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run build` (`tsc -b && vite build`) |
| **Estimated runtime** | ~30 secondes |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** `npm run build` vert + checklist de recette manuelle QA-01 à 100%
- **Max feedback latency:** 30 secondes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-XX-XX | TBD | TBD | UI-03 | — | Champs/boutons rendus via composants DS | manual (recette visuelle) + typecheck | `npm run build` | ✅ QA manuelle | ⬜ pending |
| 04-XX-XX | TBD | TBD | ROBUST-01 | V5 | Validation nom/desc/type + message clair | manual (saisie invalide → message) | — (manuel) | ✅ QA | ⬜ pending |
| 04-XX-XX | TBD | TBD | ROBUST-01 | — | Confirm douce si 0 photo (D-04) | manual | — | ✅ QA | ⬜ pending |
| 04-XX-XX | TBD | TBD | ROBUST-02 | — | Échec API → feedback inline/toast, données conservées, pas de crash | manual (couper réseau, soumettre) | — | ✅ QA | ⬜ pending |
| 04-XX-XX | TBD | TBD | ROBUST-02 | — | Revert favori + toast (D-08) | manual (couper réseau, toggle) | — | ✅ QA | ⬜ pending |
| 04-XX-XX | TBD | TBD | tous | — | Pas de régression TS / lint | typecheck + lint | `npm run build && npm run lint` | ✅ automatisé | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*IDs précis (Task ID / Plan / Wave) à renseigner par le planner une fois les PLAN.md générés.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — aucun test automatisé à créer (contrainte projet « pas de tests »). Le filet automatique se limite à `tsc`/eslint déjà en place.

**À produire par le planner :** une checklist de recette manuelle dédiée (ajout spot, édition spot user, édition spot admin, favori add/remove, favori offline, validation champ vide/trop long, soumission sans photo) — sur le modèle du `03-QA-CHECKLIST.md` existant.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Formulaires ajout/édition de spot + favoris migrés vers le DS | UI-03 | Aucune infra de test automatisé dans le projet ; rendu visuel/interaction à valider à l'œil | Ouvrir chaque écran (ajout spot, édition user, édition admin, favoris), vérifier composants DS (Input, Button, Modal) |
| Validation des champs + messages d'erreur | ROBUST-01 | Comportement UX, pas de harness de test | Saisir des valeurs invalides (nom vide, description trop longue, aucun type) et vérifier le message affiché |
| Confirm douce si 0 photo | ROBUST-01 | Interaction utilisateur | Soumettre le formulaire sans photo, vérifier la confirmation |
| Feedback sur échec API (loading/erreur/retry) | ROBUST-02 | Nécessite simulation réseau manuelle | Couper le réseau, soumettre le formulaire ou toggler un favori, vérifier absence de crash et feedback cohérent |
| Revert favori + toast | ROBUST-02 | Toast natif Capacitor, pas testable en CI | Couper le réseau, toggler un favori, vérifier le revert + toast |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (typecheck/lint) or manual QA fallback documented
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (lint/build run after each task/wave)
- [x] Wave 0 covers all MISSING references (none required — no test infra in project)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
