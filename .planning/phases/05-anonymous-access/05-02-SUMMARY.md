---
phase: 05-anonymous-access
plan: 02
subsystem: ui
tags: [react, lucide-react, auth-gating, lock-badges, anonymous-access]

# Dependency graph
requires:
  - phase: 05-anonymous-access/01
    provides: "Auth wall removal, AuthModal always available, anonymous routing"
provides:
  - "Auth-gated NavBar favorites tab and add-spot button with lock badges"
  - "Auth-gated SpotDetail favorite, review form, session form with lock badges"
  - "onOpenAuth callback propagated from App.tsx to NavBar and SpotDetail"
affects: [05-anonymous-access/03]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Variant A lock overlay (icon badge on circular buttons)", "Variant B inline lock suffix (CTA buttons)", "Variant C lock suffix (NavBar labels)", "onOpenAuth callback prop pattern for auth gating"]

key-files:
  created: []
  modified: ["src/components/NavBar.tsx", "src/components/SpotDetail.tsx", "src/App.tsx"]

key-decisions:
  - "SpotDetail interface updated in Task 1 commit to unblock App.tsx prop passing (Rule 3 - blocking)"
  - "Re-added user to useAuth() destructure in App.tsx (was removed in 05-01 as unused)"
  - "Heart icon shows slate-600 (unfilled) for anonymous users since they have no favorites state"

patterns-established:
  - "Auth gate pattern: if (!user) { onOpenAuth?.(); return; } before protected actions"
  - "Lock badge Variant A: absolute positioned 16px white circle with Lock size=10"
  - "Lock badge Variant B: inline Lock size=14 after CTA label text"
  - "Lock badge Variant C: inline Lock size=10/12 after nav label text"

requirements-completed: [ANON-03, ANON-04, ANON-06, ANON-07]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 05 Plan 02: Auth-Gate UI Summary

**Lock badges on NavBar (favorites, add-spot) and SpotDetail (favorite, review form, session form) with onOpenAuth callback opening AuthModal for anonymous users**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T22:44:35Z
- **Completed:** 2026-03-22T22:49:07Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- NavBar favorites tab and add-spot button show lock icons and open AuthModal for anonymous users
- SpotDetail favorite button has Variant A lock overlay, review/session forms show locked CTA buttons
- GPS navigation button remains fully accessible without account
- Reviews and sessions lists remain readable (read-only) for anonymous users

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth-gate NavBar and propagate onOpenAuth from App.tsx** - `e0385fe` (feat)
2. **Task 2: Auth-gate SpotDetail actions with lock badges** - `e26d7e9` (feat)

## Files Created/Modified
- `src/components/NavBar.tsx` - Added user/onOpenAuth props, lock badges on favorites and add-spot, auth guards on click handlers
- `src/components/SpotDetail.tsx` - Added onOpenAuth prop, lock badge on favorite button, locked CTA buttons for review/session forms
- `src/App.tsx` - Re-added user to useAuth destructure, passes user/onOpenAuth to NavBar (x2) and SpotDetail

## Decisions Made
- SpotDetail interface updated in Task 1 commit to allow App.tsx to pass onOpenAuth without TS error (Rule 3 blocking fix)
- Re-added `user` to `useAuth()` destructure in App.tsx (removed in 05-01 as unused, now needed for NavBar/SpotDetail prop)
- Heart icon in SpotDetail shows slate-600 (unfilled) for anonymous users since `isFavorite` would be meaningless without user context

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SpotDetail interface updated early in Task 1**
- **Found during:** Task 1 (NavBar auth-gating)
- **Issue:** Plan specified updating SpotDetail interface in Task 2, but App.tsx needed to pass onOpenAuth in Task 1 which caused TS2322 build error
- **Fix:** Added onOpenAuth to SpotDetailProps interface and used underscore prefix (_onOpenAuth) to suppress TS6133 unused-var error until Task 2
- **Files modified:** src/components/SpotDetail.tsx
- **Verification:** npm run build passes
- **Committed in:** e0385fe (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to maintain build-per-task. No scope creep.

## Issues Encountered
- Vite build ran out of memory on first attempt (Node default heap too small for production build) -- resolved with NODE_OPTIONS="--max-old-space-size=4096"

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All auth-gated UI elements in place with lock badges
- Ready for Plan 03 (final anonymous access polish/testing)

## Self-Check: PASSED

- All 3 modified files exist on disk
- Commit e0385fe (Task 1) found in git log
- Commit e26d7e9 (Task 2) found in git log

---
*Phase: 05-anonymous-access*
*Completed: 2026-03-22*
