# Feature Research

**Domain:** Mobile community app — outdoor spot discovery (pumpfoil / water sports)
**Researched:** 2026-03-18
**Confidence:** HIGH (direct competitor analysis: Foil Mates, KiteSpot, Surfr + Supabase/Capacitor implementation patterns)

---

## Context

Updock already has the spot map, favorites, admin validation, and auth. This milestone adds three new feature clusters to an existing working app:

1. **User profiles** — name, avatar, history of submitted spots
2. **Spot reviews & ratings** — star rating + comment per spot per user
3. **Scheduled sessions** — "I'll be at this spot at 14h, who joins?" with push notifications

The core project constraint is: "les riders veulent voir des spots, pas créer un profil complexe." Every decision below is filtered through that lens.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users assume exist the moment they see profiles, reviews, or sessions mentioned. Missing these makes the feature cluster feel broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Profile page with display name + avatar | Any authenticated app — users need identity | LOW | `profiles` table in Supabase; avatar in Storage bucket. Supabase trigger auto-creates on signup. Existing `AuthContext` covers auth state already. |
| Edit own profile (name, avatar) | Any profile system — read-only profiles feel broken | LOW | File upload to `avatars/` bucket, update `profiles` row. Reuse existing image upload pattern from spot submission. |
| History of spots submitted by user | Natural "my activity" section on profile | LOW | Query `spots` table by `submitted_by = user.id`. Already exists in DB, just needs display. |
| Star rating on a spot (1-5) | Foil Mates and KiteSpot both have spot ratings — users already expect this | LOW | `spot_reviews` table with `spot_id`, `user_id`, `rating`, `comment`. One review per user per spot (UNIQUE constraint). |
| Written comment alongside rating | A rating without context is near-useless for outdoor spots (conditions vary) | LOW | Same `spot_reviews` table, `comment` nullable text field. |
| Average rating displayed on spot card/detail | Foil Mates shows rating at a glance — users scan before committing to travel | LOW | Computed via `avg(rating)` from `spot_reviews`. Show on `SpotDetail` and list view. |
| Create a scheduled session (spot + date + time) | Core feature promise — must actually work to be credible | MEDIUM | `sessions` table: `spot_id`, `user_id`, `scheduled_at`, `note`. Simple insert. |
| See upcoming sessions on a spot | Sessions list per spot, visible in SpotDetail | LOW | Query `sessions` by `spot_id` and `scheduled_at > now()`. |
| Join / leave a session | Users need to signal attendance; organizer needs to know who's coming | LOW | `session_participants` join table. Toggle join/leave. Show participant count and avatar list. |
| View your own upcoming sessions | Users need to manage their commitments | LOW | Query `session_participants` + `sessions` for current user, show in profile or dedicated tab. |

### Differentiators (Competitive Advantage)

Features that go beyond what Foil Mates and KiteSpot already offer, or that Updock can execute with significantly better UX given its focused pumpfoil audience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Push notification when a session is created at a favorited spot | Foil Mates has this — it's the killer hook for sessions: "never pump alone." Nobody polls the app; the app tells you. | HIGH | Requires FCM (Firebase Cloud Messaging) + Capacitor plugin `@capacitor-firebase/messaging`. Physical device only for iOS testing (no simulator). Supabase Edge Function triggers FCM on `sessions` INSERT. |
| Session participant avatars shown inline | Social proof — "3 riders confirmed" feels more real than a count. Creates FOMO that drives joins. | LOW | Fetch `session_participants` with profile join. Render avatar stack (3 max + overflow count). |
| Spot context in session card (type, photo) | Riders scan sessions by spot quality, not just time. Showing the spot inline reduces friction. | LOW | JOIN `sessions` → `spots` in query. Already have spot photos in Supabase Storage. |
| Rating breakdown by session type / conditions note | Pumpfoil spots have dock height, current, wind exposure — a "4 stars but only at low tide" comment is more valuable than any numeric aggregate | LOW | Free-text comment field already covers this if UX prompts riders with "conditions?" placeholder text. No extra schema needed. |
| Profile shows spots submitted + sessions organized | Lightweight "reputation" — riders see you've contributed, builds trust before joining your session | LOW | Two queries on profile page: submitted spots + past sessions. No follower system needed. |

### Anti-Features (Deliberately Excluded)

