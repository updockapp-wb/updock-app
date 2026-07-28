# Phase 2: Reviews - Research

**Researched:** 2026-03-21
**Domain:** Supabase reviews table + React Context pattern + SpotDetail tab UI + star rating component
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AVIS-01 | L'utilisateur authentifié peut attribuer une note (1 à 5 étoiles) à un spot | `reviews` table with `rating SMALLINT CHECK (1..5)` already in DB; star picker UI to build; ReviewsContext `submitReview()` method |
| AVIS-02 | L'utilisateur authentifié peut laisser un commentaire textuel sur un spot | Same `reviews.comment TEXT` column; ReviewForm component combines rating + comment in single submit |
| AVIS-03 | Les avis et la note moyenne sont visibles dans la fiche détail du spot | `spot_ratings` view already exists; SpotDetail needs a Reviews tab; ReviewList + average display |
| AVIS-04 | L'utilisateur peut voir et modifier son propre avis | `UNIQUE (spot_id, user_id)` enforces one review per user per spot; upsert pattern for edit; delete via RLS |
</phase_requirements>

---

## Summary

The database schema for reviews is **already in place** from Phase 1 (Plan 01-01). The `reviews` table exists with the correct columns, RLS policies (4 policies: select all, insert own, update own, delete own), indexes on `spot_id` and `user_id`, the `UNIQUE(spot_id, user_id)` constraint (one review per user per spot), and a `spot_ratings` view that computes `avg_rating` and `review_count`. No new migrations are needed.

Phase 2 is purely a **frontend build**: create a `ReviewsContext` following the established React Context pattern (identical to `FavoritesContext` and `ProfileContext`), build `ReviewForm` and `ReviewList` components, and integrate them into a new "Reviews" tab inside the existing `SpotDetail` component. The SpotDetail currently has no tabs — tabs need to be added as a UI layer over the existing scrollable content.

The key architectural decision is whether reviews live in a context (global, like favorites) or are fetched locally inside SpotDetail (per-spot, loaded on demand). Because reviews are spot-specific and SpotDetail already fetches on open, **local state within SpotDetail** (no new context provider needed) is the simpler, lower-risk approach that fits the existing pattern for per-spot data.

**Primary recommendation:** Fetch reviews inside SpotDetail when it opens (useEffect on `spot.id`), use Supabase upsert for create/edit, RLS enforces ownership automatically. No new context provider needed — this keeps App.tsx provider tree clean and avoids unnecessary global re-renders.

---

## Standard Stack

### Core (all already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.87.2 | Read/write `reviews` table and `spot_ratings` view | Already in project; Supabase client handles auth, RLS, upsert |
| React 19 + TypeScript 5.9 | existing | Component tree, local state, typing | Existing stack |
| Tailwind CSS 4 | existing | Styling all new components | Existing styling system |
| `lucide-react` | 0.556.0 | Star icons (`Star` icon for rating), `MessageSquare` for reviews tab | Already imported in other components |
| `framer-motion` | 12 | Animate review list items (stagger), tab transition | Existing animation library |

### No new dependencies required

This phase adds **zero npm packages**. The entire feature can be built with what's already installed.

**Verification:** `npm view @supabase/supabase-js version` → 2.87.2 already in package.json.

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── components/
│   ├── SpotDetail.tsx        # MODIFY: add tabs + Reviews tab rendering
│   ├── ReviewForm.tsx        # NEW: star picker + comment textarea + submit
│   └── ReviewList.tsx        # NEW: list of reviews with author info + avg
├── translations/
│   ├── en.json               # MODIFY: add review.* keys
│   └── fr.json               # MODIFY: add review.* keys (French)
```

No new context file. Reviews are fetched locally inside SpotDetail.

### Pattern 1: Local Fetch Inside SpotDetail (recommended)

**What:** When SpotDetail receives a `spot` prop (non-null), fire a `useEffect` on `spot.id` to fetch reviews for that spot. Store in local state: `reviews`, `isLoadingReviews`, `userReview` (the current user's own review if exists).

**When to use:** Data is scoped to a single entity (spot). Only needed when SpotDetail is open. Avoids polluting the global context tree.

**Example:**
```typescript
// Inside SpotDetail.tsx
const [reviews, setReviews] = useState<Review[]>([]);
const [userReview, setUserReview] = useState<Review | null>(null);
const [isLoadingReviews, setIsLoadingReviews] = useState(false);
const { user } = useAuth();

