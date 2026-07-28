# Phase 7: Spot Ownership - Research

**Researched:** 2026-04-05
**Domain:** React frontend (SpotDetail editing, uploader display) + Supabase RLS for spot UPDATE
**Confidence:** HIGH

## Summary

This phase adds two features to SpotDetail: (1) display the spot creator's identity (avatar + name) below the title, and (2) allow the creator or admin to edit spot fields and photos via an inline overlay. The codebase already has all the building blocks: profile fetching from `user_id` (reviews pattern), an edit overlay in AdminDashboard (fields: name, type, description, difficulty), image upload to Supabase Storage (addSpot pattern), and admin detection via email check.

The main work is: adding `user_id` to the Spot TypeScript type, mapping it from DB in SpotsContext, building the uploader line + edit button in SpotDetail, extracting/adapting the AdminDashboard edit overlay into SpotDetail with photo management, updating `updateSpot()` to handle `image_urls`, and adding an RLS policy so creators (and admin) can UPDATE their own spots.

**Primary recommendation:** Reuse existing patterns verbatim (profile fetch from reviews, edit overlay from AdminDashboard, image upload from addSpot). The only new code is the photo management UI (delete existing + upload new) and the RLS UPDATE policy.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Uploader line under spot title: `Ajoute par [Avatar] [Nom]`
- Visible on SpotDetail open (not in a specific tab)
- Reuse reviews pattern: `user_id -> profiles` fetch
- If creator has no profile or `user_id` null: show nothing
- Edit button inline next to uploader: `Ajoute par Wandrille . [Modifier]`
- Visible only for creator (`user.id === spot.user_id`) or admin (`user.email === 'updock.app@gmail.com'`)
- Overlay reuses AdminDashboard structure (name, type, description, difficulty)
- Add photo management: upload new + delete existing
- Upload via Supabase Storage (same pattern as avatars in Profile.tsx / addSpot)
- Overlay opens from SpotDetail (not AdminDashboard)
- Admin detection: `user?.email === 'updock.app@gmail.com'` (existing pattern)
- Add `user_id?: string` to Spot type in `src/data/spots.ts`

### Claude's Discretion
- Wording of edit link (text vs pencil icon)
- Loading state during uploader profile fetch
- Behavior after save (close overlay + refresh spot data)
- Field validation in edit overlay

### Deferred Ideas (OUT OF SCOPE)
- Spot deletion by creator
- AdminDashboard bugs + lightbox close button (Phase 8)
- Community stats (Phase 9)
</user_constraints>

## Architecture Patterns

### Current Spot Data Flow

```
Supabase DB (spots table with user_id column)
  -> SpotsContext.fetchSpots() -> select('*')
    -> maps DB fields to Spot type (MISSING: user_id not mapped)
      -> Spot objects used everywhere
```

**Key gap:** `fetchSpots()` in SpotsContext already fetches `*` (all columns) from the spots table, and the spots table already has a `user_id` column (set during `addSpot`). However, the mapping at line 80-109 does NOT include `user_id` in the resulting Spot object. This is the core type/mapping change needed.

### Pattern 1: Profile Fetch from user_id (Existing - Reviews)

**What:** SpotDetail already fetches profiles for review authors using the exact same pattern needed for the uploader.
**Where:** SpotDetail.tsx lines 84-89
**Example (existing code):**
```typescript
const userIds = [...new Set(data.map(r => r.user_id))];
const { data: profilesData } = userIds.length > 0
    ? await supabase.from('profiles').select('id, display_name, avatar_url, avatar_id').in('id', userIds)
    : { data: [] };
```
For the uploader, this simplifies to a single fetch by `spot.user_id`.

### Pattern 2: Edit Overlay (Existing - AdminDashboard)

**What:** AdminDashboard.tsx lines 170-253 contain a complete edit overlay with name, type (multi-select), description, difficulty fields.
**Approach:** Copy this overlay structure into SpotDetail (or extract a shared component). Add photo management section.

### Pattern 3: Image Upload to Supabase Storage (Existing - addSpot)

