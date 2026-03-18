# Project Research Summary

**Project:** Updock — community features milestone (profiles, reviews, sessions, push notifications)
**Domain:** Mobile community app — outdoor spot discovery (pumpfoil / water sports) on Capacitor + Supabase
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH (stack HIGH, features HIGH, architecture HIGH, push notifications MEDIUM)

## Executive Summary

Updock is a Capacitor/React/Supabase mobile app adding three community features to an existing working spot-discovery product: user profiles, spot reviews with ratings, and scheduled sessions with push notifications. The existing stack (React 19, TypeScript 5.9, Supabase 2.87, Capacitor 8, Mapbox GL 2, Tailwind v4) is solid and requires no fundamental changes — only targeted additions. The research-recommended approach is to layer each feature in strict dependency order: schema first, then profiles, then reviews, then sessions, then push notifications. This ordering is dictated by foreign key relationships and by isolating the highest-risk component (push notifications) to the end where it can be validated without blocking everything else.

Push notifications represent the single highest-risk item in this milestone. On iOS, push requires Apple Developer account setup, APNs Authentication Key (.p8), Firebase project integration, and can only be tested on a physical device — the simulator does not support APNs. The correct Capacitor plugin is `@capacitor-firebase/messaging` (not the official `@capacitor/push-notifications`), because the official plugin returns a raw APNs hex token on iOS that Firebase rejects; the community plugin handles APNs swizzling and returns a unified FCM token. Treating push as an isolatable sub-phase with a go/no-go gate is the primary risk mitigation.

The core competitive risk is that Foil Mates already offers nearly identical features (spot ratings, session scheduling with push, social profiles). Updock's advantage is pumpfoil-specific spot taxonomy, admin-validated quality, and focused UX without chat scope creep. Research is clear: execute these features with noticeably better UX than parity — especially the session creation and join flow, the review comment quality (requiring a minimum comment alongside any rating), and contextual push permission requests (never at launch, only when a user first joins a session).

## Key Findings

### Recommended Stack

The existing stack requires no core changes. Three targeted additions are needed: `@capacitor-firebase/messaging@8.1.0` (must match Capacitor 8 major version), Firebase project setup for FCM transport, and Supabase Edge Functions (Deno, already available) for server-side notification dispatch. Two supporting libraries are optional but recommended: `date-fns` for timezone-safe session time formatting and `react-hook-form` for the profile edit form. All other community data (reviews, sessions, profiles) is handled by the existing Supabase client with new tables and RLS policies — no new backend infrastructure.

**Core technology additions:**
- `@capacitor-firebase/messaging@8.1.0`: FCM push on iOS + Android — only plugin that returns a unified FCM token (not a raw APNs token) for both platforms
- Firebase project (FCM): transport layer for push delivery — mandatory, free below millions of messages/month
- Supabase Edge Functions: FCM dispatch triggered by DB webhook — official Supabase pattern, zero extra cost on free tier
- `date-fns@3.x`: session time formatting with locale and timezone support
- `react-hook-form@7.x`: profile/review forms — optional for simple forms with few fields

**Critical version constraint:** `@capacitor-firebase/messaging` major version must match `@capacitor/core` major version. Currently `@capacitor/core@8.x` in the codebase but `@capacitor/cli@7.4.4` — this mismatch must be resolved before any notification code is written.

**Do not add:** `@capacitor/push-notifications` (wrong token type on iOS), `@capacitor-community/fcm` (double plugin complexity), OneSignal/Pusher (paid services, unnecessary), Redux/TanStack Query (over-engineering for this codebase size).

### Expected Features

The research identifies a clear and bounded feature set. The pumpfoil audience constraint — "riders want to see spots, not manage a complex profile" — filters out scope creep directly.

**Must have (table stakes):**
- User profile with display name and avatar (editable) — identity is required before reviews or sessions make sense
- Spot rating 1-5 stars with mandatory written comment — rating alone produces useless 3-4 star averages
- Average rating displayed on SpotDetail — riders scan quality before committing to travel
- Create a scheduled session (spot + date/time + optional note)
- Join / leave a session with participant count visible
- Sessions list per spot (upcoming only, sorted by start time)
- My upcoming sessions visible on profile

