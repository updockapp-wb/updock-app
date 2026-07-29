---
slug: fcm-push-tokens-empty
status: investigating
trigger: manual
created: 2026-05-24
---

# Debug: Push notifications not received — push_tokens table empty

## Symptoms
- `push_tokens` table is empty (no FCM tokens registered for any user)
- Edge Function `notify-session-created` returns "no tokens" (HTTP 200)
- No push notification appears on iPhone (TestFlight v1.1.5 build 2)
- The webhook trigger fires correctly and Edge Function is reachable

## Current Focus
hypothesis: Multiple issues prevent FCM token registration — critical one is capacitor.config.ts pointing to localhost
next_action: Present root cause analysis to user

## Evidence

### Issue 1: capacitor.config.ts has server.url pointing to localhost (CRITICAL)
- timestamp: 2026-05-24
- source: /Users/wandrillebasse/updock-app/capacitor.config.ts
- detail: `server.url` is set to `http://localhost:5174`. This means the TestFlight build connects to the local dev server, NOT the bundled app. On a real iPhone, localhost does not resolve — the app shows a blank screen or loads nothing. This alone explains why no tokens are registered: the JS never runs on the real device.

### Issue 2: AppDelegate does not call registerForRemoteNotifications
- timestamp: 2026-05-24
- source: /Users/wandrillebasse/updock-app/ios/App/App/AppDelegate.swift
- detail: The AppDelegate handles `didRegisterForRemoteNotificationsWithDeviceToken` and sets `Messaging.messaging().apnsToken`, but never calls `application.registerForRemoteNotifications()` in `didFinishLaunchingWithOptions`. The Capacitor Firebase Messaging plugin may handle this, but it depends on the plugin version and whether permission is requested first from JS.

### Issue 3: RLS policy is correct
- timestamp: 2026-05-24
- source: supabase/migrations/001_community_schema.sql
- detail: RLS policy `push_tokens_own` allows authenticated users to INSERT/UPDATE their own rows. This is fine for client-side upsert.

### Issue 4: service-account.json exists locally
- timestamp: 2026-05-24
- source: ls check
- detail: File exists at `/Users/wandrillebasse/updock-app/supabase/functions/service-account.json`. Need to confirm it was deployed with the Edge Function.

### Issue 5: GoogleService-Info.plist looks correct
- timestamp: 2026-05-24
- source: /Users/wandrillebasse/updock-app/ios/App/App/GoogleService-Info.plist
- detail: Bundle ID matches `com.updock.app.wandrille`, GCM is enabled, project ID is `updock-app`

## Resolution
root_cause: capacitor.config.ts has `server.url: 'http://localhost:5174'` which makes the TestFlight build try to load from localhost instead of the bundled app — so the entire web app (including NotificationsContext and token registration) never executes on the real iPhone
fix: pending
