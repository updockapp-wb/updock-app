# Phase 2: Navigation & Vue Carte / Spots - Pattern Map

**Mapped:** 2026-07-29
**Files analyzed:** 6 (all modifications to existing files — no net-new files)
**Analogs found:** 6 / 6 (all in-repo — this phase is a refactor, every analog is a sibling or the file itself)

> **Nature:** refactor byte-identique (héritage Phase 1). Every "analog" below is real
> existing code in this repo. The planner copies patterns verbatim, not conceptually —
> the whole point is zero observable change. Where a token aliases a literal, the
> aliasing is already proven in `src/index.css` (lines 13-19).

## File Classification

| File (modified) | Role | Data Flow | Closest Analog | Match Quality |
|-----------------|------|-----------|----------------|---------------|
| `src/config/mapbox.ts` (add `MAP_COLORS`) | config | transform (data → paint) | `src/config/mapbox.ts` existing `mapboxConfig` + `Map.tsx` `LayerProps` constants (lines 19-97) | exact (same file / same module pattern) |
| `src/components/Map.tsx` (colors + memoization + top bar) | component | event-driven + request-response | itself (self-refactor) — `spotsGeoJson` useMemo lines 141-159; layers 19-97 | exact |
| `src/ui/Modal.tsx` (add light/sheet variant) | component (DS master) | request-response | `src/ui/Header.tsx` `surface` prop pattern (lines 7, 25-26) | role-match (sibling DS master with the exact prop pattern to replicate) |
| `src/components/FiltersModal.tsx` (migrate to DS) | component | request-response | `src/components/AuthModal.tsx` (lines 83-89 — sole existing `Modal`+`Header` consumer) | exact (same modal-consumer role) |
| `src/components/NavBar.tsx` (token wiring) | component | request-response | `src/ui/Button.tsx` variant comments (lines 16-30) — the canonical byte-identical wiring precedent | role-match (token-wiring precedent) |
| `src/components/AddSpotForm.tsx` (lines 62-66 leak fix) | component | file-I/O (blob URL lifecycle) | itself — `handleRemoveImage` lines 56-60 (correct revoke pattern) + `resetForm` lines 27-35 | exact (self, correct pattern already present) |

## Pattern Assignments

### `src/config/mapbox.ts` — add `MAP_COLORS` (config, transform)

**Analog:** the file's own existing `mapboxConfig` export (module-level `as const`-style config object) + the hex literals currently inline in `Map.tsx` layers.

**Existing config-object pattern** (`src/config/mapbox.ts` lines 1-4):
```typescript
export const mapboxConfig = {
    accessToken: 'pk.eyJ1Ijoi...',
    styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12'
};
```

**Source of the 17 hex values to centralize** (`Map.tsx` lines 25-45, 58-68, 77-95). Exact values, extracted verbatim (D-01 — keep as literals in JS, NOT CSS tokens):
```typescript
// clusterLayer circle-color step:   '#22d3ee' (cyan-400, <5), '#38bdf8' (sky-400, 5-20), '#ffffff' (>20)
// clusterLayer circle-stroke-color: '#fff'
// clusterCountLayer text-color step: '#ffffff', '#ffffff', '#0f172a'
// unclusteredPoint case: pending '#f97316'
//   match by type: Dockstart '#38bdf8', Rockstart '#f472b6', Dropstart '#2dd4bf',
//                  Deadstart '#818cf8', Rampstart '#fbbf24', Beachstart '#f59e0b', default '#38bdf8'
//   circle-stroke-color: '#fff'
```

**Target shape** (from RESEARCH.md Pattern 2 — `as const` JS object, injected into `paint` expressions):
```typescript
export const MAP_COLORS = {
  clusterSmall: '#22d3ee', clusterMedium: '#38bdf8', clusterLarge: '#ffffff',
  clusterTextLight: '#ffffff', clusterTextDark: '#0f172a',
  pending: '#f97316',
  Dockstart: '#38bdf8', Rockstart: '#f472b6', Dropstart: '#2dd4bf',
  Deadstart: '#818cf8', Rampstart: '#fbbf24', Beachstart: '#f59e0b',
  markerStroke: '#fff', // note: layers currently use '#fff' (3-char), keep byte-identical
} as const;
```

