---
phase: quick-260731-eul
plan: 01
subsystem: admin-ui
tags: [i18n, design-system, admin-dashboard]
requires: [src/ui/Button.tsx, src/context/LanguageContext.tsx]
provides: [i18n-clean-pending-tab, ds-button-admin-migration]
affects: [src/components/AdminDashboard.tsx, src/translations/fr.json, src/translations/en.json]
tech-stack:
  added: []
  patterns: ["DS Button with '!' important className overrides for non-DS colors (emerald/soft-rose)"]
key-files:
  created: []
  modified:
    - src/translations/fr.json
    - src/translations/en.json
    - src/components/AdminDashboard.tsx
decisions:
  - "Used variant=danger as structural base + '!bg-*'/'!text-*' important overrides for emerald approve and soft-rose delete, since no emerald/soft-rose DS variant exists"
  - "Reused existing keys spot.difficulty, spot.desc, admin.approve, admin.delete instead of duplicating"
metrics:
  duration: ~10min
  completed: 2026-07-31
status: awaiting-human-verify
---

# Phase quick-260731-eul Plan 01: AdminDashboard Pending Tab DS Coherence Summary

i18n cleanup, DS Button migration, and padding harmonization on the AdminDashboard Pending tab and Spot Preview Modal — closing the DS-coherence gap left after Phase 4 (which only covered the inline edit form and All Spots tab).

## Status

Tasks 1-3 (auto) COMPLETE and committed. Task 4 is a `checkpoint:human-verify` gate and is **PENDING** — awaiting on-device visual confirmation (emerald approve / soft-rose delete render, labels follow language toggle, tighter card padding). Control returned to the orchestrator for human verification.

## What Was Done

### Task 1 — 5 new admin.* i18n keys (commit bb3ee75)
Added to both `fr.json` and `en.json` immediately after `admin.delete`, in identical order (strict key parity preserved):

| Key | fr | en |
|-----|----|----|
| admin.tab_pending | En attente | Pending |
| admin.tab_all | Tous les spots | All Spots |
| admin.no_spots | Aucun spot | No spots yet |
| admin.coordinates | Coordonnées | Coordinates |
| admin.view_on_map | Voir sur la carte | View on Map |

`admin.view_on_map` intentionally does NOT reuse `spot.navigate` (external Maps nav is a different action).

### Task 2 — i18n replacements + padding harmonization (commit 43ac91c)
Replaced 8 hardcoded strings with `t()` lookups (tab labels, All-Spots empty state, Preview Modal Difficulté/Coordonnées/Description/Voir sur la carte/Approuver — reusing `spot.difficulty`, `spot.desc`, `admin.approve` where they exist). Pending card wrapper changed `p-6 rounded-2xl` → `p-4 rounded-xl` to match the All Spots card; rest of the class list untouched. `Photos (...)`, the All Spots `Pending` badge, and the Edit Overlay were left untouched per scope.

### Task 3 — DS Button migration (commit 2201d00)
Migrated the 5 targeted raw `<button>` elements to `<Button>`:
- Pending card **approve** → `variant="danger"` + `!bg-emerald-500 hover:!bg-emerald-600`, `loading`/`disabled` on `actionLoadingId`. The old `? '...' :` text was dropped — the Button spinner covers the loading state.
- Pending card **delete** → `variant="danger"` + `iconOnly` + `aria-label` + `!bg-rose-50 hover:!bg-rose-100 !text-rose-500`.
- Modal **View on Map** → `variant="primary"` (native sky, no override).
- Modal **approve** → `variant="danger"` + `!bg-emerald-500 hover:!bg-emerald-600`.
- Modal **delete** → `variant="danger"` + `iconOnly` + `aria-label` (native rose).

All onClick handler bodies preserved byte-for-byte. Out-of-scope buttons (header close, tabs, modal close X, photo nav, thumbnails, Edit Overlay, All Spots edit/delete) untouched.

## Verification

- Task 1 automated verify: PASS (5 keys present in both files + strict key parity).
- Task 2 automated verify: PASS (no target hardcoded strings remain; no `p-6 rounded-2xl`).
- Task 3 automated verify: PASS — `npm run build` (tsc -b + vite) succeeds; 6 `<Button` usages (5 new + 1 pre-existing Edit Overlay save).
- `npm run lint`: no NEW errors introduced. One pre-existing `@typescript-eslint/no-explicit-any` at AdminDashboard.tsx:286 (`d as any` in the Edit Overlay difficulty selector) is unrelated to this change (Phase 4 code, out of scope) and left untouched.

## Deviations from Plan

None — plan executed exactly as written.

## Deferred Issues

- Pre-existing lint error `AdminDashboard.tsx:286 — Unexpected any` in the Edit Overlay difficulty button. Out of scope (Phase 4 territory); not introduced here. Logged for a future cleanup, not fixed.

## Pending Checkpoint (Task 4 — human-verify)

Awaiting on-device check:
1. Pending/All Spots tab labels follow fr/en toggle; Pending cards show tighter `p-4 rounded-xl`.
2. Approve renders EMERALD, Delete renders SOFT rose (bg-rose-50 / text-rose-500) — confirms `!` overrides won. Approve shows loading spinner.
3. Preview Modal labels (Difficulté/Coordonnées/Description/View on Map/Approve) follow active language.
4. Footer: View on Map = sky, Approve = emerald, delete = solid rose; all functional.

## Self-Check: PASSED

- Files exist: src/translations/fr.json, src/translations/en.json, src/components/AdminDashboard.tsx — all present.
- Commits exist: bb3ee75, 43ac91c, 2201d00 — all in git log.
