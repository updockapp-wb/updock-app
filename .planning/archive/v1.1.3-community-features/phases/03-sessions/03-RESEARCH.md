# Phase 3: Sessions - Research

**Researched:** 2026-03-21
**Domain:** React + Supabase scheduled sessions with join/leave, date/time input, profile context
**Confidence:** HIGH

---

## Summary

The database schema for sessions is already fully deployed from Phase 1. The `sessions` table (id, spot_id, creator_id, starts_at, note, is_cancelled) and `session_attendees` table (session_id, user_id, joined_at) exist with correct RLS policies. No database migration is needed for Phase 3 — only frontend work.

The architectural pattern from Phase 2 (Reviews) maps directly: a context provider manages session state, a SessionForm component handles creation, a SessionList displays upcoming sessions, and SpotDetail gets a Sessions tab. The Profile screen also needs a new section listing the user's own upcoming sessions. The main open question from STATE.md was the date/time picker strategy — this research recommends using HTML `<input type="datetime-local">` without any additional library, as it works natively on iOS (Safari) and Android and requires zero dependencies.

**Primary recommendation:** Mirror the Phase 2 reviews pattern exactly. No new dependencies needed. Use `<input type="datetime-local">` for date/time. Manage sessions client-side with optimistic updates for participant count.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SESS-01 | L'utilisateur peut annoncer une session sur un spot (date + heure + message optionnel) | SessionForm component + Supabase insert into `sessions` table |
| SESS-02 | Les sessions à venir sont visibles dans la fiche détail du spot | SessionList component + Sessions tab in SpotDetail (mirrors Reviews tab pattern) |
| SESS-03 | L'utilisateur peut rejoindre une session annoncée par quelqu'un d'autre | Join button → insert into `session_attendees`; leave → delete from `session_attendees` |
| SESS-04 | L'utilisateur peut annuler sa propre session ou son inscription à une session | Cancel own session → update `sessions.is_cancelled = true`; leave → delete from `session_attendees`; participant count updates optimistically |
</phase_requirements>

---

## Standard Stack

### Core (all already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.87.2 | DB queries for sessions and attendees | Already in project, same pattern as reviews |
| react | ^19.2.0 | Component tree, context | Already in project |
| framer-motion | ^12.23.25 | Card entrance animations | Already used in ReviewList |
| lucide-react | ^0.556.0 | Icons (Calendar, Users, Clock) | Already in project |
| tailwindcss | ^4.1.17 | Styling | Already in project |

### Native Date/Time Input
No new library needed. Use `<input type="datetime-local">` — supported natively by iOS Safari and Android WebView (which Capacitor uses). It renders the native OS date/time picker on mobile, which is the best possible UX and has zero dependency cost.

**Constraint from STATE.md:** "No native date/time picker in codebase. Evaluate options during Phase 3 planning (HTML `<input type="datetime-local">` vs Capacitor date picker plugin)." — Resolution: HTML input is the right choice. The `@capacitor-community/date-picker` plugin exists but requires native build steps and introduces iOS/Android divergence. HTML `<input type="datetime-local">` works in Capacitor WebView without any native code.

### No New Installs Required
```bash
# Nothing to install — all dependencies already present
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── context/
│   └── SessionsContext.tsx       # new — mirrors ProfileContext pattern
├── components/
│   ├── SessionForm.tsx           # new — mirrors ReviewForm pattern
│   ├── SessionCard.tsx           # new — single session display
│   └── SessionList.tsx           # new — mirrors ReviewList pattern
│
# Modified files:
│   ├── SpotDetail.tsx            # add 'sessions' tab (third tab after info/reviews)
│   └── Profile.tsx               # add upcoming sessions section
└── translations/
    ├── fr.json                   # add session.* keys
    └── en.json                   # add session.* keys
```

### Pattern 1: SessionsContext (mirrors ProfileContext)
**What:** React context that holds session state, exposes createSession, joinSession, leaveSession, cancelSession.
**When to use:** Keeps session logic out of components, allows Profile screen and SpotDetail to share the same data without prop drilling.
**Example:**
```typescript
// mirrors src/context/ProfileContext.tsx pattern
interface SessionsContextType {
  // Called by SpotDetail when spot changes
  fetchSessionsForSpot: (spotId: string) => Promise<void>;
  sessions: Session[];
  isLoadingSessions: boolean;
  createSession: (spotId: string, startsAt: string, note?: string) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  // For profile screen
  userUpcomingSessions: Session[];
  fetchUserSessions: () => Promise<void>;
}
```

**Alternative (no context):** Load sessions directly in SpotDetail like reviews are loaded currently. This is simpler if Profile only needs a separate query. Given that Profile needs its own sessions list, a shared context avoids double-implementing the fetch+profile join logic.

