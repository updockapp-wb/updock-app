# Phase 1: Foundation - Research

**Researched:** 2026-03-18
**Domain:** Capacitor version alignment, Supabase schema migration, React/TypeScript bug fixes, user profiles
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TECH-01 | Résoudre le mismatch de version Capacitor (CLI v7 / core v8) avant toute modification native | Capacitor CLI 8.2.0 is latest stable; upgrade path verified in npm registry; `npx cap doctor` is the diagnostic command |
| FIX-01 | L'onglet liste affiche les spots triés par distance croissante par rapport à la position GPS de l'utilisateur | `SpotsContext` already computes `nearbySpots` with the Haversine formula; bug is that `NearbySpotsList` shows blank when `userLocation` is null on first render — GPS permission timing issue; no new library needed |
| FIX-02 | Le formulaire d'ajout de spot ne contient plus le champ "hauteur" et la soumission est visuellement propre | `AddSpotForm.tsx` has the `height` field at lines 175–186 (w-1/3 column alongside difficulty); removal is a UI-only change; memory leak at `URL.createObjectURL()` line 51 must also be fixed per codebase audit |
| PROF-01 | L'utilisateur peut définir un pseudo affiché sur ses avis et sessions | `profiles` table already exists with `id` + `avatar_id`; needs `display_name TEXT` column added via migration; Profile.tsx needs an editable text field |
| PROF-02 | L'utilisateur peut uploader une photo de profil (avatar) | Current avatar system uses pre-defined SVG files (`avatar_id 1-5`); PROF-02 requires actual file upload to Supabase Storage; needs a new `avatars` bucket; existing `addSpot` upload pattern is the reference |
</phase_requirements>

---

## Summary

Phase 1 is a brownfield foundation phase on an existing React 19 + TypeScript + Supabase + Capacitor 8 app. The codebase is fully understood from prior research. There are no unknown technologies — every task uses patterns already present in the project. The three concerns are: (1) a version mismatch between `@capacitor/cli` (v7.4.4) and `@capacitor/core` (v8.0.0) that must be resolved by upgrading the CLI to v8.2.0; (2) two UI bugs to fix — the list tab not showing spots and the add-spot form containing a "hauteur" field; and (3) the user profile system needs two additions: a `display_name` column on the existing `profiles` table and a real avatar file upload replacing the current preset SVG picker.

The database work in this phase also establishes all five tables required by later phases (profiles, reviews, sessions, session_attendees, push_tokens) even though only profiles is consumed in Phase 1. This is the right approach: schema is cheap to create now and prevents retroactive migrations when Phase 2 and 3 begin.

No new dependencies need to be installed for Phase 1. The Capacitor CLI version bump is a `devDependency` change. Avatar upload reuses the Supabase Storage pattern already used by the spots bucket.

**Primary recommendation:** Fix TECH-01 first (CLI upgrade + `npx cap sync`), then create the full database schema (all 5 tables), then address the two UI bugs, then implement display_name + avatar upload in Profile. This order ensures native builds are stable before any changes land.

---

## Standard Stack

### Core (existing — no changes)

| Library | Version in use | Purpose | Status |
|---------|----------------|---------|--------|
| `react` + `react-dom` | 19.2.0 | UI layer | No change |
| `typescript` | 5.9.3 | Type safety | No change |
| `@supabase/supabase-js` | 2.87.2 (latest: 2.99.2) | DB, Auth, Storage | No change for Phase 1 |
| `@capacitor/core` | 8.0.0 | Native bridge | No change |
| `@capacitor/cli` | 7.4.4 (OUTDATED) | Native build tooling | Upgrade to 8.2.0 |
| `tailwindcss` | 4.1.17 | Styling | No change |
| `framer-motion` | 12.x | Animations | No change |
| `lucide-react` | 0.556.0 | Icons | No change |

### Phase 1 Dependency Change

| Package | From | To | Type | Command |
|---------|------|----|------|---------|
| `@capacitor/cli` | 7.4.4 | 8.2.0 | devDependency | `npm install -D @capacitor/cli@^8.2.0` |

**No other dependencies need to change in Phase 1.**

Version verification (confirmed against npm registry 2026-03-18):
- `@capacitor/cli` latest: **8.2.0** (matches `@capacitor/core` 8.x major)
- `@capacitor/core` latest: **8.2.0** (project uses 8.0.0 — acceptable, same major)

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 additions only)

