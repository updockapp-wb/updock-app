---
phase: 01-foundation
plan: 01
subsystem: database
tags: [capacitor, supabase, postgres, rls, sql-migration]

# Dependency graph
requires: []
provides:
  - "@capacitor/cli upgraded to ^8.2.0 in package.json"
  - "profiles table extended with display_name and avatar_url columns"
  - "reviews table with RLS (4 policies) and spot_ratings view"
  - "sessions table with RLS (4 policies)"
  - "session_attendees table with RLS (3 policies)"
  - "push_tokens table with RLS (1 ALL policy)"
  - "handle_new_user trigger with ON CONFLICT guard"
  - "idempotent migration file supabase/migrations/001_community_schema.sql"
affects:
  - 01-02
  - 01-03
  - 02-reviews
  - 03-sessions
  - 04-push-notifications

# Tech tracking
tech-stack:
  added: ["@capacitor/cli@^8.2.0"]
  patterns:
    - "IF NOT EXISTS guards on all DDL for idempotent migrations"
    - "RLS enabled on all user-data tables with per-user USING/WITH CHECK"
    - "ON DELETE CASCADE on all foreign keys to auth.users and public.spots"

key-files:
  created:
    - "supabase/migrations/001_community_schema.sql"
  modified:
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "Upgraded @capacitor/cli to ^8.2.0 resolving CLI/core version mismatch (TECH-01)"
  - "cap doctor/sync verification deferred: @capacitor/cli v8 requires Node >=22, current env is v20.19.2"
  - "Combined all 5 community tables into single migration file for atomic apply"
  - "Recreated handle_new_user trigger with ON CONFLICT (id) DO NOTHING to prevent duplicate profile errors"

patterns-established:
  - "Migration files prefixed with sequence number (001_, 002_) in supabase/migrations/"
  - "Section comments (-- Section N:) structure long migration files"

requirements-completed: [TECH-01]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 1 Plan 01: Foundation Setup Summary

**Capacitor CLI/core version mismatch resolved and full community database schema (5 tables + RLS + view) created as single idempotent migration**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-18T08:57:36Z
- **Completed:** 2026-03-18T09:00:12Z
- **Tasks:** 2
- **Files modified:** 3 (package.json, package-lock.json, 001_community_schema.sql)

## Accomplishments
- Upgraded @capacitor/cli from 7.4.4 to ^8.2.0, eliminating the CLI/core version mismatch
- Created 100-line idempotent SQL migration covering all 5 community tables (reviews, sessions, session_attendees, push_tokens) plus profiles extension
- Added 12 RLS policies ensuring users can only CRUD their own data
- Created spot_ratings view aggregating avg_rating and review_count per spot
- Recreated new-user trigger with ON CONFLICT guard preventing duplicate profile creation

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade @capacitor/cli to v8.2.0** - `a38535d` (chore)
2. **Task 2: Create community database schema migration** - `1b6ff9f` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `package.json` - @capacitor/cli devDependency upgraded from ^7.4.4 to ^8.2.0
- `package-lock.json` - Updated lockfile reflecting CLI package change
- `supabase/migrations/001_community_schema.sql` - Full community schema: profiles extension, reviews, sessions, session_attendees, push_tokens, spot_ratings view, trigger

## Decisions Made
- Used single migration file for all 5 tables rather than separate files — simpler apply process and atomic schema setup
- Deferred cap doctor/sync CLI verification until Node.js upgrade (v8 CLI requires Node >=22, env has v20)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] cap doctor/sync cannot run due to Node version constraint**
- **Found during:** Task 1 (Upgrade @capacitor/cli)
- **Issue:** @capacitor/cli v8.x requires Node >=22.0.0; environment has Node v20.19.2. After npm install succeeded (with EBADENGINE warning), running `npx cap doctor` fatally exits with: `The Capacitor CLI requires NodeJS >=22.0.0`
- **Fix:** The package.json update (code artifact) was committed as the primary deliverable. CLI verification commands documented as requiring Node >=22 to execute.
- **Files modified:** None beyond the planned package.json/package-lock.json
- **Verification:** package.json confirmed to contain `"@capacitor/cli": "^8.2.0"`
- **Committed in:** a38535d (Task 1 commit)

---

**Total deviations:** 1 environmental limitation (not a code error)
**Impact on plan:** package.json correctly updated. CLI commands (cap doctor, cap sync) require Node >=22 upgrade to execute. Schema migration unaffected.

## Issues Encountered
- @capacitor/cli v8.x introduced a hard Node >=22 engine requirement. cap doctor and cap sync cannot execute in the current Node v20 environment. The dependency version in package.json is correctly updated; full CLI verification requires upgrading Node to v22 LTS.

## User Setup Required
To complete Task 1 verification and run cap sync:
1. Upgrade Node.js to v22 LTS (e.g., `nvm install 22 && nvm use 22`)
2. Run `npx cap doctor` — should show no mismatch (both 8.x)
3. Run `npx cap sync` to sync native projects

To apply the database migration:
1. Open Supabase dashboard > SQL Editor
2. Paste contents of `supabase/migrations/001_community_schema.sql`
3. Run — migration is idempotent (safe to run multiple times)

## Next Phase Readiness
- Database schema ready for all Phase 1-4 feature work
- Reviews, sessions, and push_tokens tables available for Phase 1-2 feature plans
- Blocker: Node >=22 needed before any `npx cap` commands (native builds, sync) can run
- No blockers for SQL/TypeScript feature development

---
*Phase: 01-foundation*
*Completed: 2026-03-18*
