---
phase: 02-reviews
plan: 01
subsystem: ui
tags: [react, supabase, framer-motion, lucide-react, i18n]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: ProfileContext with AVATARS constant, AuthContext useAuth hook, supabase client
provides:
  - ReviewForm component with star picker, comment textarea, upsert submit, edit/delete own review
  - ReviewList component with avatar fallback chain, stagger animation, per-review star display
  - 15 review.* and spot.tab_* translation keys in en.json and fr.json
affects: [02-02-SpotDetail integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Review upsert with onConflict spot_id,user_id for one-review-per-user enforcement"
    - "Avatar fallback chain: avatar_url > AVATARS[avatar_id] > AVATARS[0]"
    - "Stagger animation via framer-motion motion.div with index * 0.05 delay"
    - "Inline error display — no alert() calls"

key-files:
  created:
    - src/components/ReviewForm.tsx
    - src/components/ReviewList.tsx
  modified:
    - src/translations/en.json
    - src/translations/fr.json

key-decisions:
  - "Review interface exported from ReviewForm.tsx so ReviewList.tsx can import the type without circular dependency"
  - "currentUserId prop kept on ReviewList for future use but prefixed with _ to satisfy TypeScript — edit/delete controls live in ReviewForm instead"
  - "No optimistic update in ReviewForm — form relies on server round-trip to get full profiles join before calling onSubmit"

patterns-established:
  - "Review type: exported from ReviewForm.tsx, imported by ReviewList.tsx via named import"
  - "AVATARS constant: copied verbatim from Profile.tsx into ReviewList.tsx (same 5 entries)"

requirements-completed: [AVIS-01, AVIS-02, AVIS-04]

# Metrics
duration: 5min
completed: 2026-03-21
---

# Phase 2 Plan 1: Review Components Summary

**Star-picker ReviewForm with Supabase upsert and own-review edit/delete, plus stagger-animated ReviewList with avatar fallback chain and 15 i18n keys**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-21T19:46:14Z
- **Completed:** 2026-03-21T19:51:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- ReviewForm renders 1-5 star picker, comment textarea (min 20 / max 1000 chars), submit/update button, and inline errors — no alert() calls
- ReviewForm shows existing review with Edit/Delete controls; upserts via Supabase with `onConflict: 'spot_id,user_id'`
- ReviewList renders review cards with avatar fallback chain, filled/empty stars (size 14), and stagger animation via framer-motion
- Added 15 review.* and spot.tab_* keys to both en.json and fr.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ReviewForm and ReviewList components** - `750303e` (feat)
2. **Task 2: Add review translation keys to en.json and fr.json** - `75741b0` (feat)

## Files Created/Modified
- `src/components/ReviewForm.tsx` - Star picker form, Supabase upsert, own-review display with edit/delete; exports Review interface
- `src/components/ReviewList.tsx` - Review card list with AVATARS constant, avatar fallback, stagger animation
- `src/translations/en.json` - Added 15 review/spot tab keys (English)
- `src/translations/fr.json` - Added 15 review/spot tab keys (French)

## Decisions Made
- Exported the `Review` interface from `ReviewForm.tsx` and imported it into `ReviewList.tsx` to avoid duplication and keep types co-located with the form that writes them.
- Edit/delete controls live in `ReviewForm` (when `userReview` is set), not in `ReviewList`, so the list stays read-only and doesn't need to know about the current user's review state.
- No optimistic update in ReviewForm — the upsert returns the full row with joined `profiles`, which is passed directly to `onSubmit` for accurate state in the parent.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ReviewForm and ReviewList are standalone components ready to be composed into SpotDetail in Plan 02-02
- Translation keys for tabs (spot.tab_info, spot.tab_reviews) are already in place for the tab UI in SpotDetail

---
*Phase: 02-reviews*
*Completed: 2026-03-21*

## Self-Check: PASSED

- src/components/ReviewForm.tsx: FOUND
- src/components/ReviewList.tsx: FOUND
- .planning/phases/02-reviews/02-01-SUMMARY.md: FOUND
- Commit 750303e: FOUND
- Commit 75741b0: FOUND