```
src/
├── context/
│   └── ProfileContext.tsx     # NEW: display_name, avatar_url fetch/update
├── components/
│   └── Profile.tsx            # MODIFY: add display_name edit + real avatar upload
│   └── AddSpotForm.tsx        # MODIFY: remove height field, fix memory leak
supabase/
└── migrations/
    └── 001_community_schema.sql  # NEW: all 5 tables + RLS + triggers + view
```

### Pattern 1: Supabase upsert for profile updates

**What:** The existing `Profile.tsx` already uses `supabase.from('profiles').upsert({ id: user.id, avatar_id: id })`. The same pattern extends to `display_name`.

**When to use:** Every profile field update — handles both first-time insert and subsequent updates atomically.

```typescript
// Source: existing Profile.tsx handleAvatarSelect pattern
const { error } = await supabase
  .from('profiles')
  .upsert({ id: user.id, display_name: newName });
```

### Pattern 2: Supabase Storage upload for avatars

**What:** Reuse the exact upload pattern from `SpotsContext.addSpot`. Upload file to `avatars/` bucket, get public URL, store URL in `profiles.avatar_url`.

**When to use:** When user selects a new avatar photo from their device.

```typescript
// Source: SpotsContext.tsx lines 151-163 (existing pattern)
const fileName = `${user.id}/${Date.now()}.${fileExt}`;
const { error: uploadError } = await supabase.storage
  .from('avatars')
  .upload(fileName, imageFile, { upsert: true });
// then get publicUrl and save to profiles.avatar_url
```

**Note:** Use `user.id` as folder prefix in the path (`avatars/{user_id}/avatar.jpg`). This allows RLS on `storage.objects` to be scoped per user without complex path parsing.

### Pattern 3: ProfileContext following FavoritesContext structure

**What:** New `ProfileContext.tsx` follows the exact same structure as `FavoritesContext.tsx` — TypeScript interface, createContext, Provider component, custom hook with error guard.

**When to use:** Any state that needs to be shared between Profile.tsx and future components (ReviewForm, SessionCard) that display the current user's display name and avatar.

```typescript
// Pattern from FavoritesContext.tsx (existing convention)
interface ProfileContextType {
  profile: ProfileData | null;
  isLoading: boolean;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
}
export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
```

### Pattern 4: GPS permission timing for FIX-01

**What:** `NearbySpotsList` returns `null` when `userLocation` is null. The list tab renders `NearbySpotsList` which disappears if GPS hasn't resolved yet. Fix requires showing a loading/permission state instead of null-returning silently.

**Root cause (confirmed from code):** `SpotsContext` initializes `userLocation` as `null`. `NearbySpotsList` line 16: `if (!userLocation || nearbySpots.length === 0) return null;`. When the list tab is first opened before GPS resolves, the component returns nothing — appears blank.

**Fix approach:** Show a non-null placeholder UI when `userLocation` is null (e.g., "Localisation en cours..." state), then replace with sorted list when location arrives. No sort logic change needed — `nearbySpots` is already correctly computed in SpotsContext via Haversine formula.

### Pattern 5: URL.createObjectURL memory leak fix

**What:** `AddSpotForm.tsx` line 51 creates object URLs but never revokes them. Fix: revoke URLs in `handleRemoveImage` and in a `useEffect` cleanup on unmount.

```typescript
// Fix pattern: revoke when removing
const handleRemoveImage = (index: number) => {
  URL.revokeObjectURL(imagePreviews[index]); // ADD THIS
  setImageFiles(prev => prev.filter((_, i) => i !== index));
  setImagePreviews(prev => prev.filter((_, i) => i !== index));
};
// Fix pattern: revoke all on unmount
useEffect(() => {
  return () => { imagePreviews.forEach(URL.revokeObjectURL); };
}, [imagePreviews]);
```

### Anti-Patterns to Avoid