useEffect(() => {
  if (!spot) return;
  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(display_name, avatar_url, avatar_id)')
      .eq('spot_id', spot.id)
      .order('created_at', { ascending: false });
    if (data && !error) {
      setReviews(data);
      setUserReview(data.find(r => r.user_id === user?.id) ?? null);
    }
    setIsLoadingReviews(false);
  };
  fetchReviews();
}, [spot?.id, user?.id]);
```

### Pattern 2: Upsert for Create / Edit (one review per user per spot)

**What:** The `UNIQUE(spot_id, user_id)` constraint + Supabase upsert makes create and edit a single operation. No branching needed between "first review" and "edit review".

**Example:**
```typescript
// ReviewForm submit handler
const handleSubmit = async () => {
  if (!user || !spot) return;
  const { error } = await supabase
    .from('reviews')
    .upsert(
      { spot_id: spot.id, user_id: user.id, rating, comment },
      { onConflict: 'spot_id,user_id' }
    );
  if (!error) {
    // Optimistic: update local reviews state immediately
    // Re-fetch to get fresh data including profile join
  }
};
```

### Pattern 3: Delete Own Review

**What:** RLS policy `reviews_delete` allows `DELETE WHERE auth.uid() = user_id`. Simple delete by `(spot_id, user_id)`.

```typescript
const handleDeleteReview = async () => {
  if (!user || !spot) return;
  await supabase
    .from('reviews')
    .delete()
    .eq('spot_id', spot.id)
    .eq('user_id', user.id);
  // Remove from local state optimistically
};
```

### Pattern 4: Fetch avg_rating from spot_ratings view

**What:** The `spot_ratings` view (created in migration 001) aggregates `avg_rating` and `review_count` per spot. Fetch it alongside reviews or as a separate query.

```typescript
const { data: ratings } = await supabase
  .from('spot_ratings')
  .select('avg_rating, review_count')
  .eq('spot_id', spot.id)
  .single();
