# Architecture Research

**Domain:** Mobile community app — spot discovery + user-generated content (reviews, sessions, notifications)
**Researched:** 2026-03-18
**Confidence:** HIGH (existing codebase fully mapped; new feature patterns verified against official Supabase docs)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Capacitor Shell (iOS / Android)              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    React Application                        │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │  Map tab │  │Favorites │  │List tab  │  │Profile   │  │  │
│  │  │  Map.tsx │  │tab       │  │(fix + new│  │tab       │  │  │
│  │  │          │  │          │  │proximity)│  │(new)     │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │  │
│  │       │             │             │             │         │  │
│  │  ┌────┴─────────────┴─────────────┴─────────────┴──────┐  │  │
│  │  │               Context Layer                          │  │  │
│  │  │  AuthContext  SpotsContext  FavoritesContext          │  │  │
│  │  │  ProfileContext (NEW)  SessionsContext (NEW)          │  │  │
│  │  └────────────────────────┬─────────────────────────────┘  │  │
│  │                           │                                 │  │
│  │  ┌────────────────────────┴─────────────────────────────┐  │  │
│  │  │               Integration Layer (src/lib/)            │  │  │
│  │  │  supabase.ts   notifications.ts (NEW)                 │  │  │
│  │  └────────────────────────┬─────────────────────────────┘  │  │
│  └───────────────────────────┼─────────────────────────────────┘  │
│                              │ Capacitor plugins                   │
│                 @capacitor-firebase/messaging (NEW)                │
└──────────────────────────────┼──────────────────────────────────── ┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼──────┐    ┌────────▼───────┐   ┌────────▼───────┐
    │  Supabase  │    │  Supabase      │   │  Firebase FCM  │
    │  PostgreSQL│    │  Edge Functions│   │  (push only)   │
    │  + RLS     │    │  (push webhook)│   └────────────────┘
    └────────────┘    └────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New or Existing |
|-----------|----------------|-----------------|
| `AuthContext` | Session management, user identity | Existing — no changes needed |
| `SpotsContext` | Spot data, nearby sort, spot CRUD | Existing — minor: expose `spotId` to review/session consumers |
| `ProfileContext` (new) | Current user profile, avatar, submission history | New |
| `SessionsContext` (new) | Scheduled sessions CRUD, join/leave, attendee list | New |
| `Profile.tsx` | Profile view — avatar, display name, spot history | Existing shell, needs full implementation |
| `SpotDetail.tsx` | Spot detail drawer — add reviews tab, sessions tab | Existing — extend with two new sub-sections |
| `ReviewForm.tsx` (new) | Star rating + comment form | New |
| `SessionCard.tsx` (new) | Displays a single scheduled session with join CTA | New |
| `SessionForm.tsx` (new) | Create/edit session form (date, time, note) | New |
| `notifications.ts` (new) | FCM token registration, permission request | New — `src/lib/notifications.ts` |
| Supabase Edge Function | Receives DB webhook, sends FCM push | New — `supabase/functions/push/` |

---

## Supabase Schema

### New Tables

#### `profiles`

Linked 1-to-1 with `auth.users`. Created automatically via trigger on signup.

```sql
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

RLS policies:
- SELECT: anyone authenticated can read any profile (public directory)
- UPDATE: user can only update their own row (`auth.uid() = id`)
- INSERT: blocked — handled by trigger only
- DELETE: blocked — cascade from auth.users deletion

#### `reviews`

One review per user per spot. Star rating + optional comment.

```sql
CREATE TABLE public.reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id    UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (spot_id, user_id)  -- one review per user per spot
);

