# Pitfalls Research

**Domain:** Community features on a Capacitor/Supabase/React mobile app (profiles, reviews, sessions, push notifications)
**Researched:** 2026-03-18
**Confidence:** HIGH (Supabase RLS, Capacitor push) / MEDIUM (UX patterns, session architecture)

---

## Critical Pitfalls

### Pitfall 1: Capacitor CLI / Core Version Mismatch Blocks Push Notification Build

**What goes wrong:**
The app currently has `@capacitor/cli` v7.4.4 but `@capacitor/core` v8.0.0 (confirmed in CONCERNS.md). Adding `@capacitor/push-notifications` to a mismatched environment produces silent incompatibilities — native build failures on Android, incorrect plugin resolution on iOS, or runtime crashes that only appear on physical devices during notification registration.

**Why it happens:**
Developers install the push plugin targeting the core version they want, forgetting the CLI must match. The mismatch is invisible in the web layer — it only surfaces during `npx cap sync` or when the native binary is built.

**How to avoid:**
Resolve the CLI/core mismatch before touching push notification code. Run `npx cap doctor` to confirm alignment, then bump `@capacitor/cli` to `^8.x` to match `@capacitor/core`. Pin all Capacitor-related packages to the same major version in `package.json`. After resolving, install `@capacitor-firebase/messaging` (community plugin) rather than the official `@capacitor/push-notifications`, as it provides a unified FCM token for both iOS and Android — the official plugin returns a raw APNs hex token on iOS that Firebase does not accept directly.

**Warning signs:**
- `npx cap doctor` reports version warnings
- `npx cap sync` produces deprecation warnings about plugin API versions
- Push token registration succeeds in the web layer but FCM rejects the token on the server side
- Notifications work on Android but silently fail on iOS

**Phase to address:**
Push Notifications phase — must be the very first task before any notification code is written.

---

### Pitfall 2: RLS Policies Written Correctly but Tested Wrong (SQL Editor Bypass)

**What goes wrong:**
All new tables — `profiles`, `reviews`, `sessions`, `session_participants` — will have RLS enabled. Developers test queries in the Supabase SQL Editor, see correct results, ship to production, and then users see empty results or forbidden errors. The SQL Editor runs as the `postgres` superuser and bypasses all RLS, making every policy appear to work during development.

**Why it happens:**
The Supabase dashboard is the natural place to test queries. Nothing warns you that the context is elevated. This is the #1 Supabase security issue reported across production apps (83% of exposed Supabase databases in the 2025 Lovable incident were RLS misconfigurations).

**How to avoid:**
Test all RLS policies exclusively via the Supabase client SDK, impersonating a real user. Use `supabase.auth.setSession()` with a test JWT in a dev environment, or use the "RLS policy simulator" available in the Supabase dashboard. Create at minimum two test user accounts (owner and non-owner) and verify that each sees only the rows they should. Add `EXPLAIN ANALYZE` on SELECT queries against new tables to confirm index hits on the `user_id` column.

**Warning signs:**
- Policies pass all SQL Editor tests but return empty arrays in the frontend
- `403 Forbidden` errors appear intermittently depending on which user hits the endpoint
- Admin sees all rows; regular users see none

**Phase to address:**
Each phase that introduces a new table (profiles phase, reviews phase, sessions phase).

---

### Pitfall 3: RLS `WITH CHECK` Omission on INSERT/UPDATE Enables Ownership Spoofing

**What goes wrong:**
An INSERT policy without `WITH CHECK` allows a malicious user to insert a review or session with any `user_id` value — effectively posting content attributed to someone else. An UPDATE policy without `WITH CHECK` allows a user to change `user_id` on an existing row, stealing ownership.

**Why it happens:**
`USING` clause is the intuitive part — it filters what rows are visible. `WITH CHECK` is less obvious and easy to forget. Many tutorials only show the `USING` clause.

