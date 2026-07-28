# Phase 1: Audit & Design System - Pattern Map

**Mapped:** 2026-07-28
**Files analyzed:** 8 (1 modified token source + 5 new `src/ui/` components + 1 migrated proof screen + 1 audit-artifact group)
**Analogs found:** 7 / 7 code files (audit artifacts have no code analog — tooling output)

> **Cardinal constraint (D-02, D-05, UI-SPEC):** every class string below is **extracted verbatim** from the app as actually rendered (light theme, system font stack). The `src/ui/` components codify existing patterns pixel-identically. **Do NOT normalise, simplify, or "clean up"** any extracted class string (see Pitfall 5 in RESEARCH.md). Variants widen the API; they never widen the appearance.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/index.css` (modify) | config (design tokens) | transform (canonicalize) | `src/index.css` `@theme`/`:root` (self, prune) | self / in-place |
| `src/ui/Modal.tsx` (new) | component (overlay) | event-driven (`isOpen`/`onClose`) | `src/components/AuthModal.tsx` shell (L80-96, 218-220) | exact |
| `src/ui/Input.tsx` (new) | component (form control) | request-response (`onChange`) | `src/components/AuthModal.tsx` field block (L159-172) | exact |
| `src/ui/Button.tsx` (new) | component (control) | request-response (`onClick`/submit) | `src/components/AuthModal.tsx` submit (L197-204) + variants across components | exact (primary) / role-match (variants) |
| `src/ui/Card.tsx` (new) | component (surface) | presentational | `src/components/NearbySpotsList.tsx` glass card (L18) + `Profile.tsx` light card (L265) | role-match |
| `src/ui/Header.tsx` (new) | component (heading) | presentational | `src/components/AuthModal.tsx` title/subtitle (L98-103) + `FiltersModal.tsx` header row (L38-43) | role-match |
| `src/components/AuthModal.tsx` (modify) | component (proof consumer) | request-response | self — re-authored on `src/ui/`, auth logic byte-identical | self |
| `.../audit/*` (new) | artifact (audit output) | batch | none (tooling: vite build, visualizer, knip, depcheck, lighthouse) | no analog |

## Pattern Assignments

### `src/index.css` (config, canonicalize)

**Analog:** self — this is a **subtraction + thin semantic layer**, not a rewrite (RESEARCH "Don't Hand-Roll"). Prune dead code; keep rendered values.

**Current `@theme` — DEAD Deep Ocean palette to PRUNE** (L3-20, 0 utility consumers verified by grep):
```css
@theme {
  --color-background: #0f172a;   /* DELETE — bg-background 0 uses */
  --color-surface: #1e293b;      /* DELETE — bg-surface 0 uses */
  --color-surface-transparent: rgba(30, 41, 59, 0.85); /* DELETE */
  --color-primary: #38bdf8;      /* DELETE — conflicts w/ :root #0ea5e9 (Pitfall 1) */
  --color-secondary: #2dd4bf;    /* DELETE */
  --color-accent: #f472b6;       /* DELETE */
  --font-sans: "Inter", system-ui, ...; /* CANONICALIZE — Inter not loaded (A1) */
}
```

**Current `:root` — rendered light values to CANONICALIZE FROM** (L22-53):
```css
:root {
  font-family: 'DM Sans', sans-serif;   /* NOT loaded — rendered = system stack (A1, Pitfall 6) */
  color-scheme: light;
  color: #1e293b;              /* Slate 800 — body text */
  background-color: #f8fafc;   /* Slate 50 — page bg */
  --color-primary: #0ea5e9;    /* Sky 500 — the canonical accent (== bg-sky-500) */
  --color-secondary: #0f172a;  /* Slate 900 */
  --color-accent: #f43f5e;     /* Rose 500 — destructive */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.5);
}
```

**Locked iOS anti-zoom rule — KEEP verbatim** (L55-58, do not let Input override it):
```css
input, textarea, select { font-size: 16px; }
```

**Dead `.glass` class to PRUNE** (L87-94, 0 consumers — RESEARCH Runtime State Inventory):
```css
.glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); ... }
```

**Token work required (per DS-01 / UI-SPEC), all values == already-rendered defaults:**
- Colors: semantic `--color-primary: #0ea5e9` (Sky 500), `--color-secondary: #0f172a`, `--color-accent`/destructive `#f43f5e`, text `#1e293b`/`#64748b`, bg `#f8fafc`.
- Font: `--font-sans` = **rendered system stack** (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`), NOT `'DM Sans'`/`'Inter'` (A1 — confirm with user).
- Radius: **do NOT hand-build** 8/12/16/24 — Tailwind v4 defaults (`rounded-lg/xl/2xl/3xl`) already render them. Add ONLY the off-scale token: `--radius-2xl` (or `4xl`) = `2rem` to reconcile `rounded-[32px]` (6 occurrences: AuthModal, WelcomeScreen, NearbySpotsList×3, AddSpotInfoModal).
- Spacing: **do NOT hand-build** — Tailwind v4 `--spacing` base (0.25rem) already renders `p-4/gap-2/p-6/p-8/py-3`. Keep the 12px (`gap-3`/`p-3`/`py-3`) exception verbatim (UI-SPEC — do NOT normalise).
- Glass vars: keep `--glass-bg`/`--glass-border` as-is.
- Anti-pattern (RESEARCH): never override Tailwind's default `--spacing` or default radius vars — it changes every screen. Only ADD tokens.

---

### `src/ui/Modal.tsx` (component, event-driven) — EXACT analog

**Analog:** `src/components/AuthModal.tsx` L80-96, 218-220. The Modal master is the AuthModal shell with children/props consumer-supplied.

**Backdrop + shell + open/close (extract verbatim)** (L81-96):
```tsx
<AnimatePresence>
  {isOpen && (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} className="text-white/70" />
        </button>
        {children}
```

**Contract:** `interface ModalProps { isOpen: boolean; onClose: () => void; children: ... }` (matches CONVENTIONS Modal/Drawer pattern L209-214). `rounded-[32px]` may reference the new radius token but must render 32px. `z-[5000]` verbatim (note: other modals use different z-indices — FiltersModal `z-[3000]`; Modal master codifies AuthModal's `5000`).

---

### `src/ui/Input.tsx` (component, request-response) — EXACT analog

**Analog:** `src/components/AuthModal.tsx` field block L159-172 (email field is the canonical full pattern: label + icon slot + input).

**Label + icon-slot + input (extract verbatim)** (L159-172):
```tsx
<div className="space-y-2">
  <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">{label}</label>
  <div className="relative">
    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
    <input
      type="email"
      required
      value={value}
      onChange={onChange}
      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
      placeholder={placeholder}
    />
  </div>
</div>
```

**Variant notes:**
- Icon-less variant (e.g. last-name, L127-133): input uses `pl-4` instead of `pl-12`, no icon element. Input master must support optional icon slot → `pl-12` when icon present, `pl-4` when absent.
- `py-3` = the 12px spacing exception (UI-SPEC) — keep verbatim, do NOT change to `py-4`.
- Do NOT set an inline font-size < 16px — the global `input{font-size:16px}` (index.css L56) prevents iOS focus-zoom (Pitfall 5).
- `focus:ring-2 focus:ring-sky-500` and `placeholder:text-white/20` are load-bearing — keep exactly.

---

### `src/ui/Button.tsx` (component, request-response) — EXACT (primary) + role-match (variants)

**Analog (primary variant / visual anchor, D-09/UI-SPEC):** `src/components/AuthModal.tsx` submit L197-204.

**Primary variant + loading state (extract verbatim)** (L197-204):
```tsx
<button
  type="submit"
  disabled={loading}
  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
>
  {loading && <Loader2 size={18} className="animate-spin" />}
  {isLogin ? t('auth.btn_login') : t('auth.btn_signup')}
</button>
```

**Variant sources (all extracted from existing components — derive variants from these, do NOT invent):**

| Variant | Source | Class signature (verbatim) |
|---------|--------|-----------------------------|
| primary | `AuthModal.tsx:200` | `bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98]` |
| secondary (light) | `Profile.tsx:431` | `bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-4 rounded-2xl transition-all` |
| ghost (glass icon) | `AuthModal.tsx:93` | `p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors` |
| ghost (light icon) | `FiltersModal.tsx:40` / `PremiumModal.tsx:33` | `p-2 bg-slate-100 rounded-full hover:bg-slate-200` (`text-slate-500`) |
| danger | `AdminDashboard.tsx:439` | `px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors` |
| danger (outline) | `SessionCard.tsx:168` | `border border-red-200 text-red-500 hover:bg-red-50 rounded-xl py-2 text-sm font-bold` |

**Loading state:** `<Loader2 size={18} className="animate-spin" />` prefixed inside a `flex items-center justify-center gap-2` button (AuthModal:200-202). **Disabled state:** `disabled={loading}` or `disabled:opacity-50 disabled:pointer-events-none` (SessionForm:93). **Sizes** (sm/md/lg): derive from existing vertical padding rung — `py-2`/`py-2.5` (sm), `py-3` (md), `py-4` (lg); all present in grep above.

**Accessibility contract (UI-SPEC):** icon-only variant (`rounded-full`, no visible text) MUST require an `aria-label` prop (or `sr-only` text). Button must not render icon-only without one.

---

### `src/ui/Card.tsx` (component, presentational) — role-match

**Analogs:** two rendered card surfaces — a **glass** card and a **light** card. Card master should expose both as variants (values verbatim).

**Glass card variant** — `src/components/NearbySpotsList.tsx:18`:
```tsx
<div className="bg-white/95 backdrop-blur-md rounded-[32px] p-6 shadow-xl border border-white/20">
```

**Light card variant (resting)** — `src/components/Profile.tsx:265` / `CommunityStatsScreen.tsx:110`:
```tsx
<div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
```

**Interactive light card** (hover elevation) — `src/components/AdminDashboard.tsx:101`:
```tsx
className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 cursor-pointer hover:border-sky-300 hover:shadow-md transition-all"
```

**Notes:** radius `rounded-2xl` (16px) is the card default (UI-SPEC); `shadow-sm` resting (15× dominant). Do NOT unify the glass `rounded-[32px]` and light `rounded-2xl` — they are different rendered surfaces; expose as variants.

---

### `src/ui/Header.tsx` (component, presentational) — role-match

**Analogs:** two header shapes — a **stacked title+subtitle** (AuthModal) and a **row with close button** (FiltersModal).

**Stacked heading + subtitle** — `src/components/AuthModal.tsx:98-103`:
```tsx
<h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
<p className="text-white/50 text-sm mb-8">{subtitle}</p>
```

**Header row with close-button slot** — `src/components/FiltersModal.tsx:38-43`:
```tsx
<div className="flex justify-between items-center mb-6">
  <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
  <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
    <X size={20} className="text-slate-600" />
  </button>
</div>
```

**Contract (UI-SPEC Typography):** heading role = `text-2xl font-bold` (24px / 700). Text colour varies by surface (`text-white` on glass, `text-slate-800` on light) → expose as prop/variant, do NOT hard-code one. Optional subtitle (`text-sm`, muted) and optional close-button slot.

---

### `src/components/AuthModal.tsx` (modify — D-09 proof consumer)

**Analog:** self. Re-author the JSX (L80-221) to consume `src/ui/{Modal, Header, Input, Button}`. **Keep byte-identical** (RESEARCH Pitfall 5 + Security Domain):
- `mapAuthError` (L30-35) — unchanged.
- `handleSubmit` + all `supabase.auth.*` / `supabase.from('profiles')` calls (L37-78) — unchanged.
- `required`, `minLength={6}` HTML validation (L185) — unchanged (V5 is Phase 4).
- The sky-500 primary submit stays the sole visual anchor (UI-SPEC hierarchy: heading → inputs → primary CTA).
- **Parity oracle:** capture before/after screenshots of login, signup, AND error states — verify pixel-identity by screenshot, not by reading code.

---

## Shared Patterns

### Glass-morphism (D-05 — codify verbatim)
**Source:** `AuthModal.tsx:83,88`
**Apply to:** `Modal.tsx` (surface + backdrop), glass `Card.tsx` variant
```tsx
/* surface */  bg-white/10 backdrop-blur-xl border border-white/20
/* backdrop */ bg-black/60 backdrop-blur-md
```

### Framer Motion open/close (CONVENTIONS L182-201)
**Source:** `AuthModal.tsx:81-89`
**Apply to:** `Modal.tsx`
```tsx
<AnimatePresence>{isOpen && (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} />
)}</AnimatePresence>
```
Stagger convention for lists (not on the proof screen): `transition={{ delay: index * 0.05 }}` (NearbySpotsList).

### Component API conventions (CONVENTIONS L112-130, D-05)
**Apply to:** all `src/ui/` components
- PascalCase file, one component, `export default function Name(...)`.
- Destructured props typed by `interface [Name]Props`.
- Modal contract: `isOpen: boolean` + `onClose: () => void`.
- Event handlers prefixed `handle*`.
- Relative imports only (no path alias). Icon library = **Lucide React**. Styling = **Tailwind only** (no CSS-in-JS).

### Error banner (inherited by AuthModal proof)
**Source:** `AuthModal.tsx:191-195` (UI-SPEC Copywriting Contract)
**Apply to:** AuthModal migration (not a master component this phase)
```tsx
<div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">{error}</div>
```

### Focus ring / iOS input rule
**Source:** `AuthModal.tsx:168` + `index.css:56`
**Apply to:** `Input.tsx`
```
focus:outline-none focus:ring-2 focus:ring-sky-500   /* + global input{font-size:16px} — do not override */
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.../audit/build-size.txt` | artifact | batch | Output of `npm run build` compressed-size table — tooling, not code |
| `.../audit/stats.html` | artifact | batch | `rollup-plugin-visualizer` treemap — tooling |
| `.../audit/knip.md`, `depcheck.json` | artifact | batch | Static-analysis dependency inventory — tooling |
| `.../audit/lighthouse.*` | artifact | batch | Lighthouse mobile lab (or documented fallback if no Chrome — RESEARCH Open Q2) — tooling |
| `.../01-AUDIT.md` | doc | — | DS-03 deliverable: baseline numbers + UI-incoherence inventory (hard-coded `Map.tsx` marker hexes, duplicated modal patterns). Author from artifacts + RESEARCH; no code analog |

Planner should drive these from RESEARCH.md §Standard Stack + §Code Examples (exact commands provided there), gated behind `checkpoint:human-verify` per `[ASSUMED]` package.

## Metadata

**Analog search scope:** `src/index.css`, `src/components/*.tsx` (AuthModal, FiltersModal, PremiumModal, Profile, AdminDashboard, NearbySpotsList, SessionForm/Card, SpotDetail, AddSpotForm, WelcomeScreen, CommunityStatsScreen), `.planning/codebase/{CONVENTIONS,STRUCTURE}.md`.
**Files scanned:** ~15 (1 read in full: AuthModal; targeted grep across `src/components/`).
**Pattern extraction date:** 2026-07-28