```

Note: `spot_ratings` is a view, not a table. The Supabase client can query it as if it were a table.

### Pattern 5: SpotDetail Tab Navigation

**What:** SpotDetail currently has no tabs. A tab bar needs to be added to the scrollable content area. Use simple local state `activeTab: 'info' | 'reviews'`.

**When to use:** SpotDetail already has a structured "scrollable content" div. Insert a `<div className="flex ...">` tab bar above the current content block, conditionally render the info content or the reviews content below.

**Framer Motion stagger for review list items** (matches existing pattern from `NearbySpotsList`):
```typescript
reviews.map((review, index) => (
  <motion.div
    key={review.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <ReviewCard review={review} />
  </motion.div>
))
```

### Anti-Patterns to Avoid

- **Don't create a ReviewsContext provider in App.tsx.** Reviews are per-spot, loaded on demand — not global state. Adding a provider globally would pre-fetch nothing but still pollute the provider tree.
- **Don't JOIN auth.users directly in client queries.** RLS on `auth.users` blocks client-side joins. Join `profiles` table instead (which has `display_name`, `avatar_url`, `avatar_id`).
- **Don't refetch all spots after a review submission.** The `spot_ratings` view can be refetched in isolation. Do not trigger SpotsContext refetch — it reloads the whole map.
- **Don't use `alert()` for review submission errors.** The codebase has a known tech debt of using `alert()` in SpotsContext. For reviews, use inline error state inside the form (`{error && <p className="text-red-500 text-sm">{error}</p>}`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| One-review-per-user enforcement | Custom "check if exists before insert" logic | `UNIQUE(spot_id, user_id)` + Supabase upsert `onConflict` | DB constraint is atomic; client-side checks have race conditions |
| Average rating calculation | Client-side `reviews.reduce()` | `spot_ratings` view (already created in DB) | DB does the math; view is always consistent; no stale averages |
| Star icon rendering | Custom SVG | `lucide-react` `Star` icon (already installed) | Already available; consistent with icon system |
| Ownership enforcement | `if (review.user_id !== user.id)` UI guards | Supabase RLS `reviews_update`, `reviews_delete` policies | RLS is the authoritative layer; UI guards are a supplement only |
| Avatar display for reviewers | Re-implement avatar logic | Reuse the avatar fallback chain from Profile.tsx | Same `profile.avatar_url → preset SVG by avatar_id → AVATARS[0]` pattern already exists |

**Key insight:** The hard parts (schema, RLS, view) are already done. This phase is almost entirely UI work on top of a complete backend.

---

## Common Pitfalls

### Pitfall 1: Joining auth.users Instead of profiles

**What goes wrong:** Developer writes `.select('*, auth.users(email)')` in a review query to get author names. Supabase client blocks this — `auth.users` is not directly accessible from the client layer.

**Why it happens:** Natural impulse to get user data from the auth table.

**How to avoid:** Always join `profiles` table: `.select('*, profiles(display_name, avatar_url, avatar_id)')`. The `profiles` table has RLS policy that allows SELECT. The `handle_new_user` trigger ensures every auth user has a corresponding profile row.

**Warning signs:** Query returns 403 or empty data for the joined user fields.

---

### Pitfall 2: Forgetting Reset on Spot Change

**What goes wrong:** User opens SpotDetail for Spot A, sees its reviews, closes it, opens Spot B — still sees Spot A's reviews briefly (stale state).

**Why it happens:** Reviews are fetched in a `useEffect([spot?.id])`, but the state isn't reset before the async fetch completes. There's a visible flash of old data.

**How to avoid:** Reset `reviews` and `userReview` to `[]` / `null` synchronously at the start of the effect, before the async call:
```typescript
useEffect(() => {
  if (!spot) return;
  setReviews([]);
  setUserReview(null);
  // then fetch...
}, [spot?.id]);
```

The same pattern is used in SpotDetail for `currentPhotoIndex` (line 34 of the existing SpotDetail).

---

### Pitfall 3: Upsert Without onConflict Crashes

**What goes wrong:** `supabase.from('reviews').upsert(data)` without specifying `onConflict` may not resolve the conflict on the `UNIQUE(spot_id, user_id)` constraint, returning a 409 error instead of updating.

**Why it happens:** Supabase upsert defaults to the PRIMARY KEY for conflict resolution. The `(spot_id, user_id)` constraint is a composite unique constraint, not the PK.

**How to avoid:** Always specify `{ onConflict: 'spot_id,user_id' }` in the upsert options.

---

### Pitfall 4: spot_ratings View Not Reflecting Update Immediately

**What goes wrong:** User submits a review, the average star count in the UI does not update. The view is queried once on open and cached in local state.

**Why it happens:** `spot_ratings` is a view computed on the fly, but the local state variable holding `avgRating` is only populated at fetch time.

**How to avoid:** After a successful upsert, either (a) re-fetch `spot_ratings` for the spot and update local `avgRating` state, or (b) compute it client-side from the updated `reviews` array. Option (b) is simpler and produces the "immediate update" behavior required by success criterion 4.

---

### Pitfall 5: iOS Safe-Area Not Applied to Review Form

**What goes wrong:** The ReviewForm (bottom sheet or inline form) has its submit button hidden behind the iPhone home indicator on notched devices.

**Why it happens:** New UI surfaces frequently miss the `pb-[env(safe-area-inset-bottom)]` padding.

**How to avoid:** Any container that touches the bottom of the screen must include `pb-[env(safe-area-inset-bottom)]` or `pb-safe`. The existing SpotDetail's Vaul drawer uses `rounded-t-[32px]` and the content div handles safe area. New review content must follow suit.

---

### Pitfall 6: RLS SELECT Policy Requires Authenticated User

**What goes wrong:** Anonymous (non-logged-in) users cannot see reviews because the SELECT policy is scoped to `authenticated` role: `CREATE POLICY "reviews_select" ON public.reviews FOR SELECT TO authenticated USING (true)`.

**Why it happens:** Phase 1 migration scoped all review policies to `authenticated`.

**How to avoid:** The app already requires login to view spots (LandingPage auth wall). This is not a bug — it is consistent with the app's design. Document it: reviews are only visible to logged-in users. No schema change needed.

---

## Code Examples

Verified patterns from existing codebase:

### Avatar Fallback Chain (from Profile.tsx — reuse in ReviewCard)
```typescript
// Source: src/components/Profile.tsx lines 57-70
const AVATARS = [
    { id: 1, src: '/src/assets/avatars/avatar1.svg', name: 'Wave Rider' },
    // ... 5 total
];
// In ReviewCard:
const avatar = AVATARS.find(a => a.id === (review.profiles?.avatar_id || 1)) || AVATARS[0];
const avatarSrc = review.profiles?.avatar_url || avatar.src;
```

### Optimistic State Update Pattern (from FavoritesContext — reuse in review actions)
```typescript
// Source: src/context/FavoritesContext.tsx lines 66-103
// 1. Update local state immediately
setReviews(prev => [...prev.filter(r => r.user_id !== user.id), newReview]);
// 2. Call Supabase
const { error } = await supabase.from('reviews').upsert(...);
// 3. Revert on error
if (error) setReviews(prevReviews);
```

### useEffect with Reset Pattern (from SpotDetail.tsx — already present)
```typescript
// Source: src/components/SpotDetail.tsx lines 29-34
useEffect(() => {
    if (spot) {
        setIsImageOpen(false);
        setCurrentPhotoIndex(0);
    }
}, [spot]);
// Adapt for reviews: reset reviews/userReview when spot.id changes
```

### Translation Key Pattern (from en.json / fr.json)
```json
// Add to src/translations/en.json:
"review.tab": "Reviews",
"review.write": "Write a review",
"review.edit": "Edit your review",
"review.delete": "Delete",
"review.submit": "Submit",
"review.placeholder": "Share your experience at this spot...",
"review.avg_rating": "Average rating",
"review.no_reviews": "No reviews yet. Be the first!",
"review.your_review": "Your Review"
```

### Star Picker — Lucide Star Icon Pattern
```typescript
// lucide-react Star supports fill prop for filled state
import { Star } from 'lucide-react';

// Filled star:
<Star size={24} className="fill-amber-400 text-amber-400" />
// Empty star:
<Star size={24} className="text-slate-300" />

// Interactive rating picker:
{[1, 2, 3, 4, 5].map(value => (
  <button key={value} onClick={() => setRating(value)}>
    <Star
      size={28}
      className={value <= rating
        ? 'fill-amber-400 text-amber-400'
        : 'text-slate-300 hover:text-amber-300'}
    />
  </button>
))}
```

---

## Database Schema (confirmed from migration 001)

The schema is already applied. No new migration needed for Phase 2.

```sql
-- Already exists (from 001_community_schema.sql):
CREATE TABLE IF NOT EXISTS public.reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id    UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (spot_id, user_id)
);

