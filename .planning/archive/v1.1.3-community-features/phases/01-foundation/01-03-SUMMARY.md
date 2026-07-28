---
phase: 01-foundation
plan: "03"
subsystem: profile
tags: [profile, context, supabase-storage, avatar-upload, display-name]
dependency_graph:
  requires: [01-01]
  provides: [ProfileContext, useProfile, ProfileProvider]
  affects: [App.tsx, Profile.tsx]
tech_stack:
  added: []
  patterns: [React context pattern (FavoritesContext model), Supabase Storage upload with upsert, avatar fallback chain]
key_files:
  created:
    - src/context/ProfileContext.tsx
  modified:
    - src/App.tsx
    - src/components/Profile.tsx
    - src/translations/en.json
    - src/translations/fr.json
decisions:
  - "ProfileProvider placed inside FavoritesProvider for consistent future cross-context access"
  - "selectPresetAvatar clears avatar_url to null — explicit fallback signal for preset display"
  - "Avatar upload uses upsert:true with fixed path user_id/avatar.ext to overwrite previous upload"
metrics:
  duration: "~4 min"
  completed: "2026-03-18"
  tasks_completed: 2
  files_modified: 5
requirements: [PROF-01, PROF-02]
---

# Phase 01 Plan 03: User Profile — Display Name and Avatar Upload Summary

**One-liner:** ProfileContext with display name editing and real avatar photo upload to Supabase Storage, replacing direct supabase calls in Profile.tsx.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create ProfileContext with display name and avatar management | f404a7e | src/context/ProfileContext.tsx, src/App.tsx |
| 2 | Update Profile screen with display name editing and avatar upload | d857c78 | src/components/Profile.tsx, src/translations/en.json, src/translations/fr.json |

## What Was Built

**ProfileContext.tsx** — new React context following the FavoritesContext pattern:
- `ProfileProvider` fetches `display_name`, `avatar_url`, `avatar_id` from the `profiles` table on user login
- `updateDisplayName(name)` — upserts display_name with optimistic local state update
- `uploadAvatar(file)` — uploads to Supabase Storage `avatars` bucket at path `{user_id}/avatar.{ext}` with upsert, saves public URL to profiles table
- `selectPresetAvatar(avatarId)` — upserts avatar_id and clears avatar_url (explicit preset signal)
- `useProfile()` hook with proper error boundary message

**Profile.tsx** — updated to use ProfileContext:
- Removed direct `supabase.from('profiles')` fetch and `handleAvatarSelect` mutation
- Removed local `avatarId` state — now sourced from `profile.avatar_id`
- Display name section added above stats: shows current name (or "Tap to set your name"), click to edit inline
- Avatar upload button with Camera icon added inside the avatar picker popover
- Avatar fallback chain: `profile.avatar_url` (real photo) > preset SVG by `profile.avatar_id` > AVATARS[0]
- Header name fallback: `profile.display_name` > `user.email.split('@')[0]` > 'Updocker'

**App.tsx** — `<ProfileProvider>` added inside `<FavoritesProvider>`, wrapping `<AppContent />`.

**Translation keys added** (en.json + fr.json): `profile.display_name`, `profile.name_placeholder`, `profile.set_name`, `profile.save`, `profile.upload_photo`.

## Verification

- `npm run build` — PASSED (no TypeScript errors)
- `npm run lint` — Pre-existing errors only (set-state-in-effect and no-explicit-any patterns from other files; same pattern as FavoritesContext.tsx)
- ProfileContext exports ProfileProvider and useProfile
- Profile.tsx has no direct supabase.from('profiles') calls
- Avatar fallback chain implemented correctly
- ProfileProvider in App.tsx provider tree

## Deviations from Plan

None — plan executed exactly as written.

## Notes

The `avatars` Supabase Storage bucket must be created manually in the Supabase dashboard before avatar uploads will work (documented in plan as expected). Upload will fail gracefully with `console.error` if the bucket does not exist.

## Self-Check: PASSED

- src/context/ProfileContext.tsx: FOUND
- src/App.tsx: FOUND
- src/components/Profile.tsx: FOUND
- src/translations/en.json: FOUND
- src/translations/fr.json: FOUND
- Commit f404a7e: FOUND
- Commit d857c78: FOUND
