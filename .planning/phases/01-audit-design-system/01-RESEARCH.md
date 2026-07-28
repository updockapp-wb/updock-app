# Phase 1: Audit & Design System - Research

**Researched:** 2026-07-28
**Domain:** Frontend audit tooling (Vite bundle/perf) + Tailwind v4 CSS-first design tokens + master component extraction
**Confidence:** HIGH (codebase facts verified by grep; tooling verified on npm registry; Tailwind v4 behavior cited from official docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Single token source is the `@theme` block of `src/index.css`, cleaned and extended. Exploit native Tailwind v4 behavior (utility classes `bg-primary`, `rounded-lg`, … generated directly from `@theme`). No extra indirection layer.
- **D-02:** Resolve the current conflict (`@theme` defines a dark "Deep Ocean" palette — `--color-background: #0f172a` — while `:root` re-overrides to a light theme — `background: #f8fafc`, `--color-primary: #0ea5e9`) by **canonicalizing on the actually-rendered values**. The app runs in light (`color-scheme: light`). Dead/contradictory values are deleted.
- **D-03:** Tokens cover colors, typography, spacing, radii, shadows (DS-01 scope). JS-consumed colors (e.g. `Map.tsx` markers) must be able to reference the same source values instead of staying hard-coded — handled at the token level.
- **D-04:** Master components live in a **new `src/ui/` folder** (Button, Card, Input, Modal, Header), separate from business components in `src/components/`. Clean design-system boundary.
- **D-05:** Components **codify existing patterns identically**: glass-morphism (`bg-white/10 backdrop-blur-xl border border-white/20`), Modal = `AnimatePresence` + backdrop `bg-black/60 backdrop-blur-md` from current `AuthModal`, `isOpen`/`onClose` convention, `handle*` handlers. **No visual invention** — pixel-identical.
- **D-06:** Complete/anticipated variant set (Button: primary/secondary/ghost/danger, sizes sm/md/lg, states loading/disabled), even if not all consumed yet. Each variant's style is derived from tokens and existing values — variants widen the API, never the appearance.
- **D-07:** Exhaustive audit. Tooling: bundle via `vite build` + `rollup-plugin-visualizer` (or equivalent); perf via Lighthouse mobile + full Web Vitals + React Profiler on critical screens (map, nav); deps via full map + unused/outdated (`depcheck`) + version mismatch (Capacitor CLI v7 vs core v8); UI inconsistencies inventory (hard-coded colors, duplicated modal patterns, scattered design values).
- **D-08:** **Firm baseline + directional targets.** Freeze exact baseline values (e.g. current bundle size in ko). For PERF-03, set a **directional** target (e.g. −15% bundle) to be refined in Phase 5 — no blind numeric commitment.
- **D-09:** Phase 1 = library + audit **+ one minimal proof-screen**. After building tokens and components, migrate **`AuthModal`** to the master components (strictly identical appearance). Chosen because it exercises Modal + Input + Button + error handling at once. Appearance and behavior unchanged (no auth-flow regression).

### Claude's Discretion
- Precise token naming (spacing scale, radius/shadow names) — left to planner/executor, as long as consistent with Tailwind v4 and extracted from the existing app.
- Exact API signatures and internal structure of `src/ui/` components.
- Precise choice of bundle-visualization tool and audit script.

### Deferred Ideas (OUT OF SCOPE)
- Intentional light/dark theming (keeping both palettes as themes) — new visual direction, out of v2.0.
- Migration of `Map.tsx` marker colors to tokens — inventoried in the audit, but actual map migration is **Phase 2**.
- Extended design system (toasts, tabs, badges, skeletons) — DS-04, out of v2.0.
- Non-UI debt (`any` typing, spot-type storage, offline, tests) — out of milestone scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DS-01 | Single token file centralizes colors, typography, spacing, radii, shadows; no hard-coded design values in migrated design-system components | Tailwind v4 `@theme` namespace mapping (colors/radius/shadow/font) confirmed; **finding: default Tailwind v4 spacing & radius scales already match the extracted values** — custom token work is concentrated on colors, font stack, glass, and the one off-scale radius (32px). See Standard Stack + Pitfalls. |
| DS-02 | Reusable master components (Button, Card, Input, Modal, Header) with variants | AuthModal read as the canonical Modal/Input/Button pattern; glass + AnimatePresence patterns catalogued verbatim; icon-only `aria-label` contract from UI-SPEC. See Architecture Patterns. |
| DS-03 | Architecture audit document describing current state + firm numeric perf/bundle baseline | Verified tooling: `rollup-plugin-visualizer` 7.0.1, Vite build compressed-size report, `knip`/`depcheck`, `npm outdated`, Lighthouse 13.4.1, React DevTools Profiler. See Standard Stack + Validation Architecture. |
</phase_requirements>

## Summary

This phase is two-natured: an **audit** (measurement + inventory, DS-03) and a **construction** (token file + `src/ui/` library + one proof migration, DS-01/DS-02). The audit is the least-charted territory and drives most of the research below; the construction is largely codification of patterns that already exist verbatim in `AuthModal.tsx` and the Tailwind v4 defaults.

The single most consequential finding, verified by grep against the codebase: **the custom `@theme` "Deep Ocean" color tokens are dead code — they have zero utility-class consumers (`bg-primary`, `text-secondary`, `bg-surface`, etc. appear 0 times across `src/`).** The app renders entirely from Tailwind's **default** palette (`bg-sky-500`, `text-sky-600`, `bg-sky-50`, `slate`, `rose/red`) plus a light `:root` and glass variables. Sky-500 (`#0ea5e9`) — the intended `--color-primary` — is already what `bg-sky-500` renders. This makes the D-02 canonicalization low-risk: prune the unused dark palette, and (in `src/ui/` only, per DS-01) define semantic tokens whose values equal the already-rendered defaults, so the switch is pixel-identical by construction.

Second key finding: **Tailwind v4's default spacing (`--spacing` base = 0.25rem = 4px) and default radius scale already match the values the UI-SPEC extracted** (rounded-lg=8, xl=12, 2xl=16, 3xl=24). Do NOT hand-build a spacing/radius scale — it already exists and is what the app renders. Custom token work reduces to: colors, the font stack, glass values, and the one off-scale radius (`rounded-[32px]`, 6 occurrences).

Third finding, from `index.html` + grep: **neither DM Sans (`:root font-family`) nor Inter (`@theme --font-sans`) is actually loaded** — no `<link>`, no `@font-face`, no font files. The rendered face is the system sans-serif fallback (San Francisco on iOS). Canonicalizing the font token to the *rendered* stack is the pixel-identical choice; "fixing" it to load DM Sans would change rendering and is rebranding. This is flagged as an assumption for the user to confirm.

**Primary recommendation:** Run the audit as a set of one-shot scripts producing committed artifacts (`vite build` compressed-size table + `rollup-plugin-visualizer` treemap = firm bundle baseline; Lighthouse-against-`vite preview` + React Profiler = directional perf baseline; `knip`+`depcheck`+`npm outdated` = dependency inventory). Then build `src/ui/` by extracting classes verbatim from `AuthModal.tsx`, define semantic color/font/radius/glass tokens equal to the already-rendered default values, and migrate `AuthModal` as the proof — verifying pixel-identity by before/after screenshot, not by eyeballing code.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens (colors/type/space/radius/shadow) | Build/Styling (Tailwind v4 `@theme` in `src/index.css`) | — | D-01: single CSS-first source; Tailwind generates utilities at build time |
| Master UI components | Browser/Client (`src/ui/`, React) | Styling (consume tokens) | Presentational React components; no server/data concerns |
| Bundle measurement | Build (Vite/Rollup) | Dev tooling | Bundle is a build artifact; measured at `vite build` |
| Perf measurement | Browser (Lighthouse/Chrome, React Profiler) | Build (preview server) | Runtime metrics measured against the production preview build |
| Dependency inventory | Dev tooling (knip/depcheck/npm) | — | Static analysis over `package.json` + source graph |
| AuthModal proof migration | Browser/Client (React) | Styling + Auth (Supabase, unchanged) | UI swap only; auth logic (`supabase.auth.*`) untouched |

## Standard Stack

### Core (audit tooling — dev dependencies, one-time use)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `rollup-plugin-visualizer` | 7.0.1 [ASSUMED] | Bundle composition treemap + gzip/brotli sizes | De-facto Rollup/Vite bundle analyzer; `emitFile`/`template` options; repo `btd/rollup-plugin-visualizer` [CITED: npmjs.com] |
| Vite build compressed-size report | (built into Vite 7.2.4) | **Firm** per-chunk raw+gzip ko baseline | `vite build` already prints a gzip size table; zero-install, deterministic — the firm DS-03 number [CITED: vite.dev] |
| `knip` | 6.29.0 [ASSUMED] | Unused files, exports, and dependencies in one pass | Modern successor covering more than depcheck; repo `webpro-nl/knip` [CITED: npmjs.com] |
| `depcheck` | 1.4.7 [ASSUMED] | Unused/missing dependency cross-check (explicitly named in D-07) | Named in D-07; use as a second opinion against knip; repo `depcheck/depcheck` |
| `lighthouse` | 13.4.1 [ASSUMED] | Mobile Web Vitals lab audit (LCP, CLS, TBT, FCP, SI) | Google's standard; run via `npx lighthouse`; repo `GoogleChrome/lighthouse` |
| React DevTools Profiler | (browser extension / React 19 built-in) | Render/commit counts on Map + nav screens | Standard React perf tool; establishes the pre-refactor render baseline for Phase 2 PERF-01 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `web-vitals` | 6.0.1 [ASSUMED] | Programmatic field-metric logging (LCP/INP/CLS) in the running app | Optional — if a real in-app/WKWebView number is wanted beyond Lighthouse lab; repo `GoogleChrome/web-vitals` |
| `npm outdated` / `npm ls` | (built into npm 11.12) | Version-mismatch + duplicate detection (Capacitor CLI vs core) | Zero-install; the direct way to verify the D-07 Capacitor mismatch item |
| `source-map-explorer` | 2.5.3 [ASSUMED] | Alternative bundle breakdown from source maps | If visualizer output is ambiguous; needs `build.sourcemap: true` |
| `vite-bundle-visualizer` | 1.2.1 [ASSUMED] | Zero-config CLI wrapper around rollup-plugin-visualizer | If you prefer NOT to touch `vite.config.ts` for a one-shot audit |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `rollup-plugin-visualizer` (config edit) | `vite-bundle-visualizer` (CLI, `npx`) | CLI = no config change, good for one-shot; plugin = repeatable, integrates gzip/brotli in the same build. Either satisfies D-07. |
| `knip` | `depcheck` alone | depcheck finds unused *deps* only; knip also finds unused *files/exports* (relevant to CODE-01 later). Run both; reconcile. |
| Lighthouse lab (Chrome) | `web-vitals` in-app on device | Lighthouse = repeatable lab proxy; on-device web-vitals = closer to real WKWebView but noisy. Lab is the standard baseline; note the proxy caveat (see Pitfalls). |

**Installation:**
```bash
npm install -D rollup-plugin-visualizer knip depcheck
# Lighthouse run without install:
npx lighthouse http://localhost:4173 --form-factor=mobile --output=json --output=html --output-path=./.planning/phases/01-audit-design-system/audit/lighthouse
```

**Verified versions (npm registry, 2026-07-28):** rollup-plugin-visualizer 7.0.1 · knip 6.29.0 · depcheck 1.4.7 · lighthouse 13.4.1 · web-vitals 6.0.1 · source-map-explorer 2.5.3 · vite-bundle-visualizer 1.2.1. All resolved via `npm view <pkg> version`.

## Package Legitimacy Audit

> slopcheck could not be installed in this environment (`pip install slopcheck` unavailable). Per the legitimacy-gate degradation rule, **all packages below are tagged `[ASSUMED]`** and the planner MUST gate each install behind a `checkpoint:human-verify` task. Registry existence and source-repo presence were verified manually via `npm view`, but that alone does not confer `[VERIFIED]`.

| Package | Registry | Latest | Source Repo (npm view) | slopcheck | Disposition |
|---------|----------|--------|------------------------|-----------|-------------|
| rollup-plugin-visualizer | npm | 7.0.1 | github.com/btd/rollup-plugin-visualizer | unavailable | ASSUMED — planner gates |
| knip | npm | 6.29.0 | github.com/webpro-nl/knip | unavailable | ASSUMED — planner gates |
| depcheck | npm | 1.4.7 | github.com/depcheck/depcheck | unavailable | ASSUMED — planner gates |
| lighthouse | npm | 13.4.1 | github.com/GoogleChrome/lighthouse | unavailable | ASSUMED — planner gates (also usable via `npx`, no install) |
| web-vitals | npm | 6.0.1 | github.com/GoogleChrome/web-vitals | unavailable | ASSUMED — optional |
| source-map-explorer | npm | 2.5.3 | (registry-present) | unavailable | ASSUMED — optional fallback |
| vite-bundle-visualizer | npm | 1.2.1 | (registry-present) | unavailable | ASSUMED — optional (no-config alt) |

**Packages removed due to [SLOP]:** none.
**Packages flagged [SUS]:** none (all have established source repos; lighthouse/web-vitals are Google-authored, knip/depcheck/visualizer are long-standing OSS). Suspicion is procedural only (slopcheck unavailable), not evidence-based.

**Postinstall check:** not run (slopcheck/network unavailable). Planner's `checkpoint:human-verify` should include a quick `npm view <pkg> scripts.postinstall` glance before install.

## Architecture Patterns

### System Architecture Diagram

```
                          PHASE 1 — TWO PARALLEL TRACKS

  ┌─────────────────────────── TRACK A: AUDIT (DS-03) ───────────────────────────┐
  │                                                                              │
  │  src/ (source graph) ──► knip + depcheck ──► unused files/exports/deps       │
  │  package.json ─────────► npm outdated/ls ──► version mismatch (Capacitor)    │
  │                                                                              │
  │  npm run build ─┬─► Vite compressed-size table ──► FIRM bundle ko baseline   │
  │                 └─► rollup-plugin-visualizer ────► treemap composition       │
  │                                                                              │
  │  npm run preview ─► Lighthouse (mobile) ─► Web Vitals ─┐                      │
  │  dev build ───────► React DevTools Profiler (Map/nav) ─┴─► DIRECTIONAL perf  │
  │                                                                              │
  │  grep inventory ─► hard-coded colors / dup modal patterns ─► UI incoherence  │
  │                                                                              │
  │              ALL ARTIFACTS ──► .../audit/ + AUDIT.md (committed)             │
  └──────────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────── TRACK B: DESIGN SYSTEM (DS-01/02) ─────────────────────┐
  │                                                                              │
  │  Rendered light values ─► src/index.css @theme (canonicalized tokens)        │
  │        (colors, --font-sans, --radius-*, glass vars)                         │
  │                          │                                                    │
  │                          ▼  consumed by (utilities generated at build)       │
  │  AuthModal.tsx patterns ─► src/ui/ { Button, Card, Input, Modal, Header }     │
  │                          │                                                    │
  │                          ▼  D-09 proof migration                             │
  │  AuthModal.tsx ─────────► re-authored on src/ui/ ─► before/after screenshot  │
  │                                                     = pixel-identity gate     │
  └──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| File | Responsibility |
|------|----------------|
| `src/index.css` `@theme` | Single token source (D-01). Pruned of dead Deep Ocean palette; holds canonical light color tokens, font stack, custom radius (32px), glass vars |
| `src/ui/Button.tsx` | Variants primary/secondary/ghost/danger × sm/md/lg × loading/disabled; icon-only requires `aria-label` (UI-SPEC) |
| `src/ui/Input.tsx` | Label + icon-slot + input; encodes `py-3 pl-12` + focus ring `focus:ring-sky-500` + 16px font (iOS anti-zoom) verbatim |
| `src/ui/Modal.tsx` | `AnimatePresence` + backdrop `bg-black/60 backdrop-blur-md` + glass surface `bg-white/10 backdrop-blur-xl border border-white/20`; `isOpen`/`onClose` |
| `src/ui/Card.tsx` | Glass/light card surface; radius `rounded-2xl`, `shadow-sm` resting |
| `src/ui/Header.tsx` | Heading role (24px/700) + optional subtitle/close-button slot |
| `src/components/AuthModal.tsx` | Proof consumer (D-09) — re-authored on `src/ui/`, auth logic untouched |

### Recommended Structure
```
src/
├── index.css              # @theme = single token source (cleaned)
├── ui/                    # NEW — master components (D-04)
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── Header.tsx
└── components/
    └── AuthModal.tsx      # migrated to src/ui/ (D-09)

.planning/phases/01-audit-design-system/
├── 01-AUDIT.md            # the DS-03 deliverable (numbers + inventory)
└── audit/                 # raw artifacts (stats.html, lighthouse.json, knip/depcheck output)
```

### Pattern 1: Tailwind v4 `@theme` — utilities are generated from namespaced vars
**What:** Variables under a recognized namespace both set a CSS var AND generate utilities.
**Namespaces (this phase):** `--color-*` → `bg-*/text-*/border-*`; `--radius-*` → `rounded-*`; `--shadow-*` → `shadow-*`; `--font-*` → `font-*`; `--text-*` → `text-*` (size); `--spacing` = a single base value (0.25rem) that generates the entire numeric scale. [CITED: tailwindcss.com/docs/theme]
```css
/* Source: tailwindcss.com/docs/theme */
@theme {
  --color-primary: #0ea5e9;   /* Sky 500 — equals what bg-sky-500 already renders */
  --radius-4xl: 2rem;         /* generates rounded-4xl → reconciles rounded-[32px] */
}
/* JS-consumed (D-03), e.g. Map markers, read the same source: */
/* getComputedStyle(document.documentElement).getPropertyValue('--color-primary') */
```

### Pattern 2: JS colors reference the token source (D-03)
**What:** `Map.tsx` hard-codes 12 marker/cluster hexes (`#38bdf8`, `#f472b6`, …). To let them reference the same source (inventory now, migrate in Phase 2), define them as `@theme` color tokens and read via `var(--color-…)` or `getComputedStyle`. **This phase only inventories them** (deferred: actual map migration → Phase 2).

### Pattern 3: Modal codified verbatim from AuthModal
**What:** The Modal master is the exact AuthModal shell — `AnimatePresence`, `initial/animate/exit` scale 0.95→1, backdrop `bg-black/60 backdrop-blur-md`, surface `bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 shadow-2xl`, `z-[5000]`, close button top-right. Children/props are consumer-supplied; no copy is baked in (UI-SPEC copy contract).

### Anti-Patterns to Avoid
- **Redefining Tailwind's default scale tokens** (e.g. overriding `--spacing` or the default radius vars) — this silently changes EVERY screen, not just `src/ui/`. Only ADD new tokens.
- **Normalizing off-scale values** (e.g. `gap-3`/`p-3` 12px → 16px, or `rounded-[32px]` → `rounded-2xl`) — changes rendered pixels; forbidden by the cardinal constraint.
- **Introducing shadcn/Radix or any new visual dependency** — contradicts "no rebranding" (UI-SPEC: Tool = none, resolved by upstream decision).
- **"Fixing" the font to load DM Sans/Inter** — nothing currently loads them; adding a webfont changes rendering = rebranding.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spacing scale | A custom `--spacing-*` token ladder | Tailwind v4 default (`--spacing` = 0.25rem base) | Default already generates `p-4/gap-2/p-6/p-3` = the exact extracted values |
| Radius scale | Custom radius tokens for 8/12/16/24px | Tailwind v4 default `rounded-lg/xl/2xl/3xl` | Defaults already equal the UI-SPEC values; only 32px needs a new token |
| Bundle size number | Manual `du`/eyeballing dist | `vite build` compressed-size report | Deterministic raw+gzip per chunk; the firm DS-03 baseline for free |
| Bundle composition | Manual dependency accounting | `rollup-plugin-visualizer` treemap | Accurate per-module attribution incl. gzip/brotli |
| Unused deps/code | Grep heuristics | `knip` + `depcheck` | Grep misses re-exports, dynamic imports, type-only usage |
| Perf metrics | Custom timing instrumentation | Lighthouse + React DevTools Profiler | Standardized, comparable, repeatable |
| Modal open/close animation | New motion code | Extract AuthModal's existing `AnimatePresence` block | D-05 requires pixel/behavior identity |

**Key insight:** For this phase, "don't hand-roll" mostly means "don't re-invent what Tailwind v4 and the existing AuthModal already give you." The token file is a *subtraction* (prune dead Deep Ocean palette) plus a *thin* semantic layer over defaults — not a from-scratch design system.

## Runtime State Inventory

> This phase is partly a rename/canonicalization of design values in `src/index.css`. Runtime state check:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — tokens/components are code+CSS only; no persisted design values | None (verified: no DB/localStorage design tokens) |
| Live service config | None — no external service holds design tokens | None |
| OS-registered state | None | None |
| Secrets/env vars | None — no env var references a design token | None |
| Build artifacts | `dist/` CSS is regenerated by Tailwind on every `vite build`; the `.glass` CSS class in `index.css` is **dead** (0 consumers) and can be pruned | Rebuild after token edits; prune dead `.glass` rule and dead `@theme` Deep Ocean vars |

**Cross-check performed:** `bg-primary`/`text-secondary`/`bg-surface`/`bg-background`/`*-accent` utilities = **0 occurrences** in `src/`. The custom `@theme` color tokens are unreferenced dead code — pruning them cannot cause visual regression. `.glass` class = 0 occurrences.

## Common Pitfalls

### Pitfall 1: The `@theme` var double-declaration trap
**What goes wrong:** `--color-primary` is declared twice — `#38bdf8` (sky-400) in `@theme`, then re-overridden to `#0ea5e9` (sky-500) in `:root`. Tailwind generates `bg-primary` from the `@theme` value but emits `background-color: var(--color-primary)`, so the `:root` override wins at runtime → the utility and the token disagree.
**Why it happens:** Leftover from an abandoned dark→light migration.
**How to avoid:** Consolidate to a single `@theme` definition using the rendered light value; delete the `:root` color re-declarations. Since these utilities have **0 consumers**, this is safe.
**Warning sign:** A token value in `@theme` that differs from its `:root` twin.

### Pitfall 2: Lighthouse measured against the dev server
**What goes wrong:** Running Lighthouse against `npm run dev` reports catastrophic numbers (unminified, HMR overhead) that aren't a real baseline.
**How to avoid:** Always audit against the production preview: `npm run build && npm run preview` (default `http://localhost:4173`), then point Lighthouse at that URL.
**Warning sign:** LCP in the many-seconds range, giant unminified JS in the trace.

### Pitfall 3: Treating Lighthouse/Chrome as the Capacitor number
**What goes wrong:** Lighthouse runs in headless Chrome; the app ships in an iOS WKWebView. They differ (JIT, memory, GPU). Presenting Lighthouse as "the mobile app perf" overstates precision.
**How to avoid:** Record Lighthouse as a **directional web-lab proxy** (consistent with D-08 directional perf targets). Keep the **bundle ko** as the firm number; keep perf directional.
**Warning sign:** A plan that hard-commits a Lighthouse score as a pass/fail gate.

### Pitfall 4: `rollup-plugin-visualizer` default gzip off
**What goes wrong:** Default output shows parsed (uncompressed) sizes, inflating the picture and disagreeing with Vite's gzip table.
**How to avoid:** Enable `gzipSize: true` (and `brotliSize: true`) in the plugin options so composition matches the shipped transfer size.

### Pitfall 5: Pixel drift during AuthModal migration
**What goes wrong:** Re-authoring AuthModal on `src/ui/` silently changes a padding (`py-3`), a placeholder color (`placeholder:text-white/20`), the focus ring (`focus:ring-2 focus:ring-sky-500`), or the 16px input font → subtle visual/behavioral regression, or (font <16px) iOS focus-zoom returns.
**How to avoid:** Extract classes verbatim into the master components; verify with a **before/after screenshot** of the modal (login and signup states, error state), not by reading code. Keep `mapAuthError` and all `supabase.auth.*` calls byte-identical.
**Warning sign:** Any class string that was "cleaned up" or "simplified" during extraction.

### Pitfall 6: Font token misinterpreted as a load target
**What goes wrong:** Seeing `font-family: 'DM Sans'` and assuming DM Sans renders — it does not (no webfont is loaded). Adding the font "to match the token" changes every screen's typeface.
**How to avoid:** Canonicalize `--font-sans` to the **actually rendered** system stack. Flag to the user that DM Sans/Inter are declared-but-unloaded (see Assumptions Log A1).

## Code Examples

### Wire rollup-plugin-visualizer into Vite (repeatable audit)
```typescript
// Source: github.com/btd/rollup-plugin-visualizer (README) + vite.dev/config
import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: '.planning/phases/01-audit-design-system/audit/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    }) as PluginOption,
  ],
})
```

### Firm bundle baseline (no install)
```bash
# Vite prints a per-chunk raw + gzip table — capture verbatim into AUDIT.md
npm run build | tee .planning/phases/01-audit-design-system/audit/build-size.txt
```

### Dependency inventory
```bash
npx knip --reporter markdown > .planning/phases/01-audit-design-system/audit/knip.md
npx depcheck --json > .planning/phases/01-audit-design-system/audit/depcheck.json
npm outdated || true      # version staleness
npm ls @capacitor/cli @capacitor/core   # confirm/deny the CONCERNS.md mismatch
```

### JS reads a token (D-03 pattern for Map markers, Phase 2 migration)
```typescript
// Source: tailwindcss.com/docs/theme (var() usage)
const root = getComputedStyle(document.documentElement)
const primary = root.getPropertyValue('--color-primary').trim() // '#0ea5e9'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` theme object | CSS-first `@theme` in CSS + `@import "tailwindcss"` | Tailwind v4.0 | This project is already v4; no config file — tokens live in CSS |
| Static Tailwind spacing scale | `--spacing` single base value → dynamic scale | Tailwind v4.0 | Any `p-N`/`gap-N` works without defining each step |
| `@capacitor/cli` 7.x vs core 8.x mismatch (CONCERNS.md, 2026-03-18) | **package.json now pins `@capacitor/cli ^8.2.0`; `npx cap --version` → 8.2.0** | Since the March audit | The D-07 "version mismatch" item appears **already resolved** — the audit should verify installed versions rather than assume the mismatch persists |

**Deprecated/outdated:**
- Dead `@theme` "Deep Ocean" dark palette + `:root` color overrides + `.glass` CSS class — 0 consumers; prune.
- CONCERNS.md (2026-03-18) predates the current `package.json`; treat its dependency claims as leads to re-verify, not facts.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | DM Sans / Inter are not loaded, so the pixel-identical font token is the **system sans-serif** stack — canonicalize to that, not to DM Sans | Summary, Pitfall 6 | **CONFIRMED by user 2026-07-28** (plan-phase session): system stack chosen; DM Sans/Inter removed as dead values. See Open Question 3. |
| A2 | All audit tools tagged `[ASSUMED]` (slopcheck unavailable) despite verified registry+repo | Package Legitimacy Audit | Low — all are long-standing OSS; planner gate mitigates |
| A3 | The Capacitor CLI/core version mismatch is already resolved (cli 8.2.0) | State of the Art | Low — audit re-verifies with `npm ls`; if wrong, mismatch is simply re-reported |
| A4 | `rounded-[32px]` (6×) should be reconciled into the radius scale as a new named token (`--radius-4xl: 2rem`) rather than left arbitrary | Architecture Patterns | Low — cosmetic naming choice; either way renders 32px. Planner/executor discretion (D-06). |

## Open Questions

1. **Firm vs directional PERF-03 baseline unit** — **RESOLVED** (plan 01-02 Task 3 freezes **gzip total JS** as the firm baseline).
   - What we know: Bundle ko (raw+gzip) is the firm number (D-08); Lighthouse is a directional proxy.
   - What's unclear: whether the −15% target is against raw JS, gzip total, or largest chunk.
   - Resolution: Freeze **gzip total JS** as the headline firm baseline; set −15% directional against it; refine in Phase 5.

2. **Does Lighthouse have a Chrome binary available on this machine?** — **RESOLVED** (plan 01-01 Task 1 implements the Chrome preflight + documented fallback; no Chrome on PATH confirmed at plan time, so the perf slice takes the Vite compressed-size + React Profiler fallback).
   - What we know: no global `lighthouse`; `npx lighthouse` needs a Chromium/Chrome install.
   - Resolution: Planner added a preflight (`Environment Availability`); with no Chrome, fall back to Vite build report + React Profiler for the (directional) perf slice and note Lighthouse as deferred/manual.

3. **Font canonicalization (ties to A1)** — **RESOLVED**. The user explicitly confirmed **canonicalizing `--font-sans` to the system stack** during the plan-phase session on 2026-07-28 (AskUserQuestion "Police" → "Stack système (Recommandé)"). DM Sans / Inter are declared-but-unloaded dead values and are removed. This is consistent with D-02's "canonicalize on rendered values" principle and the phase's pixel-identity cardinal constraint. Loading a webfont would be rebranding (out of scope v2.0).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | all tooling | ✓ | v26.0.0 | — |
| npm | installs / `npx` | ✓ | 11.12.1 | — |
| Vite build | firm bundle baseline | ✓ | 7.2.4 (project) | — |
| `@capacitor/cli` | native context | ✓ | 8.2.0 (matches core 8.x) | — |
| Chrome/Chromium | Lighthouse run | ✗ (unverified — no global lighthouse; `npx` will need a browser) | — | Vite compressed-size report + React Profiler; run Lighthouse manually on a dev machine with Chrome |
| React DevTools | Profiler baseline | ✗ (browser extension, install as needed) | — | React 19 `<Profiler>` API in code as fallback |

**Missing with no hard block:** Chrome for Lighthouse — perf slice is directional (D-08), so absence downgrades but does not block the phase; the firm bundle baseline is unaffected.

## Validation Architecture

> nyquist_validation = true in config. This project has **no test framework and "no tests" is a locked project constraint** (REQUIREMENTS Out of Scope; CODE-03 is future). Validation here is therefore **build/lint gates + audit-artifact existence + manual visual parity**, NOT automated tests. Do not introduce a test runner.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none (project constraint: no automated tests) |
| Config file | none |
| Quick run command | `npm run lint && npm run build` (ESLint + `tsc -b` typecheck + Vite build) |
| Full suite command | `npm run build && npm run preview` + manual QA checklist (auth flow) + AuthModal before/after screenshot diff |
| Phase gate | Lint+typecheck green · audit artifacts committed · AuthModal pixel-identical |

### Phase Requirements → Verification Map
| Req ID | Behavior | Type | Command / Check | Exists? |
|--------|----------|------|-----------------|---------|
| DS-03 | Firm bundle baseline captured | build artifact | `npm run build` size table saved to `audit/build-size.txt` | ❌ Wave 0 (create audit/) |
| DS-03 | Bundle composition captured | build artifact | `stats.html` from visualizer present | ❌ Wave 0 |
| DS-03 | Dependency inventory captured | static analysis | `knip.md` + `depcheck.json` present; `npm ls` mismatch noted | ❌ Wave 0 |
| DS-03 | Directional perf baseline captured | lab/profiler | Lighthouse JSON (or documented fallback) + Profiler notes | ❌ Wave 0 |
| DS-01 | No dead tokens; utilities still resolve | build | `npm run build` succeeds after `@theme` prune | ✅ existing build |
| DS-02 | `src/ui/` components compile & typecheck | typecheck | `tsc -b` clean; ESLint clean | ✅ existing lint/build |
| DS-02 / D-09 | AuthModal renders pixel-identical | manual visual | before/after screenshot (login, signup, error states) match | ❌ Wave 0 (capture "before" first) |
| QA (parity) | Auth flow unregressed | manual | login + signup + error path exercised on device/preview | ✅ manual checklist |

### Sampling Rate
- **Per task commit:** `npm run lint && npm run build`
- **Per wave merge:** full build + preview + AuthModal screenshot diff
- **Phase gate:** all audit artifacts committed under `audit/` + AuthModal parity confirmed + build/lint green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Create `.planning/phases/01-audit-design-system/audit/` for artifacts.
- [ ] Capture **"before" AuthModal screenshots** (login/signup/error) BEFORE any token or component change — the parity oracle.
- [ ] Confirm Chrome availability for Lighthouse (else record fallback per Open Question 2).
- [ ] No test-framework install (forbidden by project constraint).

## Security Domain

> `security_enforcement` key absent in config → treated as enabled. This phase adds **no new** auth/data/crypto surface; it swaps UI for the existing `AuthModal` whose `supabase.auth.*` logic must remain byte-identical. Input-validation hardening (ROBUST-01/02) is explicitly Phase 4, not here.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (unchanged) | AuthModal keeps existing Supabase auth calls verbatim — do not alter |
| V3 Session Management | no | Supabase SDK, untouched |
| V4 Access Control | no | out of scope this phase |
| V5 Input Validation | no (Phase 4) | AuthModal keeps current `required`/`minLength={6}` HTML validation as-is; no new validation added here |
| V6 Cryptography | no | none introduced |

### Known Threat Patterns for this phase
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Regression in auth flow from UI refactor | Tampering / DoS (lockout) | Keep `handleSubmit`, `mapAuthError`, `supabase.auth.*` unchanged; verify login+signup manually before merge |
| Dev audit tool with malicious postinstall | Supply-chain | Planner `checkpoint:human-verify` gate on each `[ASSUMED]` install; `npm view <pkg> scripts.postinstall` glance |

## Sources

### Primary (HIGH confidence)
- Codebase (verified by grep/read, 2026-07-28): `src/index.css`, `src/components/AuthModal.tsx`, `index.html`, `package.json`, `vite.config.ts`; custom-token utility usage = 0; sky-default palette usage; `rounded-[32px]`×6; no webfont loaded.
- [Tailwind CSS — Theme variables](https://tailwindcss.com/docs/theme) — `@theme` namespaces (`--color-/--radius-/--shadow-/--font-/--text-`), `--spacing` base, `@theme inline`, `var()` in JS.
- npm registry (`npm view`, 2026-07-28) — verified versions of all audit tools.

### Secondary (MEDIUM confidence)
- [rollup-plugin-visualizer (npm / btd repo)](https://www.npmjs.com/package/rollup-plugin-visualizer) — Vite wiring, `emitFile`/`template`/`gzipSize`.
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config context.
- [vite-bundle-visualizer (npm)](https://www.npmjs.com/package/vite-bundle-visualizer) — zero-config alternative.

### Tertiary (LOW confidence)
- CONCERNS.md (2026-03-18) — dependency-mismatch claims, superseded by current package.json (re-verify in audit).

## Metadata

**Confidence breakdown:**
- Standard stack (audit tools): HIGH — versions verified on registry; wiring cited from official README/docs.
- Codebase facts (dead tokens, unloaded fonts, palette usage): HIGH — direct grep/read.
- Tailwind v4 token behavior: HIGH — official docs.
- Perf baseline methodology: MEDIUM — Lighthouse-as-mobile-proxy is directional by nature (D-08) and Chrome availability unconfirmed.
- Package legitimacy: MEDIUM — registry+repo verified, but slopcheck unavailable → all `[ASSUMED]`, planner-gated.

**Research date:** 2026-07-28
**Valid until:** ~2026-08-27 (30 days; stable stack). Re-verify tool versions if the phase starts later.