CREATE INDEX reviews_spot_id_idx ON public.reviews(spot_id);
CREATE INDEX reviews_user_id_idx ON public.reviews(user_id);
```

RLS policies:
- SELECT: anyone authenticated can read reviews
- INSERT: authenticated user, `user_id = auth.uid()`
- UPDATE: own review only (`user_id = auth.uid()`)
- DELETE: own review only (`user_id = auth.uid()`)

Aggregation view (avoids N+1 reads in SpotDetail):

```sql
CREATE VIEW public.spot_ratings AS
SELECT
  spot_id,
  COUNT(*)              AS review_count,
  ROUND(AVG(rating), 1) AS avg_rating
FROM public.reviews
GROUP BY spot_id;
```

#### `sessions`

A session is one user announcing they will be at a spot at a given time.

```sql
CREATE TABLE public.sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id     UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at   TIMESTAMPTZ NOT NULL,
  note        TEXT CHECK (char_length(note) <= 500),
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX sessions_spot_id_idx ON public.sessions(spot_id);
CREATE INDEX sessions_starts_at_idx ON public.sessions(starts_at);
```

RLS policies:
- SELECT: anyone authenticated can read non-cancelled sessions
- INSERT: authenticated user, `creator_id = auth.uid()`
- UPDATE: own session only (cancel flag)
- DELETE: own session only

#### `session_attendees`

Junction table — who has joined a session.

```sql
CREATE TABLE public.session_attendees (
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);
```

RLS policies:
- SELECT: anyone authenticated
- INSERT: authenticated user, `user_id = auth.uid()`
- DELETE: own row only

#### `push_tokens`

Stores FCM device tokens per user. A user may have multiple devices.

```sql
CREATE TABLE public.push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);
```

RLS policies:
- SELECT/INSERT/DELETE: own rows only (`user_id = auth.uid()`)

#### `notifications`

Inbox record + DB webhook trigger for push dispatch.

```sql
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,  -- 'session_new', 'session_joined', 'session_reminder'
  payload    JSONB NOT NULL DEFAULT '{}',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
```

DB webhook on INSERT fires Supabase Edge Function `push` which reads `push_tokens` and calls FCM.

### Schema Dependency Order

```
auth.users (Supabase managed)
    └── profiles           (trigger on signup)
    └── push_tokens        (user device registration)
    └── notifications      (push dispatch)
    └── reviews            (depends on spots + users)
    └── sessions           (depends on spots + users)
        └── session_attendees
```

---

## React/Capacitor Component Structure

### New Files to Create

```
src/
├── context/
│   ├── ProfileContext.tsx      # Profile fetch, update, submission history
│   └── SessionsContext.tsx     # Sessions CRUD, join/leave, attendees
├── components/
│   ├── ReviewForm.tsx          # Star picker + comment input
│   ├── ReviewList.tsx          # Flat list of reviews for a spot
│   ├── SessionCard.tsx         # Single session row (time, creator, attendees, join btn)
│   ├── SessionForm.tsx         # Create session modal (date/time picker + note)
│   └── SessionList.tsx         # Sessions on a given spot, sorted by starts_at
└── lib/
    └── notifications.ts        # FCM token registration + permission flow
```

### Existing Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap with `ProfileProvider`, `SessionsProvider`; add notification init on login |
| `src/components/SpotDetail.tsx` | Add "Reviews" and "Sessions" tabs inside the drawer |
| `src/components/Profile.tsx` | Implement fully: avatar, display_name, spot submission history via `useProfile()` |
| `src/components/AddSpotForm.tsx` | Remove "hauteur" field; fix memory leak (revoke object URLs on cleanup) |
| `src/context/AuthContext.tsx` | On login: call `notifications.ts` to register FCM token |

### SpotDetail Extended Layout

SpotDetail currently shows spot info in a Vaul drawer. The extension adds a tab bar inside the drawer:

```
┌─────────────────────────────────┐
│  [Spot name]  [Type badge]       │
│  [Photos carousel]               │
│  ─────────────────────────────  │
│  [ Info ] [ Reviews ] [ Sessions]│  ← new tab bar
│  ─────────────────────────────  │
│  [Tab content area]              │
└─────────────────────────────────┘
```

- "Info" tab: existing content (description, coordinates, favorites)
- "Reviews" tab: `ReviewList` + "Write a review" button → `ReviewForm` inline or as sub-modal
- "Sessions" tab: `SessionList` + "Add a session" button → `SessionForm` modal

---

## Data Flow

### Review Creation Flow

```
User taps "Write a review" in SpotDetail
    → ReviewForm renders inline (star picker + textarea)
    → onSubmit: supabase.from('reviews').upsert({ spot_id, user_id, rating, comment })
    → optimistic update: local reviews state updated immediately
    → spot_ratings view re-queried to refresh avg_rating badge
    → on error: revert optimistic update, show toast