- **Do NOT migrate spot type from JSON string to array now.** The codebase audit flags this as tech debt, but PROJECT.md explicitly says "Ne pas refactoriser le type de spot (JSON string) maintenant — hors scope des correctifs prioritaires." Stick to out-of-scope boundary.
- **Do NOT add `display_name` to auth.users metadata.** The existing `profiles` table is the right place. `user.user_metadata?.first_name` in Profile.tsx line 110 is the current fallback — replace it with `profile.display_name` from ProfileContext.
- **Do NOT add `fcm_token` to profiles.** The architecture research is clear: use a separate `push_tokens` table (already included in Phase 1 schema for forward compatibility).
- **Do NOT create a public avatars bucket.** Use a private bucket with per-user path. The storage pattern with `user.id` as folder prefix enables RLS without complex policy logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Distance calculation | Custom formula | `getDistance()` from `src/utils/distance.ts` (Haversine, already exists) | Already tested and in use by `nearbySpots` in SpotsContext |
| File upload to Supabase | Custom fetch + FormData | `supabase.storage.from('avatars').upload()` | Same SDK already used by spot image uploads |
| Profile persistence | localStorage | `supabase.from('profiles').upsert()` | Auth-scoped, survives reinstall, consistent with rest of data |
| Avatar image preview | Canvas or FileReader | `URL.createObjectURL()` | Already used in AddSpotForm — same pattern |
| Native version check | Manual parsing | `npx cap doctor` | Official Capacitor diagnostic command |

---

## Common Pitfalls

### Pitfall 1: Capacitor sync after CLI upgrade

**What goes wrong:** After upgrading `@capacitor/cli` to v8.2.0, the iOS native project may have stale plugin bindings. If `npx cap sync` is not run, the iOS build uses old native code.

**Why it happens:** `cap sync` copies web assets and updates native plugin registrations. It is not automatic on `npm install`.

**How to avoid:** After upgrading CLI, run `npx cap doctor` to confirm no version warnings, then `npx cap sync` to update iOS/Android projects. Verify on the next native build.

**Warning signs:** `npx cap doctor` shows "CLI version X does not match Core version Y" after upgrade.

### Pitfall 2: profiles table already exists with limited columns

**What goes wrong:** The existing migration `create_profiles_table.sql` creates `profiles` with only `id` and `avatar_id`. Adding `display_name` via a new migration risks conflicts if the trigger or policies are re-created without `DROP ... IF EXISTS` guards.

**Why it happens:** Incremental migrations on an existing table require `ALTER TABLE ADD COLUMN IF NOT EXISTS` not `CREATE TABLE`. The trigger `on_auth_user_created` already exists — re-creating it without DROP first will error.

**How to avoid:**
- Use `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;`
- Use `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;` (new column for real uploads, separate from `avatar_id`)
- Use `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;` before recreating the trigger with the new column defaults
- For the 4 new tables (reviews, sessions, session_attendees, push_tokens): use `CREATE TABLE IF NOT EXISTS`

### Pitfall 3: RLS tested in Supabase SQL Editor bypasses policies

**What goes wrong:** Testing the new `profiles` columns in the SQL editor shows correct results, but the app gets empty data or 403 errors because the SQL editor runs as superuser (bypasses RLS).

**Why it happens:** Supabase SQL Editor always runs as the `postgres` role — RLS is invisible there.

**How to avoid:** After writing all RLS policies, test them only via the Supabase JavaScript client with a real user session. Use the "Row Level Security" simulator in the Supabase dashboard for quick verification.

### Pitfall 4: Avatar URL vs avatar_id confusion in Profile.tsx

**What goes wrong:** Profile.tsx currently reads `avatar_id` and maps it to a local SVG. After PROF-02, the profile needs to show a real uploaded photo. If both `avatar_id` and `avatar_url` exist, the component needs a clear precedence rule.

**How to avoid:** Establish a clear fallback chain: `avatar_url` (real upload) → preset SVG by `avatar_id` → default SVG (avatar1). Implement this in one place in ProfileContext, not scattered across components.

### Pitfall 5: iOS safe-area not respected on profile form

**What goes wrong:** New input fields for `display_name` and avatar upload button get hidden behind the iOS home indicator on iPhone X+ if the profile screen doesn't account for `env(safe-area-inset-bottom)`.

**Why it happens:** The profile screen uses `overflow-y-auto` but the submit area may not have bottom padding.

**How to avoid:** The existing Profile.tsx already has `pb-8` at the bottom. Verify this is sufficient after adding the new form elements. Check on physical device (or Xcode simulator with safe area enabled).

---

## Code Examples

### FIX-01: NearbySpotsList with GPS loading state