> **Byte-identical guard (D-01):** `#38bdf8` is sky-400 v3-era; `--color-primary` aliases sky-500 (v4 ≈ `#00a6f4`). They are NOT equal — do NOT wire any marker color to a token. All stay literal. (`src/index.css` lines 8-13 confirm the v4 OKLCH drift.)
> **`#fff` vs `#ffffff`:** current layers mix `'#fff'` (stroke, lines 44/94) and `'#ffffff'` (cluster fill/text). Preserve each exactly — do not normalize, Mapbox renders them identically but the constraint is byte-identical source fidelity for review.

---

### `src/components/Map.tsx` — split-memoization + color refs + top bar (component, event-driven)

**Analog:** the file itself (self-refactor).

**Current memoization to refine** (lines 141-159 — do NOT rewrite from scratch, split it):
```typescript
const spotsGeoJson: FeatureCollection = useMemo(() => {
    const filtered = filter === 'All' ? spots : spots.filter(s => s.type.includes(filter as StartType));
    return {
        type: 'FeatureCollection',
        features: filtered.map(spot => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [spot.position[1], spot.position[0]] },
            properties: { id: spot.id, name: spot.name, type: spot.type[0], is_approved: spot.is_approved }
        }))
    };
}, [spots, filter]);
```

**Target split** (RESEARCH Pattern 1): `allFeatures = useMemo(..., [spots])` then filtered `useMemo(..., [allFeatures, filter])`.

> **Pitfall 4 (regression risk):** current filter tests `s.type.includes(filter)` on the FULL type array, but each feature stores only `type: spot.type[0]`. If you filter on `properties.type` post-split, multi-type spots vanish. **Fix:** either keep filtering on `spots` (retain full array access), or store the full `spot.type` array in properties. Manual recipe: compare visible markers per filter before/after.
> **Pitfall 2:** keep `<Source data={...} cluster>` → `setData` path. Do NOT switch to `map.setFilter()` (breaks cluster counts). Memoization is React-side allocation only.

**Established layer pattern to preserve** (lines 19-97): layers stay module-level `LayerProps` constants; only the inline hex become `MAP_COLORS.*` refs.

**Top bar filter button** (lines 239-244) — already uses `bg-sky-50 text-sky-600` active state; part of the D-02/NAV-01 chrome. `bg-sky-50`/`text-sky-600` have NO token slot → stay literal (Pitfall 5). Only pure `sky-500` occurrences are wirable.

**Integration point (D-02):** `<FiltersModal isOpen onClose selectedFilter onFilterChange>` (lines 368-373) — prop contract stays identical after FiltersModal migrates internally.

---

### `src/ui/Modal.tsx` — extend with light/bottom-sheet variant (DS master, request-response)

**Analog:** `src/ui/Header.tsx` — the sibling DS master that ALREADY solved this exact problem with a `surface` prop.

**The prop pattern to replicate** (`Header.tsx` lines 7, 16-26):
```typescript
surface?: 'glass' | 'light'; // controls text color: white (glass) vs slate-800 (light)
// ...
export default function Header({ title, subtitle, onClose, surface = 'glass' }: HeaderProps) {
    const titleColor = surface === 'glass' ? 'text-white' : 'text-text';
    const subtitleColor = surface === 'glass' ? 'text-white/50' : 'text-muted';
```
> Default `= 'glass'` keeps existing consumers untouched. Modal must do the same (default = current glass) — verified sole current consumer is `AuthModal.tsx` (glass), so a glass default is retro-compatible (RESEARCH A2/Open Q1, `grep "ui/Modal" src/`).

