---
phase: 2
slug: reviews
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing — vite project) |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm run build -- --noEmit` (TypeScript check) |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build -- --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AVIS-01 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AVIS-02 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AVIS-03 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | AVIS-04 | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] TypeScript builds cleanly with zero errors before new code is added

*Existing infrastructure covers all phase requirements — no new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Star picker renders and selects rating | AVIS-01 | UI interaction | Open spot detail → Reviews tab → tap stars 1-5, verify selection updates |
| Review appears in list after submit | AVIS-01 | Real Supabase insert | Submit review → verify it appears without page reload |
| Author avatar shown next to review | AVIS-02 | Requires live profile data | Submit review → verify avatar/display name shown |
| Edit own review | AVIS-03 | Auth + mutation | Edit review text and rating → verify update persists |
| Cannot edit other user's review | AVIS-03 | RLS enforcement | Verify no edit UI shown for other users' reviews |
| Average rating updates immediately | AVIS-04 | Real-time view query | Submit review → verify spot_ratings view update reflected in UI |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
