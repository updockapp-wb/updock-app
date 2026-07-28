# Phase 4: Push Notifications - Research

**Researched:** 2026-03-22
**Domain:** Firebase Cloud Messaging (FCM) + Capacitor iOS + Supabase Edge Functions
**Confidence:** MEDIUM-HIGH

---

## Summary

Phase 4 adds push notifications to an existing Capacitor 8 + React + Supabase iOS app. There are two distinct concerns: (1) registering the device and obtaining a FCM token on the client side using `@capacitor-firebase/messaging`, and (2) dispatching notifications server-side via Supabase Edge Functions that talk to FCM's HTTP v1 API.

The client-side work requires real iOS device access (APNs does not work in Simulator), Xcode capability configuration, an Apple APNs key (.p8) uploaded to Firebase, and three AppDelegate.swift methods added to the existing bare-bones delegate. The server-side work uses Supabase database webhooks (triggered on `sessions` INSERT) and a pg_cron scheduled job (for reminders) to call Deno Edge Functions that authenticate against FCM v1 API using a Google service account JSON.

The project already has a `push_tokens` table with the correct schema (`user_id`, `token`, `platform`, UNIQUE on `user_id, token`). No schema migration is needed for the token table. A `notifications` table (or direct trigger on `sessions`) is needed to drive the webhook. The FCM dispatch pattern is well-documented via Supabase's own official examples.

**Primary recommendation:** Use `@capacitor-firebase/messaging@8.1.0` + `firebase@12.11.0` for the client. Request permission only inside `createSession`/`joinSession` flows (never at app launch). Use a Supabase database webhook on `sessions` INSERT for the favorite-spot notification, and a pg_cron job calling an Edge Function for timed reminders.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTIF-01 | L'utilisateur peut activer les notifications push (permission demandée au moment de créer ou rejoindre une session, pas au lancement) | Deferred permission pattern: call `FirebaseMessaging.requestPermissions()` + `getToken()` inside `createSession`/`joinSession` in SessionsContext; upsert token to `push_tokens`. |
| NOTIF-02 | L'utilisateur reçoit une notification quand une session est créée sur un spot qu'il a en favori | Supabase DB webhook on `sessions` INSERT triggers Edge Function; function queries `favorites` to find recipients, looks up their `push_tokens`, calls FCM v1 API. |
| NOTIF-03 | Les participants d'une session reçoivent une notification de rappel avant l'heure de la session | pg_cron job runs every minute (or every 5 min), calls a reminder Edge Function that queries `session_attendees` for sessions starting within the reminder window; idempotency guard prevents duplicate sends. |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor-firebase/messaging | 8.1.0 | FCM token registration, permission request, push receipt on iOS/Android | Only plugin with active Capacitor 8 support; unified FCM token avoids APNs-direct complexity. Pre-roadmap decision: use this over @capacitor/push-notifications. |
| firebase | 12.11.0 | Firebase JS SDK peer dep; iOS/Android use native SDKs via Pods/Gradle | Required alongside the Capacitor plugin; web uses JS SDK, native platforms use GoogleService-Info.plist |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase Edge Functions (Deno) | platform | Server-side FCM dispatch and reminder scheduling | Needed for NOTIF-02, NOTIF-03 — keeps Firebase service account credentials off the client |
| pg_cron | built-in | Postgres extension for scheduled cron jobs | Needed for NOTIF-03 reminder dispatch |
| pg_net | built-in | Async HTTP from Postgres; used by pg_cron to call Edge Functions | Comes with Supabase hosted platform |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @capacitor-firebase/messaging | @capacitor/push-notifications | The standard plugin requires APNs-direct setup; @capacitor-firebase/messaging gives unified FCM token and is the project's pre-decided choice |
| Supabase DB webhook + Edge Fn | Supabase Realtime listeners on client | Server-side dispatch is the only viable approach for background notifications when app is closed |
| pg_cron reminder | Client-side reminder scheduling | Client approach fails when app is backgrounded/killed; pg_cron is reliable |

**Installation:**
```bash
npm install @capacitor-firebase/messaging firebase
npx cap sync
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── context/
│   └── NotificationsContext.tsx   # requestPermission(), registerToken(), notification state
├── ...existing files

supabase/
├── functions/
│   ├── notify-session-created/    # Webhook trigger on sessions INSERT
│   │   └── index.ts
│   ├── send-session-reminders/    # Called by pg_cron, finds sessions starting soon
│   │   └── index.ts
│   └── service-account.json       # Firebase service account (gitignored, loaded at deploy)
└── migrations/
    └── 002_notification_triggers.sql  # pg_cron schedule, notifications idempotency table
```

