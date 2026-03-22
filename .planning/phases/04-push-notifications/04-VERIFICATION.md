---
phase: 04-push-notifications
verified: 2026-03-22T22:30:00Z
status: human_needed
score: 10/10 must-haves verified in code
re_verification:
  previous_status: human_needed
  previous_score: 10/10
  gaps_closed:
    - "FirebaseApp.configure() was missing from AppDelegate — now present (commit f5db108)"
    - "AppDelegate imported 'Firebase' monolith — now correctly imports FirebaseCore and FirebaseMessaging (commit 8815314)"
    - "Input fields had no explicit font-size — 16px global rule in index.css prevents iOS zoom (commit 8a23148)"
    - "NSLocationWhenInUseUsageDescription was absent from Info.plist — now present (commit d4ae160)"
    - "navigator.geolocation caused double permission prompt — replaced with @capacitor/geolocation in Map.tsx and SpotsContext.tsx (commit 12d449d)"
    - "flyTo fired on every tab switch — module-level hasFlownToUserLocation guard ensures it runs only on first app load (commit c0e987e)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Trigger notify-session-created webhook end-to-end"
    expected: "User A favorites Spot X. User B creates a session on Spot X. User A receives a push notification titled 'New session at <spot name>'."
    why_human: "Webhook is configured in Supabase Dashboard (not verifiable in code). FCM delivery requires physical iOS device with Firebase configured."
  - test: "Trigger send-session-reminders end-to-end"
    expected: "Create a session starting in ~1 hour. Within 5 minutes of the 1-hour mark, session attendees receive 'Reminder: session in 1 hour' push notification. Running the function a second time for the same session does NOT re-send."
    why_human: "pg_cron schedule requires live Supabase instance with pg_cron + pg_net extensions enabled and Vault secrets configured. Idempotency can only be confirmed with actual DB state."
  - test: "Permission denied does not block session creation on device"
    expected: "User denies push permission when iOS dialog appears during session create. Session is created normally. No error is shown."
    why_human: "Requires physical iOS device. Silent-fail behavior in ensurePushToken is verified in code but real-device confirmation validates the full FCM + APNs chain."
  - test: "Profile notification row reflects live permission state"
    expected: "After granting permission: row shows 'Active' (sky-blue badge). After denying: row shows 'Disabled — tap to enable' and tapping navigates to iOS Settings."
    why_human: "FirebaseMessaging.checkPermissions() returns real OS state only on device. window.location.href='app-settings:' redirect requires native Capacitor runtime."
---

# Phase 04: Push Notifications Verification Report

**Phase Goal:** Add push notifications so users are alerted when a session is created at a favorited spot and reminded before their session starts.
**Verified:** 2026-03-22
**Status:** human_needed — all code artifacts verified; end-to-end delivery requires human testing on device
**Re-verification:** Yes — after iOS bug-fix commits (2026-03-22)

## Re-verification Summary

Six iOS fixes were committed after the initial verification. All six are confirmed applied correctly. No previously passing items have regressed. The overall phase score and human_needed status are unchanged — the fixes address native iOS plumbing that is prerequisite to the human verification tests but do not replace those tests.

| Fix | Commit | Status |
|-----|--------|--------|
| `FirebaseApp.configure()` in `didFinishLaunchingWithOptions` | f5db108 | VERIFIED |
| `import FirebaseCore` + `import FirebaseMessaging` (not `Firebase`) | 8815314 | VERIFIED |
| `Messaging.messaging().apnsToken = deviceToken` in `didRegisterForRemoteNotificationsWithDeviceToken` | f5db108 | VERIFIED |
| `font-size: 16px` on `input, textarea, select` in `index.css` | 8a23148 | VERIFIED |
| `NSLocationWhenInUseUsageDescription` in `Info.plist` | d4ae160 | VERIFIED |
| `@capacitor/geolocation` replaces `navigator.geolocation` in `Map.tsx` + `SpotsContext.tsx` | 12d449d | VERIFIED |
| `hasFlownToUserLocation` module-level flag gates fly-to to first app load only | c0e987e | VERIFIED |