**How to avoid:**
For every INSERT or UPDATE policy on `reviews`, `sessions`, `session_participants`, `profiles`: always include both `USING (auth.uid() = user_id)` and `WITH CHECK (auth.uid() = user_id)`. For UPDATE, the USING clause controls which rows can be targeted and WITH CHECK controls what the row looks like after the update. Never omit WITH CHECK on any writable table.

**Warning signs:**
- A test user can insert a row with a different `user_id` without error
- You can change the `user_id` field of an existing review via the SDK without error
- RLS policies pass a read-only audit but write operations are never explicitly tested

**Phase to address:**
Every phase that introduces a writable table — verify in implementation checklist.

---

### Pitfall 4: iOS Push Permission Asked at App Launch Instead of at Contextual Trigger

**What goes wrong:**
iOS presents the push permission dialog exactly once. If it is shown at app startup (the common shortcut), most users dismiss it because there is no context for why it is needed. Median iOS opt-in rate is 51% when asked contextually, and much lower (~20-30%) when asked cold at launch. Once denied, the user must go to iOS Settings manually — the app cannot re-prompt.

**Why it happens:**
The Capacitor push registration flow is typically wired into app initialization. It is one line of code to trigger on `appStateChange` at launch, and the developer moves on.

**How to avoid:**
Gate the permission request behind the first user action that makes notifications valuable — specifically, when a user taps "I'll be at this spot" to join a session. Show a pre-permission modal explaining: "We'll notify you when other riders join the session." Only after the user confirms this intent do you call `requestPermissions()`. If denied, persist a `notificationsDenied` flag in local storage and do not ask again; instead, show an inline "Enable in Settings" prompt on the sessions tab.

**Warning signs:**
- Permission request is called inside `initializeApp()` or `App.addListener('appStateChange', ...)`
- No pre-permission explanation screen exists
- Analytics show < 30% push opt-in rate

**Phase to address:**
Sessions + Push Notifications phase — permission UX must be designed before implementation begins.

---

### Pitfall 5: Push Notifications Not Tested on Physical Device Until Late

**What goes wrong:**
Push notifications do not work on iOS Simulators (APNs is not available). Android emulators require specific Google Play Services configuration. Developers build the entire notification pipeline against web mocks, then discover fundamental platform issues (wrong token type, entitlements missing, provisioning profile lacking push capability) only during final testing — requiring a full rebuild cycle.

**Why it happens:**
Physical device testing requires Apple Developer membership, provisioning profiles, and signing configuration — high friction that gets deferred. The web layer appears to work correctly (FCM SDK accepts the request), masking the native layer failure.

**How to avoid:**
Test on physical devices from the first notification spike. Before writing any notification dispatch logic, validate the full registration → token → FCM receive loop on a real iPhone and Android device. Verify: (1) Push Notifications capability enabled in Xcode, (2) `google-services.json` in `android/app/` with matching package name, (3) APNs key uploaded to Firebase Console for iOS. Keep a physical test device available throughout the entire notifications phase — do not defer to the end.

**Warning signs:**
- All notification tests run in a browser or simulator only
- FCM console shows tokens registered but no messages delivered
- iOS build has no Push Notifications capability in the entitlements file

**Phase to address:**
Push Notifications phase — physical device test must be the first acceptance criterion.

---

### Pitfall 6: Session Notifications Trigger Storms from Supabase Realtime + pg_cron

**What goes wrong:**
A scheduled session at 15:00 has 20 participants. If you use a pg_cron job that fires every minute to check for upcoming sessions and dispatches notifications, and the cron runs at 14:59 and 15:00, users receive duplicate notifications. At Supabase free tier, cron jobs that invoke Edge Functions face a 200 concurrent connection limit on Realtime and a 5 second timeout on cron-triggered Edge Functions; a slow FCM dispatch loop can time out, partially notifying users and leaving others with no notification.

**Why it happens:**
The naive approach is: "cron finds sessions starting soon → for each participant → send push." This does not account for duplication window, partial failures, or fan-out time at scale.