### Pattern 1: Deferred Permission Request

**What:** Only request push permission (and register token) when the user explicitly creates or joins a session. Never request at app launch.
**When to use:** Satisfies NOTIF-01; follows iOS best-practice of contextual permission requests.

```typescript
// Inside SessionsContext.tsx — createSession and joinSession call this before the DB write
async function ensurePushToken(userId: string): Promise<void> {
  // Check if already registered
  const { data: existing } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
    .limit(1);

  // Only if no token yet — request permission then register
  if (!existing || existing.length === 0) {
    const { receive } = await FirebaseMessaging.requestPermissions();
    if (receive !== 'granted') return;

    const { token } = await FirebaseMessaging.getToken();
    if (!token) return;

    // Upsert — UNIQUE (user_id, token) ensures no duplicate per device
    await supabase
      .from('push_tokens')
      .upsert({ user_id: userId, token, platform: 'ios' }, { onConflict: 'user_id,token' });
  }
}
```

### Pattern 2: Multi-device Token Storage

**What:** `push_tokens` has UNIQUE on `(user_id, token)`. Upsert by that pair — never overwrite a different device's token.
**When to use:** Every time a token is obtained on device.
**Why:** A user on two iOS devices gets two rows, both receive notifications. This is the intended behavior from the project's success criteria.

### Pattern 3: DB Webhook to Edge Function (NOTIF-02)

**What:** A Supabase database webhook fires on every `sessions` INSERT, calling an Edge Function that finds favorited-spot users and dispatches FCM.
**When to use:** Session created trigger.

```typescript
// supabase/functions/notify-session-created/index.ts
// Webhook payload: { type: 'INSERT', record: { id, spot_id, creator_id, ... } }
Deno.serve(async (req) => {
  const payload = await req.json();
  const session = payload.record;

  // 1. Find users who favorited this spot (excluding the creator)
  const { data: favUsers } = await supabase
    .from('favorites')
    .select('user_id')
    .eq('spot_id', session.spot_id)
    .neq('user_id', session.creator_id);

  if (!favUsers?.length) return new Response('ok');

  const userIds = favUsers.map(f => f.user_id);

  // 2. Get their push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds);

  // 3. Send via FCM v1 API for each token
  const accessToken = await getGoogleAccessToken(); // service account JWT
  for (const { token } of tokens ?? []) {
    await sendFcmMessage(accessToken, token, {
      title: 'New session on your spot',
      body: `Someone is heading to your favorite spot!`,
    });
  }

  return new Response('ok');
});
```

### Pattern 4: FCM v1 API Authentication (Deno, no Admin SDK)

**What:** Exchange service account JSON for a short-lived OAuth2 bearer token, then POST to FCM v1.
**Why:** Firebase Admin SDK is Node.js; Deno Edge Functions use raw HTTP instead.

```typescript
// Source: Supabase official push notifications example
import serviceAccount from '../service-account.json' with { type: 'json' };

async function getGoogleAccessToken(): Promise<string> {
  const jwtClient = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const token = await jwtClient.getAccessToken();
  return token.token!;
}

async function sendFcmMessage(accessToken: string, fcmToken: string, notification: { title: string; body: string }) {
  const projectId = serviceAccount.project_id;
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification,
      },
    }),
  });
  return response.json();
}
```

Note: The `google-auth-library` npm package works in Deno with the npm: specifier. Supabase's own official example uses this approach.

### Pattern 5: pg_cron Reminder Job (NOTIF-03)

**What:** A pg_cron job runs every 5 minutes, calls a "send-session-reminders" Edge Function. The Edge Function queries for sessions starting within the reminder window (e.g., 60 minutes), with an idempotency guard.

```sql
-- supabase/migrations/002_notification_triggers.sql

-- Idempotency: track which reminders have been sent
CREATE TABLE IF NOT EXISTS public.sent_reminders (
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,  -- e.g. '1h'
  sent_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, reminder_type)
);

-- Schedule: call Edge Function every 5 minutes
SELECT cron.schedule(
  'send-session-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/send-session-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

The Edge Function itself:
```typescript
// supabase/functions/send-session-reminders/index.ts
const REMINDER_WINDOW_MINUTES = 60;
const REMINDER_TYPE = '1h';

