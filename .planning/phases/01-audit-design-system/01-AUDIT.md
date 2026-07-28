# Phase 01 — Architecture Audit (DS-03)

**Date:** 2026-07-28
**Scope:** Current-state photograph of the Updock app on pristine source (Wave 1, before
any token/component change) — bundle size + composition, dependency inventory, directional
perf, and UI-incoherence inventory.
**Nature:** Measurement + inventory ONLY. Nothing is migrated in this plan. The Map.tsx
colour and modal-duplication findings are inventoried for Phase 2+; token cleanup is plan 01-03+.

Raw artifacts backing every number below live in
`.planning/phases/01-audit-design-system/audit/`.

---

## 1. Structure Summary

Source: `.planning/codebase/STRUCTURE.md`, `.planning/codebase/STACK.md` (analysed 2026-03-18),
re-verified by `find src` on 2026-07-28.

- **Stack:** React 19.2 + TypeScript 5.9, Vite 7.2 build, Tailwind v4 (CSS-first `@theme`),
  Mapbox GL 2.15 (`react-map-gl` 7.1), Supabase JS, Framer Motion 12, Capacitor 8 (iOS/Android).
- **Source graph:** 34 `.ts`/`.tsx` files under `src/`.
  - `src/components/` — 19 files (business components: Map, AuthModal, AddSpotForm, SpotDetail,
    AdminDashboard, FiltersModal, Profile, ReviewList, …).
  - `src/context/` — 7 React context providers (Auth, Spots, Sessions, Profile, Favorites,
    Notifications, Language) — the app's state layer.
  - `src/` supporting: `assets/avatars` (5), `config` (1), `data` (1), `lib` (1),
    `translations` (2), `utils` (3).
- **No test infrastructure** — a locked project constraint (REQUIREMENTS Out of Scope).
  Validation is build/lint gates + audit-artifact existence + manual visual parity.

---

## 2. Firm Bundle Baseline (D-08)

Source: `audit/build-size.txt` (verbatim `npm run build` compressed-size table, Vite 7.2.7)
and `audit/stats.html` (rollup-plugin-visualizer treemap, gzip + brotli).

### Per-chunk (raw │ gzip)

| Asset | Raw (kB) | Gzip (kB) | Kind |
|-------|---------:|----------:|------|
| `assets/mapbox-gl-Du0GEVXw.js` | 987.84 | **274.66** | vendor (Mapbox GL) |
| `assets/index-DXUOV-dU.js` | 733.44 | **214.11** | app + other vendor |
| `assets/web-CkVArvhV.js` | 45.83 | 14.10 | vendor chunk |
| `assets/web-YyG7_k9H.js` | 0.90 | 0.47 | small chunk |
| `assets/web-MVbS4Siv.js` | 0.76 | 0.35 | small chunk |
| `assets/web-BrcgjhEa.js` | 0.36 | 0.25 | small chunk |
| `assets/web-BXNBJe_y.js` | 0.28 | 0.23 | small chunk |
| `assets/index-*.css` | 87.19 | 13.60 | Tailwind CSS |
| `index.html` | 0.45 | 0.30 | — |

### Headline firm numbers (frozen)

- **FIRM BASELINE = gzip total JS = 504.17 kB** (sum of all `.js` gzip sizes).
  This is the headline number per RESEARCH Open Question 1 (resolved: freeze gzip total JS).
- Raw total JS: 1769.41 kB.
- CSS: 87.19 kB raw / 13.60 kB gzip.
- Total JS+CSS transfer (gzip): **517.77 kB**.

### Composition insight

- **Mapbox GL alone = 274.66 kB gzip = 54.5 % of gzip JS.** The single largest lever.
  Core to the product (the map is the app), so reduction is bounded — treat as directional.
- App + remaining vendor (`index-*.js`) = 214.11 kB gzip = 42.5 % of gzip JS.
- Vite flags both `index` and `mapbox-gl` chunks as > 500 kB raw and suggests code-splitting
  via dynamic `import()` / `manualChunks` — a concrete PERF lever for Phase 5.

---

## 3. Directional PERF-03 Target (D-08)

> **DIRECTIONAL — not a hard commitment.** Refined in Phase 5 (PERF-03).

- **Target: −15 % gzip total JS → ≈ 428.5 kB** (from the 504.17 kB firm baseline).
- Rationale: −15 % is achievable via code-splitting the app chunk and lazy-loading
  non-critical paths; the Mapbox core resists large cuts, so the target is set against the
  whole gzip-JS figure rather than any single chunk.
- Levers identified (for Phase 5): dynamic `import()` route/modal splitting, `manualChunks`
  vendor separation, tree-shaking unused deps (see §4), dropping the confirmed-unused
  `@capacitor/android` from the web bundle graph.
- Perf runtime metrics stay **directional** (see §5) — the bundle ko is the firm gate; the
  Lighthouse/Web-Vitals number is a proxy (RESEARCH Pitfall 3, D-08).