**What:** SpotsContext.addSpot() lines 143-163 upload images to `spots` bucket.
**Key details:**
- Bucket: `spots` (public)
- Path: `public/${timestamp}_${random}.${ext}`
- Max 5 images
- Returns public URL via `getPublicUrl()`

### Pattern 4: Admin Check (Existing - Profile.tsx)

```typescript
const isAdmin = user?.email === 'updock.app@gmail.com';
```

### Recommended Structure for SpotDetail Changes

```
SpotDetail.tsx changes:
1. New state: uploaderProfile, isEditing, editForm, photoFiles
2. useEffect: fetch uploader profile when spot changes (if spot.user_id)
3. Uploader line: below title, before tabs
4. Edit overlay: AnimatePresence modal with form fields + photo grid
5. Save handler: call updateSpot() + handle photo uploads/deletions
```

### Anti-Patterns to Avoid
- **Don't create a separate EditSpotOverlay component in a new file:** The AdminDashboard overlay is inline (~80 lines). For consistency, keep it inline in SpotDetail too. Extraction to a shared component would add complexity without benefit given only 2 consumers.
- **Don't fetch uploader profile on every render:** Cache it in state, fetch once per spot change.

## Key Implementation Details

### 1. Spot Type Update (`src/data/spots.ts`)

```typescript
export interface Spot {
    id: string;
    name: string;
    type: StartType[];
    position: [number, number];
    description: string;
    description_fr?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
    height?: number;
    image_urls?: string[];
    is_approved?: boolean;
    distance?: number;
    user_id?: string;  // <-- ADD THIS
}
```

### 2. SpotsContext Mapping Fix

In `fetchSpots()`, the DB-to-Spot mapping (line 80-109) must include `user_id`:

```typescript
return {
    id: s.id,
    name: s.name,
    // ... existing fields ...
    image_urls: s.image_urls,
    is_approved: s.is_approved,
    user_id: s.user_id || null,  // <-- ADD THIS
};
```

Same fix needed in `addSpot()` response mapping (line 190-200).

### 3. updateSpot() Must Handle image_urls

Current `updateSpot()` (SpotsContext line 264-284) does NOT update `image_urls`. It only updates name, description, type, difficulty. Must add `image_urls` to the Supabase update payload.

```typescript
const updateSpot = async (updatedSpot: Spot) => {
    const { error } = await supabase
        .from('spots')
        .update({
            name: updatedSpot.name,
            description: updatedSpot.description,
            type: JSON.stringify(updatedSpot.type),
            difficulty: updatedSpot.difficulty,
            image_urls: updatedSpot.image_urls || null,  // <-- ADD
        })
        .eq('id', updatedSpot.id);
    // ...
};
```

### 4. RLS Policy for Spot UPDATE

**Current state:** No UPDATE policy exists on the `spots` table. The existing policies are:
- Admin DELETE (`admin_permissions.sql`)
- No explicit INSERT/UPDATE/SELECT policies found in migrations (likely permissive defaults or handled elsewhere)

**Needed:** An RLS policy allowing the spot creator OR admin to update their spot:

```sql
CREATE POLICY "spot_owner_or_admin_update" ON public.spots
FOR UPDATE TO authenticated
USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'email' = 'updock.app@gmail.com'
)
WITH CHECK (
    auth.uid() = user_id
    OR auth.jwt() ->> 'email' = 'updock.app@gmail.com'
);
```

### 5. Photo Deletion from Storage

To delete a photo from Supabase Storage, extract the file path from the public URL:
```typescript
// URL format: https://<project>.supabase.co/storage/v1/object/public/spots/public/filename.jpg
// Path to delete: public/filename.jpg
const filePath = url.split('/storage/v1/object/public/spots/')[1];
await supabase.storage.from('spots').remove([filePath]);
```

**Storage deletion policy:** The existing policy allows users to delete their own uploads (`owner = auth.uid()`). For admin deleting other users' photos, a new storage policy may be needed. Alternative: admin can remove URLs from `image_urls` array without deleting the actual file from storage (simpler, storage cost is negligible).

### 6. Translation Keys Needed