Deno.serve(async () => {
  const now = new Date();
  const windowStart = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES - 5) * 60000);
  const windowEnd = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES + 5) * 60000);

  // Find sessions starting in ~1h, not cancelled, not already reminded
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_attendees(user_id)')
    .eq('is_cancelled', false)
    .gte('starts_at', windowStart.toISOString())
    .lte('starts_at', windowEnd.toISOString());

  for (const session of sessions ?? []) {
    // Idempotency guard
    const { error: guardError } = await supabase
      .from('sent_reminders')
      .insert({ session_id: session.id, reminder_type: REMINDER_TYPE });

    if (guardError) continue; // Already sent (unique constraint violated)

    const userIds = session.session_attendees.map(a => a.user_id);
    // ... fetch tokens, dispatch FCM
  }

  return new Response('ok');
});
```

### AppDelegate.swift Changes Required

The existing `AppDelegate.swift` is a bare-bones Capacitor delegate. Three methods must be added for APNs/FCM registration to work:

```swift
// Add these three methods to AppDelegate.swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
}

func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
  NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}

func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
  NotificationCenter.default.post(name: Notification.Name.init("didReceiveRemoteNotification"), object: completionHandler, userInfo: userInfo)
}
```

### Anti-Patterns to Avoid

- **Request permission at launch:** Never call `requestPermissions()` in App.tsx or a top-level context effect — users abandon apps that ask for permission before they understand the value.
- **Overwrite existing token on login:** Always UPSERT on `(user_id, token)` rather than deleting all user tokens first — breaks multi-device users.
- **Store service-account.json in git:** This file contains the Firebase private key. Add to `.gitignore`. Pass via `supabase secrets set` at deploy time.
- **Use legacy FCM API:** The legacy `https://fcm.googleapis.com/fcm/send` endpoint was shut down June 2024. Always use the v1 API (`/v1/projects/{id}/messages:send`).
- **Send one FCM call per user from Edge Function:** Batch where possible. However FCM v1 does not support true batch send — use `Promise.all` for parallel dispatch, not serial loops.
- **Skip idempotency on reminder cron:** pg_cron can invoke an Edge Function multiple times if there are retries. The `sent_reminders` table with a unique constraint is essential.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| APNs token handling | Manual APNs HTTP/2 requests | @capacitor-firebase/messaging | APNs device token format, certificate/key rotation, silent push, and background modes have dozens of edge cases; Firebase abstracts all of it |
| OAuth2 JWT for FCM | Custom JWT signing | google-auth-library (npm: import in Deno) | Token expiry (1h), correct scopes, and key rotation are handled; hand-rolled JWTs miss edge cases |
| Idempotency for reminders | Checking a timestamp field | `sent_reminders` unique constraint (DB enforces) | Race conditions and retry logic are solved by DB uniqueness; application-level checks have TOCTOU bugs |
| Cron scheduling | Node.js cron service | pg_cron in Supabase | No extra service to manage; pg_cron is already available on hosted Supabase |

**Key insight:** Both FCM token management and OAuth2 service-account auth have enough version-sensitivity and edge cases that any hand-rolled implementation will fail silently in production (wrong expiry, wrong scope, wrong notification format).

---

## Common Pitfalls

### Pitfall 1: Testing on Simulator

**What goes wrong:** APNs (and therefore FCM on iOS) does not work in the iOS Simulator. `getToken()` will throw or return no token.
**Why it happens:** APNs requires a real hardware device with a valid provisioning profile that includes push entitlement.
**How to avoid:** Use a physical iPhone for ALL push notification testing. This is flagged as a go/no-go gate in STATE.md.
**Warning signs:** `getToken()` returns empty string or throws; `requestPermissions()` appears to succeed but no token follows.

### Pitfall 2: Missing Xcode Capabilities

**What goes wrong:** App never receives push tokens even on physical device; APNs registration silently fails.
**Why it happens:** `Push Notifications` and `Background Modes > Remote notifications` capabilities not enabled in Xcode Signing & Capabilities.
**How to avoid:** Open `ios/App/App.xcworkspace` in Xcode, select the App target, go to Signing & Capabilities, add both capabilities before running `cap sync`.
**Warning signs:** `didRegisterForRemoteNotificationsWithDeviceToken` never fires; `getToken()` hangs.

### Pitfall 3: GoogleService-Info.plist Not Added to Xcode Target

**What goes wrong:** Firebase fails to initialize on iOS; "No GoogleService-Info.plist found" error at runtime.
**Why it happens:** The file must be dragged into Xcode's file navigator (not just placed in the filesystem), and "Add to targets" must be checked.
**How to avoid:** After downloading from Firebase Console, drag `GoogleService-Info.plist` into Xcode under `App/App/`, ensure it is added to all targets.
**Warning signs:** App crashes on launch with Firebase initialization error.

### Pitfall 4: Legacy FCM API (Shut Down June 2024)