---

## 4. Dependency Inventory

Sources: `audit/knip.md`, `audit/depcheck.json`, `audit/npm-outdated.txt`,
`audit/capacitor-versions.txt`.

### Capacitor version verdict (CONCERNS.md re-verification)

CONCERNS.md (2026-03-18) claimed a mismatch: `@capacitor/cli` v7.4.4 vs `@capacitor/core`
v8.0.0. Re-verified on 2026-07-28 via `npm ls @capacitor/cli @capacitor/core`:

- **`@capacitor/cli` = 8.2.0, `@capacitor/core` = 8.0.0 — both v8. MISMATCH RESOLVED.**
- Every Capacitor plugin (`android/ios/app/geolocation/share/toast`, `@capacitor-firebase/messaging`)
  dedupes on `@capacitor/core@8.0.0`.
- Nuance: `@capacitor/assets@3.0.5` (dev tool) pulls a nested `@capacitor/cli@5.7.8` in its own
  subtree, but the project-level CLI the developer invokes is 8.2.0. Not a runtime concern.
- Verdict: the CONCERNS.md item is **stale/superseded by the current package.json** — no action
  needed this milestone.

### Unused files / deps / exports (knip)

- **Unused files (3):** `supabase/functions/send-session-reminders/index.ts`,
  `supabase/functions/notify-session-created/index.ts`, `test-fcm.mjs` — Supabase Edge
  Functions + a scratch FCM test script; live outside the Vite graph, expected. (The
  notify-session function IS deployed server-side — knip only sees the client graph. Do not
  delete blindly; flagged for CODE-01 review, not removal here.)
- **Unused dependency (1):** `@capacitor/android` — Android platform not in the current build
  path (iOS-first). Candidate for Phase 5 dependency pruning.
- **Unused devDependencies (3):** `@capacitor/assets`, `autoprefixer`, `depcheck` (depcheck is
  self-flagging as it is invoked via `npx`, not imported — false positive).
- **Unlisted dependency (1):** `geojson` imported in `src/components/Map.tsx` but not in
  `package.json` (resolved transitively via mapbox types). Should be added explicitly — flagged
  for CODE-01.

### depcheck cross-check (`audit/depcheck.json`)

- Unused deps: `@capacitor/android`, `@capacitor/ios`, `@tailwindcss/postcss` (the latter two
  are build/native-config false positives — used by native tooling / PostCSS pipeline).
- Missing (used-but-unlisted): `geojson` (confirms knip), plus Supabase Edge Function imports
  (`@supabase`, `google-auth-library`, `@emotion/is-prop-valid`) — all inside `supabase/functions/*`
  (Deno runtime, separate dependency universe; not part of the client bundle).
- **Reconciliation:** knip + depcheck agree on the two actionable items — unused
  `@capacitor/android` and unlisted `geojson`. Everything else is a build/native/Deno false
  positive. No urgent action this milestone; folded into CODE-01/CODE-02 (Phase 5).

### Staleness (`npm outdated`)

Everything is on a current-minor line; nothing dangerously stale. Notable majors available but
intentionally NOT taken (would risk regression, out of scope): `mapbox-gl` 2→3, `react-map-gl`
7→8, `lucide-react` 0.556→1.x, `typescript` 5→7, `vite` 7→8, `eslint` 9→10. Minor bumps
(Capacitor 8.0→8.4, Supabase 2.87→2.110, framer-motion 12.23→12.43) are low-risk and can be
batched in Phase 5 cleanup.

---

## 5. Directional Perf Baseline — Lighthouse Fallback

Source: RESEARCH Open Question 2 (resolved: no Chrome on PATH), Pitfalls 2/3.

- **Chrome/Chromium is ABSENT on this machine** (no `google-chrome`/`chromium`/`chrome` on
  PATH; no `/Applications/Google Chrome.app`). `npx lighthouse` requires a Chromium binary, so
  Lighthouse **was not run**. `audit/lighthouse.json` is intentionally NOT produced.
- **Documented fallback (per plan + D-08 directional perf):**
  1. **Firm side — Vite compressed-size report** (§2) stands as the firm, deterministic baseline.
     This is unaffected by the Chrome gap.
  2. **Directional side — React Profiler notes.** The React 19 `<Profiler>` API is available in
     code; the critical screens to profile for render/commit counts are the **Map view**
     (`src/components/Map.tsx` — heavy Mapbox + clustering) and the **navigation shell**
     (`src/App.tsx` + NavBar). These establish the pre-refactor render baseline for Phase 2
     PERF-01. Interactive profiling requires a running app on a dev machine and is captured
     there; no numeric Lighthouse lab score is frozen this phase.
- **Lighthouse status: MANUAL / DEFERRED.** Run `npx lighthouse http://localhost:4173
  --form-factor=mobile` on a machine with Chrome (against `npm run build && npm run preview`,
  never the dev server — Pitfall 2) when a lab number is wanted. Because perf is directional
  (D-08), this absence downgrades precision but does **not block** the phase — the firm bundle
  baseline is the gate.