-- RLS Policies (already applied):
-- reviews_select: FOR SELECT TO authenticated USING (true)
-- reviews_insert: FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)
-- reviews_update: FOR UPDATE TO authenticated USING+WITH CHECK (auth.uid() = user_id)
-- reviews_delete: FOR DELETE TO authenticated USING (auth.uid() = user_id)

-- View (already exists):
CREATE OR REPLACE VIEW public.spot_ratings AS
SELECT spot_id,
       COUNT(*) AS review_count,
       ROUND(AVG(rating), 1) AS avg_rating
FROM public.reviews
GROUP BY spot_id;
```

**One gap to verify:** The `reviews` table has `updated_at` but no trigger to auto-update it on UPDATE. The migration does not include an `update_updated_at` trigger. For Phase 2, this is acceptable — the column exists but won't auto-update. If needed, it can be set explicitly in the upsert payload: `{ ..., updated_at: new Date().toISOString() }`.

---

## SpotDetail Integration Design

The current SpotDetail has one content block (Stats Cards, Photo Preview, Description). Phase 2 adds a "Reviews" tab. The cleanest approach:

```
SpotDetail scrollable content area:
├── Tab bar: [Info] [Reviews(n)]    ← NEW
├── Tab: Info (existing content)   ← conditionally shown
└── Tab: Reviews                   ← NEW
    ├── Average rating display
    ├── ReviewForm (if logged in)
    └── ReviewList
```

The tab bar should use the same styling language as existing badges:
```typescript
// Tab button pattern (consistent with existing badge styles):
<button
  onClick={() => setActiveTab('info')}
  className={`px-4 py-2 text-sm font-bold rounded-full transition-colors ${
    activeTab === 'info'
      ? 'bg-sky-100 text-sky-700'
      : 'text-slate-400 hover:text-slate-600'
  }`}
>
  {t('spot.tab_info')}
</button>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual INSERT + separate UPDATE | Supabase upsert with `onConflict` | Supabase v2+ | Simplifies create/edit to single operation |
| Custom star widget (SVG) | Lucide `Star` icon with `fill` prop | lucide-react v0.3+ | No additional package needed |
| Global state for per-spot data | Local component state + useEffect | Existing project pattern | Keeps provider tree clean |

**Nothing deprecated in this phase.** All patterns used are current as of the project's existing stack.

---

## Open Questions

1. **Should `updated_at` be kept current on review edits?**
   - What we know: The column exists but no DB trigger auto-updates it.
   - What's unclear: Whether the product needs to display "edited X minutes ago".
   - Recommendation: Include `updated_at: new Date().toISOString()` in the upsert payload as a no-cost improvement. No migration needed.