**Should have (competitive differentiators):**
- Push notification when a new session is created at a user's favorited spot — the "never pump alone" hook that Foil Mates has and that drives daily active usage
- Session participant avatars shown inline — social proof that drives join behavior
- Spot context (type, photo) in session cards — riders choose sessions by spot quality, not just time

**Defer to v1.x after validation:**
- Notify participants on session cancellation (low effort once FCM is live)
- "Sessions near me" filtered view
- Notification on new review at a favorited spot

**Defer to v2+:**
- Session history statistics on profile
- Rich review filtering by date or conditions
- Push notification preferences (per-sport, per-distance)
- Public browsable profile pages

**Anti-features (deliberately excluded):** real-time chat, follower/feed system, session RSVP waitlists, gamification points, spot photo upload in reviews, social login (OAuth fragile in Capacitor deep links), advanced notification settings.

### Architecture Approach

The architecture follows the existing Context + Supabase client pattern without deviation. Two new React contexts (`ProfileContext`, `SessionsContext`) are added inside the existing provider tree. New UI surfaces (`ReviewForm`, `ReviewList`, `SessionCard`, `SessionForm`, `SessionList`) are all self-contained components. The main structural change to existing code is extending `SpotDetail.tsx` with an internal tab bar (Info / Reviews / Sessions). Push notification logic is isolated in `src/lib/notifications.ts` and a Supabase Edge Function — it does not touch the component tree beyond a single `useEffect` in `AuthContext` on login.

**Five new database tables:**
1. `profiles` — 1:1 with `auth.users`, auto-created via trigger on signup
2. `reviews` — one per user per spot (UNIQUE constraint), with `spot_ratings` aggregation view
3. `sessions` — scheduled session per spot, with `is_cancelled` soft-delete
4. `session_attendees` — junction table for join/leave
5. `push_tokens` — separate table for FCM device tokens (supports multiple devices per user, unlike a single `fcm_token` column on profiles)

**Key architectural decisions:**
- `push_tokens` is a separate table, not a column on `profiles` — a user can have multiple devices; one column silently drops earlier registrations
- Supabase Realtime subscribes per-spot (scoped to currently open SpotDetail drawer), not globally — prevents hitting the 200-connection free tier limit
- FCM dispatch goes through a `notifications` table insert → DB webhook → Edge Function, keeping the FCM server key out of frontend code
- `spot_ratings` is a SQL view, not a client-side computation — aggregate always computed server-side

**Provider tree order (App.tsx):** `LanguageProvider > AuthProvider > SpotsProvider > FavoritesProvider > ProfileProvider (new) > SessionsProvider (new) > AppContent`

### Critical Pitfalls

1. **Capacitor CLI/core version mismatch:** `@capacitor/cli@7.4.4` vs `@capacitor/core@8.0.0` already exists in the codebase. This is a confirmed pre-existing issue (CONCERNS.md). Any push notification work will silently fail or produce native build crashes until the CLI is bumped to `^8.x`. Run `npx cap doctor` before writing a single line of notification code.

2. **RLS `WITH CHECK` omission on INSERT/UPDATE:** Missing `WITH CHECK (auth.uid() = user_id)` on INSERT policies allows any authenticated user to post a review or session attributed to another user. This is a data integrity and trust issue, not just a security audit finding. Every writable table in this milestone needs both `USING` and `WITH CHECK`.

3. **RLS tested only in SQL Editor (bypasses all policies):** The Supabase SQL Editor runs as `postgres` superuser — RLS is invisible. All policy testing must be done via the SDK client with real user JWTs. Every phase that adds a new table must include a two-user integration test (owner vs non-owner) before shipping.

4. **iOS push permission requested at app launch:** iOS presents the permission dialog exactly once. Requesting it at launch (the common shortcut) produces a 20-30% opt-in rate vs ~51% when requested contextually. The correct trigger is the user's first "join session" tap. Once denied, the app cannot re-prompt — recovery requires directing users to iOS Settings.