```

### Session Creation + Notification Flow

```
User creates session via SessionForm
    → INSERT into sessions table
    → Supabase DB webhook fires → Edge Function `push`
    → Edge Function queries push_tokens for users who favorited the spot
    → FCM sends push notification to each device token
    → INSERT into notifications table (inbox record)
    → Attending users see SessionCard appear in SpotDetail Sessions tab
        (via Supabase Realtime subscription on sessions table)
```

### Push Token Registration Flow

```
User logs in (AuthContext.onAuthStateChange SIGNED_IN)
    → notifications.ts: FirebaseMessaging.requestPermissions()
    → FirebaseMessaging.getToken() → FCM token
    → supabase.from('push_tokens').upsert({ user_id, token, platform })
    → token stored for future notification dispatch
```

### Profile Load Flow

```
App mounts with authenticated user
    → ProfileContext mounts: supabase.from('profiles').select().eq('id', uid)
    → if no row: insert default row (display_name = null, avatar = null)
    → Profile.tsx reads useProfile() — shows display_name or email fallback
    → User can edit display_name / avatar → UPDATE profiles SET ...
    → Spot submission history: supabase.from('spots').select().eq('created_by', uid)
```

### State Management Addition

The two new contexts follow the same pattern as `FavoritesContext`:

```
ProfileContext
    └── state: { profile, isLoading, error }
    └── actions: updateProfile(partial), refetch()
    └── hook: useProfile()

SessionsContext
    └── state: { sessions, attendees, isLoading }
    └── actions: createSession(data), joinSession(id), leaveSession(id), cancelSession(id)
    └── hook: useSessions()
    └── Realtime: subscribes to sessions INSERT/UPDATE filtered by spot_id