## Goal Achievement

### Observable Truths

#### Plan 01 — Client-Side Infrastructure (NOTIF-01)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Push permission is requested only when a user creates or joins a session, never at app launch | VERIFIED | `ensurePushToken()` called as first action in `createSession` (line 114) and `joinSession` (line 149) in `SessionsContext.tsx`. No call at mount or app launch. |
| 2 | FCM token is stored in push_tokens with correct user_id, token, and platform='ios' | VERIFIED | `NotificationsContext.tsx` lines 119-125: `supabase.from('push_tokens').upsert({ user_id: user.id, token, platform: 'ios' }, { onConflict: 'user_id,token' })` |
| 3 | Multiple devices for the same user each get their own row (UNIQUE on user_id,token) | VERIFIED | `onConflict: 'user_id,token'` in both ensurePushToken (line 123) and tokenReceived listener (line 77). DB schema in 001_community_schema.sql already has `UNIQUE (user_id, token)`. |
| 4 | Profile screen shows notification status (Active/Disabled/unknown/loading) | VERIFIED | `Profile.tsx` lines 306-333: Bell icon with four conditional states — granted (sky Active badge), denied (Disabled text + app-settings: link), unknown (ChevronRight), loading (spinner). |
| 5 | Permission denial does not block session creation or join | VERIFIED | `ensurePushToken` is wrapped in `try/catch` (line 93/129). Returns silently on permission denied (line 111). `createSession` and `joinSession` continue past `await ensurePushToken()` regardless of outcome. |
| 6 | Permission inline banner appears in SessionForm and SessionCard join flow | VERIFIED | `SessionForm.tsx` lines 92-103: `role="status"`, `bg-sky-50`, Bell icon, `notification.banner` key. `SessionCard.tsx` lines 137-148: same pattern, guarded by `!session.user_is_attending`. |

#### Plan 02 — Server-Side Dispatch (NOTIF-02, NOTIF-03)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 7 | When a session is created on a spot, users who favorited that spot receive a push notification | VERIFIED in code / ? RUNTIME | `notify-session-created/index.ts`: queries `favorites` table filtered by `spot_id`, dispatches FCM v1 messages in parallel. Webhook configuration: human-approved per SUMMARY. |
| 8 | Session creator does NOT receive the new-session notification for their own session | VERIFIED | Line 78: `.neq('user_id', session.creator_id)` — creator excluded from favorites query before token lookup. |
| 9 | Session participants receive a reminder push notification ~1 hour before session start | VERIFIED in code / ? RUNTIME | `send-session-reminders/index.ts`: window is 55-65 min (`REMINDER_WINDOW_MINUTES - 5` to `+ 5`). Queries `session_attendees`, fetches push tokens, dispatches FCM. pg_cron: human-approved per SUMMARY. |
| 10 | Reminder notifications are sent exactly once per session (idempotency guard) | VERIFIED | `sent_reminders` INSERT attempt (line 83-91): if INSERT fails (unique constraint on `session_id, reminder_type`), session is skipped with `totalSkipped++`. |

