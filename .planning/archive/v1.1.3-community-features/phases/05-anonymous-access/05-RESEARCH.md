# Phase 5: Anonymous Access - Research

**Researched:** 2026-03-22
**Domain:** Frontend auth gating, Supabase RLS policies, React conditional rendering
**Confidence:** HIGH

## Summary

Phase 5 transforms the app from a fully auth-gated experience to a "browse-first" model where anonymous users can view the map, spot details (including reviews and sessions in read-only), and use GPS navigation. All community actions (favorites, reviews, sessions, adding spots) require authentication and trigger the existing AuthModal.

The primary technical challenge is twofold: (1) restructuring the React component tree in App.tsx to render the full app shell for anonymous users instead of the LandingPage auth wall, and (2) adjusting Supabase Row Level Security policies to allow the `anon` role to SELECT from `reviews`, `sessions`, and `session_attendees` tables -- currently these tables restrict SELECT to `authenticated` only, which means anonymous Supabase client calls will silently return empty results or errors.

**Primary recommendation:** Start with the Supabase RLS migration to enable anon read access, then restructure App.tsx to remove the auth wall, then propagate `onOpenAuth` callbacks to all components that need auth-gating on their CTAs.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- App launches directly on Map tab for non-connected users -- no auth wall
- LandingPage component is deleted entirely
- WelcomeScreen (post-email-confirmation) is kept unchanged
- When anonymous user clicks a protected action, the existing AuthModal opens directly
- Protected actions: favorite, leave a review, join/create session, add a spot
- Action buttons remain visible with a lock icon (padlock) -- showcase of what's possible with an account
- Favorites tab in NavBar is visible for anonymous, but click triggers AuthModal
- Profile tab shows a dedicated login screen (not a redirect): illustration + title "Rejoins la communaute Updock" + "Se connecter" and "S'inscrire" buttons
- After login from Profile tab, user stays on Profile tab (transforms into real profile)
- All SpotDetail tabs visible (Info, Reviews, Sessions) in read-only
- Action buttons in SpotDetail (review, join session, favorite) visible with padlock, trigger AuthModal
- GPS navigation ("Naviguer vers ce spot") always accessible without account -- core functionality
- "Add spot" button visible in NavBar/Map but triggers AuthModal for anonymous

### Claude's Discretion
- Choice of padlock component/icon (lucide-react has `Lock` icon)
- Exact wording of messages in anonymous Profile screen
- Precise padlock placement on buttons (overlay, suffix, etc.)
- Post-login context management (e.g., auto-open the favorite that was clicked)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in project |
| Supabase JS | (project dep) | Backend + auth | Already in project, provides `anon` key for unauthenticated access |
| lucide-react | ^0.556.0 | Icons including `Lock` | Already in project, has the padlock icon needed |
| framer-motion | ^12.23.25 | Animations | Already in project for tab transitions |
| vaul | ^1.1.2 | Mobile drawer | Already in project for SpotDetail |

### Supporting
No new libraries needed. This phase is entirely about restructuring existing code and adding a Supabase migration.

### Alternatives Considered
None -- all tools needed are already in the project.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Pattern 1: Auth-Gating via Callback Propagation
**What:** Instead of blocking entire routes/components behind auth, pass an `onOpenAuth` callback through props to individual action buttons. Each button checks `user` from `useAuth()` and either performs the action or calls `onOpenAuth()`.
**When to use:** Every component with protected actions (SpotDetail, NavBar, Map add-spot button).
**Example:**
```typescript
// In a component with a protected action button
const { user } = useAuth();

const handleFavoriteClick = () => {
  if (!user) {
    onOpenAuth(); // Opens AuthModal
    return;
  }
  toggleFavorite(spotId);
};
```