2. **Minimum comment length?**
   - What we know: The DB constraint only enforces a maximum of 1000 characters. The PITFALLS.md recommends requiring a 20-character minimum comment alongside any rating.
   - What's unclear: Whether the product wants to enforce this.
   - Recommendation: Add client-side validation: `comment.trim().length >= 20` before enabling the submit button. No DB change needed.

3. **Should non-authenticated users see a teaser of reviews?**
   - What we know: The RLS `reviews_select` policy requires `authenticated` role. The app already gates everything behind login.
   - What's unclear: Whether there's value in showing review count/average on the map pin or spot card for non-logged-in users.
   - Recommendation: Out of scope for Phase 2. The app auth wall handles this — all users must log in. Deferred to v2.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured (no test framework detected in project) |
| Config file | None |
| Quick run command | `npm run build && npm run lint` (TypeScript + ESLint — best available proxy) |
| Full suite command | `npm run build && npm run lint` |

No unit test framework exists in this project. Validation for this phase is via build pass + lint + manual verification on device/browser.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AVIS-01 | Star rating 1-5 submits to `reviews` table | manual | `npm run build` (TypeScript compile) | ❌ Wave 0 — no test file |
| AVIS-02 | Comment text saved alongside rating | manual | `npm run build` | ❌ Wave 0 — no test file |
| AVIS-03 | Reviews tab shows all reviews + avg | manual | `npm run build` | ❌ Wave 0 — no test file |
| AVIS-04 | User can edit/delete own review; cannot touch others | manual | `npm run build` | ❌ Wave 0 — no test file |

### Sampling Rate

- **Per task commit:** `npm run build && npm run lint` — must pass with zero new errors
- **Per wave merge:** Same (only one plan in this phase)
- **Phase gate:** Manual verification checklist before `/gsd:verify-work`

### Manual Verification Checklist (Phase Gate)

- [ ] Submit a review as User A — row appears in Supabase `reviews` table with correct `user_id`, `spot_id`, `rating`, `comment`
- [ ] Reviews tab shows User A's review with correct avatar (profile photo or preset SVG fallback)
- [ ] Average rating in Reviews tab matches `spot_ratings` view value in Supabase SQL editor
- [ ] User A can edit their review — rating and comment update; only one row per `(spot_id, user_id)` in DB
- [ ] User A can delete their review — row removed from DB; Reviews tab shows empty state
- [ ] Log in as User B — User B cannot see edit/delete controls on User A's review
- [ ] Average rating updates immediately after User A submits or edits (no page reload)
- [ ] No `alert()` calls introduced — errors shown inline in form
- [ ] `npm run build` passes with no TypeScript errors
- [ ] `npm run lint` shows no new lint errors beyond existing 24 pre-existing baseline

### Wave 0 Gaps

- [ ] No test files exist — this is a known project-wide gap (see `CONCERNS.md` Test Coverage Gaps section). For this phase, the build + lint + manual checklist is the validation strategy. No test framework setup is in scope for Phase 2.

---

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection — `supabase/migrations/001_community_schema.sql` — confirmed reviews table, RLS, spot_ratings view all exist
- Codebase direct inspection — `src/context/ProfileContext.tsx`, `src/context/FavoritesContext.tsx` — confirmed React Context + upsert patterns
- Codebase direct inspection — `src/components/SpotDetail.tsx` — confirmed current tab-less structure, Vaul drawer, snap points
- Codebase direct inspection — `src/components/Profile.tsx` — confirmed AVATARS constant + avatar fallback chain
- `.planning/codebase/CONVENTIONS.md` — naming conventions, state management patterns, animation patterns
- `.planning/codebase/ARCHITECTURE.md` — React Context pattern, data flow patterns
- `.planning/research/PITFALLS.md` — RLS pitfalls, iOS safe-area, auth.users join blocked

### Secondary (MEDIUM confidence)

- `.planning/research/STACK.md` — No new dependencies needed for reviews; star rating via Lucide already in project
- `.planning/phases/01-foundation/01-01-SUMMARY.md` — Confirmed migration 001 was the source of truth for the schema

### Tertiary (LOW confidence)

- None — all critical claims are verified against the actual codebase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, verified in package.json
- Architecture: HIGH — directly modeled on FavoritesContext and ProfileContext patterns already in codebase
- DB schema: HIGH — verified by reading migration file directly
- Pitfalls: HIGH — sourced from pre-existing PITFALLS.md research + direct codebase inspection
- UI patterns: HIGH — directly modeled on existing SpotDetail and Profile component patterns

**Research date:** 2026-03-21
**Valid until:** 2026-06-21 (90 days — stable stack with no fast-moving dependencies for this feature)
