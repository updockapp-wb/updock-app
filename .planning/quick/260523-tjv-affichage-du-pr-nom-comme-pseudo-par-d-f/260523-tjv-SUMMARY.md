---
phase: quick
plan: 260523-tjv
subsystem: auth
tags: [signup, display-name, migration]
key-files:
  created:
    - supabase/migrations/006_backfill_display_name_from_firstname.sql
  modified:
    - src/components/AuthModal.tsx
    - src/translations/fr.json
    - src/translations/en.json
decisions:
  - "useRef for displayNameTouched to avoid re-renders on every keystroke"
metrics:
  duration: 97s
  completed: 2025-05-23
---

# Quick Task 260523-tjv: Affichage du prenom comme pseudo par defaut - Summary

**Champ display_name obligatoire pre-rempli depuis le prenom, avec migration backfill et trigger mis a jour**

## What Was Done

### Task 1: Champ display_name obligatoire et pre-rempli dans AuthModal
- Replaced `username` state with `displayName` state + `displayNameTouched` ref
- Added `useEffect` to auto-fill displayName from firstName when not manually edited
- Replaced "Pseudo" input with "Nom d'affichage" input (required, same styling)
- Updated signup metadata to send `display_name` instead of `username`
- Updated profiles upsert to use `displayName`
- Reset `displayNameTouched` on login/signup mode toggle
- Updated translation keys in fr.json and en.json
- **Commit:** `f4ea48e`

### Task 2: Migration backfill display_name depuis first_name
- Created migration `006_backfill_display_name_from_firstname.sql`
- Backfills profiles where display_name is NULL or empty from auth.users first_name metadata
- Updated `handle_new_user` trigger to prefer `display_name` metadata, fallback to `first_name`
- **Commit:** `3e53ecc`

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- TypeScript build: PASSED (no errors)
- Migration file exists with correct UPDATE + trigger logic: PASSED

## Known Stubs

None.

## Self-Check: PASSED

- All 4 files verified present
- Both commits (f4ea48e, 3e53ecc) verified in git log
