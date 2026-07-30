# Phase 3: Fiches Détaillées & Profils - Pattern Map

**Mapped:** 2026-07-30
**Files analyzed:** 7 source files (2 already planned in 03-02, 5 still to plan)
**Analogs found:** 6 / 7 (1 net-new pattern with no codebase analog: `loading="lazy"`)

> **Nature of this phase (read first).** This is a *harmonization* phase, not a
> feature build. There are no new files — every entry below is a MODIFY of an
> existing file. The research (`03-RESEARCH.md`) proved via character-by-character
> grep that the byte-identical DS-migration surface is only **7 sites**
> (4×`Card`, 1×`Button secondary`, 1×`Header`, 1×`Modal` shell). Everything else
> is **token wiring** (literal Tailwind class → `@theme` token, proven identical
> by value) and **lazy-loading** of images. So the "analog" for most files is a
> *master DS component* plus the **Phase 2 migration precedent** (`FiltersModal`,
> `NearbySpotsList`), not another feature file. Do NOT force non-byte-identical
> migrations to satisfy the literal "uses exclusively DS components" wording —
> use the documented-override precedent (`01-VERIFICATION.md`, RESEARCH Pitfall 3).

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/ui/Modal.tsx` | component (DS master) | event-driven (open/close) | itself + Phase 2 `light+sheet` extension precedent | exact (self-precedent) |
| `src/components/PremiumModal.tsx` | component (dialog) | event-driven (open/close) | `src/components/FiltersModal.tsx` | exact |
| `src/components/Profile.tsx` | component (screen) | request-response (reads profile/stats) | `src/components/NearbySpotsList.tsx` + `src/ui/{Card,Button}.tsx` | role-match (Card/Button sites exact) |
| `src/components/CommunityStatsScreen.tsx` | component (full-screen) | request-response (reads KPIs) | `src/components/NearbySpotsList.tsx` + `src/ui/Card.tsx` | role-match (2×Card exact; shell = token-only) |
| `src/components/SpotDetail.tsx` | component (screen) | request-response + streaming (carousel) | token-wiring precedent only — **no DS component matches byte-identical** | partial (tokens + lazy only) |
| `src/components/ReviewList.tsx` | component (list) | request-response (N avatars) | net-new `loading="lazy"` (no analog) | none (net-new pattern) |
| `src/components/SessionCard.tsx` | component (list item) | request-response (1 avatar/session) | `src/components/ReviewList.tsx` | exact (identical avatar markup) |

**Planning artifact (not a source file):** `03-BASELINE.md` (produced by plan
03-01) — network baseline gate, no code pattern.

**Already planned (do not re-plan):** `src/ui/Modal.tsx` + `src/components/PremiumModal.tsx`
are covered by `03-02-PLAN.md`. They are included here so the remaining plans
can reference the same shared patterns. The 5 files still needing plans:
`Profile.tsx`, `CommunityStatsScreen.tsx`, `SpotDetail.tsx`, `ReviewList.tsx`,
`SessionCard.tsx`.

## Pattern Assignments

### `src/components/PremiumModal.tsx` (component, event-driven) — planned 03-02

**Analog:** `src/components/FiltersModal.tsx` — the Phase 2 file that migrated
its dialog shell to `Modal` + `Header` with verbatim class extraction. Same move,
different shape (`light+center` instead of `light+sheet`).

**Consumer pattern to copy** (`FiltersModal.tsx:30-33`):
```tsx
return (
    <Modal isOpen={isOpen} onClose={onClose} surface="light" layout="sheet">
        <Header surface="light" title={t('filters.title')} onClose={onClose} />
```
PremiumModal target: `surface="light" layout="center"` (the 3rd shape added to
Modal in 03-02) and `<Header surface="light" title={...} />` **without** `onClose`
(its close is a floating absolute button — see below).

**Custom-control precedent** (`FiltersModal.tsx:65-73`): CTA stays a native
`<button>` because no `Button` variant matches `bg-slate-900`. PremiumModal's CTA
(`py-3.5 bg-secondary`) and close button (`bg-slate-100 rounded-full`) follow the
exact same "keep custom, wire the token only" precedent (D-02 / Phase 2 A4).

---

### `src/ui/Modal.tsx` (component, DS master) — planned 03-02

**Analog:** itself — the Phase 2 extension that added the `light+sheet` shape
(`Modal.tsx:39-58`) is the exact template for adding the 3rd `light+center` shape.

**Existing dispatch to extend** (`Modal.tsx:30-37`):
```tsx
const isLightSheet = surface === 'light' || layout === 'sheet';
if (isLightSheet) {
    if (import.meta.env.DEV && (surface !== 'light' || layout !== 'sheet')) {
        console.warn('Modal: `surface="light"` and `layout="sheet"` are only supported together; …');
    }
    /* light bottom-sheet shape */
}
/* glass centered shape (default fallback) */
```

**Existing shape to preserve verbatim** (`Modal.tsx:46-53`, bottom-sheet panel):
```tsx
<motion.div
    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
    className="relative z-10 bg-white w-full max-w-sm sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl pointer-events-auto"
>
```
New `light+center` branch (RESEARCH Pattern 1) is extracted verbatim from
`PremiumModal.tsx:16-30`: wrapper `p-6`, animated `motion.div` backdrop
`bg-slate-900/40 backdrop-blur-sm`, panel `relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl overflow-hidden`, animation `scale + y:20`, **no built-in close**.

---

### `src/components/Profile.tsx` (component, request-response)

**Analog:** `src/components/NearbySpotsList.tsx` (Phase 2 file that consumes the
`Card` glass surface + `layoutId`) for the "consume the master, keep custom what
doesn't match" discipline; plus the `Card`/`Button` masters directly for the 3
byte-identical sites.

**Card master to consume** (`Card.tsx:25`, `variant="light"` renders):
```tsx
'bg-white p-4 rounded-2xl border border-slate-100 shadow-sm'
```
Matches `Profile.tsx:264-273` (Spots Added / Favorites stat grid) **exactly**
[VERIFIED via sed — both blocks are `bg-white p-4 rounded-2xl border border-slate-100 shadow-sm`]:
```tsx
// BEFORE (Profile.tsx:265,269)
<div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Spots Added</p>
    <p className="text-2xl font-black text-slate-800">{spotsCount}</p>
</div>
// AFTER: <Card>…</Card> (text-slate-800 → text-text wiring on the inner <p>)
```

**Button secondary to consume** (`Button.tsx:24`, `variant="secondary"` renders
`bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-2xl transition-all`
+ `py-4` from `size="lg"` + base `flex items-center justify-center gap-2`). Matches
`Profile.tsx:429-435` (Log Out) **exactly** — the `secondary` variant was literally
extracted from this line in Phase 1 (`Button.tsx:23` comment "Profile:431"):
```tsx
// BEFORE (Profile.tsx:429-435)
<button onClick={() => signOut()}
    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-4 rounded-2xl transition-all mb-8 flex items-center justify-center gap-2">
    <LogOut size={18} /> Log Out
</button>
// AFTER: <Button variant="secondary" size="lg" onClick={() => signOut()} className="w-full mb-8">
```

**DO NOT migrate (RESEARCH Anti-Patterns):**
- Anon CTAs (L94-107), Save-name button (L237), notif toggle (L388) → no matching
  variant, keep custom + wire tokens only.
- Username title `text-2xl font-bold text-slate-800` (L199) → `Header` would add
  `mb-2` and shift the email `<p>` by 8px. Keep custom.
- Dead branches after the `if (!user) return` early-return at L71 (Pitfall 6) →
  do NOT migrate; flag for CODE-01 / Phase 5.

**Token wiring surface** (byte-identical by value, RESEARCH § wiring table):
`text-sky-500→text-primary` (L80,127,178,292,315,329,357,383), `bg-sky-500→bg-primary`
(L96,244,391), `text-slate-800→text-text`, `text-slate-500→text-muted`,
`bg-slate-50→bg-background`, `hover:bg-slate-50→hover:bg-background`, `text-rose-500→text-accent`.
Keep literal: `slate-400/300/600/700/100/200`, all `sky-*` gradient/shadow classes.

**Avatar `Profile.tsx:164` — do NOT lazy** (in viewport when component mounts;
`Profile` is conditionally mounted at `App.tsx:207`, gain = 0, Pitfall 5).

---

### `src/components/CommunityStatsScreen.tsx` (component, request-response)

**Analog:** same as Profile — `Card` master for the 2 KPI cards, `NearbySpotsList`
token discipline for the rest.

**Card matches** (`CommunityStatsScreen.tsx:110,116`): both are
`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm` → `<Card>` (exact).

**Keep custom (no DS shape matches):**
- App-bar header (`L90-98`): `<h1 text-lg font-bold>` + back-arrow **on the left** +
  `border-b bg-white`. Neither `Header` shape matches. Keep custom.
- **DO NOT touch** `pt-[calc(1rem+env(safe-area-inset-top))]` at L90 — prior
  safe-area fix (CONTEXT § Specifics, RESEARCH Anti-Patterns). Regression risk on iOS.
- Full-screen shell `L88`: `fixed inset-0 z-50 bg-slate-50` — not a Modal. Wire
  `bg-slate-50 → bg-background` only (semantically exact: page background).

**Zero images:** flags are unicode emoji via `countryCodeToFlag()` — **no `<img>`**,
so D-06's "éventuelles images de CommunityStatsScreen" resolves to zero. Document
explicitly, not as an oversight. (The `country-list-incomplete` todo is a data bug,
NOT folded here — CONTEXT § Deferred.)

---

### `src/components/SpotDetail.tsx` (component, request-response + streaming)

**Analog:** **none** for DS components — RESEARCH proved 0 byte-identical matches
(`Header` blocked by shared `layoutId`, `Card` blocked by `bg-slate-50`, `Button`
blocked by D-02 + gradient, `Modal` blocked by D-01/`vaul`). UI-01 is honored by
**token wiring + `rounded-[24px]→rounded-3xl`** only. The pattern precedent is the
Phase 1/2 token-wiring discipline, not a component swap.

**FROZEN — do NOT touch (D-01/D-02/D-03, Pitfall 8):**
- `vaul` `Drawer.Root/Portal/Content` shell + `snapPoints` + `modal={false}` + all
  `onTouch*`/`onPointerDown` handlers (`stopPropagation` at L680-682).
- Lightbox rendered **inside** `Drawer.Portal` (comment L668-670 documents this is
  deliberate for touch isolation).
- `motion.h2` title with `layoutId={`spot-name-${spot.id}`}` (L225) — **shared**
  with `NearbySpotsList.tsx:63` (verified below). Migrating to `Header` silently
  breaks the shared-element morph animation.
- Header icon-buttons (Share/Favorite/Close/Edit) — native `<button>`, D-02.
- Info/Avis/Sessions tabs + full-screen carousel — D-03.
- Edit overlay `L526-664` — **out of scope** (UI-03 / Phase 4, RESEARCH Open Q3).
  Includes `URL.createObjectURL` leak at L622 (Pitfall 7): do NOT fix, do NOT regress.

**Shared `layoutId` precedent** (`NearbySpotsList.tsx:62-67`, the paired node):
```tsx
<motion.p layoutId={`spot-name-${spot.id}`}
    className="font-bold text-slate-900 group-hover:text-sky-600 …">
    {spot.name}
</motion.p>
```

**Token wiring** (RESEARCH § wiring table): `text-sky-500→text-primary` (263,378),
`text-slate-800→text-text` (380,385,391,440), `text-slate-500→text-muted`
(238,252,486,512), `bg-slate-50→bg-background` (377,382,441,486,512),
`fill-rose-500 text-rose-500→fill-accent text-accent` (298),
`rounded-[24px]→rounded-3xl` ✅ (218,741). `rounded-t-[32px]→rounded-t-4xl` (763,
on `Drawer.Content`) is a grey zone (Open Q4 — planner's call; class-only, no
gesture impact). Title color L226 `text-slate-900→text-secondary` is optional
(semantically shaky, planner's call — Open Q6/A6).

**Lazy loading (this file) — see Shared Patterns § loading="lazy" and § prefetch.**
- Vignette `L409` (`spot.image_urls[0]`, `aspect-video`) → `loading="lazy"` candidate
  [VERIFIED L405-413: `<img src={spot.image_urls[0]} className="w-full h-full object-cover …">`].
- Uploader avatar `L246` (20×20, in viewport) → do NOT lazy.
- Lightbox `motion.img L721` (the content/LCP) → do NOT lazy; target of prefetch.

---

### `src/components/ReviewList.tsx` (component, list)

**Analog:** **none** in the codebase for the lazy-loading behavior (no `<img>`
anywhere carries `loading` today — grep confirms 0). This is a net-new attribute
add. The container is already correctly pre-sized (`w-8 h-8`), so no CLS risk.

**Site** (`ReviewList.tsx:47-51`) [VERIFIED]:
```tsx
<img
  src={review.profiles!.avatar_url!}
  alt={displayName}
  className="w-8 h-8 rounded-full object-cover"
/>
// AFTER: add loading="lazy" — this is the ONE real lazy surface (N avatars in a
// scrollable list, RESEARCH Open Q5 recommends INCLUDE).
```
Scope note: D-06 doesn't name this file; RESEARCH Open Q5 recommends including it
as a minor scope extension (it's the only place with N simultaneous images in a
scrollable container). Flag explicitly, don't apply silently.

---

### `src/components/SessionCard.tsx` (component, list item)

**Analog:** `src/components/ReviewList.tsx` — **identical** avatar markup, same
lazy-loading decision.

**Site** (`SessionCard.tsx:85-89`) [VERIFIED — byte-identical to ReviewList except `alt`]:
```tsx
<img
  src={session.creator_profile!.avatar_url!}
  alt=""
  className="w-8 h-8 rounded-full object-cover"
/>
// AFTER: add loading="lazy" (same rationale as ReviewList).
```

## Shared Patterns

### Token wiring (byte-identical by value)
**Source of truth:** `src/index.css` `@theme` + precedent `01-VERIFICATION.md`.
**Apply to:** `Profile.tsx`, `CommunityStatsScreen.tsx`, `SpotDetail.tsx`, `PremiumModal.tsx`.
Available tokens: `--color-primary`=sky-500, `--color-secondary`=slate-900,
`--color-accent`=rose-500, `--color-text`=slate-800, `--color-muted`=slate-500,
`--color-background`=slate-50, `--radius-3xl`=1.5rem(24px), `--radius-4xl`=2rem(32px).
**Verification protocol** (RESEARCH § Code Examples, replay per wiring):
```bash
npm run build
grep -oE "\.(text-slate-800|text-text)\{[^}]*\}" dist/assets/*.css
# expect: different var() string, IDENTICAL resolved oklch() value
```
**Never wire** (no matching token, keep literal): `slate-400/300/600/700/100/200`,
`border-slate-100/50`, `sky-50/100/600/700`, all gradients (`from-sky-500 to-blue-600`),
all shadows, `bg-black/60|95`, `bg-white/70|10`, `white/10|20`, emerald/amber/teal/pink.

### Card master consumption
**Source:** `src/ui/Card.tsx:25` — `variant="light"` renders
`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm`.
**Apply to:** `Profile.tsx:265,269`; `CommunityStatsScreen.tsx:110,116` (4 exact matches).
**Limitation:** `Card` exposes no `onClick` (Card.tsx:3-8) — clickable rows in
`Profile` cannot become `Card interactive` without API change (and their classes
don't match anyway). Keep them custom.

### Button secondary consumption
**Source:** `src/ui/Button.tsx:24` — `variant="secondary"`.
**Apply to:** `Profile.tsx:429-435` (Log Out) only. `size="lg"` gives `py-4`; base
adds `flex items-center justify-center gap-2`; only `w-full mb-8` go through `className`.
`disabled:*` classes produce no style when not disabled → render identical (verify in DevTools).

### Header light consumption
**Source:** `src/ui/Header.tsx:48-55` — stacked shape, `surface="light"` renders
`<h2 className="text-2xl font-bold text-text mb-2">`.
**Apply to:** `PremiumModal.tsx:43` only. **Never pass `onClose`** (switches to the
row-with-close shape and injects a second close button). Never pass `subtitle`
(adds `text-sm`, drops `leading-relaxed`).

### Modal light+center consumption
**Source:** `src/ui/Modal.tsx` (after 03-02 extension) — new 3rd shape.
**Apply to:** `PremiumModal.tsx` only. Retro-compat verified: only `AuthModal`
(glass+center defaults) and `FiltersModal` (light+sheet explicit) consume `Modal`;
neither passes `light+center` → new branch unreachable → zero regression risk.

### `loading="lazy"` (NET-NEW — no codebase analog)
**Source:** none — no `<img>` in `src/` carries `loading` today (grep = 0).
Native HTML attribute per D-06, graceful degradation on iOS < 16.4 (attribute
ignored → eager → current behavior; Pitfall 5).
**Apply to:** `SpotDetail.tsx:409` (vignette), `ReviewList.tsx:47`, `SessionCard.tsx:85`.
**Never apply to:** `SpotDetail.tsx:246` (uploader avatar, in viewport),
`Profile.tsx:164` (profile avatar, in viewport), `SpotDetail.tsx:721` (lightbox
LCP), `SpotDetail.tsx:622` (blob: local). No CLS risk: all containers pre-sized.

### Neighbor prefetch (NET-NEW — no codebase analog)
**Source:** none — RESEARCH Pattern 4 (resolves the D-03↔D-06 contradiction).
**Apply to:** `SpotDetail.tsx` lightbox only (single `<img>`, can't mark neighbors).
```tsx
useEffect(() => {
    if (!isImageOpen || !spot?.image_urls || spot.image_urls.length < 2) return;
    const n = spot.image_urls.length;
    [spot.image_urls[(currentPhotoIndex + 1) % n],
     spot.image_urls[(currentPhotoIndex - 1 + n) % n]]
        .forEach(src => { const img = new Image(); img.src = src; });
}, [isImageOpen, currentPhotoIndex, spot?.id]);
```
This is the metric that actually moves (Metric A: next/prev requests 1 → 0) —
Metric B (initial-load count) will likely be a legitimate zero delta (Pitfall 4).

## No Analog Found

| File / Pattern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| `loading="lazy"` attribute (ReviewList, SessionCard, SpotDetail vignette) | attribute add | request-response | No `<img>` in the codebase carries `loading` today — first use. No pattern to copy; follow RESEARCH Pattern 3 + graceful-degradation note. |
| Neighbor prefetch `useEffect` (SpotDetail lightbox) | hook | streaming (carousel) | No image-prefetch code exists anywhere. Net-new per RESEARCH Pattern 4. |
| `SpotDetail.tsx` DS-component migration | component | request-response | RESEARCH proved 0 byte-identical DS-component matches. UI-01 honored by token wiring + `rounded` normalization only, under a documented override (Pitfall 3). |
| `CommunityStatsScreen` app-bar header | component | request-response | Neither `Header` shape (stacked / row-with-close) matches a left-arrow `<h1 text-lg>` app-bar. Keep custom + token wiring. |

## Metadata

**Analog search scope:** `src/ui/*` (all 5 masters read), `src/components/`
(FiltersModal, NearbySpotsList as Phase 2 migration precedents; PremiumModal,
Profile, CommunityStatsScreen, SpotDetail, ReviewList, SessionCard as targets).
**Files scanned:** 11 (5 masters + 2 precedents + 4 target excerpts, plus RESEARCH's
exhaustive grep inventory relied on for line-level accuracy).
**Verification done in this pass:** confirmed byte-identical Card/Button target
strings in `Profile.tsx` (sed L264-273, L429-436), the SpotDetail vignette
`<img>` (L405-413), the ReviewList/SessionCard avatar markup, and `grep -rc
'loading="lazy"' src/` = 0 (net-new confirmed).
**Pattern extraction date:** 2026-07-30
