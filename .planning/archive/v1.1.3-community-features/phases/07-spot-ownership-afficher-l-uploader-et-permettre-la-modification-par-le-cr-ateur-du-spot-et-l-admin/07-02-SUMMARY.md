---
phase: 07-spot-ownership
plan: 02
subsystem: frontend
tags: [react, typescript, supabase-storage, spot-editing, uploader-display]

# Dependency graph
requires:
  - phase: 07-spot-ownership
    plan: 01
    provides: user_id on Spot, updateSpot with image_urls, translation keys
provides:
  - uploader display line in SpotDetail (avatar + name)
  - edit overlay for spot creator and admin
  - photo management (upload new, delete existing)
affects:
  - src/components/SpotDetail.tsx

# Tech stack
added: []
patterns:
  - "Fetch uploader profile from profiles table by spot.user_id"
  - "Edit overlay with absolute positioning over content"
  - "Photo upload to Supabase Storage spots bucket with URL tracking"
  - "Admin check via user email (updock.app@gmail.com)"

# Key files
created: []
modified:
  - src/components/SpotDetail.tsx

# Decisions
key-decisions:
  - "AVATARS constant duplicated in SpotDetail (same pattern as ReviewList) for avatar resolution"
  - "Edit overlay uses absolute inset-0 positioning over content div, not a separate modal"
  - "Photo deletion only removes URL from image_urls array, does not delete from Storage (per RESEARCH.md Pitfall 4)"
  - "Admin identified by email check (updock.app@gmail.com) consistent with existing pattern"

# Metrics
duration: 4
completed: "2026-04-05T21:12:46Z"
tasks_completed: 2
tasks_total: 2
files_modified: 1
---

# Phase 07 Plan 02: Uploader Display and Edit Overlay Summary

Uploader line with avatar/name below spot title, plus full edit overlay with photo management for creator/admin in SpotDetail.

## What Was Done

### Task 1: Add uploader display line and edit button (a4ff450)
- Added Pencil icon import and StartType import
- Added AVATARS constant (5 preset avatars) for avatar resolution
- Added uploaderProfile state and useEffect to fetch display_name, avatar_url, avatar_id from profiles table
- Rendered uploader line below spot title: avatar image + display name + edit button
- Edit button only visible when user is spot creator (user_id match) or admin (email check)
- Added isEditing state, reset on spot change

### Task 2: Add edit overlay with photo management (eab3ec4)
- Added Save, Plus, Trash2 icons and useSpots hook
- Added editForm, newPhotoFiles, photosToDelete, isSaving state
- Edit button initializes editForm with spread copy of current spot data
- Added handleSaveEdit: uploads new photos to Supabase Storage, computes final URLs (existing minus deleted plus new), calls updateSpot
- Added full edit overlay JSX with AnimatePresence animation:
  - Name input field
  - Type multi-select buttons (Dockstart, Rockstart, Dropstart, Deadstart, Rampstart)
  - Description textarea
  - Difficulty selector (Easy, Medium, Hard, Extreme)
  - Photo grid: existing photos with delete button, new photo previews with remove, add photo button (max 5 total)
  - Save button with loading state
- Added relative positioning to content container for overlay absolute positioning

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npm run build` passes with zero errors (both tasks verified)
- SpotDetail.tsx contains uploader profile fetch, edit button with creator/admin check, full edit overlay with all fields and photo management

## Self-Check: PASSED
