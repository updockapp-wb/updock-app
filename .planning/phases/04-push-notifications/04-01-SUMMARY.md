---
phase: 04-push-notifications
plan: 01
subsystem: push-notifications-client
tags: [firebase, capacitor, ios, push-tokens, notifications, context]
dependency_graph:
  requires: []
  provides:
    - NotificationsContext (ensurePushToken, hasToken, permissionStatus, checkPermission)
    - AppDelegate APNs delegate methods
    - push_tokens upsert integration
  affects:
    - src/context/SessionsContext.tsx
    - src/components/Profile.tsx
    - src/components/SessionForm.tsx
    - src/components/SessionCard.tsx
    - src/App.tsx
tech_stack:
  added:
    - "@capacitor-firebase/messaging@^8.1.0"
    - "firebase@^12.11.0"
  patterns:
    - Deferred push permission request (on session create/join, never at launch)
    - FCM token upsert with onConflict user_id,token for multi-device support
    - Token rotation listener via FirebaseMessaging.addListener('tokenReceived')
    - Silent-fail pattern (ensurePushToken catches all errors, never blocks callers)
key_files:
  created:
    - src/context/NotificationsContext.tsx
  modified:
    - src/App.tsx
    - src/context/SessionsContext.tsx
    - src/components/Profile.tsx
    - src/components/SessionForm.tsx
    - src/components/SessionCard.tsx
    - ios/App/App/AppDelegate.swift
    - src/translations/en.json
    - src/translations/fr.json
    - .gitignore
    - package.json
decisions:
  - "App.openUrl does not exist in @capacitor/app v8 — use window.location.href='app-settings:' for iOS settings navigation on permission denied"
  - "permissionStatus starts as 'unknown' not 'loading' — loading state only during active checkPermission call"
metrics:
  duration: "8 minutes"
  completed_date: "2026-03-22"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 10
---

# Phase 04 Plan 01: Client-Side Push Notification Infrastructure Summary

**One-liner:** FCM token registration via @capacitor-firebase/messaging with deferred permission on session create/join, NotificationsContext managing permission state and token rotation.

## What Was Built

Client-side push notification infrastructure enabling Plan 02 (server-side dispatch) to have FCM tokens to target.

### NotificationsContext (`src/context/NotificationsContext.tsx`)

- `ensurePushToken()` — checks push_tokens for existing row, requests permission via FirebaseMessaging.requestPermissions(), gets FCM token via FirebaseMessaging.getToken(), upserts to push_tokens with onConflict: 'user_id,token'. Catches all errors silently — never blocks caller.
- `permissionStatus: 'unknown' | 'granted' | 'denied' | 'loading'` — updated on mount and after each ensurePushToken call.
- `checkPermission()` — re-checks OS permission state, used by Profile on mount.
- `hasToken: boolean` — whether current user has a row in push_tokens. Drives inline banner visibility.
- `tokenReceived` listener — upserts new FCM token on rotation (app reinstall / token refresh).

### App.tsx

NotificationsProvider added between ProfileProvider and SessionsProvider:
`LanguageProvider > AuthProvider > SpotsProvider > FavoritesProvider > ProfileProvider > NotificationsProvider > SessionsProvider`

### SessionsContext (`src/context/SessionsContext.tsx`)

`ensurePushToken()` called as first action (after user guard) in both `createSession` and `joinSession`, before any DB writes. Silent failure never blocks session actions.

### Profile (`src/components/Profile.tsx`)

Notification status row added between Language Toggle and Go Premium with Bell icon. Shows Active badge (sky-blue) when granted, "Disabled — tap to enable" (taps open app-settings:) when denied, ChevronRight when unknown, spinner when loading.

### SessionForm + SessionCard

Permission inline banner (bg-sky-50, Bell icon, role="status") rendered when `!hasToken && permissionStatus !== 'granted'`. In SessionCard, only shown when user is not yet attending.

### AppDelegate.swift (`ios/App/App/AppDelegate.swift`)

Three APNs delegate methods added:
- `didRegisterForRemoteNotificationsWithDeviceToken` — posts to `.capacitorDidRegisterForRemoteNotifications`
- `didFailToRegisterForRemoteNotificationsWithError` — posts to `.capacitorDidFailToRegisterForRemoteNotifications`
- `didReceiveRemoteNotification` — posts to `didReceiveRemoteNotification` Notification.Name

### Translation keys

Added to en.json and fr.json: `notification.active`, `notification.disabled`, `notification.banner` (with correct French accents).

### .gitignore

Added `supabase/functions/service-account.json` to prevent Firebase private key from being committed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `.catch()` on PromiseLike (TypeScript error)**
- **Found during:** Task 1 build verification
- **Issue:** Supabase `.from().select()...limit()` returns `PromiseLike<void>` not `Promise<void>` when chained from `.then()`; `.catch()` does not exist on `PromiseLike`.
- **Fix:** Replaced `.then().catch()` chain with single `.then(({ data, error }) => { if (error) ... })` handler.
- **Files modified:** `src/context/NotificationsContext.tsx`
- **Commit:** 6ec508d

**2. [Rule 1 - Bug] Fixed App.openUrl not existing in @capacitor/app v8**
- **Found during:** Task 2 build verification
- **Issue:** The plan specified `App.openUrl({ url: 'app-settings:' })` but `AppPlugin` in @capacitor/app v8 does not expose an `openUrl` method (only `exitApp`, `getInfo`, `getLaunchUrl`).
- **Fix:** Replaced with `window.location.href = 'app-settings:'` which achieves the same effect on iOS Capacitor (triggers UIApplication openURL).
- **Files modified:** `src/components/Profile.tsx`
- **Commit:** 6ff994f

## Checkpoint Status

Task 3 (`checkpoint:human-verify`) — human verification approved 2026-03-22. Plan complete.

## Self-Check: PASSED

Files verified:
- `src/context/NotificationsContext.tsx` — exists, contains NotificationsProvider, useNotifications, ensurePushToken, hasToken, permissionStatus, tokenReceived listener, push_tokens upsert with onConflict
- `ios/App/App/AppDelegate.swift` — contains didRegisterForRemoteNotificationsWithDeviceToken, didFailToRegisterForRemoteNotificationsWithError, didReceiveRemoteNotification, capacitorDidRegisterForRemoteNotifications
- `.gitignore` — contains service-account.json
- `src/translations/en.json` — contains notification.active, notification.disabled, notification.banner
- `src/translations/fr.json` — contains notification.active: "Activées", notification.disabled: "Désactivées", notification.banner
- `src/App.tsx` — contains NotificationsProvider import and wrapping
- `src/context/SessionsContext.tsx` — contains useNotifications import, ensurePushToken call before sessions insert and before joinSession optimistic update
- `src/components/Profile.tsx` — contains Bell, permissionStatus, notification.active, notification.disabled, app-settings:
- `src/components/SessionForm.tsx` — contains notification.banner, role="status", bg-sky-50, useNotifications
- `src/components/SessionCard.tsx` — contains notification.banner, role="status", bg-sky-50, useNotifications

Commits verified:
- 6ec508d: feat(04-01): install Firebase messaging packages, create NotificationsContext, update AppDelegate + translations
- 6ff994f: feat(04-01): wire NotificationsProvider, integrate ensurePushToken in sessions, add notification UI