### Pattern 2: Conditional CTA Rendering with Lock Badge
**What:** Action buttons are always rendered but display a small Lock icon when `!user`. The click handler gates on auth.
**When to use:** All protected action buttons in SpotDetail, NavBar favorites tab, add-spot button.
**Example:**
```typescript
import { Lock } from 'lucide-react';

<button onClick={handleFavoriteClick} className="relative ...">
  <Heart size={20} />
  {!user && <Lock size={12} className="absolute -top-1 -right-1 text-slate-400" />}
</button>
```

### Pattern 3: Anonymous Profile Screen (Inline, not redirect)
**What:** Profile component detects `!user` early and renders a dedicated sign-in/sign-up screen with its own AuthModal-like UI, staying within the Profile tab.
**When to use:** Profile.tsx when user is null.
**Example:**
```typescript
if (!user) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2>{t('anon_profile.title')}</h2>
      <button onClick={() => setShowInlineAuth(true)}>{t('auth.btn_login')}</button>
      <button onClick={() => setShowInlineAuth(true)}>{t('auth.btn_signup')}</button>
    </div>
  );
}
```

### Pattern 4: Remove Auth Wall, Keep Provider Tree
**What:** The entire provider tree (AuthProvider > SpotsProvider > FavoritesProvider > etc.) stays intact. Only the conditional render `{!user ? <LandingPage/> : <AppContent/>}` is replaced with always rendering AppContent.
**When to use:** App.tsx restructuring.

### Anti-Patterns to Avoid
- **Wrapping entire routes in auth guards:** This phase explicitly wants anonymous users to browse everything. Don't add route-level guards.
- **Lazy-loading auth state:** The `authLoading` spinner should still show while Supabase resolves the session, but after that, render the app regardless of user state.
- **Removing `if (!user) return` guards from write operations:** Context methods like `createSession`, `joinSession`, `toggleFavorite` already have `if (!user) return` guards. These MUST stay -- they prevent anonymous write attempts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth modal | Custom login form | Existing `AuthModal.tsx` | Already built, handles login + signup + error mapping |
| Lock icon | Custom SVG or emoji | `lucide-react` `Lock` icon | Already available, consistent with project icon library |
| Auth state detection | Custom session check | `useAuth()` hook returning `user` | Already wired to Supabase onAuthStateChange |

## Common Pitfalls

### Pitfall 1: Supabase RLS Blocks Anonymous Reads
**What goes wrong:** Anonymous users see empty reviews and sessions lists because Supabase `anon` role is blocked by `TO authenticated` SELECT policies on `reviews`, `sessions`, and `session_attendees`.
**Why it happens:** The original RLS policies (001_community_schema.sql) use `CREATE POLICY ... FOR SELECT TO authenticated USING (true)` which grants SELECT only to authenticated users. The Supabase JS client uses the `anon` key when no session exists, hitting the `anon` role which has NO select permission on these tables.
**How to avoid:** Create a new migration that adds SELECT policies for `anon` role on reviews, sessions, and session_attendees. Or change existing policies to not restrict to `authenticated` for SELECT.
**Warning signs:** Reviews tab and Sessions tab show empty/loading for anonymous users despite data existing in the database.

### Pitfall 2: FavoritesContext Clears State on No User
**What goes wrong:** `FavoritesContext` line 25-28 runs `setFavorites([])` when `!user`. This is correct behavior for anonymous users (no favorites to show). BUT the `toggleFavorite` function also has `if (!user) return` at line 62 -- so anonymous toggleFavorite calls are silently ignored.
**Why it happens:** This is actually correct -- the anonymous user should see the padlock and trigger AuthModal before `toggleFavorite` is ever called.
**How to avoid:** Ensure the padlock + AuthModal intercept happens BEFORE calling `toggleFavorite`. The button's onClick should check `user` first.
**Warning signs:** If you call `toggleFavorite` for anonymous users, nothing happens and no error is shown.