**How to avoid:**
Use a `notifications_sent` boolean column (or a `notified_at` timestamp) on session rows. The pg_cron query only selects sessions where `notified_at IS NULL` and updates `notified_at = NOW()` in the same transaction before dispatching. This makes the operation idempotent. For fan-out to many participants, use Supabase Queues (pgmq) rather than dispatching directly in the Edge Function — queue each notification as a discrete job to avoid timeout. Set cron interval to 5 minutes (not 1 minute) for session reminders sent 30 minutes in advance.

**Warning signs:**
- Cron job does not update a "sent" flag before dispatching
- Edge Function fan-out loop has no timeout handling
- Users report receiving the same session notification 2-3 times

**Phase to address:**
Sessions + Push Notifications phase — notification dispatch architecture must be designed upfront, not bolted on.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing `spot_type` as JSON string (already in codebase) | No migration needed now | Reviews and session filters on spot type become unreliable; any new feature touching spot type breaks silently | Never — migrate before adding reviews that reference spot type |
| Using `alert()` for error handling (already in codebase) | Fast to implement | New features (review submission failures, session join errors) will surface native browser dialogs on mobile — broken UX | Never in production mobile app |
| Skipping index on `user_id` in new community tables | Faster to write schema | RLS policy `user_id = auth.uid()` causes full table scan; 10k reviews → 50ms+ queries; noticeable on profile load | Never — add index at table creation time |
| Storing push tokens in `localStorage` only | No backend needed | Token becomes stale after reinstall; no way to notify users who cleared app data; cannot target multiple devices | Never for production notifications |
| Asking push permission at app boot | One-line implementation | iOS opt-in rate collapses; cannot re-prompt after denial | Never — always use contextual triggers |
| Public Supabase storage bucket for avatars | Simple URL access | Any URL can be scraped; no user-level access control; cannot revoke access | Only acceptable for completely anonymous public content |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Capacitor Push + Firebase | Using `@capacitor/push-notifications` on iOS — returns raw APNs hex token that FCM rejects | Use `@capacitor-firebase/messaging` which handles APNs swizzling and returns a unified FCM token |
| Supabase Storage (avatars) | Creating a public bucket and relying on obscure URLs for privacy | Create a private `avatars` bucket; use `user_id` as folder name in path; write RLS policy on `storage.objects` matching `auth.uid()` |
| Supabase Edge Functions + pg_cron | Edge Function invoked by cron with no idempotency guard | Add `notified_at` timestamp check + update in same DB transaction before any side effect |
| Supabase Realtime (session presence) | Subscribing all active users to a single realtime channel | Scope channels per spot (`spot:{spot_id}`) to limit connection fan-out and stay within the 200-connection free tier limit |
| FCM via Supabase Edge Function | Dispatching to all participants inside the Edge Function synchronously | Use Supabase Queues (pgmq) to fan out — avoids the 5s Edge Function cron timeout |
| Capacitor on iOS physical device | Testing push in Simulator | APNs is unavailable in Simulator; physical device with correct provisioning profile required from day one |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No index on `user_id` in `reviews`, `sessions`, `profiles` | Profile page loads slowly; RLS policies scan full table | Add `CREATE INDEX ON reviews(user_id)` at migration time | ~1,000 rows |
| Fetching all reviews for a spot in a single query (no pagination) | Spot detail page hangs for popular spots | Default `LIMIT 20` with cursor-based pagination from the start | ~100 reviews per spot |
| Supabase Realtime channel per user instead of per spot | Free tier 200 concurrent connection limit hit with ~200 active users | Channel per spot, not per user; only subscribe when SpotDetail is open | 200 simultaneous users |
| Storing push tokens in the frontend only (no `device_tokens` table) | Cannot notify users who reinstalled or use multiple devices | `device_tokens` table: `(user_id, token, platform, created_at)` with upsert on token | First reinstall after notification feature launch |
| Re-fetching all spots after a review is submitted | Map reloads entire dataset unnecessarily | Optimistic UI update; only re-fetch the single spot's review count | ~50 spots today, still wasteful UX |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS enabled on `reviews` but missing `WITH CHECK` on INSERT | Any user can post a review attributed to another user's `user_id` | Always pair INSERT/UPDATE policies with `WITH CHECK (auth.uid() = user_id)` |
| `sessions` table allows participants to see each other's email | User enumeration — riders can harvest other users' emails | Only expose `display_name` and `avatar_url` from `profiles` in session participant queries; never join `auth.users` directly in client queries |
| Avatar bucket set to public | Any URL is permanently accessible even after user deletion | Private bucket with per-user folder path RLS policy |
| Push tokens stored without expiry or rotation | Stale tokens accumulate; token from sold device can still receive notifications | Store `(user_id, token, platform, updated_at)`; delete tokens on logout; handle FCM `NotRegistered` error by deleting the token |
| No rate limit on review submission | A user can spam hundreds of reviews on a spot | Add Supabase row-level rate limiting via a `CHECK` constraint or Edge Function that counts reviews per user per spot per day |
| Missing input validation on review text | XSS if review text is rendered as HTML; excessively long reviews bog down storage | Client-side length cap (max 500 chars); server-side Postgres `CHECK (LENGTH(content) <= 500)` constraint |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Mandatory profile creation before any community action | Riders who just want to check spots abandon the app before they see value | Allow full spot browsing without a profile; gate profile creation on first review or session join with a lightweight bottom-sheet modal |
| Asking for push permission on first app open | iOS users deny immediately (no context); cannot re-prompt; notification features never used | Ask only when user taps "I'll be there" on a session for the first time |
| Profile avatar upload as blocking step | Users skip the profile entirely if avatar upload is required | Make avatar optional; show initials fallback; surface upload as a one-tap improvement after profile is created |
| Star rating with no written component | Spot quality data becomes useless (every spot gets 3-4 stars) | Require a minimum 20-character comment alongside any rating |
| Session time displayed in server timezone | International riders see wrong times; miss sessions | Always convert and display session times in device local timezone using `Intl.DateTimeFormat` |
| Notification for every session on every spot in the app | Notification spam leads to 32% uninstall rate (industry data) | Only notify users who have favorited the spot OR explicitly followed the session; never broadcast to all users |
| iOS safe-area not respected in new modals (profile, review form) | Bottom content hidden behind home indicator on iPhone X+ | Use `padding-bottom: env(safe-area-inset-bottom)` on all new full-screen sheets; verify on physical notched device |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Push Notifications:** Registration flow works in browser — verify FCM token is received AND delivered on a physical iOS device with correct provisioning profile
- [ ] **User Profiles:** Profile page renders correctly — verify RLS prevents User A from editing User B's profile; verify avatar URL is not publicly guessable
- [ ] **Reviews:** Review form submits successfully — verify `user_id` in the inserted row matches `auth.uid()` (cannot be spoofed); verify duplicate reviews per user per spot are blocked
- [ ] **Sessions:** Session appears in the list — verify session creator can delete/cancel it; verify non-participants cannot see participant contact information
- [ ] **Session Notifications:** Notification fires once in dev — verify it fires exactly once (idempotent) when cron runs multiple times around the session start time
- [ ] **Cascade Deletes:** Spot deletion works for admin — verify that reviews and sessions for that spot are also deleted (or blocked if active sessions exist); confirm no orphaned `favorites` records (already fragile per CONCERNS.md)
- [ ] **Capacitor Version:** Push plugin integrates without error — run `npx cap doctor` and confirm CLI and core are on the same major version before shipping
- [ ] **Error Handling:** Feature works on happy path — verify that review submission network failures, push token registration failures, and session join conflicts surface visible error messages (not `alert()` or silent failures per existing codebase patterns)

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| iOS push users denied permission at launch | HIGH | Cannot re-prompt via code; must surface "Enable Notifications" button linking to `UIApplication.openSettingsURLString`; rebuild trust before users return to Settings |
| RLS WITH CHECK missing — spoofed ownership data in production | HIGH | Audit all rows with `user_id` not matching the submitting user's JWT history; soft-delete suspect rows; add migration to add `WITH CHECK`; notify affected users |
| Capacitor CLI/core mismatch discovered mid-feature | MEDIUM | Resolve via `npx cap sync` after aligning versions; re-test all existing native features (camera, location) on physical device before continuing |
| Notification storm (duplicate push sent) | MEDIUM | Add `notified_at IS NULL` guard retroactively; send one apology notification explaining the duplicate; FCM has no recall mechanism |
| Push token stale after user reinstall | LOW | FCM returns `NotRegistered` error on dispatch; implement handler to delete that token record from `device_tokens` table |
| `reviews` table missing index — production slowdown | LOW | `CREATE INDEX CONCURRENTLY` — no downtime; query performance restores immediately |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Capacitor CLI/core mismatch | Push Notifications phase (first task) | `npx cap doctor` shows no version warnings before any notification code |
| RLS tested in SQL Editor (bypasses policies) | Every phase with a new table | Integration test using SDK client with real user JWT, not SQL Editor |
| RLS missing `WITH CHECK` on writes | Every phase with a writable table | Attempt to insert row with spoofed `user_id` via SDK — must return 403 |
| iOS push permission asked at launch | Sessions + Push phase (UX design step) | No `requestPermissions()` call in app initialization code |
| Push not tested on physical device | Push Notifications phase (first acceptance criterion) | FCM test notification received on physical iPhone and Android device |
| Notification storm from cron duplication | Sessions + Push phase (architecture step) | `notified_at` column present; running cron twice does not send duplicate notifications |
| No index on community table `user_id` columns | Each schema migration | `\d reviews` shows index on `user_id`; `EXPLAIN ANALYZE` shows index scan, not seq scan |
| Push token not persisted in database | Push Notifications phase | `device_tokens` table exists; token upserted on registration; deleted on logout |
| Session times in wrong timezone | Sessions phase | Session displayed in local time on device set to UTC+9 differs correctly from UTC device |
| iOS safe-area violations in new modals | Each new UI phase | Manual visual test on physical iPhone X+ — no content hidden behind home indicator |