5. **Push notifications built against simulator/browser only:** APNs does not work in the iOS Simulator. The entire FCM token registration → dispatch loop must be validated on a physical device from the first notification spike. Discovering provisioning profile issues or missing push entitlements during final QA means a full rebuild cycle.

6. **Notification storm from cron without idempotency guard:** If using pg_cron for session reminders, running the cron twice around the session start time sends duplicate notifications. The `sessions` table needs a `notified_at` column; the cron query must check `notified_at IS NULL` and update it in the same transaction before dispatching.

## Implications for Roadmap

Research is unusually specific about phase order due to strict schema dependencies and platform constraints. The architecture research provided an explicit recommended build order; the features and pitfalls research reinforces it. Six phases are suggested.

### Phase 1: Database Foundation
**Rationale:** Every frontend feature in this milestone depends on the schema. Getting the schema wrong means re-migrating and potentially breaking data. Build it entirely before touching React code.
**Delivers:** All 5 new tables with RLS policies, the `profiles` signup trigger, the `spot_ratings` aggregation view, and SQL migration files committed to `supabase/migrations/`.
**Addresses:** All table stakes features (requires schema as prerequisite)
**Avoids:** RLS `WITH CHECK` omission (design policies for all tables at once), missing indexes on `user_id` columns (add at creation time), schema dependencies in wrong order
**Research flag:** Standard Supabase pattern — no additional research needed. Use the schema DDL provided verbatim in ARCHITECTURE.md.

### Phase 2: User Profiles
**Rationale:** Profiles are referenced as foreign keys in reviews (author display) and sessions (creator info). Even a minimal profile (display name, avatar) must exist before any other community feature is buildable. The `profiles` table trigger auto-creates a row on signup, so existing users will also get profile rows via migration.
**Delivers:** `ProfileContext`, `Profile.tsx` fully implemented with avatar upload to Supabase Storage, display name editing, and spot submission history list.
**Uses:** Existing Supabase Storage pattern (same as spot photos bucket), `react-hook-form` for the edit form
**Implements:** `ProfileContext` → `useProfile()` hook, `ProfileProvider` added to App.tsx provider tree
**Avoids:** Public avatar bucket (use private bucket with per-user path), mandatory profile completion before browsing spots
**Research flag:** Standard pattern — no additional research needed.

### Phase 3: Spot Reviews and Ratings
**Rationale:** Reviews are independent of sessions — they only depend on profiles and spots (both already exist after Phase 2). Building reviews before sessions validates the `SpotDetail` tab extension pattern (Info / Reviews / Sessions tab bar) at lower risk before sessions add complexity.
**Delivers:** `ReviewForm`, `ReviewList`, tab bar in `SpotDetail`, average rating badge using `spot_ratings` view.
**Uses:** Supabase Realtime (optional: subscribe to review inserts for live updates), `spot_ratings` SQL view for aggregation
**Implements:** Reviews tab in SpotDetail, star picker component, review list with author avatar pulled from profiles
**Avoids:** Fetching all reviews without pagination (add LIMIT 20 default), computing averages client-side (use the view)
**Research flag:** Standard pattern — no additional research needed.

### Phase 4: Bug Fixes and Spot List Polish
**Rationale:** The existing List tab spot proximity sort is broken. Fixing existing debt before the most complex new feature (sessions) reduces the risk of shipping sessions into an already-unstable surface. This phase also removes the "hauteur" field from spot submission and fixes the image object URL memory leak — both noted in ARCHITECTURE.md as pending changes to `AddSpotForm.tsx`.
**Delivers:** Working spot List tab with proximity sort, simplified spot submission form, memory leak fix.
**Uses:** Existing `SpotsContext` — diagnosis and repair only
**Implements:** No new architecture — pure bug fixes
**Avoids:** Compounding existing issues with new feature complexity
**Research flag:** No research needed — codebase-specific diagnosis.