**Current Modal shell — the GLASS variant (keep verbatim as default)** (`Modal.tsx` lines 13-32):
```typescript
<AnimatePresence>
  {isOpen && (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-sm rounded-4xl p-8 shadow-2xl relative overflow-hidden"
      >
        <Button variant="ghost" iconOnly aria-label="Close" onClick={onClose} className="absolute top-4 right-4 !p-2">
          <X size={20} className="text-white/70" />
        </Button>
        {children}
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

**The LIGHT/sheet variant classes — extract VERBATIM from `FiltersModal.tsx` lines 29-37** (this is the byte-identical source of truth for the new variant):
```typescript
// container:  "fixed inset-0 z-[3000] flex items-end sm:items-center justify-center pointer-events-none"
// backdrop:   "absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" (onClick={onClose})
// panel:      "relative z-10 bg-white w-full max-w-sm sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl pointer-events-auto"
// animation:  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
```
> **Pitfall 1 (critical):** glass and light differ on EVERY axis — surface (`bg-white/10` vs `bg-white`), z-index (`5000` vs `3000`), animation (scale vs slide-y), backdrop (`bg-black/60 blur-md` vs `bg-black/20 blur-sm`), radius (`rounded-4xl p-8` vs `rounded-t-3xl p-6`), align (`items-center` vs `items-end sm:items-center`). Wrapping FiltersModal in the unmodified glass Modal = guaranteed visual regression. Extend FIRST.
> Note the light variant does NOT render an internal close Button (FiltersModal's close lives in its `<Header>` row). Gate the built-in close button on the glass variant, or make the sheet variant render `{children}` without the absolute close.

---

### `src/components/FiltersModal.tsx` — migrate to DS (component, request-response)

**Analog:** `src/components/AuthModal.tsx` lines 83-89 — the ONLY existing `Modal` + `Header` consumer; copy its composition shape.

**Reference consumption pattern** (`AuthModal.tsx` lines 83-89):
```typescript
<Modal isOpen={isOpen} onClose={onClose}>
    <Header
        surface="glass"
        title={isLogin ? t('auth.title_login') : t('auth.title_signup')}
        subtitle={...}
    />
    {/* body */}
</Modal>
```

**Target for FiltersModal** — same shape, but `surface="light"` + sheet layout:
```typescript
<Modal isOpen={isOpen} onClose={onClose} surface="light" /* + layout="sheet" per your Modal API */>
    <Header surface="light" title={t('filters.title')} onClose={onClose} />
    {/* filter rows + CTA */}
</Modal>
```

**Header mapping** — FiltersModal's current header (lines 38-43) IS the exact class source of Header's row-with-close shape (see `Header.tsx` line 29 comment "FiltersModal:38-43"). Replacing it with `<Header surface="light" title onClose>` is byte-identical by construction:
```typescript
// FiltersModal current (lines 38-43) — matches Header's row-with-close output verbatim:
<div className="flex justify-between items-center mb-6">
  <h2 className="text-2xl font-bold text-slate-800">{t('filters.title')}</h2>
  <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
    <X size={20} className="text-slate-600" />
  </button>