```

---

## Build Order (Phase Dependencies)

The recommended order follows a strict dependency chain — each phase unlocks the next.

### Phase 1: Database Foundation

Create all Supabase tables + RLS policies + signup trigger.
No frontend yet. Validate with Supabase dashboard.

Deliverables:
- `profiles` table + trigger
- `reviews` table + `spot_ratings` view
- `sessions` + `session_attendees` tables
- `push_tokens` + `notifications` tables
- All RLS policies
- SQL migration files committed to `supabase/migrations/`

Why first: Every frontend feature depends on this. Getting schema wrong means re-migrating. Build it before touching React.

### Phase 2: User Profiles

`ProfileContext` + `Profile.tsx` full implementation.

Deliverables:
- `ProfileContext.tsx` with fetch/update
- `Profile.tsx` — display_name, avatar upload to Supabase Storage, spot history list
- `App.tsx` — wrap with `ProfileProvider`

Why second: Profiles are consumed by reviews (author display name/avatar) and sessions (creator info). Build profiles before those surfaces.

### Phase 3: Reviews and Ratings

`ReviewForm`, `ReviewList`, `spot_ratings` badge in `SpotDetail`.

Deliverables:
- `ReviewForm.tsx` — star picker, comment field, submit
- `ReviewList.tsx` — list with author avatar (from profiles), date, rating
- `SpotDetail.tsx` — tab bar + Reviews tab
- Average rating badge visible on SpotDetail header

Why third: Reviews have no dependency on sessions. Isolated, lower risk. Validates the SpotDetail tab extension pattern before sessions add complexity.

### Phase 4: Fix Spot List Tab

Fix the existing bug in List tab (spot proximity sort broken). This is lower-risk than sessions and provides immediate value.

Deliverables:
- Diagnose `SpotsContext` / List component bug (tab not rendering)
- Fix proximity sort display
- Add simplified spot submission form (remove "hauteur" field, fix image memory leak)

Why fourth: Fixes existing debt before adding the most complex new feature (sessions). Cleans up the spot creation form that sessions will link to.

### Phase 5: Sessions

`SessionsContext`, `SessionForm`, `SessionCard`, `SessionList`, Realtime subscription, Sessions tab in `SpotDetail`.

Deliverables:
- `SessionsContext.tsx` — CRUD + Realtime subscription
- `SessionForm.tsx` — date/time picker, note
- `SessionCard.tsx` — creator profile, time, attendee count, join/leave button
- `SessionList.tsx` — sorted by starts_at
- `SpotDetail.tsx` — Sessions tab added

Why fifth: Most complex feature. Depends on profiles (creator display), spots (context), and is a prerequisite for notifications.

### Phase 6: Push Notifications

FCM integration, Edge Function, notification dispatch on session creation.

Deliverables:
- Firebase project setup (iOS + Android)
- `src/lib/notifications.ts` — token registration
- `supabase/functions/push/index.ts` — Edge Function
- DB webhook configured on `notifications` INSERT
- AuthContext triggers token registration on login
- In-app notification badge (optional — read `notifications` table)

Why last: Depends on sessions being stable. FCM setup is platform-specific and requires physical devices for testing. Isolated — can be built/tested without breaking prior phases.

---

## Integration Points with Existing Code

| Existing Code | Integration Point | Change Needed |
|---------------|-------------------|---------------|
| `AuthContext.tsx` | After SIGNED_IN event, call token registration | Add one `useEffect` call to `notifications.ts` |
| `SpotsContext.tsx` | `spots` table needs a `created_by` column for profile history | Verify column exists; add if missing |
| `SpotDetail.tsx` | Drawer extended with tab bar | Wrap existing content in "Info" tab, add Reviews + Sessions tabs |
| `Profile.tsx` | Currently a placeholder component | Full implementation using `useProfile()` |
| `App.tsx` | Provider wrapping order | Add `ProfileProvider` and `SessionsProvider` inside existing provider tree |
| `FavoritesContext.tsx` | Session notifications target users who favorited a spot | Edge Function queries `favorites` table — no frontend change needed |

### Provider Tree Order (App.tsx)

```tsx
<LanguageProvider>
  <AuthProvider>
    <SpotsProvider>
      <FavoritesProvider>
        <ProfileProvider>        {/* new */}
          <SessionsProvider>    {/* new */}
            <AppContent />
          </SessionsProvider>
        </ProfileProvider>
      </FavoritesProvider>
    </SpotsProvider>
  </AuthProvider>
