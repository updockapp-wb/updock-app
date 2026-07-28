---
phase: 01-foundation
plan: "02"
subsystem: ui-components
tags: [bug-fix, gps, forms, memory-leak, i18n]
dependency_graph:
  requires: []
  provides: [GPS loading state in list tab, simplified add-spot form, URL memory leak fix]
  affects: [src/components/NearbySpotsList.tsx, src/components/AddSpotForm.tsx]
tech_stack:
  added: []
  patterns: [URL.revokeObjectURL cleanup in useEffect, split early-return conditions]
key_files:
  modified:
    - src/components/NearbySpotsList.tsx
    - src/components/AddSpotForm.tsx
    - src/translations/en.json
    - src/translations/fr.json
decisions:
  - "Kept useEffect cleanup dependency on imagePreviews array so revocation fires when the array shrinks as well as on unmount"
  - "Pre-existing lint errors (no-explicit-any, set-state-in-effect across codebase) treated as out-of-scope; build passes cleanly"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-18"
  tasks_completed: 2
  files_modified: 4
---

# Phase 1 Plan 02: UI Bug Fixes (FIX-01, FIX-02) Summary

**One-liner:** Split compound GPS early-return into animated loading/empty states and stripped height field plus URL.revokeObjectURL cleanup from AddSpotForm.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Fix list tab blank screen with GPS loading state (FIX-01) | 93d8f43 | NearbySpotsList.tsx, en.json, fr.json |
| 2 | Remove height field and fix memory leak in AddSpotForm (FIX-02) | 4e4c271 | AddSpotForm.tsx |

## What Was Built

### Task 1 — GPS loading state in list tab (FIX-01)

`NearbySpotsList.tsx` previously returned `null` for both "GPS not yet resolved" and "GPS resolved but no nearby spots" via a single compound condition. The list tab appeared completely blank on first open until both conditions were satisfied simultaneously.

The compound `if (!userLocation || nearbySpots.length === 0) return null` was split into two separate early returns:

1. **GPS loading state** (`userLocation === null`): renders the existing card container with a pulsing `Navigation` icon and `t('nearby.locating')` text.
2. **Empty state** (`nearbySpots.length === 0`): renders the card container with a static `MapPin` icon and `t('nearby.empty')` text.

Translation keys `nearby.locating` and `nearby.empty` were added to both `en.json` and `fr.json`.

### Task 2 — Remove height field and fix URL memory leak (FIX-02)

Three categories of changes to `AddSpotForm.tsx`:

- **Height field removed:** `height` state variable, its `resetForm()` call, its `handleSubmit` payload entry (`parseFloat(height)`), and the entire height `<input>` block were deleted. The difficulty select now sits in a full-width `<div>` instead of a two-column flex row.
- **Memory leak fixed:** `URL.revokeObjectURL(imagePreviews[index])` added as the first line of `handleRemoveImage`, ensuring each removed preview URL is released immediately.
- **Unmount cleanup added:** A `useEffect` returning a cleanup function that calls `imagePreviews.forEach(url => URL.revokeObjectURL(url))` was added with `[imagePreviews]` as the dependency, releasing all outstanding object URLs when the component unmounts or the previews array changes.

`useEffect` was already imported on line 3 (`import { useState, useEffect } from 'react'`), so no import change was needed.

## Verification Results

- `NearbySpotsList.tsx` contains `if (!userLocation)` as a separate condition: PASS
- `NearbySpotsList.tsx` contains `animate-pulse`: PASS
- `NearbySpotsList.tsx` contains `t('nearby.locating')` and `t('nearby.empty')`: PASS
- `en.json` and `fr.json` contain both new translation keys: PASS
- `AddSpotForm.tsx` contains zero occurrences of `height`: PASS
- `AddSpotForm.tsx` contains two occurrences of `URL.revokeObjectURL`: PASS
- `npm run build` passes (TypeScript + Vite): PASS
- `npm run lint` — 24 pre-existing errors across 9 files, none introduced by this plan: PASS (no regressions)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/components/NearbySpotsList.tsx` — FOUND
- `src/components/AddSpotForm.tsx` — FOUND
- `src/translations/en.json` — FOUND
- `src/translations/fr.json` — FOUND
- Commit 93d8f43 — FOUND
- Commit 4e4c271 — FOUND
