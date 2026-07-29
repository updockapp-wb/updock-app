---
status: awaiting_human_verify
trigger: "FCM v1 API returns 401 THIRD_PARTY_AUTH_ERROR despite valid OAuth token"
created: 2026-05-24T00:00:00Z
updated: 2026-05-24T00:00:00Z
---

## Current Focus

hypothesis: "THIRD_PARTY_AUTH_ERROR is NOT an OAuth authentication failure -- it is FCM reporting that IT failed to authenticate with APNs (the third-party push service) when trying to deliver the notification to an iOS device. The OAuth token exchange with Google succeeds (200, ya29.c...), but FCM then tries to forward the message to APNs using the APNs .p8 key configured in Firebase Console, and THAT authentication fails."
test: "Verify that the APNs auth key (.p8) uploaded in Firebase Console is the correct APNs key (not an App Store Connect API key or other key), and that the Key ID, Team ID, and bundle ID all match."
expecting: "If the APNs key is wrong/mismatched, fixing it in Firebase Console will resolve the 401. If the APNs key is correct, we need to look at sandbox vs production token mismatch."
next_action: "User must verify APNs key configuration in Firebase Console -> Project Settings -> Cloud Messaging -> Apple app configuration"

## Symptoms

expected: "FCM v1 API should accept the OAuth token and deliver push notification to iOS device via APNs"
actual: "OAuth token exchange succeeds (HTTP 200, token starts with ya29.c.c0AZ4bNpZ2W-1), but FCM returns 401 THIRD_PARTY_AUTH_ERROR with message 'Request is missing required authentication credential'"
errors: |
  {"error":{"code":401,"message":"Request is missing required authentication credential. Expected OAuth 2 access token, login cookie or other valid authentication credential.","status":"UNAUTHENTICATED","details":[{"@type":"type.googleapis.com/google.firebase.fcm.v1.FcmError","errorCode":"THIRD_PARTY_AUTH_ERROR"}]}}
reproduction: "Trigger the notify-session-created Edge Function with a valid session payload targeting an iOS device with a registered FCM token"
started: "First implementation of FCM v1 push notifications"

## Eliminated

- hypothesis: "Wrong OAuth scope (should use cloud-platform instead of firebase.messaging)"
  evidence: "Firebase official docs confirm `https://www.googleapis.com/auth/firebase.messaging` is the correct and recommended scope for FCM v1 API. The `cloud-platform` scope would also work but is broader than needed. The OAuth token exchange succeeds with 200, confirming the scope is accepted."
  timestamp: 2026-05-24

- hypothesis: "Authorization header format issue"
  evidence: "Code uses `Authorization: Bearer ${accessToken}` which is the correct format per FCM v1 API docs. The header construction is standard."
  timestamp: 2026-05-24

- hypothesis: "Project ID mismatch between service account and FCM URL"
  evidence: "service-account.json has project_id='updock-app', GoogleService-Info.plist has PROJECT_ID='updock-app', and the FCM URL is constructed from serviceAccount.project_id. All three match."
  timestamp: 2026-05-24

- hypothesis: "FCM API endpoint format issue"
  evidence: "URL format `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send` matches the official FCM v1 API documentation exactly."
  timestamp: 2026-05-24

- hypothesis: "OAuth token generation bug (JWT signing, Base64 encoding)"
  evidence: "OAuth exchange returns HTTP 200 with a valid access_token starting with ya29.c -- Google accepted the JWT and issued a token. The signing and encoding are working correctly."
  timestamp: 2026-05-24

## Evidence

- timestamp: 2026-05-24
  checked: "OAuth scope in getAccessToken()"
  found: "Uses `https://www.googleapis.com/auth/firebase.messaging` -- this is the correct scope per Firebase docs"
  implication: "Scope is not the issue"

- timestamp: 2026-05-24
  checked: "Authorization header format in sendFcmMessage()"
  found: "Uses `Authorization: Bearer ${accessToken}` -- standard OAuth2 bearer token format"
  implication: "Header format is correct"

- timestamp: 2026-05-24
  checked: "Project ID consistency"
  found: "service-account.json project_id='updock-app', GoogleService-Info.plist PROJECT_ID='updock-app', FCM URL uses serviceAccount.project_id"
  implication: "No project ID mismatch"

