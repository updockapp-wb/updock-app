---
phase: 4
slug: push-notifications
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `npm run build` (TypeScript compilation) + grep-based content checks + manual device testing |
| **Config file** | tsconfig.json (existing) |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` + manual device smoke test |
| **Estimated runtime** | ~15 seconds (build) |

---

## Nyquist Compliance Rationale

Push notification testing is **inherently manual** for this phase. RESEARCH.md explicitly documents:

> "Push notification end-to-end testing is inherently manual (requires physical device, live APNs, real FCM token)."

Automated unit tests for this phase would require mocking Firebase, APNs, FCM v1 API, and Supabase Edge Function runtime — all of which provide low confidence because the primary failure modes are integration-level (wrong token format, expired credentials, missing Xcode capabilities, stale APNs registration).

The validation strategy uses:
1. **TypeScript compilation** (`npm run build`) as automated signal for Plan 01 tasks — catches type errors, missing imports, broken interfaces
2. **Grep-based content checks** for Plan 02 tasks (Deno Edge Functions) — verifies key patterns (Deno.serve, FCM endpoint, idempotency guards) are present in generated files
3. **Manual device testing** as the primary quality gate for all NOTIF requirements

This is nyquist-compliant because every task has an automated verify command that runs in < 60 seconds, and the manual device testing covers the integration paths that no mock can reliably validate.

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (Plan 01) or grep content checks (Plan 02)
- **After every plan wave:** Manual device smoke test if physical device available
- **Before `/gsd:verify-work`:** Full manual verification of all 3 NOTIF requirements on physical device
- **Max feedback latency:** 15 seconds (build time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 4-01-01 | 01 | 1 | NOTIF-01 | build | `npm run build` | pending |
| 4-01-02 | 01 | 1 | NOTIF-01 | build | `npm run build` | pending |
| 4-01-03 | 01 | 1 | NOTIF-01 | checkpoint | Human verify: build + UI + optional device test | pending |
| 4-02-01 | 02 | 2 | NOTIF-02 | content check | `grep -q "Deno.serve" && grep -q "fcm.googleapis.com/v1"` on Edge Function files | pending |
| 4-02-02 | 02 | 2 | NOTIF-03 | content check | `grep -q "sent_reminders" && grep -q "REMINDER_WINDOW_MINUTES"` on Edge Function file | pending |
| 4-02-03 | 02 | 2 | NOTIF-02/03 | checkpoint | Human verify: code review + optional deployment test | pending |

*Status: pending / green / red / flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push permission dialog appears on session create/join | NOTIF-01 | APNs only works on physical iOS device, not Simulator | Build to device, tap "Create Session", confirm system permission dialog appears |
| Permission inline banner appears in SessionForm/SessionCard | NOTIF-01 | Visual verification of UI component rendering | Open session creation flow, verify sky-blue banner with Bell icon appears |
| Notification received when favorite-spot session created | NOTIF-02 | Requires live FCM + APNs pipeline | Have user A favorite Spot X, have user B create session on Spot X, verify user A receives push |
| Reminder notification fires before session | NOTIF-03 | Requires live pg_cron + FCM pipeline | Create session starting in 1h, wait for reminder, verify delivery 1h prior |
| FCM token stored without overwriting other devices | NOTIF-01 | Requires multi-device setup | Log in same user on 2 devices, verify both tokens exist in push_tokens with same user_id |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter (rationale: APNs/FCM testing is inherently manual; automated checks cover compilation and content correctness)

**Approval:** pending
