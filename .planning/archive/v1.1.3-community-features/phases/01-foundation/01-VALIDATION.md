---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (React/TypeScript project) |
| **Config file** | vitest.config.ts (if exists) or vite.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | TECH-01 | build | `npx cap doctor` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | TECH-01 | build | `npx cap sync` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | TECH-01 | schema | `npx supabase db diff` or manual | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | FIX-01 | unit | `npx vitest run NearbySpotsList` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | FIX-02 | unit | `npx vitest run AddSpotForm` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | PROF-01 | unit | `npx vitest run UserProfile` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 3 | PROF-02 | manual | avatar upload flow | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/NearbySpotsList.test.tsx` — stub for FIX-01 proximity sort
- [ ] `src/__tests__/AddSpotForm.test.tsx` — stub for FIX-02 form cleanup
- [ ] `src/__tests__/UserProfile.test.tsx` — stub for PROF-01/PROF-02 profile screen
- [ ] vitest installed and configured if not present

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Avatar upload visible on profile | PROF-02 | Requires Supabase Storage bucket + real device camera/gallery | 1. Login 2. Go to Profile 3. Tap avatar 4. Upload image 5. Verify image displays |
| Capacitor native build (iOS/Android) | TECH-01 | Requires native build environment | Run `npx cap open ios` or `npx cap open android`, build, verify no version warnings |
| GPS proximity sort on device | FIX-01 | Requires real GPS position | Open app on device, check spot list sorted by distance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