---

## Sources

- [Capacitor Push Notifications Official Docs](https://capacitorjs.com/docs/apis/push-notifications) — HIGH confidence
- [The Push Notifications Guide for Capacitor — Capawesome](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/) — MEDIUM confidence
- [Complete Guide to Capacitor Push Notifications — DEV Community](https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4) — MEDIUM confidence
- [Supabase Row Level Security — Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Supabase RLS Hidden Dangers — DEV Community](https://dev.to/fabio_a26a4e58d4163919a53/supabase-security-the-hidden-dangers-of-rls-and-how-to-audit-your-api-29e9) — MEDIUM confidence
- [Supabase Cascade Deletes — Official Docs](https://supabase.com/docs/guides/database/postgres/cascade-deletes) — HIGH confidence
- [Supabase Realtime Limits — Official Docs](https://supabase.com/docs/guides/realtime/limits) — HIGH confidence
- [Supabase Storage Access Control — Official Docs](https://supabase.com/docs/guides/storage/security/access-control) — HIGH confidence
- [Scheduling Edge Functions — Official Docs](https://supabase.com/docs/guides/functions/schedule-functions) — HIGH confidence
- [Push Notification Best Practices — UX Playbook](https://www.boundev.com/blog/push-notification-best-practices-ux-guide) — MEDIUM confidence
- [Updating to Capacitor 8.0 — Official Docs](https://capacitorjs.com/docs/updating/8-0) — HIGH confidence
- [Codebase CONCERNS.md — Updock internal audit 2026-03-18](/.planning/codebase/CONCERNS.md) — HIGH confidence (direct codebase evidence)

---
*Pitfalls research for: Updock community features (profiles, reviews, sessions, push notifications) on Capacitor/Supabase/React*
*Researched: 2026-03-18*