Features that appear attractive but contradict the project's core value or create disproportionate complexity.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time chat / messaging | "We're at the spot together" social glue | Full WebSocket infra, moderation burden, Supabase Realtime quotas, privacy concerns. Explicitly out of scope in PROJECT.md. | Session comment/note field at creation time. Use existing messaging apps (WhatsApp) for in-session comms. |
| Follower / feed system | "See what my network is doing" social engagement | Turns the app into a social network — conflicts with "spots before anything" core value. High complexity, low retention without network effects. | Session participants list gives natural social context within spot discovery. |
| Session chat / group messaging | Coordinate meetup details | Same problems as real-time chat, plus requires push for chat messages (compounding FCM complexity) | Session has a `note` field set at creation (e.g., "meet at the red buoy"). |
| Session RSVP with capacity limits / waitlists | "Prevent overcrowding" on popular spots | Adds complex state machine (pending / approved / waitlisted), admin overhead, user frustration. Pumpfoil spots rarely have strict capacity limits. | Show participant count. Let organizer cancel if needed. No waitlist. |
| Leaderboards / gamification points | "Top contributors" motivation | Distorts behavior (fake spot submissions for points). KiteSpot has this, reviews are noticeably lower quality. | Simple activity history on profile. Trust through transparency, not points. |
| Spot photo upload in reviews | Richer reviews | Multiplies storage costs, requires moderation, adds friction to review flow. Most riders are wet when reviewing. | Allow link to external photo in comment text. Core review = text + rating. |
| Advanced user preferences / notification settings | "Don't notify me for X sport or Y distance" | Premature optimization — with a small user base, all notifications are relevant. Settings add UI debt with no ROI yet. | Single toggle: notifications ON/OFF per user. Refine when user volume justifies it. |
| Social login (Google, Apple) | Reduce signup friction | Auth system already exists with email/password + email verification. Adding OAuth adds callback URL complexity in Capacitor deep links (already fragile per codebase notes). | Polish existing email verification flow (already in progress per recent commit). |

---

## Feature Dependencies

```
[User Profile]
    └──required by──> [Spot Reviews]     (reviews need author identity)
    └──required by──> [Scheduled Sessions] (sessions need organizer identity)
    └──required by──> [Session Participants] (joining needs user identity)

[Spot Reviews]
    └──required by──> [Average Rating Display] (needs review data to aggregate)

[Scheduled Sessions]
    └──required by──> [Session Participants] (can't join what doesn't exist)
    └──required by──> [Push Notifications]   (nothing to notify about without sessions)

[Push Notifications]
    └──requires──> [FCM / Firebase project setup] (external service, not in current stack)
    └──requires──> [Capacitor @capacitor-firebase/messaging plugin]
    └──requires──> [Supabase Edge Function] (to trigger FCM on DB event)
    └──requires──> [Physical iOS device] (iOS Simulator cannot receive APNs)

[Session Participants]
    └──enhances──> [Push Notifications] (notify participants on session change/cancellation)
    └──enhances──> [User Profile] (session history visible on profile)
```

### Dependency Notes

- **User Profile must come first:** Both reviews and sessions store `user_id` as foreign key. The `profiles` table must exist before any community feature is built. Even a minimal profile (display name only) unblocks everything else.
- **Sessions before Push Notifications:** FCM integration is the highest-risk item (physical device only, Apple Developer config, multi-service coordination). Build and validate sessions as a polling/manual-refresh feature first, then layer notifications on top.
- **Reviews are independent of Sessions:** Once profiles exist, reviews can be built in parallel with sessions. They share no schema dependencies.
- **Push Notifications conflict with rapid iteration:** Every change to notification payloads requires an app store build. Design the notification schema carefully before shipping.

---

## MVP Definition

This milestone is not a greenfield app — it's three feature additions to a working product. The MVP for this milestone is the minimum that makes each feature cluster credible.

### Launch With (v1 — this milestone)

- [ ] **User profiles (minimal)** — display name, avatar, editable. No public profile browsing needed; profile is for self-identification in reviews and sessions.
- [ ] **Spot reviews** — star rating (1-5) + optional comment. One review per user per spot. Average rating shown in SpotDetail. Reviews list visible on spot.
- [ ] **Scheduled sessions** — create session (spot + date/time + optional note). View sessions per spot. Join/leave a session. My upcoming sessions visible on profile tab.
- [ ] **Push notifications (FCM)** — notify when a new session is created at a user's favorited spot. Single notification type to validate the full stack before adding more triggers.

### Add After Validation (v1.x)

- [ ] **Notify participants on session cancellation** — once notification stack is live, this is a single new trigger. Add when first session is cancelled and users complain they didn't know.
- [ ] **"Sessions near me" view** — once sessions have data, surface sessions at spots within N km. Requires geolocation (already in app) + sessions query with spot coordinates join.
- [ ] **Notification on new review at a spot you favorited** — low friction to add once FCM is set up. Useful for monitoring spot quality over time.

### Future Consideration (v2+)