### Pattern 2: Session Data Shape
**What:** The `Session` interface the frontend works with, after joining profile data.
**Example:**
```typescript
export interface Session {
  id: string;
  spot_id: string;
  creator_id: string;
  starts_at: string;          // ISO timestamp
  note: string | null;
  is_cancelled: boolean;
  created_at: string;
  // joined via separate profiles fetch (same pattern as reviews)
  creator_profile: {
    display_name: string | null;
    avatar_url: string | null;
    avatar_id: number | null;
  } | null;
  // attendees joined inline
  attendee_count: number;     // computed from session_attendees
  user_is_attending: boolean; // computed: attendees includes current user.id
}
```

### Pattern 3: Fetching Sessions with Attendee Count
**What:** Sessions require joining attendee count from `session_attendees`. Supabase supports this via embedded select.
**Example:**
```typescript
// Source: Supabase docs — embedded resource count
const { data, error } = await supabase
  .from('sessions')
  .select(`
    *,
    session_attendees(user_id)
  `)
  .eq('spot_id', spotId)
  .eq('is_cancelled', false)
  .gte('starts_at', new Date().toISOString())
  .order('starts_at', { ascending: true });
```
Then compute `attendee_count = row.session_attendees.length` and `user_is_attending = row.session_attendees.some(a => a.user_id === user.id)` client-side. This avoids a COUNT subquery and gives the user_id list needed to determine join state.

### Pattern 4: Optimistic Participant Count Update
**What:** When joining/leaving, update local state immediately before the DB call confirms.
**When to use:** Same approach as reviews avg rating — update state in handler, no refetch.
**Example:**
```typescript
const joinSession = async (sessionId: string) => {
  if (!user) return;
  // Optimistic update
  setSessions(prev => prev.map(s =>
    s.id === sessionId
      ? { ...s, attendee_count: s.attendee_count + 1, user_is_attending: true }
      : s
  ));
  const { error } = await supabase
    .from('session_attendees')
    .insert({ session_id: sessionId, user_id: user.id });
  if (error) {
    // Rollback
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, attendee_count: s.attendee_count - 1, user_is_attending: false }
        : s
    ));
  }
};
```

### Pattern 5: Session Tab in SpotDetail
**What:** Add a third tab `'sessions'` to the existing `activeTab` union type in SpotDetail.
**Current type:** `useState<'info' | 'reviews'>('info')` — extend to `'info' | 'reviews' | 'sessions'`.
**Tab button pattern:** Copy the reviews tab button, use Calendar icon from lucide-react.
**Reset on spot change:** The existing `useEffect` that resets `activeTab` to `'info'` when `spot` changes already handles this — no change needed to that effect.

### Pattern 6: datetime-local Input Formatting
**What:** `<input type="datetime-local">` expects value in `YYYY-MM-DDTHH:MM` format. Supabase `starts_at` is stored as ISO timestamptz. Need conversion.
**Example:**
```typescript
// Convert local datetime-local value to ISO for Supabase
const toISO = (localValue: string) => new Date(localValue).toISOString();

// Convert ISO back to datetime-local value (for display/edit)
const toLocalInput = (isoString: string) => {
  const d = new Date(isoString);
  // pad to YYYY-MM-DDTHH:MM
  return d.toISOString().slice(0, 16);
};

// Set min to now (prevent past sessions)
const minDateTime = new Date().toISOString().slice(0, 16);
```

### Anti-Patterns to Avoid
- **Storing datetime-local string directly in DB:** Always convert to ISO before inserting. `datetime-local` gives a local-time string without timezone. `new Date(localValue).toISOString()` is the correct conversion.
- **Fetching profile separately per session in a loop:** Use the same pattern as reviews — collect all creator_ids, fetch profiles in a single `IN` query, build a map.
- **Adding a separate "Upcoming Sessions" tab to Profile from scratch:** Profile.tsx already has a stats grid and settings list. Add a `<UpcomingSessions />` section below the stats grid — no new tab needed in Profile since Profile has no tab navigation.
- **Using Supabase realtime subscriptions:** Not needed for this phase. Pull-on-load is sufficient and avoids subscription complexity. Realtime is Phase 4 territory.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Attendee count | Custom SQL COUNT subquery | Embedded select `session_attendees(user_id)` + `.length` | Supabase embedded relations handle this; simpler than aggregate |
| Date/time picker | Custom calendar UI | `<input type="datetime-local">` | Native OS picker on mobile is better UX; zero dependency |
| "Is user attending?" check | Separate DB query per session | Include `session_attendees(user_id)` in main fetch | One query instead of N+1 |
| Avatar resolution | Duplicate AVATARS array | Extract shared `resolveAvatarSrc(profile)` util | ReviewList already has this pattern; extract to `src/utils/avatar.ts` |

