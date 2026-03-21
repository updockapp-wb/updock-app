---
phase: 3
slug: sessions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | SESS-01 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | SESS-02 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | SESS-03 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 1 | SESS-04 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/sessions.test.ts` — stubs for SESS-01, SESS-02, SESS-03, SESS-04
- [ ] Existing vitest infrastructure covers framework requirements

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session create/join/leave real-time participant count update | SESS-03 | Requires live Supabase + UI interaction | Open two browser tabs, create session in one, join in another, verify count updates in both |
| Profile screen shows user's upcoming sessions | SESS-04 | Requires auth + data | Login, create a session, navigate to Profile tab, verify session list appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