**Score:** 10/10 code-level truths verified. 4 items flagged for human verification (runtime delivery).

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/context/NotificationsContext.tsx` | NotificationsProvider, useNotifications, ensurePushToken, hasToken, permissionStatus, tokenReceived listener | VERIFIED | 148 lines. Exports `NotificationsProvider` and `useNotifications`. All 5 capabilities present and substantive. |
| `src/context/SessionsContext.tsx` | ensurePushToken call before createSession and joinSession DB writes | VERIFIED | `useNotifications` imported (line 4). `ensurePushToken` called before `supabase.from('sessions').insert` in createSession (line 114) and before optimistic update in joinSession (line 149). |
| `src/components/Profile.tsx` | Notification status row with Bell icon and state badge | VERIFIED | Bell imported (line 1). `useNotifications` destructured (line 41). Notification row present at lines 305-333 between Language Toggle and Go Premium. All 4 permissionStatus states handled. |
| `src/components/SessionForm.tsx` | Permission inline banner (bg-sky-50, Bell icon, role='status') | VERIFIED | Lines 92-103. `useNotifications` imported (line 7). `showPermissionBanner` derived from `!hasToken && permissionStatus !== 'granted'`. All spec attributes present. |
| `src/components/SessionCard.tsx` | Permission inline banner in join action area | VERIFIED | Lines 137-148. Same pattern. Additional guard `!session.user_is_attending` prevents banner from showing to attendees. |
| `ios/App/App/AppDelegate.swift` | FirebaseApp.configure(), correct imports, APNs token forwarding, Capacitor delegate methods | VERIFIED (re-verified) | Line 3-4: `import FirebaseCore` + `import FirebaseMessaging` (not monolithic `Firebase`). Line 13: `FirebaseApp.configure()` in `didFinishLaunchingWithOptions`. Line 53: `Messaging.messaging().apnsToken = deviceToken` in `didRegisterForRemoteNotificationsWithDeviceToken`. Lines 57-63: all 3 Capacitor delegate methods present. |
| `ios/App/App/Info.plist` | NSLocationWhenInUseUsageDescription | VERIFIED (re-verified) | Line 50-51: `NSLocationWhenInUseUsageDescription` — "Updock uses your location to show nearby skate spots and sessions." Also includes `NSLocationAlwaysAndWhenInUseUsageDescription` (line 52-53). |
| `src/index.css` | font-size: 16px on input, textarea, select | VERIFIED (re-verified) | Lines 55-58: global rule `input, textarea, select { font-size: 16px; }` with comment explaining iOS zoom prevention. |
| `src/components/Map.tsx` | @capacitor/geolocation for user position; fly-to gated to first app load | VERIFIED (re-verified) | Line 2: `import { Geolocation } from '@capacitor/geolocation'`. Line 16: `let hasFlownToUserLocation = false` (module-level, persists across tab remounts). Lines 270-282: fly-to block guarded by `!hasFlownToUserLocation`, sets flag to `true` before calling `Geolocation.getCurrentPosition`. |
| `src/context/SpotsContext.tsx` | @capacitor/geolocation for watch position | VERIFIED (re-verified) | Line 6: `import { Geolocation } from '@capacitor/geolocation'`. Line 43: `Geolocation.watchPosition(...)`. Line 47: `Geolocation.clearWatch(...)`. No `navigator.geolocation` remaining. |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/notify-session-created/index.ts` | Edge Function with favorites query and FCM v1 dispatch | VERIFIED | 130 lines. `Deno.serve`, `favorites` query, `push_tokens` query, `fcm.googleapis.com/v1`, `Promise.all`, `neq('user_id', session.creator_id)`, `NOT_FOUND`/`UNREGISTERED` stale token cleanup. |
| `supabase/functions/send-session-reminders/index.ts` | Edge Function with 1-hour window and idempotency | VERIFIED | 158 lines. `REMINDER_WINDOW_MINUTES = 60`, `REMINDER_TYPE = '1h'`, `sent_reminders` INSERT guard, `session_attendees` query, `push_tokens` query, FCM v1 dispatch, `Promise.all`. |
| `supabase/migrations/002_notification_triggers.sql` | sent_reminders table + pg_cron schedule template | VERIFIED | Creates `sent_reminders` with `PRIMARY KEY (session_id, reminder_type)`, RLS enabled. pg_cron schedule present as commented template (intentional — requires Vault secrets before running). |

### Key Link Verification

#### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/context/SessionsContext.tsx` | `src/context/NotificationsContext.tsx` | `useNotifications().ensurePushToken()` | WIRED | Import at line 4. `ensurePushToken` destructured at line 40. Called in createSession (line 114) and joinSession (line 149). |
| `src/context/NotificationsContext.tsx` | push_tokens table | `supabase.from('push_tokens').upsert()` | WIRED | Two upsert sites: ensurePushToken (lines 121-125) and tokenReceived listener (lines 74-78). Both use `onConflict: 'user_id,token'`. |
| `src/App.tsx` | `src/context/NotificationsContext.tsx` | `NotificationsProvider` wrapping `SessionsProvider` | WIRED | `NotificationsProvider` imported (line 20). Wraps `SessionsProvider` in correct position: `ProfileProvider > NotificationsProvider > SessionsProvider` (lines 265-268). |
| `src/components/SessionForm.tsx` | `src/context/NotificationsContext.tsx` | `useNotifications().permissionStatus` for banner | WIRED | Import at line 7. `hasToken` and `permissionStatus` destructured (line 19). `showPermissionBanner` drives JSX at line 92. |
| `AppDelegate.swift` | Firebase SDK | `FirebaseApp.configure()` + `Messaging.messaging().apnsToken` | WIRED (re-verified) | `FirebaseCore` + `FirebaseMessaging` imported separately (lines 3-4). `FirebaseApp.configure()` at line 13. APNs token forwarded at line 53. Both required for FCM to receive push tokens on iOS. |
| `@capacitor/geolocation` | iOS location permission | Replaces `navigator.geolocation` in Map.tsx + SpotsContext.tsx | WIRED (re-verified) | Single Capacitor plugin call path — eliminates the double-prompt that occurred when both the browser API and Capacitor independently requested location permission. |

#### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| sessions INSERT webhook | `notify-session-created/index.ts` | Supabase database webhook (Dashboard config) | HUMAN NEEDED | Webhook configured in Supabase Dashboard per user-approved SUMMARY (2026-03-22). Not verifiable in code. |
| `notify-session-created/index.ts` | FCM v1 API | `fetch` to `fcm.googleapis.com/v1/projects/...` | WIRED | Line 26: URL construction from `serviceAccount.project_id`. Lines 27-35: POST with OAuth2 bearer token. |
| pg_cron job | `send-session-reminders/index.ts` | `net.http_post` every 5 minutes | HUMAN NEEDED | pg_cron schedule template in migration (commented, requires Vault). User-approved SUMMARY confirms deployment. Not verifiable in code. |
| `send-session-reminders/index.ts` | sent_reminders table | INSERT with unique constraint | WIRED | Lines 83-91: `supabase.from('sent_reminders').insert(...)`. On `guardError`: skip. On success: proceed to send. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NOTIF-01 | 04-01 | User can enable push notifications (permission requested on create/join, not at launch) | SATISFIED | `ensurePushToken` called only in `createSession` and `joinSession`. Permission never requested at mount or app start. Profile shows live permission state. iOS fix: `@capacitor/geolocation` eliminates double-prompt; `FirebaseApp.configure()` + APNs token forwarding complete the FCM registration chain. |
| NOTIF-02 | 04-02 | User receives notification when a session is created at a favorited spot | SATISFIED in code | `notify-session-created` Edge Function queries favorites, excludes creator, dispatches FCM v1. Webhook deployment human-approved. |
| NOTIF-03 | 04-02 | Session participants receive a reminder notification before the session | SATISFIED in code | `send-session-reminders` queries sessions in 55-65 min window, checks attendees, dispatches FCM v1. Idempotency via `sent_reminders`. pg_cron deployment human-approved. |

No orphaned requirements found. All 3 NOTIF requirements are claimed and satisfied.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `supabase/migrations/002_notification_triggers.sql` | `cron.schedule` is commented out | Info | Intentional design decision — pg_cron requires Vault secrets to be configured first. User runs SQL manually after setup. Documented in migration comment. Not a code gap. |

No TODO/FIXME/placeholder comments found in implementation files. No empty handlers or stub returns. No `navigator.geolocation` calls remain in the codebase.