</LanguageProvider>
```

`ProfileProvider` must be inside `AuthProvider` (needs `useAuth()` for uid).
`SessionsProvider` must be inside both `SpotsProvider` (needs spot context) and `ProfileProvider` (needs profile for creator display).

---

## Architectural Patterns

### Pattern 1: Optimistic UI with Revert

Used by existing `FavoritesContext`. Apply to reviews and session join/leave.

**What:** Update local state before DB response. Revert on error.
**When to use:** Low-risk write operations (toggles, joins) where latency would hurt UX.
**Trade-offs:** Code complexity increases; must handle edge cases. Acceptable for mobile where network latency is visible.

```typescript
// In SessionsContext joinSession:
const prev = attendees;
setAttendees([...prev, { session_id, user_id: uid }]); // optimistic
const { error } = await supabase.from('session_attendees').insert({ session_id, user_id: uid });
if (error) {
  setAttendees(prev); // revert
  toast.error('Failed to join session');
}
```

### Pattern 2: Supabase Realtime for Sessions

Subscribe to sessions changes for the currently open spot. Do NOT subscribe globally — too much traffic.

**What:** `supabase.channel('sessions:spot_id=eq.X').on('postgres_changes', ...)` scoped to current spot.
**When to use:** When a user opens SpotDetail. Unsubscribe on drawer close.
**Trade-offs:** Adds WebSocket connection per open drawer. Acceptable since only one drawer is open at a time.

```typescript
// In SessionsContext when spotId changes:
useEffect(() => {
  if (!spotId) return;
  const channel = supabase
    .channel(`sessions:${spotId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'sessions',
      filter: `spot_id=eq.${spotId}`
    }, (payload) => { /* update local sessions */ })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [spotId]);
```

### Pattern 3: View-Based Aggregation for Ratings

Avoid computing average ratings in the frontend. Use the `spot_ratings` SQL view.

**What:** Query `spot_ratings` view when loading SpotDetail instead of fetching all reviews and computing avg.
**When to use:** Always. Never compute aggregates client-side when Postgres can do it.
**Trade-offs:** Additional DB query, but a single indexed scan vs N rows transferred.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Sessions Subscription

**What people do:** Subscribe to all sessions on app load, filter in memory.
**Why it's wrong:** Fires on every session change across all spots. Wasted bandwidth. Realtime connection overhead.
**Do this instead:** Subscribe only when SpotDetail drawer is open (`spotId` is set). Unsubscribe on close.

### Anti-Pattern 2: Fetching Reviews Inside SpotDetail Render

**What people do:** Trigger review fetch inside SpotDetail component on mount every time drawer opens.
**Why it's wrong:** Each drawer open = fresh DB query. With pagination not implemented, full table scan possible.
**Do this instead:** Cache reviews by `spot_id` in `SessionsContext` / a `ReviewsContext`. Only re-fetch if stale (older than 5 min).

### Anti-Pattern 3: Storing FCM Token in Profiles Table

**What people do:** Add `fcm_token` column directly to `profiles`.
**Why it's wrong:** A user can have multiple devices. One column = last device wins, silently dropping others.
**Do this instead:** Use separate `push_tokens` table with `(user_id, token)` unique constraint. Edge Function fans out to all tokens.

### Anti-Pattern 4: Sending Push from Frontend

**What people do:** Call FCM HTTP API directly from React with the server key.
**Why it's wrong:** Exposes FCM server key in bundled JS. Anyone can send arbitrary pushes.
**Do this instead:** Insert into `notifications` table → DB webhook → Edge Function → FCM. Server key stays in Edge Function secrets only.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 users | Current architecture sufficient. Full table scans on reviews/sessions are fast. Realtime on 1 channel per open drawer is fine. |
| 500-5k users | Add index on `reviews(spot_id)`. Monitor Edge Function cold starts. Consider debouncing Realtime updates if high write volume. |
| 5k+ users | Materialized view for `spot_ratings` with scheduled refresh. Queue push notifications through a job table instead of synchronous Edge Function. |

**First bottleneck:** Edge Function cold starts under burst load (many sessions created at once). Mitigation: edge function warmup or batched notification queue.

**Second bottleneck:** `spot_ratings` view becomes a slow query when reviews table has 100k+ rows. Mitigation: materialized view refreshed on trigger.

---

## Sources

- [Supabase Push Notifications — Official Docs](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Capacitor Firebase Messaging — Complete Guide (DEV Community)](https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4)
- [Supabase Row Level Security — Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Best Practices (Makerkit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Supabase Tables and Data — Official Docs](https://supabase.com/docs/guides/database/tables)
- [Capacitor Push Notifications API — Official Docs](https://capacitorjs.com/docs/apis/push-notifications)

---

*Architecture research for: Updock — community features (profiles, reviews, sessions, push notifications)*
*Researched: 2026-03-18*