**Key insight:** The codebase already has the review pattern which is structurally identical to sessions. Copy the pattern, don't re-invent it.

---

## Common Pitfalls

### Pitfall 1: datetime-local Timezone Trap
**What goes wrong:** `<input type="datetime-local">` returns a string like `2026-04-10T14:30` with no timezone info. If stored directly, the time is ambiguous.
**Why it happens:** The browser uses local time; Supabase stores UTC.
**How to avoid:** Always wrap in `new Date(value).toISOString()` before inserting. When displaying, use `toLocaleString()` or `toLocaleDateString()`/`toLocaleTimeString()` so the user sees their local time.
**Warning signs:** Sessions appearing an hour off after DST change, or stored at unexpected UTC time.

### Pitfall 2: Stale Sessions on Spot Change
**What goes wrong:** Opening SpotA, then SpotB, still seeing SpotA's sessions briefly.
**Why it happens:** Async fetch from SpotA resolves after SpotB opens.
**How to avoid:** Mirror the reviews pattern in SpotDetail — reset sessions state synchronously on `spot.id` change before the async fetch fires. The existing review reset pattern in SpotDetail lines 57-97 is the exact model.

### Pitfall 3: Creator Cancelling vs Attendee Leaving
**What goes wrong:** Both "cancel session" (creator action) and "leave session" (attendee action) look like they could use DELETE, but they're different operations.
**Why it happens:** Conflating the two paths.
**How to avoid:**
- Creator cancel: `UPDATE sessions SET is_cancelled = true WHERE id = ? AND creator_id = user.id` — session remains in DB for audit/notification history.
- Attendee leave: `DELETE FROM session_attendees WHERE session_id = ? AND user_id = user.id` — removes the row.
- The RLS policies confirm this: sessions UPDATE is allowed only for `creator_id`; session_attendees DELETE is allowed only for `user_id`.

### Pitfall 4: Profile Join N+1
**What goes wrong:** Fetching creator profile in a loop per session.
**Why it happens:** Naive implementation after getting sessions array.
**How to avoid:** Collect all `creator_id` values, single `supabase.from('profiles').select(...).in('id', creatorIds)`, build a map. Same technique as lines 77-82 in SpotDetail.tsx for reviews.

### Pitfall 5: Past Sessions Showing
**What goes wrong:** Sessions from yesterday appearing in "upcoming" list.
**Why it happens:** Forgetting the `.gte('starts_at', new Date().toISOString())` filter.
**How to avoid:** Always filter `starts_at >= now()` in the upcoming sessions query. For Profile screen sessions, apply the same filter.

### Pitfall 6: Creator Already Counted as Attendee
**What goes wrong:** Creator shows up as +1 in attendee count but isn't in `session_attendees`.
**Why it happens:** The sessions table only tracks attendees who explicitly joined — the creator is not auto-inserted into `session_attendees`.
**How to avoid:** Either: (a) Insert creator into `session_attendees` at creation time (recommended — makes count consistent), or (b) always add +1 to the count display to account for the creator. Option (a) is cleaner because it also makes "leave" work symmetrically for the creator before they need to cancel.

---

## Code Examples

### Create a Session
```typescript
// Source: Supabase JS docs — insert
const { data, error } = await supabase
  .from('sessions')
  .insert({
    spot_id: spotId,
    creator_id: user.id,
    starts_at: new Date(dateTimeLocalValue).toISOString(),
    note: note.trim() || null,
  })
  .select('*')
  .single();
```

### Cancel Own Session
```typescript
// Source: Supabase JS docs — update with filter
const { error } = await supabase
  .from('sessions')
  .update({ is_cancelled: true })
  .eq('id', sessionId)
  .eq('creator_id', user.id); // RLS enforces this but explicit is clearer
```

### Join a Session
```typescript
// Source: Supabase JS docs — insert with upsert to handle double-click
const { error } = await supabase
  .from('session_attendees')
  .upsert(
    { session_id: sessionId, user_id: user.id },
    { onConflict: 'session_id,user_id' }
  );
```

### Leave a Session
```typescript
const { error } = await supabase
  .from('session_attendees')
  .delete()
  .eq('session_id', sessionId)
  .eq('user_id', user.id);
```

### Fetch Upcoming Sessions with Attendees
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select('*, session_attendees(user_id)')
  .eq('spot_id', spotId)
  .eq('is_cancelled', false)
  .gte('starts_at', new Date().toISOString())
  .order('starts_at', { ascending: true });