```json
{
    "spot.added_by": "Added by",
    "spot.added_by_fr": "Ajoute par",
    "spot.edit": "Edit" / "Modifier",
    "spot.edit_title": "Edit Spot" / "Modifier le spot",
    "spot.edit_save": "Save Changes" / "Enregistrer",
    "spot.edit_photos": "Photos",
    "spot.edit_add_photo": "Add Photo" / "Ajouter une photo",
    "spot.edit_delete_photo": "Delete" / "Supprimer"
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image upload | Custom upload logic | Existing `addSpot` pattern with Supabase Storage | Already handles file naming, path, public URL generation |
| Profile fetching | New API endpoint | Direct Supabase query (reviews pattern) | Single SELECT, no need for Edge Function |
| Form state management | Custom form library | useState with spread (AdminDashboard pattern) | Simple form, 4-5 fields, no complex validation needed |
| Admin check | Role table / JWT claims | Email check `user?.email === 'updock.app@gmail.com'` | Locked decision, consistent with existing code |

## Common Pitfalls

### Pitfall 1: Static Spots Have No user_id

**What goes wrong:** Static spots in `src/data/spots.ts` (hardcoded array) have no `user_id`. Trying to display uploader or edit button for these spots would fail or show empty state.
**Why it happens:** Static spots are merged with DB spots in SpotsContext. They never went through Supabase INSERT.
**How to avoid:** Check `spot.user_id` before rendering uploader line. The CONTEXT.md decision already handles this: "If creator has no profile or user_id null: show nothing."
**Warning signs:** Uploader line shows for some spots but not others (expected behavior).

### Pitfall 2: updateSpot() Doesn't Refresh the Spot in SpotDetail

**What goes wrong:** After saving edits, the SpotDetail still shows old data because `updateSpot()` updates the spots array in context but SpotDetail may hold a stale `spot` prop.
**Why it happens:** SpotDetail receives `spot` as a prop. If the parent component caches the spot reference, the update in SpotsContext won't propagate.
**How to avoid:** After `updateSpot()`, either (a) close the overlay and let the parent re-select from the updated context, or (b) update local state directly from the edit form values.

### Pitfall 3: Photo Upload + URL Array Update Must Be Atomic

**What goes wrong:** New photos are uploaded to storage but the spot's `image_urls` isn't updated, or vice versa.
**Why it happens:** Two separate operations: storage upload + DB update.
**How to avoid:** Upload all new photos first, collect URLs, then merge with existing URLs (minus deleted ones), then call `updateSpot()` with the complete `image_urls` array in one DB call.

### Pitfall 4: Storage Delete Policy Blocks Admin

**What goes wrong:** Admin tries to delete another user's photo from storage and gets a permission error.
**Why it happens:** Storage policy `owner = auth.uid()` only allows the uploader to delete.
**How to avoid:** For MVP, admin removes URL from `image_urls` array without deleting the actual storage file. Storage cost is negligible. Add admin storage delete policy later if needed.

### Pitfall 5: addSpot Interface Conflict

**What goes wrong:** Build error because `addSpot` signature is `Omit<Spot, 'id' | 'user_id'>` but after adding `user_id` to Spot type, the omit still works correctly.
**Why it happens:** The Omit already excludes `user_id` from the addSpot parameter.
**How to avoid:** Verify the addSpot signature still compiles after adding `user_id` to Spot. It should since `user_id` is already omitted.

## Code Examples

### Uploader Line in SpotDetail

```typescript
// Fetch uploader profile
const [uploaderProfile, setUploaderProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
    avatar_id: number | null;
} | null>(null);

useEffect(() => {
    if (!spot?.user_id) {
        setUploaderProfile(null);
        return;
    }
    supabase
        .from('profiles')
        .select('display_name, avatar_url, avatar_id')
        .eq('id', spot.user_id)
        .single()
        .then(({ data }) => setUploaderProfile(data));
}, [spot?.id]);