**What goes wrong:** Edge Function gets 410 Gone responses; notifications not delivered.
**Why it happens:** Using `https://fcm.googleapis.com/fcm/send` (legacy HTTP API).
**How to avoid:** Always use `https://fcm.googleapis.com/v1/projects/{projectId}/messages:send` with OAuth2 bearer token.
**Warning signs:** HTTP 410 or 404 from FCM endpoint.

### Pitfall 5: service-account.json Committed to Git

**What goes wrong:** Firebase private key is exposed; anyone with repo access can send push notifications to all users.
**Why it happens:** Developer places the file in `supabase/functions/` without gitignoring it.
**How to avoid:** Add `supabase/functions/service-account.json` to `.gitignore` before committing. Deploy secrets via `supabase secrets set` or Supabase Vault.
**Warning signs:** `git status` shows `service-account.json` as an untracked or staged file.

### Pitfall 6: Token Not Re-registered After App Reinstall

**What goes wrong:** User reinstalls app; old token in `push_tokens` is stale; FCM returns `UNREGISTERED` error.
**Why it happens:** FCM invalidates tokens on app reinstall.
**How to avoid:** Listen to `tokenReceived` event (fires when FCM rotates the token); upsert new token. Handle `UNREGISTERED` responses from FCM by deleting the stale row from `push_tokens`.
**Warning signs:** FCM API returns `{"error": {"status": "NOT_FOUND"}}` for a token.

### Pitfall 7: Node Version for Capacitor CLI

**What goes wrong:** `npx cap sync` fails after `npm install @capacitor-firebase/messaging`.
**Why it happens:** STATE.md documents that `@capacitor/cli ^8.2.0` requires Node >=22; current env is Node v20.19.2.
**How to avoid:** Upgrade Node to >=22 before running `cap sync`. This is a pre-existing blocker documented in STATE.md (TECH-01 partially resolved).
**Warning signs:** `cap sync` exits with version requirement error.

---

## Code Examples

### Register Token (deferred, on action)

```typescript
// Source: https://capawesome.io/plugins/firebase/cloud-messaging/
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

async function requestAndRegisterPushToken(userId: string): Promise<void> {
  const { receive } = await FirebaseMessaging.requestPermissions();
  if (receive !== 'granted') return;

  const { token } = await FirebaseMessaging.getToken();
  if (!token) return;

  await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform: 'ios' },
      { onConflict: 'user_id,token' }
    );
}
```

### Listen for Token Rotation

```typescript
// Source: https://capawesome.io/plugins/firebase/cloud-messaging/
await FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
  if (!userId) return;
  await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, platform: 'ios' }, { onConflict: 'user_id,token' });
});
```

### Webhook Payload Shape (sessions INSERT)

```json
{
  "type": "INSERT",
  "table": "sessions",
  "schema": "public",
  "record": {
    "id": "uuid",
    "spot_id": "uuid",
    "creator_id": "uuid",
    "starts_at": "2026-03-22T15:00:00Z",
    "note": null,
    "is_cancelled": false,
    "created_at": "2026-03-22T10:00:00Z"
  },
  "old_record": null
}
```

### Deploy Edge Function with Service Account

