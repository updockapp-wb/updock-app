---
phase: 4
slug: push-notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) + manual device testing |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds (unit/integration only) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | NOTIF-01 | manual | `npx cap sync ios` (verify no errors) | ✅ | ⬜ pending |
| 4-01-02 | 01 | 1 | NOTIF-01 | unit | `npx vitest run src/contexts/SessionsContext.test.tsx` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | NOTIF-01 | manual | Physical device: permission dialog appears on session create/join | N/A | ⬜ pending |
| 4-02-01 | 02 | 1 | NOTIF-02 | manual | Deploy Edge Function, trigger via DB insert, verify FCM delivery | N/A | ⬜ pending |
| 4-02-02 | 02 | 2 | NOTIF-03 | manual | pg_cron job fires, reminder delivered before session start | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/contexts/SessionsContext.test.tsx` — stubs for NOTIF-01 permission + token registration
- [ ] `supabase/functions/notify-new-session/index.test.ts` — stubs for NOTIF-02 dispatch
- [ ] `supabase/functions/session-reminders/index.test.ts` — stubs for NOTIF-03 reminder logic + idempotency

*If vitest already configured, no new install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push permission dialog appears on session create/join | NOTIF-01 | APNs only works on physical iOS device, not Simulator | Build to device, tap "Create Session", confirm system permission dialog appears |
| Notification received when favorite-spot session created | NOTIF-02 | Requires live FCM + APNs pipeline | Have user A favorite Spot X, have user B create session on Spot X, verify user A receives push |
| Reminder notification fires before session | NOTIF-03 | Requires live pg_cron + FCM pipeline | Create session starting in 1h, wait for reminder, verify delivery 1h prior |
| FCM token stored without overwriting other devices | NOTIF-01 | Requires multi-device setup | Log in same user on 2 devices, verify both tokens exist in push_tokens with same user_id |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
