---
phase: 09-community-stats
plan: 01
subsystem: ui
tags: [react, supabase, typescript, i18n, community-stats, profile]

# Dependency graph
requires:
  - phase: 08-bug-fixes
    provides: Profile.tsx with clean stats grid and nav row patterns
  - phase: 05-anonymous-access
    provides: Anonymous profile screen with language toggle structure
provides:
  - CommunityStatsScreen component with total spots, total users, spots-by-country KPIs
  - countryFromCoords utility with bounding-box country derivation and flag emoji helper
  - Authenticated nav row in Profile.tsx opening CommunityStatsScreen overlay
  - Anonymous stats preview (N spots | N riders) below signup CTA
  - Translation keys community_stats.* in fr.json and en.json
affects: [future phases using Profile.tsx, any phase adding global stats or community features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client-side country derivation from lat/lng using ordered bounding-box lookup (CH before FR)
    - Fixed overlay pattern (fixed inset-0 z-50) reusing AdminDashboard approach
    - Supabase count query with head:true for lightweight totals without data transfer
    - Static spots count (+10) added to DB count for accurate community totals
    - Intl.NumberFormat for locale-aware number formatting (fr-FR / en-US)

key-files:
  created:
    - src/utils/countryFromCoords.ts
    - src/components/CommunityStatsScreen.tsx
  modified:
    - src/components/Profile.tsx
    - src/translations/fr.json
    - src/translations/en.json

key-decisions:
  - "Country derived client-side from lat/lng bounding boxes (not GROUP BY country DB column) — no country column exists in spots table and static spots have no country field"
  - "Switzerland bounds checked BEFORE France bounds because CH is a geographic subset of FR bounding box"
  - "Nav row placed AFTER Upcoming Sessions and BEFORE Settings header for logical grouping of personal vs community data"
  - "Anonymous stats fetched only when !user to avoid redundant queries for authenticated users"
  - "CommunityStatsScreen rendered as fixed inset-0 z-50 overlay matching AdminDashboard pattern"

patterns-established:
  - "Fixed overlay component: return null when !isOpen, fixed inset-0 z-50 bg-slate-50 with header + back arrow"
  - "Anon-gated useEffect: guard with if (user) return to prevent redundant fetches"
  - "Static + DB total: staticSpots.length added to Supabase count result for accurate community totals"

requirements-completed: [STATS-01, STATS-02, STATS-03, STATS-04, STATS-05]

# Metrics
duration: ~25min
completed: 2026-04-15
---

# Phase 9 Plan 01: Community Stats Summary

**CommunityStatsScreen overlay with total spots (static+DB), total users, and flag-emoji spots-by-country breakdown, plus anonymous stats preview, wired into Profile.tsx via nav row**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-15T05:37:30Z
- **Completed:** 2026-04-15T06:05:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify — approved)
- **Files modified:** 5

## Accomplishments
- Created `src/utils/countryFromCoords.ts` with bounding-box country lookup for 14 regions and flag emoji converter
- Built `src/components/CommunityStatsScreen.tsx` showing 3 KPIs (total spots, total users, spots by country with flags), fetching from Supabase + combining static spots
- Modified `Profile.tsx` to add authenticated nav row (BarChart2 icon + ChevronRight), CommunityStatsScreen overlay, and anonymous stats preview ("N spots | N riders" below signup CTA)
- Added 6 translation keys per language (fr.json, en.json) under `community_stats.*` namespace

## Task Commits

Each task was committed atomically:

1. **Task 1: Create country utility and CommunityStatsScreen component** - `a455f2f` (feat)
2. **Task 2: Wire CommunityStatsScreen into Profile.tsx** - `383a59d` (feat)
3. **Task 3: Visual verification of community stats** - checkpoint:human-verify, approved by user (no code changes)

## Files Created/Modified
- `src/utils/countryFromCoords.ts` - Bounding-box country lookup for 14 regions; flag emoji converter via Unicode regional indicators
- `src/components/CommunityStatsScreen.tsx` - Full-screen overlay with 3 KPIs; fetches Supabase counts + static spots; country breakdown with flags
- `src/components/Profile.tsx` - Nav row for authenticated users, CommunityStatsScreen overlay render, anonymous stats preview with useEffect guard
- `src/translations/fr.json` - Added 6 community_stats.* keys (title, total_spots, total_users, spots_by_country, spots_count, nav_label)
- `src/translations/en.json` - Added 6 community_stats.* keys (English variants)

## Decisions Made
- Country derivation done client-side from lat/lng bounding boxes, not a DB column: no `country` column exists in spots table, and static spots have no country field — adding a DB column + migration + backfill would be significantly more complex
- Switzerland bounds checked BEFORE France in COUNTRY_BOUNDS array because CH is geographically contained within FR bounding box; checking FR first would incorrectly classify Swiss spots
- Nav row placed after Upcoming Sessions and before Settings header to group personal activity data together, matching the user's intent of "between stats and settings"
- Anonymous stats fetched only in a `!user`-gated useEffect to avoid redundant Supabase queries for authenticated users who already load stats in CommunityStatsScreen

## Deviations from Plan

None - plan executed exactly as written. The country derivation approach was pre-authorized in the PLAN.md itself as a noted deviation from CONTEXT.md's "GROUP BY country" which was infeasible without a DB migration.

## Issues Encountered

None - TypeScript compiled clean, visual verification passed on first review.

## User Setup Required

None - no external service configuration required. Supabase anon RLS was already confirmed operational from Phase 5.

## Next Phase Readiness
- Phase 9 is the final planned phase in the current milestone
- Community stats feature is complete and live
- Future phases could expand stats (e.g., monthly active spots, sessions count) by extending CommunityStatsScreen and adding Supabase queries

---
*Phase: 09-community-stats*
*Completed: 2026-04-15*