// Render (below title, before tabs)
{uploaderProfile && (
    <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>{t('spot.added_by')}</span>
        {/* Avatar */}
        <img src={uploaderProfile.avatar_url || defaultAvatar} className="w-5 h-5 rounded-full" />
        <span>{uploaderProfile.display_name || t('review.anonymous')}</span>
        {(user?.id === spot.user_id || user?.email === 'updock.app@gmail.com') && (
            <button onClick={() => setIsEditing(true)} className="text-sky-500 ml-1">
                {t('spot.edit')}
            </button>
        )}
    </div>
)}
```

### Photo Management in Edit Overlay

```typescript
// State for photo management
const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);

// Save handler
const handleSaveEdit = async () => {
    // 1. Upload new photos
    const newUrls: string[] = [];
    for (const file of newPhotoFiles) {
        const ext = file.name.split('.').pop();
        const path = `public/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
        const { error } = await supabase.storage.from('spots').upload(path, file);
        if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('spots').getPublicUrl(path);
            newUrls.push(publicUrl);
        }
    }

    // 2. Compute final image_urls (existing minus deleted, plus new)
    const existingUrls = (editForm.image_urls || []).filter(url => !photosToDelete.includes(url));
    const finalUrls = [...existingUrls, ...newUrls];

    // 3. Update spot
    await updateSpot({ ...editForm, image_urls: finalUrls.length > 0 ? finalUrls : undefined });

    // 4. Close overlay
    setIsEditing(false);
};
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no test infrastructure in project) |
| Config file | none |
| Quick run command | N/A |
| Full suite command | `npm run build` (TypeScript + Vite build) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OWN-01 | Uploader name + avatar displays in SpotDetail | manual | N/A | N/A |
| OWN-02 | Edit button visible only for creator/admin | manual | N/A | N/A |
| OWN-03 | Edit overlay saves name, type, desc, difficulty | manual | N/A | N/A |
| OWN-04 | Photo upload + delete works in edit overlay | manual | N/A | N/A |
| OWN-05 | RLS prevents non-owner non-admin from updating | manual | N/A | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (TypeScript compilation check)
- **Per wave merge:** `npm run build` + manual spot detail check
- **Phase gate:** Build green + manual verification of all 5 behaviors

### Wave 0 Gaps
None -- no test framework exists in the project. All validation is via TypeScript build + manual testing. Setting up a test framework is out of scope for this phase.

## Open Questions

1. **Existing RLS policies on spots table for UPDATE**
   - What we know: No UPDATE policy found in migration files. There IS a DELETE policy for admin. INSERT is done via `addSpot()` which runs as authenticated user.
   - What's unclear: Whether RLS is even enabled on the spots table, or if there's a permissive default. The `updateSpot()` function works from AdminDashboard without any visible policy.
   - Recommendation: Check if RLS is enabled on spots (`ALTER TABLE spots ENABLE ROW LEVEL SECURITY`). If not enabled, the update works without policy. If enabled, add the creator+admin UPDATE policy. Either way, adding the policy is good practice.

2. **Avatar display for preset avatars**
   - What we know: Profile has `avatar_id` (1-5 preset) and `avatar_url` (custom upload). The preset avatars are defined in Profile.tsx.
   - What's unclear: How to resolve `avatar_id` to an image in SpotDetail without importing the AVATARS array.
   - Recommendation: Import the AVATARS constant from Profile.tsx or move it to a shared file. The reviews already handle this somewhere -- check how ReviewList renders avatars.

## Sources

### Primary (HIGH confidence)
- `src/context/SpotsContext.tsx` -- Complete spots data flow, addSpot upload pattern, updateSpot signature
- `src/components/AdminDashboard.tsx` -- Edit overlay structure (lines 170-253)
- `src/components/SpotDetail.tsx` -- Profile fetch pattern from reviews (lines 84-89), component structure
- `src/data/spots.ts` -- Spot type definition
- `supabase/migrations/admin_permissions.sql` -- Admin RLS policy pattern
- `supabase/migrations/supabase_storage_setup.sql` -- Storage bucket and policies

### Secondary (MEDIUM confidence)
- `src/components/Profile.tsx` -- Admin email check (line 125), avatar constants

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use (React, Supabase, framer-motion, lucide-react)
- Architecture: HIGH -- all patterns already established in codebase
- Pitfalls: HIGH -- identified from direct code reading

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable -- no external dependencies, all patterns internal)