</div>
```
> Header renders `text-text` (aliases slate-800) and the close button `bg-slate-100 ... text-slate-600` — identical to the literals above.

**Stays CUSTOM (no DS variant matches — do NOT force):**
- Filter rows (lines 48-71): `border-2 border-sky-500 bg-sky-50` selected state, icon chips, check pill. No Button variant covers this. Keep as-is.
- "Voir les résultats" CTA (lines 75-80): `bg-slate-900 text-white rounded-2xl` — `Button` variants are primary(sky)/secondary(slate-200)/ghost/danger(rose); NONE match `bg-slate-900` (RESEARCH A4). Keep custom OR add a new verbatim variant. Default: keep custom to minimize scope.

---

### `src/components/NavBar.tsx` — token wiring (component, request-response)

**Analog:** `src/ui/Button.tsx` lines 16-30 — the canonical precedent for byte-identical token wiring with inline justification comments.

**Wiring precedent to follow** (`Button.tsx` line 22):
```typescript
// bg-primary aliases var(--color-sky-500) (src/index.css) — byte-identical render to
// the original bg-sky-500 literal. No --color-primary-hover/shadow token exists yet, so those stay literal.
primary: 'bg-primary hover:bg-sky-400 text-white ...',
```

**Wirable occurrences in NavBar — ONLY pure `text-sky-500`** (mobile active state, lines 82, 93, 125, 133):
```typescript
// 'text-sky-500'  →  'text-primary'   ✅ --color-primary aliases var(--color-sky-500), identical render
```

**NON-wirable — stay literal (Pitfall 5, no token slot):**
```typescript
// desktop active:  'bg-sky-50 text-sky-600'           (lines 21, 32, 43, 51) — sky-50/600 have no token
// CTA gradients:   'from-sky-500 to-blue-600'         (line 63, vertical)
//                  'from-sky-400 to-blue-500'         (line 110, mobile FAB)
//                  'shadow-sky-500/25', 'shadow-sky-500/30'  (lines 63, 110)
```
> **Duplication (Claude's Discretion):** NavBar renders twice — `isVertical` desktop (lines 16-73) vs mobile bottom bar (lines 76-140). Refactoring the duplication is OPTIONAL (CONTEXT.md), only acceptable if token wiring naturally justifies it AND behavior is unchanged.
> **Legacy exceptions to preserve (UI-SPEC):** mobile labels `text-[10px] font-medium` (500 weight, off the 400/700 canonical couple) and `p-3`/`gap-3` (12px, off the 8-point grid). Do NOT "correct" these.

---

### `src/components/AddSpotForm.tsx` — blob URL leak fix, lines 62-66 (component, file-I/O)

**Analog:** the file itself — `handleRemoveImage` (lines 56-60) already implements the CORRECT revoke pattern; `resetForm` (lines 27-35) is the correct scope hook.

**The bug (lines 62-66 — replace this):**
```typescript
useEffect(() => {
    return () => {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
}, [imagePreviews]);   // cleanup runs on EVERY imagePreviews change → revokes still-displayed URLs
```

**The correct pattern already in the file — `handleRemoveImage` (lines 56-60), KEEP as-is:**
```typescript
const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);   // revokes ONLY the removed URL — correct
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
};
```

**`resetForm` (lines 27-35) — the scope hook to attach revocation to** (called on open, line 39, and after submit):
```typescript
const resetForm = () => {
    setName(''); setType(['Dockstart']); setDescription('');
    setDifficulty('Medium'); setImageFiles([]); setImagePreviews([]); setIsSending(false);
};
```

**Target fix** (RESEARCH Pattern 3): mirror `imagePreviews` into a `useRef` (no-cleanup effect), a `revokeAll` callback reading the ref, call `revokeAll()` inside `resetForm` BEFORE clearing, plus a real-unmount guard `useEffect(() => () => revokeAll(), [revokeAll])`.

> **Pitfall 3 (critical):** `AddSpotForm` is rendered UNCONDITIONALLY in `Map.tsx` line 358 — `AnimatePresence>{isOpen && ...}` toggles only its INNER content, the component function never unmounts. A pure unmount-cleanup (`useEffect(..., [])`) would NEVER run → leak persists. Revoke at reset/close, not (only) at unmount.
> **D-03 constraint:** bug fix ONLY. Zero visual change to the form (its DS migration is Phase 4).

## Shared Patterns

### Byte-identical token wiring
**Source:** `src/index.css` lines 13-19 (`--color-primary: var(--color-sky-500)` etc.) + `src/ui/Button.tsx` lines 16-30 (justification-comment style).
**Apply to:** `NavBar.tsx` (`text-sky-500` → `text-primary`), Header/Modal light text (`text-text`/`text-muted`).
**Rule:** wire ONLY exact 1:1 matches. sky-50/100/400/600, gradients, shadows have no token → stay literal. Prove the CSS chain, never assume (01-VERIFICATION methodology).

### Framer-motion modal shell
**Source:** `src/ui/Modal.tsx` lines 13-32 (glass) + `src/components/FiltersModal.tsx` lines 27-37 (light/sheet).
**Apply to:** the Modal extension. Both use `<AnimatePresence>{isOpen && (<div backdrop><motion.div panel>...)}`. Only surface/animation/z differ — those become the variant switch.

### DS modal consumption shape
**Source:** `src/components/AuthModal.tsx` lines 83-89.
**Apply to:** migrated `FiltersModal`. `<Modal isOpen onClose [surface]><Header .../>{body}</Modal>`.

### Blob URL lifecycle
**Source:** `src/components/AddSpotForm.tsx` lines 56-60 (`handleRemoveImage` — correct per-URL revoke).
**Apply to:** the leak fix — same `URL.revokeObjectURL` discipline, scoped to reset/close instead of every state change.

## No Analog Found

None. Every file in scope is a modification of existing code with an in-repo pattern source (self, DS sibling, or the sole existing DS consumer). RESEARCH.md fallback patterns are not needed except as implementation guidance (Patterns 1-3), which are already cross-referenced above.

## Metadata

**Analog search scope:** `src/components/`, `src/ui/`, `src/config/`, `src/index.css`
**Files scanned:** `Map.tsx`, `FiltersModal.tsx`, `AddSpotForm.tsx`, `NavBar.tsx`, `ui/Modal.tsx`, `ui/Header.tsx`, `ui/Button.tsx`, `AuthModal.tsx`, `config/mapbox.ts`, `index.css`
**No project CLAUDE.md or skills directory** in working tree (only user auto-memory).
**Pattern extraction date:** 2026-07-29