### Pitfall 3: NotificationsContext Calls Firebase on Mount
**What goes wrong:** `NotificationsContext` calls `FirebaseMessaging.checkPermissions()` on mount (line 40-42) regardless of whether user is logged in. On web dev mode this may throw errors. On native without Firebase config it may crash.
**Why it happens:** The `checkPermission` useEffect runs unconditionally.
**How to avoid:** This is likely already handled gracefully by the try/catch in `checkPermission`. But verify that anonymous users on web don't see console errors from Firebase. The `ensurePushToken` already checks `if (!user) return` so that's safe.
**Warning signs:** Console errors about Firebase on app launch for anonymous users.

### Pitfall 4: SessionsContext fetchSessionsForSpot Without Auth Check
**What goes wrong:** `fetchSessionsForSpot` (line 46) doesn't check for `user` before querying Supabase. For anonymous users, the query will use the `anon` key. If the RLS policy only allows `authenticated`, the query will return empty data (not an error -- Supabase returns empty arrays for RLS-blocked queries).
**Why it happens:** The function was written assuming it only runs in an authenticated context.
**How to avoid:** Fix the RLS policies (Pitfall 1) so anon can SELECT sessions. The function itself doesn't need modification -- just the database policies.
**Warning signs:** Sessions tab shows "No sessions planned" even when sessions exist.

### Pitfall 5: Profile.tsx Uses Multiple Auth-Dependent Hooks
**What goes wrong:** Profile.tsx calls `useProfile()`, `useSessions()`, `useNotifications()` unconditionally. For anonymous users, `useProfile()` will return null profile, `fetchUserSessions()` has a `if (!user) return` guard but the `useEffect` on line 43-46 still runs.
**Why it happens:** Profile was designed as an authenticated-only component.
**How to avoid:** The anonymous Profile screen should be a separate early-return branch that doesn't invoke hooks that depend on user data. Since React hooks must be called in the same order, the hooks themselves must be called but their effects should be guarded (which they mostly are).
**Warning signs:** Console warnings about calling Supabase methods without auth.

### Pitfall 6: SpotDetail Reviews Fetch Using Supabase Without anon SELECT
**What goes wrong:** SpotDetail line 76 queries `supabase.from('reviews').select('*')` directly (not through a context). For anonymous users, this will return empty if RLS blocks anon SELECT on reviews.
**Why it happens:** Reviews are fetched inline in SpotDetail, not through a context that might handle auth gating.
**How to avoid:** Same fix as Pitfall 1 -- the RLS migration must allow anon SELECT on reviews.
**Warning signs:** Reviews tab shows no reviews for anonymous users.

### Pitfall 7: AuthModal onClose After Login from Profile Tab
**What goes wrong:** After successful login from the Profile tab's dedicated auth screen, the user should stay on Profile tab (which transforms into real profile). If using the global `AuthModal`, the `onClose` callback might redirect or reset state.
**Why it happens:** AuthModal's `onClose` prop doesn't control which tab is active.
**How to avoid:** For the Profile anonymous screen, either embed auth directly (re-using AuthModal component with appropriate onClose) or use the global AuthModal but ensure `activeTab` stays on 'profile' after auth state changes.
**Warning signs:** User logs in from Profile tab but gets redirected to Map tab.

## Code Examples

### Current Auth Wall (to be removed)
```typescript
// App.tsx line 93 - CURRENT: blocks everything behind auth
{!user ? (
  <>
    <LandingPage onStart={() => setIsAuthModalOpen(true)} />
    <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
  </>
) : (
  <div vaul-drawer-wrapper="" className="...">
    {/* Full app content */}
  </div>
)}
```

### Target Structure (after phase 5)
```typescript
// App.tsx - NEW: always render app content, AuthModal available globally
<div vaul-drawer-wrapper="" className="...">
  {/* Full app content rendered for ALL users */}
  <main>
    {/* Map, Favorites (gated), List, Profile tabs */}
  </main>

  <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
</div>
```