```

### Avatar Util (extract from ReviewList)
```typescript
// src/utils/avatar.ts
const AVATARS = [
  { id: 1, src: '/src/assets/avatars/avatar1.svg' },
  // ...
];
export function resolveAvatarSrc(profile: { avatar_url?: string | null; avatar_id?: number | null } | null): string {
  return profile?.avatar_url
    || AVATARS.find(a => a.id === (profile?.avatar_id ?? 1))?.src
    || AVATARS[0].src;
}
```

---

## Translation Keys to Add

Both `fr.json` and `en.json` need the following new keys (following the `review.*` naming convention):

```json
"session.tab": "Sessions",
"session.upcoming": "Sessions à venir",
"session.no_sessions": "Aucune session prévue. Soyez le premier !",
"session.create": "Annoncer une session",
"session.date_label": "Date et heure",
"session.note_placeholder": "Message optionnel (conditions, point de rdv...)",
"session.submit": "Annoncer",
"session.join": "Rejoindre",
"session.leave": "Se désinscrire",
"session.cancel": "Annuler la session",
"session.participants": "participants",
"session.created_by": "par",
"session.your_session": "Votre session",
"session.past_date_error": "La date doit être dans le futur"
```

English equivalents follow the same keys.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Capacitor date picker plugin | `<input type="datetime-local">` | Zero dependency, native OS picker on mobile |
| Supabase realtime for count updates | Optimistic local state update | Sufficient for Phase 3; no subscription complexity |
| Separate COUNT query | Embedded select + `.length` | Single round trip |

---

## Open Questions

1. **Creator auto-inserted into session_attendees?**
   - What we know: The DB schema does not auto-insert the creator.
   - What's unclear: Whether the participant count displayed should include the creator.
   - Recommendation: Insert creator into `session_attendees` at session creation time. Keeps count consistent and makes "leave before cancel" work naturally.

2. **Session time display: relative ("in 2 hours") vs absolute ("15 Apr, 14:30")?**
   - What we know: No date formatting utility exists in the codebase currently.
   - Recommendation: Use `toLocaleDateString()` + `toLocaleTimeString()` for absolute display. No library needed. Relative time (e.g., "in 2h") is a nice-to-have but not required by SESS-02 spec.

3. **Profile screen sessions: full SessionCard or compact list?**
   - Recommendation: Compact list (date, spot name, participant count). The SessionCard with full details belongs in SpotDetail. Profile needs a lightweight summary.
   - Note: Profile does not currently know spot names for the sessions it lists. Either (a) join `spots` table in the profile query, or (b) display spot_id with a name lookup. Option (a) is cleaner — add `.select('*, spots(name)')` to the profile sessions query.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected in codebase |
| Config file | None — no jest.config, vitest.config, or pytest.ini found |
| Quick run command | `npm run build` (TypeScript compile as proxy test) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-01 | Session created, appears in DB | manual-only | — | N/A |
| SESS-02 | Sessions tab shows upcoming sessions | manual-only | — | N/A |
| SESS-03 | Join increments count; leave decrements | manual-only | — | N/A |
| SESS-04 | Cancel removes session; leave removes attendee | manual-only | — | N/A |

**Manual-only justification:** The project has no test framework configured. All behavioral tests require a live Supabase connection and UI interaction. Build + lint serve as the automated gate.

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Build clean + lint clean + manual smoke test of all 4 requirements before `/gsd:verify-work`

### Wave 0 Gaps
- None for test infrastructure (no framework to set up). Manual verification checklist covers all requirements.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/components/SpotDetail.tsx`, `ReviewForm.tsx`, `ReviewList.tsx`, `Profile.tsx`, `context/ProfileContext.tsx`
- `supabase/migrations/001_community_schema.sql` — sessions and session_attendees table definitions, RLS policies
- `package.json` — exact installed versions
- `.planning/STATE.md` — date picker decision context

### Secondary (MEDIUM confidence)
- Supabase JS v2 embedded relations pattern (`.select('*, related_table(col)')`) — consistent with existing code patterns in codebase
- HTML `<input type="datetime-local">` browser support — supported on iOS Safari 14.1+, Android Chrome — current standard for Capacitor apps

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in project, confirmed via package.json
- Architecture: HIGH — mirrors directly from Phase 2 code that is working in production
- DB schema: HIGH — read directly from migration file
- Pitfalls: HIGH — derived from reading existing code patterns and known datetime-local gotchas
- Date/time picker decision: HIGH — STATE.md flagged this; HTML input recommended based on zero-dependency advantage

**Research date:** 2026-03-21
**Valid until:** 2026-06-01 (stable stack, no fast-moving dependencies)
