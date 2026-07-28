---
phase: 05-anonymous-access
plan: 01
subsystem: ui, database
tags: [supabase, rls, react, i18n, anonymous-access]

requires:
  - phase: 04-push-notifications
    provides: "Complete app with auth wall, sessions, notifications"
provides:
  - "RLS SELECT policies for anon role on reviews, sessions, session_attendees"
  - "Auth wall removed — app shell renders for all users unconditionally"
  - "Translation keys for anonymous profile screen (fr + en)"
affects: [05-02, 05-03]

tech-stack:
  added: []
  patterns: ["Unconditional app render (no auth wall ternary)"]

key-files:
  created:
    - supabase/migrations/003_anon_read_access.sql
  modified:
    - src/App.tsx
    - src/translations/fr.json
    - src/translations/en.json
  deleted:
    - src/components/LandingPage.tsx

key-decisions:
  - "Removed `user` from useAuth() destructure since auth wall ternary is gone — avoids TS6133 unused variable error"
  - "AuthModal moved inside vaul-drawer-wrapper div, always available regardless of auth state"

patterns-established:
  - "App renders full shell unconditionally; auth checks happen at feature level, not app level"

requirements-completed: [ANON-01, ANON-02, ANON-08]

duration: 3min
completed: 2026-03-22
---

# Phase 5 Plan 1: Auth Wall Removal Summary

**Anon RLS policies for reviews/sessions/attendees, auth wall removed from App.tsx, LandingPage deleted, i18n keys for anonymous profile**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T22:39:12Z
- **Completed:** 2026-03-22T22:42:30Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 3 modified, 1 deleted)

## Accomplishments
- Created Supabase RLS migration with 3 SELECT policies granting anon role read access to reviews, sessions, and session_attendees
- Removed auth wall ternary from App.tsx so anonymous users see the full app shell (map, tabs, spot details)
- Deleted LandingPage component entirely
- Added 4 translation keys for anonymous profile screen in both fr.json and en.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase RLS migration + translation keys** - `e63c838` (feat)
2. **Task 2: Remove auth wall from App.tsx and delete LandingPage** - `f8adc78` (feat)

## Files Created/Modified
- `supabase/migrations/003_anon_read_access.sql` - RLS SELECT policies for anon role on reviews, sessions, session_attendees
- `src/App.tsx` - Auth wall ternary removed, LandingPage import removed, AuthModal unified inside wrapper
- `src/translations/fr.json` - Added anon_profile.* keys (title, subtitle, btn_login, btn_signup)
- `src/translations/en.json` - Added anon_profile.* keys (title, subtitle, btn_login, btn_signup)
- `src/components/LandingPage.tsx` - Deleted

## Decisions Made
- Removed `user` from `useAuth()` destructure since it was only used in the auth wall ternary (now removed). This avoids TS6133 unused variable build error.
- AuthModal placed inside the vaul-drawer-wrapper div rather than outside, keeping it always available for Profile's onOpenAuth callback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `user` variable from useAuth() destructure**
- **Found during:** Task 2 (Remove auth wall)
- **Issue:** After removing `{!user ? ... : ...}` ternary, the `user` variable was no longer referenced, causing TS6133 build error
- **Fix:** Changed `const { user, loading: authLoading } = useAuth()` to `const { loading: authLoading } = useAuth()`
- **Files modified:** src/App.tsx
- **Verification:** `npm run build` passes cleanly
- **Committed in:** f8adc78 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal — necessary fix for TypeScript strict mode. No scope creep.

## Issues Encountered
None.

## User Setup Required
RLS migration `003_anon_read_access.sql` must be applied manually to Supabase via `supabase db push` or SQL editor in Supabase dashboard.

## Next Phase Readiness
- Auth wall removed, app renders for anonymous users
- RLS policies ready to apply for anon read access
- Translation keys in place for Plan 02 (anonymous profile screen)
- Plan 02 can proceed: auth-gated features (favorites, add spot, sessions write) and anonymous profile screen

---
*Phase: 05-anonymous-access*
*Completed: 2026-03-22*
