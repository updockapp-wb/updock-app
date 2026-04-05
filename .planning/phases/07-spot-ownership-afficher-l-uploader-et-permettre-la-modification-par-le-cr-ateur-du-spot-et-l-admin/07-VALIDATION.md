---
phase: 7
slug: spot-ownership
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (React/TypeScript — vite-based project) |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm run build` (TypeScript compile check) |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | Spot.user_id type | build | `npm run build` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | fetchSpots includes user_id | build | `npm run build` | ✅ | ⬜ pending |
| 07-01-03 | 01 | 2 | Uploader display + Modifier button | build | `npm run build` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 1 | Edit overlay extracted | build | `npm run build` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 2 | Photo upload in edit overlay | build | `npm run build` | ✅ | ⬜ pending |
| 07-02-03 | 02 | 2 | RLS UPDATE policy | manual | — | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (TypeScript build is the main validator for this UI phase).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Uploader visible sous le titre dans SpotDetail | Spot Ownership display | UI visuelle | Ouvrir un spot créé avec compte — vérifier nom+avatar affiché |
| Bouton Modifier absent pour non-créateur | Access control | Auth-gated | Se connecter avec un autre compte — vérifier absence bouton |
| RLS UPDATE spots table | Database policy | Supabase RLS | Tenter update via un utilisateur non-créateur — doit échouer |
| Upload photo fonctionne | Photo management | Storage integration | Ajouter une photo via l'overlay — vérifier apparition dans SpotDetail |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
