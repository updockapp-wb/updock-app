# Roadmap: Updock — Community Features Milestone

## Overview

Updock already delivers core spot discovery (map, auth, favorites, admin). This milestone layers three community features on top: user profiles, spot reviews, and scheduled sessions — capped by push notifications. The work proceeds in strict dependency order: fix the technical foundation first (Capacitor mismatch, broken list tab, form cleanup), establish identity (profiles), build community interaction (reviews, then sessions), and finally add push notifications as an isolatable layer that can be deferred without blocking sessions.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Fix technical debt, database schema, and user profiles (completed 2026-03-18)
- [ ] **Phase 2: Reviews** - Spot ratings and comments with author identity
- [ ] **Phase 3: Sessions** - Scheduled sessions with join/leave on spots
- [ ] **Phase 4: Push Notifications** - FCM push for session activity on favorited spots

## Phase Details

### Phase 1: Foundation
**Goal**: The app works correctly and users have an identity before any community feature is built
**Depends on**: Nothing (brownfield — existing app is the baseline)
**Requirements**: TECH-01, FIX-01, FIX-02, PROF-01, PROF-02
**Success Criteria** (what must be TRUE):
  1. The spot list tab displays spots sorted by distance from the user's GPS position
  2. The add-spot form no longer shows the "hauteur" field and the submission flow is visually clean
  3. All Capacitor native builds succeed without CLI/core version warnings
  4. A logged-in user can set a display name and upload an avatar visible on their profile
  5. All 5 new database tables (profiles, reviews, sessions, session_attendees, push_tokens) exist with correct RLS policies
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Capacitor fix + database schema (TECH-01, all tables + RLS + triggers + spot_ratings view)
- [ ] 01-02-PLAN.md — Bug fixes: spot list proximity sort + add-spot form simplification (FIX-01, FIX-02)
- [ ] 01-03-PLAN.md — User profiles: display name, avatar upload, profile screen (PROF-01, PROF-02)

### Phase 2: Reviews
**Goal**: Users can rate and comment on spots, and anyone can see the community's verdict on a spot
**Depends on**: Phase 1
**Requirements**: AVIS-01, AVIS-02, AVIS-03, AVIS-04
**Success Criteria** (what must be TRUE):
  1. A logged-in user can submit a 1-5 star rating with a written comment on any spot
  2. The spot detail sheet shows a Reviews tab with all reviews, author avatars, and average rating
  3. A user can edit or delete their own review; they cannot modify another user's review
  4. The average rating on a spot updates immediately after a review is submitted or changed
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — ReviewForm + ReviewList components, translation keys (AVIS-01, AVIS-02, AVIS-04)
- [ ] 02-02-PLAN.md — SpotDetail tab integration, reviews fetch/display, avg rating wiring (AVIS-01, AVIS-02, AVIS-03, AVIS-04)

### Phase 3: Sessions
**Goal**: Users can announce they will be at a spot at a specific time and others can join them
**Depends on**: Phase 2
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04
**Success Criteria** (what must be TRUE):
  1. A logged-in user can create a session on a spot with a date, time, and optional message
  2. The spot detail sheet shows a Sessions tab listing upcoming sessions with participant count and creator avatar
  3. A user can join an existing session and leave it; the participant count updates immediately
  4. A user can cancel their own session; session creator and participants see it removed from upcoming sessions
  5. A user's own upcoming sessions are visible on their profile screen
**Plans**: TBD

Plans:
- [ ] 03-01: Sessions feature — SessionsContext, SessionForm, SessionCard, SessionList, SpotDetail Sessions tab, join/leave, profile session list (SESS-01, SESS-02, SESS-03, SESS-04)

### Phase 4: Push Notifications
**Goal**: Users are notified of session activity on spots they care about, without being asked for permission at launch
**Depends on**: Phase 3
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03
**Success Criteria** (what must be TRUE):
  1. Push permission is requested only when a user first creates or joins a session — never at app launch
  2. A user who has favorited a spot receives a push notification when a new session is created on that spot
  3. Session participants receive a push reminder before the session start time
  4. The FCM token is stored per device in push_tokens (not overwritten if user has multiple devices)
**Plans**: TBD

Plans:
- [ ] 04-01: Firebase + Capacitor push setup — Firebase project, @capacitor-firebase/messaging, APNs config, push_tokens registration (NOTIF-01)
- [ ] 04-02: Notification dispatch — Edge Function, DB webhook on notifications table, favorite-spot trigger, session reminder with idempotency guard (NOTIF-02, NOTIF-03)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete   | 2026-03-18 |
| 2. Reviews | 1/2 | In Progress|  |
| 3. Sessions | 0/1 | Not started | - |
| 4. Push Notifications | 0/2 | Not started | - |