- [ ] **Session history / stats on profile** — "X sessions organized, Y attended" — defer until session volume justifies it.
- [ ] **Rich review filtering** — filter reviews by date, season, conditions — defer until review volume justifies it.
- [ ] **Push notification preferences** — per-spot or per-sport filtering — defer until user base is large enough to warrant personalization.
- [ ] **Public profile pages** — browsable by other users (e.g., "see all spots submitted by this rider") — defer; privacy implications need consideration.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User profile (name + avatar) | HIGH | LOW | P1 |
| Spot rating (stars + comment) | HIGH | LOW | P1 |
| Average rating on spot detail | HIGH | LOW | P1 |
| Create scheduled session | HIGH | MEDIUM | P1 |
| Join / leave session | HIGH | LOW | P1 |
| Session list per spot | HIGH | LOW | P1 |
| My upcoming sessions (profile) | MEDIUM | LOW | P1 |
| Push notification (favorited spot + new session) | HIGH | HIGH | P1 — but isolated; can delay to v1.x if Apple dev setup blocks |
| Session participant avatars inline | MEDIUM | LOW | P2 |
| Spot context in session card | MEDIUM | LOW | P2 |
| Notify participants on cancellation | MEDIUM | LOW (once FCM live) | P2 |
| Sessions near me | MEDIUM | MEDIUM | P2 |
| Session history on profile | LOW | LOW | P3 |
| Rich review filtering | LOW | MEDIUM | P3 |
| Push notification preferences | LOW | MEDIUM | P3 |

---

## Competitor Feature Analysis

| Feature | Foil Mates | KiteSpot | Surfr | Updock approach |
|---------|------------|----------|-------|-----------------|
| Spot ratings | Yes — visible on spot | Yes — community rating | Yes — spot reviews | Yes — 1-5 stars + comment |
| User profiles | Yes — session history, stats | Minimal (points system) | Yes — performance stats focus | Minimal: name, avatar, submissions. No performance tracking. |
| Session scheduling ("I'll be there") | Yes — with push notification | No | No | Yes — core differentiator in pumpfoil niche |
| "Who's riding now" live view | Yes — home dashboard | No | Partial (GPS live share) | Deferred — requires constant location sharing, privacy concern |
| Community chat | Yes — spot chat + groups | No | Yes (social feed) | Anti-feature — explicitly out of scope |
| Spot discovery map | Yes | Yes (8000+ spots) | Yes | Yes — existing, our strongest feature |
| Push notifications | Yes | No | Partial (safety GPS share) | Yes — sessions at favorited spots |
| Gamification / points | No | Yes | Yes (Stokes) | Anti-feature — distorts quality |
| Offline support | Unknown | No | No | Yes — existing feature, maintain it |

**Key competitive insight:** Foil Mates is the direct competitor and has nearly identical features in this milestone. Updock's advantages are (1) pumpfoil-specific spot taxonomy (Dockstart, Rockstart, Dropstart, etc.), (2) existing admin-validated spot quality, and (3) no chat scope creep. The risk is that Foil Mates already exists — Updock must execute these features with noticeably better UX, not just feature parity.

---

## Implementation Notes for Roadmap

### Profile: Low risk, build first
Standard Supabase pattern: `profiles` table in public schema with `id` (FK to `auth.users`), `display_name`, `avatar_url`. Supabase trigger auto-creates profile row on signup. Avatar upload to dedicated Storage bucket with RLS per user ID. Estimated: 1-2 days.

### Reviews: Low risk, build second
New `spot_reviews` table: `id`, `spot_id`, `user_id`, `rating` (1-5), `comment` (text, nullable), `created_at`. UNIQUE constraint on `(spot_id, user_id)`. Aggregate via SQL `avg()`. Needs translation strings for FR/EN. Estimated: 1-2 days.

### Sessions: Medium risk, build third
New tables: `sessions` (`id`, `spot_id`, `organizer_id`, `scheduled_at`, `note`, `created_at`) and `session_participants` (`session_id`, `user_id`, `joined_at`). Sessions are shown in SpotDetail (new section). Profile tab shows user's upcoming sessions. Needs date/time picker (no existing component in app). Estimated: 2-3 days.

### Push Notifications: High risk, build last and isolate
Requires: (1) Firebase project creation, (2) Apple Developer push capability + APNs .p8 key, (3) `@capacitor-firebase/messaging` plugin replacing any existing notification plugin, (4) FCM token storage per user in Supabase, (5) Supabase Edge Function triggered on `sessions` INSERT. Cannot be tested on iOS Simulator — physical device mandatory. Recommendation: treat as its own sub-phase with a clear go/no-go gate. If Apple Developer setup is not complete, ship sessions as pull-only first. Estimated: 3-4 days including platform setup.

---

## Sources

- [Foil Mates — direct pumpfoil competitor](https://foilmates.com) — spot ratings, session scheduling with push, "who's riding", community chat (out of scope for us)
- [Foiling Magazine — Foil Mates feature profile](https://www.thefoilingmagazine.com/features/flightpath-foil-mates)
- [KiteSpot — community rating + spot reviews](https://kitespotapp.com/)
- [Surfr — kite/wing/windsurf community app](https://www.thesurfr.app/)
- [Supabase push notifications guide](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Capacitor push notifications complete guide — DEV Community, Jan 2026](https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4)
- [Supabase user management with React tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-react)

---

*Feature research for: Updock — pumpfoil community app (profiles + reviews + sessions milestone)*
*Researched: 2026-03-18*
