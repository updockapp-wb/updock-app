---
phase: 07-spot-ownership
plan: 01
subsystem: database, api
tags: [supabase, rls, typescript, i18n]

# Dependency graph
requires:
  - phase: 05-anonymous-access
    provides: existing Spot type and SpotsContext with auth-aware access
provides:
  - Spot type with user_id field
  - SpotsContext user_id mapping in fetch and create flows
  - updateSpot with image_urls payload support
  - RLS UPDATE policy for spot owner or admin
  - 11 translation keys for spot ownership UI (fr + en)
affects: [07-spot-ownership plan 02 UI]

# Tech tracking
tech-stack:
  added: []
  patterns: [RLS owner-or-admin policy pattern]

key-files:
  created:
    - supabase/migrations/004_spot_owner_update.sql
  modified:
    - src/data/spots.ts
    - src/context/SpotsContext.tsx
    - src/translations/fr.json
    - src/translations/en.json

key-decisions:
  - "user_id mapped as s.user_id || null to handle static spots gracefully"
  - "RLS policy uses email check for admin (consistent with existing admin_permissions pattern)"

patterns-established:
  - "Owner-or-admin RLS pattern: auth.uid() = user_id OR admin email check"

requirements-completed: [OWN-01, OWN-02, OWN-03, OWN-04, OWN-05]

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 7 Plan 01: Spot Ownership Data Layer Summary

**Spot type extended with user_id, SpotsContext mappings updated, updateSpot sends image_urls, RLS owner-or-admin UPDATE policy created, and 11 translation keys added in FR/EN**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T21:00:31Z
- **Completed:** 2026-04-05T21:03:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Spot interface extended with optional user_id field for ownership tracking
- SpotsContext updated to map user_id in both fetchSpots and addSpot flows, and updateSpot now includes image_urls in Supabase payload
- RLS UPDATE policy created allowing spot creator or admin to modify spots
- All 11 translation keys for the ownership UI added in both French and English

## Task Commits

Each task was committed atomically:

1. **Task 1: Add user_id to Spot type + SpotsContext mappings + updateSpot image_urls** - `558eebb` (feat)
2. **Task 2: RLS UPDATE policy + translation keys** - `2b1e9de` (feat)

## Files Created/Modified
- `src/data/spots.ts` - Added user_id?: string to Spot interface
- `src/context/SpotsContext.tsx` - user_id mapping in fetchSpots/addSpot + image_urls in updateSpot payload
- `supabase/migrations/004_spot_owner_update.sql` - RLS UPDATE policy for spot owner or admin
- `src/translations/fr.json` - 11 new spot.* keys for ownership UI
- `src/translations/en.json` - 11 new spot.* keys for ownership UI

## Decisions Made
- user_id mapped as `s.user_id || null` in fetchSpots to handle static spots (which have no user_id) gracefully
- RLS policy uses email check for admin (`updock.app@gmail.com`) consistent with existing admin_permissions pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

Migration `004_spot_owner_update.sql` must be applied to Supabase manually:
- Run the SQL in Supabase SQL Editor to create the UPDATE policy on spots table

## Next Phase Readiness
- Data layer complete for Plan 02 (UI) which will display uploader info and edit overlay
- All translation keys ready for the edit form UI
- updateSpot can now persist image_urls changes

---
*Phase: 07-spot-ownership*
*Completed: 2026-04-05*