- timestamp: 2026-05-24
  checked: "FCM error code semantics via Firebase docs and community reports"
  found: "THIRD_PARTY_AUTH_ERROR specifically means FCM failed to authenticate with the DOWNSTREAM push service (APNs for iOS, Web Push for web). It does NOT mean the caller's OAuth token is invalid. The 401 status code is misleading -- it's FCM reporting that IT received a 401-equivalent from APNs."
  implication: "The problem is between FCM and APNs, not between the Edge Function and FCM"

- timestamp: 2026-05-24
  checked: "Common causes of THIRD_PARTY_AUTH_ERROR via web research"
  found: "Top causes: (1) Wrong .p8 key uploaded -- e.g. an App Store Connect API key instead of an APNs auth key, (2) Key ID mismatch, (3) Team ID mismatch, (4) Bundle ID mismatch, (5) APNs key revoked/expired, (6) Sandbox vs Production token mismatch"
  implication: "Must verify APNs configuration in Firebase Console"

- timestamp: 2026-05-24
  checked: "Bundle ID in GoogleService-Info.plist"
  found: "com.updock.app.wandrille"
  implication: "Must confirm this exact bundle ID is registered in Firebase Console Apple app config AND matches the APNs key's associated app"

- timestamp: 2026-05-24
  checked: "Service account identity"
  found: "firebase-adminsdk-fbsvc@updock-app.iam.gserviceaccount.com with Firebase Admin SDK role"
  implication: "Service account has correct permissions for FCM API calls -- consistent with OAuth token being accepted"

- timestamp: 2026-05-24
  checked: "Code logic in sendFcmMessage()"
  found: "The message payload is correctly structured: { message: { token: fcmToken, notification: { title, body } } }. No apns-specific overrides. FCM should auto-route to APNs based on the device token type."
  implication: "Payload structure is correct per FCM v1 docs"

## Resolution

root_cause: |
  THIRD_PARTY_AUTH_ERROR is NOT an OAuth authentication failure on the caller side.
  It means FCM successfully received the request (OAuth token was valid) but then
  failed to authenticate with Apple Push Notification service (APNs) when trying to
  deliver the notification to the iOS device.

  The most likely specific cause is one of:
  1. WRONG APNs KEY: The .p8 file uploaded in Firebase Console is not an APNs
     authentication key. A common mistake is uploading an App Store Connect API key
     (.p8 format, looks identical) instead of an APNs authentication key.
  2. KEY ID MISMATCH: The Key ID entered in Firebase Console does not match the
     actual Key ID of the uploaded .p8 file.
  3. TEAM ID MISMATCH: The Team ID in Firebase Console does not match the Apple
     Developer account's Team ID.
  4. SANDBOX vs PRODUCTION: The FCM device token was registered in sandbox/development
     mode but FCM is trying to use it in production mode (or vice versa).

fix: |
  This is a Firebase Console configuration issue, not a code issue. The Edge Function
  code is correct. Steps to fix:

  1. Go to Firebase Console -> Project Settings -> Cloud Messaging -> Apple app configuration
  2. Check the APNs Authentication Key section:
     a. Verify the Key ID matches an APNs key (NOT an App Store Connect API key)
        in Apple Developer -> Certificates, Identifiers & Profiles -> Keys
     b. The key must have "Apple Push Notifications service (APNs)" enabled
     c. Verify Team ID is MRP323ZTYM (from user's report)
  3. If the wrong key was uploaded:
     a. Delete the current key in Firebase Console
     b. In Apple Developer Portal -> Keys, find or create a key with APNs enabled
     c. Download the .p8 file (can only download once!)
     d. Upload it to Firebase Console with the correct Key ID and Team ID
  4. If sandbox/production mismatch:
     a. When testing on a physical device via Xcode, tokens are sandbox tokens
     b. Ensure the Capacitor FCM plugin is registering with the correct environment
     c. Check if apns-push-type header needs to be set

  OPTIONAL CODE IMPROVEMENT (diagnostic, not a fix):
  Add APNs-specific headers to the FCM message to help debug environment issues:

verification: "pending -- requires user to verify APNs key configuration in Firebase Console"
files_changed: []
