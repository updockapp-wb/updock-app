---
phase: 01-audit-design-system
plan: 04
subsystem: design-system
tags: [ui, master-components, tailwind, framer-motion, a11y]
requires:
  - "src/index.css --radius-4xl token (plan 01-03)"
  - "framer-motion, lucide-react (existing deps)"
provides:
  - "src/ui/Modal.tsx — master overlay (AnimatePresence glass shell)"
  - "src/ui/Input.tsx — master form control (label + optional icon slot)"
  - "src/ui/Button.tsx — master control (variant/size/state matrix + a11y contract)"
affects:
  - "plan 01-06 (re-authors AuthModal onto these three masters)"
tech-stack:
  added: []
  patterns:
    - "src/ui/ hand-built master component library (D-04)"
    - "verbatim class extraction (D-05): variants widen API, never appearance"
    - "rounded-4xl token consumption in place of literal rounded-[32px]"
key-files:
  created:
    - src/ui/Modal.tsx
    - src/ui/Input.tsx
    - src/ui/Button.tsx
  modified: []
decisions:
  - "Button className passthrough added (Rule 2) so layout (e.g. w-full mt-4) is applied at usage, keeping the variant class string verbatim"
metrics:
  duration: ~3 min
  completed: 2026-07-28
requirements: [DS-02]
---

# Phase 01 Plan 04: AuthModal-donor Master Components (Modal, Input, Button) Summary

Three of the five DS-02 master components extracted verbatim from `AuthModal.tsx` into `src/ui/`: a Framer-Motion glass `Modal`, an icon-slot `Input`, and a full-matrix `Button` with an enforced icon-only a11y contract — the proof-critical trio that plan 01-06 re-authors AuthModal onto.

## What Was Built

- **`src/ui/Modal.tsx`** — `export default Modal({ isOpen, onClose, children })`. Codifies the AuthModal shell verbatim: `AnimatePresence` + `z-[5000]` backdrop (`bg-black/60 backdrop-blur-md`), glass surface (`bg-white/10 backdrop-blur-xl border border-white/20`), scale `0.95 → 1` open/close, and top-right close button. The 32px glass shell consumes the **`rounded-4xl`** token (plan 01-03 `--radius-4xl: 2rem`, identical 32px) instead of the literal `rounded-[32px]` — token wiring per UI-SPEC line 51 / DS-01, not a visual change.
- **`src/ui/Input.tsx`** — `export default Input(props)`. Label (`text-xs font-bold uppercase tracking-wider`) + optional `icon` slot + input, verbatim classes. `pl-12` when an icon is present, `pl-4` when absent. No inline `font-size` (global `input{font-size:16px}` iOS anti-zoom rule wins). `py-3` (12px declared exception) kept verbatim.
- **`src/ui/Button.tsx`** — `export default Button(props)`. Variant→class map with verbatim signatures (primary/secondary/ghost/danger), size rung sm/md/lg (`py-2`/`py-3`/`py-4`), `loading` (Loader2 spinner) + `disabled` handling. Default `primary` + `lg` preserves the AuthModal submit as the sole visual anchor. Icon-only variants enforce an `aria-label` (console.error in dev if missing) per the UI-SPEC accessibility contract.

## Verification

- `npm run build` (`tsc -b && vite build`) clean after each task.
- Grep gates passed for all three: `AnimatePresence` / `bg-black/60 backdrop-blur-md` / `z-[5000]` / `rounded-4xl` present and `rounded-[32px]` absent (Modal); `focus:ring-2 focus:ring-sky-500` / `placeholder:text-white/20` / `py-3` present and `font-size` absent (Input); `bg-sky-500 hover:bg-sky-400` / `aria-label` / `animate-spin` present (Button).
- `eslint` clean for `src/ui/*.tsx` (28 pre-existing errors in unrelated files are out of scope — see Deferred Issues).

## Deviations from Plan

### Auto-added Functionality

**1. [Rule 2 - Missing critical functionality] Button `className` passthrough**
- **Found during:** Task 3
- **Issue:** The plan's `ButtonProps` interface had no width/layout mechanism, but the AuthModal submit (which plan 01-06 must re-author onto this Button for pixel-identity) is `w-full mt-4`. Baking `w-full` into the primary variant would corrupt the verbatim class signature and misapply to ghost/icon-only buttons.
- **Fix:** Added optional `className?: string`, appended after the variant/size classes. Layout is applied at usage; the variant string stays byte-verbatim.
- **Files modified:** src/ui/Button.tsx
- **Commit:** 05360e5

## Deferred Issues

- `npm run lint` reports 28 pre-existing errors + 5 warnings in unrelated files (`no-explicit-any`, `react-refresh/only-export-components`, etc.). None originate from `src/ui/` (which lints clean). Out of scope per the plan's file boundary; logged for a future cleanup pass, not fixed here.

## Threat Surface

No new trust boundaries. Both threat-register mitigations satisfied: T-01-04-T (verbatim class extraction — grep gates assert key strings) and T-01-04-I (icon-only a11y — Button enforces `aria-label`).

## Self-Check: PASSED

- FOUND: src/ui/Modal.tsx, src/ui/Input.tsx, src/ui/Button.tsx
- FOUND commits: 67f52fc (Modal), 72227de (Input), 05360e5 (Button)