```bash
# Deploy with no JWT verification (webhook calls don't have user JWT)
supabase functions deploy notify-session-created --no-verify-jwt
supabase functions deploy send-session-reminders --no-verify-jwt

# The service-account.json is bundled at deploy time from supabase/functions/
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FCM legacy HTTP API | FCM v1 API with OAuth2 bearer | Legacy shut down June 2024 | Must use v1; any tutorial pre-2024 using the old endpoint is broken |
| @capacitor/push-notifications | @capacitor-firebase/messaging | ~2022 for unified FCM | Project pre-decision; gives one token for both APNs and FCM routing |
| Firebase Admin SDK (Node.js) | google-auth-library in Deno | Ongoing | Admin SDK is Node-only; Deno Edge Functions use npm: imports |

**Deprecated/outdated:**
- Legacy FCM send endpoint (`/fcm/send`): shut down June 2024, use v1 API
- `@capacitor-community/fcm`: older community plugin, less maintained than capawesome's `@capacitor-firebase/messaging`

---

## Open Questions

1. **Apple Developer Account / APNs Key Access**
   - What we know: An APNs .p8 key must be uploaded to Firebase Console; this requires Apple Developer Program membership.
   - What's unclear: Does the developer have an Apple Developer account and existing provisioning profile for `com.updock.app.wandrille`?
   - Recommendation: Verify before starting 04-01. If no APNs key exists, create one at developer.apple.com > Certificates, Identifiers & Profiles > Keys.

2. **Reminder Window Duration**
   - What we know: NOTIF-03 says "before the session start time" but does not specify how far in advance.
   - What's unclear: Should the reminder be sent 1 hour before? 30 minutes? Both?
   - Recommendation: Default to 1 hour; make it a constant in the Edge Function for easy adjustment.

3. **Node >=22 Requirement for `cap sync`**
   - What we know: STATE.md flags that `@capacitor/cli ^8.2.0` requires Node >=22; current env is v20.19.2.
   - What's unclear: Will the developer upgrade Node before starting this phase?
   - Recommendation: Plan 04-01 must include a Wave 0 task: upgrade Node to >=22 and run `cap sync` successfully before any native work.

4. **Notification content for NOTIF-02**
   - What we know: A new session was created on a favorited spot.
   - What's unclear: Should the notification include the spot name? The session time? The creator's display name?
   - Recommendation: Fetch spot name and session time in the Edge Function; construct a meaningful message like "New session at [spot_name] on [date]".

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config files or test directories found |
| Config file | Wave 0 task |
| Quick run command | N/A — see Wave 0 |
| Full suite command | N/A — see Wave 0 |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTIF-01 | Permission requested only inside createSession/joinSession, never at launch | Manual (requires physical device + APNs) | — manual only | ❌ Wave 0 |
| NOTIF-01 | Token upserted to push_tokens with correct user_id and platform | Integration (Supabase) | manual device test | ❌ Wave 0 |
| NOTIF-02 | Favorited-spot users receive FCM notification on session INSERT | Integration (Edge Fn + FCM test) | manual + Edge Fn logs | ❌ Wave 0 |
| NOTIF-03 | Participants receive reminder; idempotency guard prevents duplicates | Integration (pg_cron + Edge Fn) | manual + sent_reminders table inspection | ❌ Wave 0 |

**Note:** Push notification end-to-end testing is inherently manual (requires physical device, live APNs, real FCM token). Automated unit tests can cover helper logic (token upsert, FCM payload construction) but delivery validation is manual-only.

### Sampling Rate

- **Per task commit:** Verify build compiles (`npm run build && npx cap sync`) — no unit test suite exists
- **Per wave merge:** Manual device smoke test (token registered, notification received)
- **Phase gate:** All 3 NOTIF requirements manually verified on physical device before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `Node >=22` — required for `npx cap sync`; upgrade before any native work (TECH-01 residual)
- [ ] No test framework detected — manual verification is the primary quality gate for this phase
- [ ] `supabase/functions/` directory — does not exist yet; must be created with `supabase functions new`
- [ ] `supabase/functions/service-account.json` — must be obtained from Firebase Console and gitignored before any Edge Function work

---

## Sources

### Primary (HIGH confidence)

- [capawesome.io/plugins/firebase/cloud-messaging](https://capawesome.io/plugins/firebase/cloud-messaging/) — Plugin API, iOS AppDelegate requirements, Capacitor 8 compatibility table
- [supabase.com/docs/guides/functions/examples/push-notifications](https://supabase.com/docs/guides/functions/examples/push-notifications) — Official Supabase FCM Edge Function pattern, service account auth, DB webhook architecture
- [supabase.com/docs/guides/functions/schedule-functions](https://supabase.com/docs/guides/functions/schedule-functions) — pg_cron + pg_net Edge Function scheduling pattern
- [supabase.com/docs/guides/database/webhooks](https://supabase.com/docs/guides/database/webhooks) — Webhook payload format (INSERT/UPDATE/DELETE), creation methods

### Secondary (MEDIUM confidence)

- [capawesome.io/blog/the-push-notifications-guide-for-capacitor](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/) — Xcode capabilities setup, GoogleService-Info.plist placement, token rotation handling
- [firebase.google.com/docs/cloud-messaging/send/v1-api](https://firebase.google.com/docs/cloud-messaging/send/v1-api) — FCM v1 API endpoint, OAuth2 scope, message format
- npm registry: `@capacitor-firebase/messaging@8.1.0` (verified current as of 2026-03-22), `firebase@12.11.0`

### Tertiary (LOW confidence)

- DEV Community / Medium articles on FCM + Supabase integration — patterns cross-verified against official docs above

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — version numbers verified against npm registry on 2026-03-22
- iOS native config: MEDIUM — AppDelegate.swift methods from official plugin docs; Xcode steps from blog post (cross-verified with plugin docs)
- Edge Function FCM dispatch: HIGH — matches Supabase's own official example
- pg_cron reminder pattern: HIGH — from Supabase official scheduling docs
- Pitfalls: HIGH — legacy API shutdown is verified fact; others are from official troubleshooting guidance

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack; Firebase/Capacitor versioning is relatively stable)