### Phase 5: Scheduled Sessions
**Rationale:** Sessions are the most complex frontend feature. They depend on profiles (creator display) and are a prerequisite for push notifications. Building sessions as a pull-only feature first (no push) lets the team validate the full join/leave/display flow on real devices before adding the highest-risk integration layer.
**Delivers:** `SessionsContext`, `SessionForm` with date/time picker, `SessionCard`, `SessionList`, Sessions tab in SpotDetail, Supabase Realtime subscription scoped per spot, user's upcoming sessions on Profile tab.
**Uses:** `date-fns` for timezone-safe time display, Supabase Realtime scoped to `spot:{spot_id}` channel
**Implements:** `SessionsProvider` added to App.tsx provider tree, optimistic UI for join/leave
**Avoids:** Global Realtime subscription (subscribe only when SpotDetail is open), session times displayed in server timezone (use `Intl.DateTimeFormat` on device), session chat scope creep
**Research flag:** Date/time picker component selection may need brief research — no native date/time picker exists in the current component library. Verify what's available in the Capacitor/React ecosystem before implementation.

### Phase 6: Push Notifications
**Rationale:** Push is last because it depends on sessions being stable, requires external service setup (Firebase project, Apple Developer push capability), and can only be validated on physical devices. Isolating it means every prior phase ships regardless of push readiness. This phase has a clear go/no-go gate: if Apple Developer setup is incomplete, sessions ship as pull-only and push is deferred.
**Delivers:** Firebase project configured for iOS + Android, `src/lib/notifications.ts` for token registration, `supabase/functions/push/index.ts` Edge Function, DB webhook on `notifications` table INSERT, FCM token persisted in `push_tokens` table on login, push notification sent to users who favorited a spot when a new session is created.
**Uses:** `@capacitor-firebase/messaging@8.1.0`, Firebase FCM v1 API via Edge Function, Supabase Queues (pgmq) for fan-out to avoid Edge Function timeout
**Implements:** Push token registration wired into `AuthContext` on SIGNED_IN, contextual permission request on first session join, in-app toast for foreground notifications
**Avoids:** Requesting permission at app launch (gate behind first session join), storing FCM token in `profiles` table (use separate `push_tokens` table), sending FCM from frontend (use Edge Function only), testing on Simulator (physical device from first spike), notification storm (idempotency via `notified_at` column)
**Research flag:** NEEDS RESEARCH during planning. Firebase project setup for Capacitor 8 with `@capacitor-firebase/messaging` has non-trivial native configuration steps (Xcode entitlements, `google-services.json` placement, APNs key upload). The Capacitor CLI/core version mismatch must also be resolved as the very first task of this phase.

### Phase Ordering Rationale

The order is driven by three forces: schema dependencies (tables must exist before frontend), feature dependencies (profiles before everything, sessions before push), and risk isolation (highest-risk item last). Reviews and sessions could theoretically be built in parallel after profiles, but sequential building is safer given this is a two-phase SpotDetail extension (tab bar) that would cause merge conflicts if built simultaneously.

The List tab bug fix (Phase 4) is placed before sessions rather than before reviews because reviews touch `SpotDetail` (a relatively stable surface) while sessions touch both `SpotDetail` and the List tab (the broken surface). Fixing List first creates a clean foundation for sessions.

### Research Flags

Phases needing deeper research during planning:
- **Phase 6 (Push Notifications):** Firebase project setup, Xcode entitlements for push, `google-services.json` placement with Capacitor 8, APNs .p8 key upload flow. Also: Supabase Queues (pgmq) availability on current Supabase plan. Use `/gsd:research-phase` before planning this phase.
- **Phase 5 (Sessions) — partial:** Date/time picker component. No existing picker in codebase. Options include a native Capacitor date picker or a React date/time picker compatible with Tailwind v4. Brief research recommended.

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Database Foundation):** Well-documented Supabase schema patterns; DDL provided in full in ARCHITECTURE.md.
- **Phase 2 (Profiles):** Standard Supabase Storage + RLS pattern; identical to existing spot photo pattern.
- **Phase 3 (Reviews):** Standard Supabase CRUD + aggregation view; no novel integrations.
- **Phase 4 (Bug Fixes):** Codebase-specific diagnosis; no external research applicable.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack is confirmed working. Additions are few and well-documented. Only uncertainty is native push plugin behavior on physical iOS device (untested). |
| Features | HIGH | Direct competitor analysis (Foil Mates, KiteSpot, Surfr) confirmed feature set. Anti-features are explicitly justified. MVP scope is well-bounded. |
| Architecture | HIGH | Existing codebase fully mapped. All new patterns follow established precedents in the codebase (FavoritesContext pattern). Schema DDL is complete and reviewed. |
| Pitfalls | HIGH (security/RLS) / MEDIUM (push UX) | Supabase RLS pitfalls sourced from official docs and confirmed production incidents. Push UX opt-in rate data is industry-reported, not Updock-specific. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Capacitor CLI/core version mismatch:** `@capacitor/cli@7.4.4` vs `@capacitor/core@8.0.0` is a confirmed pre-existing issue. Resolution is straightforward (`npm install @capacitor/cli@^8`) but must be validated against all existing native plugins before push work begins. This is not a research gap — it is a known task for Phase 6.