### Auth-Gated Button Pattern
```typescript
// Generic pattern for any protected action button
const { user } = useAuth();

const handleProtectedAction = (action: () => void) => {
  if (!user) {
    onOpenAuth();
    return;
  }
  action();
};

// In JSX:
<button onClick={() => handleProtectedAction(() => toggleFavorite(spot.id))} className="relative">
  <Heart size={20} />
  {!user && <Lock size={10} className="absolute -top-0.5 -right-0.5 text-slate-400" />}
</button>
```

### Supabase RLS Migration for Anon Read Access
```sql
-- Allow anonymous users to read reviews, sessions, and session_attendees
-- Required for Phase 5: Anonymous Access

-- Reviews: anon can read all reviews
CREATE POLICY "reviews_select_anon" ON public.reviews
  FOR SELECT TO anon USING (true);

-- Sessions: anon can read non-cancelled sessions
CREATE POLICY "sessions_select_anon" ON public.sessions
  FOR SELECT TO anon USING (true);

-- Session attendees: anon can read attendee counts
CREATE POLICY "session_attendees_select_anon" ON public.session_attendees
  FOR SELECT TO anon USING (true);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auth wall (LandingPage) | Browse-first with gated actions | Phase 5 | Users see app value before committing to account creation |
| All tables authenticated-only SELECT | Anon SELECT for read-only data | Phase 5 | Supabase anon role can read spots, reviews, sessions |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual testing (no automated test infrastructure in project) |
| Config file | none |
| Quick run command | `npm run build` (TypeScript compilation check) |
| Full suite command | `npm run build && npm run preview` |

### Phase Requirements -> Test Map

Since no formal requirement IDs exist for Phase 5, the test map is based on CONTEXT.md decisions:

| Req | Behavior | Test Type | Command | File Exists? |
|-----|----------|-----------|---------|-------------|
| ANON-01 | App launches on Map for anonymous users | manual | Open app without login | N/A |
| ANON-02 | LandingPage is deleted | build | `npm run build` (no import errors) | N/A |
| ANON-03 | SpotDetail shows reviews/sessions for anon | manual | Open spot detail without login | N/A |
| ANON-04 | Protected actions show lock + trigger AuthModal | manual | Click favorite/review/session without login | N/A |
| ANON-05 | Profile tab shows login screen for anon | manual | Navigate to Profile without login | N/A |
| ANON-06 | GPS navigation works for anon | manual | Click "Navigate" on a spot without login | N/A |
| ANON-07 | Favorites tab triggers AuthModal for anon | manual | Click Favorites tab without login | N/A |
| ANON-08 | RLS allows anon read on reviews/sessions | manual | Verify data loads for anon in SpotDetail | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (ensures no TypeScript errors)
- **Per wave merge:** Manual test of all ANON scenarios above
- **Phase gate:** Full manual walkthrough + build passes

### Wave 0 Gaps
- [ ] Supabase RLS migration file for anon SELECT policies
- [ ] Translation keys for anonymous Profile screen (fr.json + en.json)

## Critical Technical Details

### Files to Modify (from CONTEXT.md + research)
1. **`src/App.tsx`** -- Remove `!user ? <LandingPage/> : <AppContent/>` block. Always render AppContent. Pass `onOpenAuth` to NavBar and other components.
2. **`src/components/NavBar.tsx`** -- Accept `user` and `onOpenAuth` props. Intercept Favorites tab click and add-spot button click for anonymous users.
3. **`src/components/SpotDetail.tsx`** -- Add lock icons to favorite button (line 192), review form area (line 354), session form area (line 377). Show auth-gated CTAs. The review form (`{user && <ReviewForm/>}`) should be replaced with a locked CTA for anonymous users.
4. **`src/components/Profile.tsx`** -- Add early return with dedicated login screen when `!user`. Keep the settings section (language toggle) accessible for anonymous users.
5. **`src/translations/fr.json`** + **`en.json`** -- Add keys for anonymous profile screen.

### Files to Create
1. **Supabase migration** -- New migration for anon SELECT policies on reviews, sessions, session_attendees.

### Files to Delete
1. **`src/components/LandingPage.tsx`** -- Complete removal.

### Supabase RLS Analysis (CRITICAL)

| Table | Current SELECT Policy | Anon Can Read? | Action Needed |
|-------|----------------------|----------------|---------------|
| `spots` | Unknown (not in migrations, likely dashboard-set) | YES (SpotsContext works) | Verify -- likely already public |
| `profiles` | `for select using (true)` -- no role restriction | YES | None |
| `reviews` | `FOR SELECT TO authenticated USING (true)` | NO | Add anon SELECT policy |
| `sessions` | `FOR SELECT TO authenticated USING (true)` | NO | Add anon SELECT policy |
| `session_attendees` | `FOR SELECT TO authenticated USING (true)` | NO | Add anon SELECT policy |
| `favorites` | Not in visible migrations | N/A (only for logged-in users) | None needed |
| `push_tokens` | `FOR ALL TO authenticated` | NO | None needed (auth-only feature) |

### Provider Tree Impact
The current provider tree in App.tsx wraps everything:
```
LanguageProvider > AuthProvider > SpotsProvider > FavoritesProvider > ProfileProvider > NotificationsProvider > SessionsProvider > AppContent
```

For anonymous users:
- **SpotsProvider:** Works fine -- fetches spots without auth dependency
- **FavoritesProvider:** Safe -- clears favorites when `!user`
- **ProfileProvider:** Needs verification -- likely returns null profile for `!user`
- **NotificationsProvider:** Firebase calls may log errors but won't crash (try/catch)
- **SessionsProvider:** `fetchSessionsForSpot` will work once RLS is fixed

No provider tree restructuring needed.

## Open Questions

1. **Spots table RLS policy origin**
   - What we know: SpotsContext successfully fetches spots, so anon SELECT is likely enabled
   - What's unclear: The policy wasn't in any migration file -- it may have been set via Supabase dashboard
   - Recommendation: Verify in Supabase dashboard that spots has a public SELECT policy. If not, add one in the migration.

2. **Post-login redirect behavior**
   - What we know: CONTEXT.md says "after login from Profile tab, user stays on Profile"
   - What's unclear: How to handle login triggered from other contexts (e.g., clicking favorite on SpotDetail)
   - Recommendation: Claude's discretion -- simplest is to just close the AuthModal and let the user re-click the action. No auto-redirect needed for v1.

3. **ProfileProvider behavior for anonymous users**
   - What we know: ProfileProvider likely calls `useAuth()` and fetches profile data. For null user, it should return null profile.
   - What's unclear: Whether it throws errors or handles null gracefully
   - Recommendation: Check ProfileProvider source during implementation. Add `if (!user) return` guards if missing.

## Sources

### Primary (HIGH confidence)
- `src/App.tsx` -- Current auth wall implementation (line 93)
- `src/context/AuthContext.tsx` -- User/session state management
- `src/components/AuthModal.tsx` -- Existing reusable auth component
- `supabase/migrations/001_community_schema.sql` -- RLS policies for reviews, sessions, session_attendees
- `supabase/migrations/create_profiles_table.sql` -- Profiles RLS policy (public SELECT)

### Secondary (MEDIUM confidence)
- `05-CONTEXT.md` -- User decisions and canonical references
- Supabase documentation on RLS `anon` vs `authenticated` roles

### Tertiary (LOW confidence)
- Spots table RLS policy (not found in migrations, assumed public based on runtime behavior)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing libraries
- Architecture: HIGH - straightforward conditional rendering refactor
- Pitfalls: HIGH - verified by reading actual RLS policies in migration files
- Supabase RLS: HIGH - directly read from 001_community_schema.sql, policies clearly restrict SELECT to `authenticated`

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no external dependency changes expected)
