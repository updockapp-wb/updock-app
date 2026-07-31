---
phase: 05-recette-globale-nettoyage-final
reviewed: 2026-07-31T21:51:17Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - ios/App/App.xcodeproj/project.pbxproj
  - ios/App/App/GoogleService-Info.plist
  - src/App.tsx
  - src/components/AdminDashboard.tsx
  - src/components/AuthModal.tsx
  - src/components/ErrorBoundary.tsx
  - src/components/Map.tsx
  - src/components/Profile.tsx
  - src/context/AuthContext.tsx
  - src/context/FavoritesContext.tsx
  - src/context/LanguageContext.tsx
  - src/context/NotificationsContext.tsx
  - src/context/ProfileContext.tsx
  - src/context/SessionsContext.tsx
  - src/context/SpotsContext.tsx
  - src/context/useAuth.ts
  - src/context/useFavorites.ts
  - src/context/useLanguage.ts
  - src/context/useNotifications.ts
  - src/context/useProfile.ts
  - src/context/useSessions.ts
  - src/context/useSpots.ts
  - src/main.tsx
  - src/translations/en.json
  - src/translations/fr.json
  - src/utils/offline.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-07-31T21:51:17Z
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

**Note on process:** This review was performed inline by the orchestrator (not the `gsd-code-reviewer` subagent) because the account's monthly Claude spend limit was hit mid-phase, blocking further subagent spawns. The same adversarial standard-depth methodology (per-file read, language-aware checks, severity classification) was applied manually.

## Summary

Phase 05 touched context/hook file-splitting (05-01), dead-code cleanup (05-02), error-handling homogenization + `cacheSpotImages` parallelization (05-03), `React.lazy` code-splitting (05-04), and a recette closeout that added the Android native platform and fixed a Firebase-config wiring gap in `ios/App/App.xcodeproj/project.pbxproj` (05-05). No hardcoded secrets, injection vectors, or dangerous-function usage (`eval`, `innerHTML`, `dangerouslySetInnerHTML`) were found across the reviewed set. Pattern scans for debug artifacts (`console.log`/`TODO`/`FIXME`), empty catch blocks, and residual `any` typing all came back clean, consistent with 05-01's claimed zero-lint-debt result. The rethrow-to-caller error-handling pattern (D-05) is correctly and consistently applied in `AuthContext.signOut`, `SpotsContext.{addSpot,approveSpot,deleteSpot,updateSpot}`, with call sites in `AdminDashboard.tsx` and `Profile.tsx` catching and showing translated `Toast`s. `ErrorBoundary.tsx` and its wiring in `App.tsx` around the lazy `Map` correctly implement the Pitfall-1 mitigation (retry affordance, translated fallback). `cacheSpotImages` in `offline.ts` is correctly parallelized with `Promise.all` and per-URL error isolation — no unhandled-rejection risk.

Two Warnings surfaced, both from the same root cause: **Android was added as a real target platform in this phase's closing plan (05-05), but two pieces of code outside this phase's direct file-modification scope still assume iOS-only.** These aren't regressions introduced by phase 5's own diffs — they're latent gaps that only became reachable once Android became a supported platform in this same phase. Flagging them here because the recette (05-05) explicitly names Android as in-scope going forward (D-11).

## Warnings

### WR-01: Push token upsert hardcodes `platform: 'ios'`, will mis-tag Android devices

**File:** `src/context/NotificationsContext.tsx:81` and `src/context/NotificationsContext.tsx:128`
**Issue:** Both the `tokenReceived` listener and `ensurePushToken()` upsert to `push_tokens` with a hardcoded `platform: 'ios'` field. No call to `Capacitor.getPlatform()` (or equivalent) exists anywhere in `src/` — confirmed via `grep -rn "getPlatform\|Capacitor\.platform" src/` returning no matches. Now that this same phase added the Android native platform (`db0bb73`) to satisfy D-11's device-recette requirement, any Android user who grants notification permission will have their token stored with `platform: 'ios'`, which will silently corrupt any platform-based filtering/delivery logic downstream (e.g. `supabase/functions/notify-session-created`, out of this review's file scope but a known consumer of this table per git status).
**Fix:**
```typescript
import { Capacitor } from '@capacitor/core';
// ...
const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
await supabase
    .from('push_tokens')
    .upsert(
        { user_id: user.id, token, platform },
        { onConflict: 'user_id,token' }
    );
```
Apply the same fix at both call sites (line 81 in the `tokenReceived` listener, line 128 in `ensurePushToken`).

### WR-02: iOS-only settings deep link no-ops on Android

**File:** `src/components/Profile.tsx:359`
**Issue:** When push permission is `denied`, tapping the notification row navigates via `window.location.href = 'app-settings:'` — an iOS-specific URL scheme. On Android this does nothing (no app-settings intent is triggered), leaving the user stuck with no way to re-enable notifications from within the app. Same root cause as WR-01: pre-existing code, but now reachable on a real second platform as of this phase.
**Fix:**
```typescript
import { Capacitor } from '@capacitor/core';
// ...
onClick={permissionStatus === 'denied' ? () => {
    if (Capacitor.getPlatform() === 'ios') {
        window.location.href = 'app-settings:';
    } else if (Capacitor.getPlatform() === 'android') {
        // e.g. @capacitor/app's App.openSettings(), or a native intent bridge
    }
} : undefined}
```
(Requires picking an Android settings-intent mechanism — not present in the reviewed file set — before this can be closed.)

## Info

### IN-01: Per-image upload failures in `addSpot` are silently swallowed

**File:** `src/context/SpotsContext.tsx:159-171`
**Issue:** Inside the image-upload loop, a failed `supabase.storage.from('spots').upload(...)` only logs via `console.error` and continues — the spot is still created without that image and without any user-facing signal about which upload(s) failed. Pre-existing behavior (not part of the 05-03 error-handling homogenization diff, which focused on the outer `addSpot`/`approveSpot`/`deleteSpot`/`signOut` rethrow pattern), but worth noting since this file was actively touched this phase and the surrounding function's error handling was the explicit subject of review.
**Fix:** Not blocking — consider surfacing a count of failed uploads to the caller (e.g. via a return value or a dedicated field) so `AddSpotForm` can inform the user, in a future pass. No action required for this phase.

---

_Reviewed: 2026-07-31T21:51:17Z_
_Reviewer: Claude (orchestrator, inline — gsd-code-reviewer subagent unavailable due to spend-limit block)_
_Depth: standard_