### Human Verification Required

These items were identified in the initial verification and remain pending. The iOS fixes committed since then (FirebaseApp.configure, APNs token forwarding, correct imports, @capacitor/geolocation, Info.plist location description) are prerequisites that must be in place for these tests to succeed — they are now confirmed in code. The tests themselves still require a physical iOS device with the full Firebase + Supabase stack live.

#### 1. Webhook — Favorites-Based New-Session Notification (NOTIF-02)

**Test:** Have User A favorite Spot X. Log in as User B and create a session at Spot X. Check User A's device.
**Expected:** User A receives a push notification: title "New session at [spot name]", body "[User B name] is heading there on [date]". User B does NOT receive a notification.
**Why human:** The Supabase database webhook (sessions INSERT trigger) is configured in the Dashboard, not in code. FCM delivery to a physical iOS device requires the full APNs + Firebase + Supabase chain to be live.

#### 2. Idempotent Reminder Notification (NOTIF-03)

**Test:** Create a session starting approximately 1 hour from now. Wait for the pg_cron job to fire (every 5 minutes). Check attendees' devices. Then wait for the next cron tick.
**Expected:** Attendees receive exactly one reminder notification: "Reminder: session in 1 hour" / "Your session at [spot] starts at [time]". The second cron tick produces no duplicate notification.
**Why human:** pg_cron execution requires a live Supabase instance with pg_cron + pg_net enabled and Vault secrets configured. The idempotency logic is verified in code but duplicate-prevention can only be confirmed against real DB state.

#### 3. Permission Denied — Silent Fail on Device

**Test:** On a physical iOS device, tap "Create Session". When the iOS permission dialog appears, tap "Don't Allow". Complete the session creation form and submit.
**Expected:** Session is created normally. No error message appears. The Profile notification row shows "Disabled — tap to enable". Tapping it opens iOS Settings.
**Why human:** FirebaseMessaging permission dialog and APNs registration require Capacitor native runtime. `window.location.href = 'app-settings:'` redirect is iOS-only behavior.

#### 4. Profile Notification Row — Live State After Permission Grant

**Test:** On a physical iOS device with no prior push permission, create a session (grants permission when prompted). Navigate to Profile tab.
**Expected:** The Notifications row now shows the sky-blue "Active" badge. The inline banners in SessionForm and SessionCard are no longer visible.
**Why human:** `FirebaseMessaging.checkPermissions()` reads real OS state, only valid on native device. Banner hide logic (`hasToken` check) depends on actual Supabase `push_tokens` row being present.

### Gaps Summary

No code gaps found. All 10 plan must-haves are implemented substantively and wired correctly.

The six iOS fixes committed after initial verification are all confirmed in code:
- `AppDelegate.swift` now correctly initializes Firebase (`FirebaseApp.configure()`) and forwards the APNs device token to Firebase Messaging (`Messaging.messaging().apnsToken = deviceToken`) using the correct granular imports (`FirebaseCore`, `FirebaseMessaging`).
- `Info.plist` now carries `NSLocationWhenInUseUsageDescription`, satisfying the iOS requirement for location permission prompts.
- `src/index.css` applies `font-size: 16px` globally to `input`, `textarea`, and `select`, preventing iOS Safari from auto-zooming on focus.
- `Map.tsx` and `SpotsContext.tsx` use `@capacitor/geolocation` exclusively — `navigator.geolocation` is fully replaced, eliminating the double-permission-prompt bug on iOS.
- `Map.tsx` gates the fly-to animation behind a module-level `hasFlownToUserLocation` flag, preventing repeated location animations on tab switches.

These fixes are prerequisites for the human verification tests to pass on a physical device. The phase remains code-complete with 4 runtime delivery items awaiting human confirmation.

---

_Initial verified: 2026-03-22_
_Re-verified: 2026-03-22_
_Verifier: Claude (gsd-verifier)_