- **Supabase plan limits:** Whether the current Supabase plan supports pg_cron (for session reminders) needs verification. Free tier does not include cron jobs. Alternative (DB webhook on `sessions` INSERT) is available regardless of plan but only covers immediate notification, not time-based reminders. Validate plan level before committing to reminder notifications in scope.

- **Date/time picker component:** No existing picker in the codebase. Must be selected during Phase 5 planning. Options: `@capacitor/date-picker` (native), or a React-based picker (e.g., a simple HTML `<input type="datetime-local">` styled with Tailwind — surprisingly viable on mobile). Evaluate during Phase 5 planning.

- **Physical iOS test device availability:** Every notification feature requires a physical iPhone with push capability configured. Research assumes a device is available. Confirm this before committing to push notification scope for this milestone.

## Sources

### Primary (HIGH confidence)
- [Supabase Push Notifications — Official Docs](https://supabase.com/docs/guides/functions/examples/push-notifications) — FCM + Edge Function pattern
- [capawesome-team/capacitor-firebase README](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/messaging/README.md) — plugin version compatibility
- [Supabase Row Level Security — Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy patterns and pitfalls
- [Supabase Realtime Limits — Official Docs](https://supabase.com/docs/guides/realtime/limits) — 200-connection free tier limit
- [Supabase Storage Access Control — Official Docs](https://supabase.com/docs/guides/storage/security/access-control) — private bucket + RLS pattern
- [Supabase Cascade Deletes — Official Docs](https://supabase.com/docs/guides/database/postgres/cascade-deletes) — schema cleanup behavior
- [Capacitor Push Notifications API — Official Docs](https://capacitorjs.com/docs/apis/push-notifications) — confirmed APNs token limitation
- [Updating to Capacitor 8.0 — Official Docs](https://capacitorjs.com/docs/updating/8-0) — CLI/core alignment requirement
- [Codebase CONCERNS.md — Updock internal audit 2026-03-18](/.planning/codebase/CONCERNS.md) — confirmed pre-existing CLI/core mismatch

### Secondary (MEDIUM confidence)
- [Complete Guide to Capacitor Push Notifications — DEV Community](https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4) — plugin comparison, `@capacitor-firebase/messaging` rationale
- [Foil Mates](https://foilmates.com) + [Foiling Magazine feature profile](https://www.thefoilingmagazine.com/features/flightpath-foil-mates) — competitor feature analysis
- [KiteSpot](https://kitespotapp.com/), [Surfr](https://www.thesurfr.app/) — competitor feature benchmarking
- [Supabase RLS Hidden Dangers — DEV Community](https://dev.to/fabio_a26a4e58d4163919a53/supabase-security-the-hidden-dangers-of-rls-and-how-to-audit-your-api-29e9) — WITH CHECK omission pattern
- [Push Notification Best Practices — UX Playbook](https://www.boundev.com/blog/push-notification-best-practices-ux-guide) — contextual permission UX, opt-in rate data
- [React State Management 2025 — DEV Community](https://dev.to/themachinepulse/do-you-need-state-management-in-2025-react-context-vs-zustand-vs-jotai-vs-redux-1ho) — justification for not adding Redux/TanStack Query

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