```tsx
// Source: existing NearbySpotsList.tsx — fix the null return
export default function NearbySpotsList({ onSpotClick }: NearbySpotsListProps) {
  const { nearbySpots, userLocation } = useSpots();
  const { t } = useLanguage();

  // Show loading state while GPS resolves, not blank screen
  if (!userLocation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Navigation size={32} className="mb-3 animate-pulse" />
        <p className="text-sm font-medium">{t('nearby.locating') || 'Localisation en cours...'}</p>
      </div>
    );
  }

  if (nearbySpots.length === 0) {
    return (/* empty state */);
  }
  // ... rest unchanged
}
```

### FIX-02: Remove height field from AddSpotForm

```tsx
// Source: AddSpotForm.tsx lines 160-186 — remove the height section
// BEFORE: Difficulty & Height Row with two columns
// AFTER: Difficulty only (full width)
<div>
  <label className="block text-sm font-medium text-slate-700 mb-2">{t('spot.difficulty')}</label>
  <select
    value={difficulty}
    onChange={(e) => setDifficulty(e.target.value as any)}
    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none font-medium appearance-none"
  >
    <option value="Easy">Easy</option>
    <option value="Medium">Medium</option>
    <option value="Hard">Hard</option>
    <option value="Extreme">Extreme</option>
  </select>
</div>
// Remove: height state, height input field, height in handleSubmit payload
```

### PROF-01: Add display_name to profiles migration

```sql
-- In supabase/migrations/001_community_schema.sql
-- Extend existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update trigger to handle new columns
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_id)
  VALUES (NEW.id, 1)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### PROF-02: Avatar upload to Supabase Storage

```typescript
// Source: Pattern from SpotsContext.tsx addSpot — adapted for avatars
const handleAvatarUpload = async (file: File) => {
  if (!user) return;
  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  await supabase.from('profiles')
    .upsert({ id: user.id, avatar_url: publicUrl });
};
```

### Full database schema (Plan 01-01)

```sql
-- =====================================================
-- Phase 1 full schema: all 5 tables + RLS + view
-- =====================================================