- Caveat (Pitfall 3): even when run, Lighthouse is a headless-Chrome proxy; the app ships in an
  iOS WKWebView. Any Lighthouse score is directional, not the Capacitor number.

---

## 6. UI-Incoherence Inventory (D-03, D-07)

> **Inventory only.** Nothing below is migrated in Phase 1. Map.tsx colours → Phase 2;
> token/modal consolidation → design-system build (plans 01-03+).

### 6.1 Hard-coded Map.tsx marker/cluster colours

`grep` on `src/components/Map.tsx`:

- **17 hard-coded hex occurrences, 12 distinct colours.** These drive marker + cluster
  styling directly in JS, bypassing any token source:
  `#38bdf8` (×3), `#ffffff` (×3), `#fff` (×2), `#fbbf24`, `#f97316`, `#f59e0b`, `#f472b6`,
  `#818cf8`, `#2dd4bf`, `#242B4B`, `#22d3ee`, `#0f172a`.
- Per D-03, these should eventually reference the same `@theme` token source via
  `var(--color-…)` / `getComputedStyle`. **Migration is Phase 2** — inventoried here only.

### 6.2 Duplicated modal patterns

- **6 components** hand-roll a modal shell with a `bg-black/*` backdrop + `AnimatePresence` +
  `backdrop-blur`: `AuthModal`, `FiltersModal`, `SpotDetail`, `AddSpotInfoModal`, `AddSpotForm`,
  `AdminDashboard`. Each re-implements the open/close animation and backdrop independently.
- This is exactly the duplication the DS-02 `src/ui/Modal` master will absorb (codified verbatim
  from `AuthModal` per D-05). AuthModal is the D-09 proof migration.

### 6.3 Dead design tokens (`src/index.css`)

Confirmed by grep (0 consumers each):

- **Dead `@theme` "Deep Ocean" dark palette** — `--color-background: #0f172a`,
  `--color-surface`, `--color-primary: #38bdf8`, `--color-secondary`, `--color-accent`,
  and `--font-sans: "Inter", …`. The `:root` block re-overrides colours to a **light** theme
  (`color-scheme: light`, `--color-primary: #0ea5e9`). The app renders entirely from Tailwind's
  **default** palette + the light `:root` — the custom `bg-primary`/`text-secondary`/`bg-surface`/
  `bg-background`/`*-accent` utilities have **0 occurrences** across `src/`.
- **Dead `.glass` CSS class** — **0 `className` consumers** in `src/`.
- **Unloaded fonts** — neither DM Sans (`:root`) nor Inter (`@theme`) is actually loaded (no
  `<link>`/`@font-face`/font file); the rendered face is the system sans-serif stack. Font token
  will be canonicalized to the system stack (RESEARCH Open Q3, user-confirmed) — NOT loaded.
- **Off-scale radius** — `rounded-[32px]` appears **6×** in `src/`; to be reconciled as a named
  `--radius-*` token (renders identically) during the token build (plan 01-03+).
- **Consequence:** pruning the dead palette + `.glass` cannot cause visual regression (0
  consumers). Handled in the design-system plans, not here.

### 6.4 Code-quality debt (out of scope, deferred)

`npm run lint` (`audit/lint-report.txt`) reports **33 problems (28 errors, 5 warnings)** in app
source — all **pre-existing**, none introduced by this plan (which only touched `vite.config.ts`
+ dev deps). Breakdown: `no-explicit-any` (13), `react-refresh/only-export-components` (7),
`react-hooks/set-state-in-effect` (7), `react-hooks/exhaustive-deps` (5), `no-unused-vars` (1).
Logged to `deferred-items.md`; target CODE-01/CODE-02 + PERF-01. Not fixed here (measurement only).

---

## 7. DS-03 Satisfaction

| Requirement | Evidence |
|-------------|----------|
| Firm bundle baseline captured | `audit/build-size.txt` → **504.17 kB gzip JS** (§2) |
| Bundle composition captured | `audit/stats.html` visualizer treemap (gzip+brotli) |
| Dependency inventory captured | `audit/knip.md` + `audit/depcheck.json` + `audit/npm-outdated.txt` (§4) |
| Capacitor mismatch verdict | cli 8.2.0 / core 8.0.0 — **resolved** (`audit/capacitor-versions.txt`, §4) |
| Directional perf baseline | Vite size report (firm) + React Profiler plan; Lighthouse deferred (no Chrome) (§5) |
| UI-incoherence inventory | Map.tsx 12 hexes, 6 duplicated modals, dead palette/glass/fonts (§6) |
| Firm baseline + directional PERF-03 target | §2 (504.17 kB gzip JS) + §3 (−15 % → ≈428.5 kB, directional) |

**DS-03 satisfied:** the current state is documented with a firm numeric bundle baseline and a
directional PERF-03 target, backed by committed raw artifacts under `audit/`.