-- 1. Extend profiles (already exists)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_id)
  VALUES (NEW.id, 1)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. reviews table
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
CREATE INDEX IF NOT EXISTS reviews_spot_id_idx ON public.reviews(spot_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. spot_ratings view
CREATE OR REPLACE VIEW public.spot_ratings AS
SELECT
  spot_id,
  COUNT(*)              AS review_count,
  ROUND(AVG(rating), 1) AS avg_rating
FROM public.reviews
GROUP BY spot_id;

-- 4. sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id      UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  creator_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at    TIMESTAMPTZ NOT NULL,
  note         TEXT CHECK (char_length(note) <= 500),
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_spot_id_idx ON public.sessions(spot_id);
CREATE INDEX IF NOT EXISTS sessions_starts_at_idx ON public.sessions(starts_at);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "sessions_delete" ON public.sessions FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

-- 5. session_attendees table
CREATE TABLE IF NOT EXISTS public.session_attendees (
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_attendees_select" ON public.session_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "session_attendees_insert" ON public.session_attendees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "session_attendees_delete" ON public.session_attendees FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. push_tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_tokens_own" ON public.push_tokens FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 1 |
|--------------|------------------|---------------------|
| Capacitor CLI v7 + Core v8 | CLI v8.2.0 + Core v8.x | Must align before any native work; upgrade is straightforward devDependency bump |
| Avatar = preset SVG picker (avatar_id) | Avatar = real photo upload to Supabase Storage | PROF-02 requires adding avatar_url column + avatars bucket; keep avatar_id as fallback |
| Profiles table: id + avatar_id only | Profiles: id + avatar_id + display_name + avatar_url | Two new columns via ALTER TABLE; no table recreation needed |
| List tab shows blank if GPS not resolved | List tab shows GPS loading state | UX fix in NearbySpotsList |

---

## Open Questions

1. **Does the `spots` table have a `created_by` / `user_id` column for profile spot history?**
   - What we know: `SpotsContext.addSpot` sends `user_id: user.id` in `dbPayload` (line 178). The column exists in the insert.
   - What's unclear: Whether it's named `user_id` in the actual Supabase schema (no schema dump available in the repo). The migration files don't show the original `spots` table creation.
   - Recommendation: Plan 01-01 should include a `SELECT column_name FROM information_schema.columns WHERE table_name = 'spots'` check or a safe `ALTER TABLE spots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)` to ensure it exists.

2. **Does the `favorites` table have RLS configured correctly for the cascade delete scenario?**
   - What we know: `admin_permissions.sql` adds a separate policy for admin to delete favorites; `deleteSpot` in SpotsContext manually deletes favorites before the spot. This is fragile.
   - What's unclear: Whether the new community tables (reviews, sessions) will cascade cleanly on spot deletion without the same manual workaround.
   - Recommendation: The Phase 1 schema uses `ON DELETE CASCADE` on `reviews.spot_id` and `sessions.spot_id` FK constraints — this removes the manual cascade problem for the new tables. No action needed for the existing favorites fragility (out of scope).

3. **Private vs public avatars bucket?**
   - What we know: The existing `spots` bucket is public. Pitfalls research recommends a private `avatars` bucket.
   - What's unclear: Whether the Supabase free tier supports private bucket + signed URLs at the performance needed for mobile.
   - Recommendation: Use a public bucket with `user_id` folder namespacing for Phase 1 simplicity (matching the spots bucket pattern). The avatar URL is not sensitive — it is a profile picture. Private bucket adds complexity (signed URL expiry) not justified at this project size. Flag for security review if requirements change.

---

## Validation Architecture

No automated test infrastructure exists in this project (`"Pas de tests : aucune infra de test en place — ne pas en introduire sauf si demandé explicitement"` per PROJECT.md constraints).

`workflow.nyquist_validation` is `true` in `.planning/config.json`, but the project explicitly prohibits introducing test infrastructure. The validation for Phase 1 is therefore entirely manual.

### Manual Verification Checklist per Plan

**Plan 01-01 (Capacitor fix + schema):**
- `npx cap doctor` shows no version warnings after CLI upgrade
- `npx cap sync` completes without errors
- Supabase SQL: all 5 tables visible in dashboard Table Editor
- Supabase SQL: RLS enabled badge visible on each new table
- RLS test: log in as test user, try to insert a review with a different `user_id` — must fail
- Trigger test: create a new test user account — profile row auto-created in profiles table

**Plan 01-02 (Bug fixes):**
- List tab: open app, grant location — spots appear sorted by distance (nearest first)
- List tab: open app, deny location — shows "Localisation en cours..." placeholder, not blank
- Add spot form: "hauteur" field is gone; form has Location / Type / Difficulty / Name / Description / Photos only
- Add spot form: select 3 images, remove 2, select 3 more — no memory growth (Chrome DevTools Memory tab)

**Plan 01-03 (User profiles):**
- Profile tab: display_name input appears; user enters a name, taps Save — name persists after app restart
- Profile tab: avatar upload button appears; user selects a photo — photo uploads and displays as circular avatar
- Profile tab: display name shown in place of "Updocker" fallback when set
- Cross-device: log in on second device — same display_name and avatar visible

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis — `src/context/SpotsContext.tsx`, `src/components/AddSpotForm.tsx`, `src/components/Profile.tsx`, `src/context/AuthContext.tsx`, `supabase/migrations/create_profiles_table.sql`, `package.json`
- `.planning/codebase/CONCERNS.md` — confirmed memory leak location (AddSpotForm line 51), confirmed Capacitor mismatch (TECH-01)
- npm registry — `npm view @capacitor/cli dist-tags` confirms latest stable is 8.2.0 (checked 2026-03-18)
- `.planning/research/ARCHITECTURE.md` — full schema design for all 5 tables, RLS patterns, provider tree
- `.planning/research/PITFALLS.md` — RLS WITH CHECK requirement, SQL Editor bypass, Capacitor mismatch details

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — Supabase Storage pattern for avatar upload, profiles extension approach
- `.planning/research/FEATURES.md` — MVP definition confirming display_name + real avatar upload scope
- `.planning/codebase/CONVENTIONS.md` — naming conventions, Context pattern, error handling approach

---

## Metadata

**Confidence breakdown:**
- TECH-01 (Capacitor upgrade): HIGH — version numbers verified against npm registry; upgrade path is a single devDependency change
- FIX-01 (List tab / GPS): HIGH — root cause identified in source code (NearbySpotsList line 16, SpotsContext nearbySpots computation)
- FIX-02 (Form cleanup): HIGH — height field location confirmed (AddSpotForm lines 175-186); memory leak location confirmed (CONCERNS.md)
- PROF-01 (display_name): HIGH — profiles table exists; ALTER TABLE pattern is standard; no new dependency
- PROF-02 (avatar upload): HIGH — Supabase Storage upload pattern exists in SpotsContext; avatars bucket needs creation

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable tech — 30 days)
