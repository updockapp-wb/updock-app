# Phase 5: Recette globale & nettoyage final - Research

**Researched:** 2026-07-31
**Domain:** React 19 + Vite 7 + Capacitor 8 refactor — dead-code/dep pruning, state homogenization, bundle code-splitting, manual regression recette
**Confidence:** HIGH (all findings verified against the live codebase in this session)

## Summary

This is the closing phase of the v2.0 refactor. Research confirms the four work-streams (CODE-01 dead code/deps, CODE-02 state homogenization, PERF-03 bundle reduction, QA-01 global recette) but surfaces **three load-bearing corrections to premises baked into `05-CONTEXT.md`** that the planner MUST absorb before writing tasks:

1. **No context follows a "split" file convention yet.** CONTEXT.md D-04 assumes `AuthContext`, `FavoritesContext`, `ProfileContext` already split their hook out of the provider file and only 3 contexts (`Language`, `Sessions`, `Spots`) need aligning. **Verified false:** all 6 contexts co-locate their `useXxx()` hook with the provider and **all 6 trigger `react-refresh/only-export-components`**. Because D-01 requires `npm run lint` to finish green, **all 6 contexts must be split**, and there is **no existing precedent to copy** — the convention is a fresh Claude's-discretion decision.

2. **The stated bundle metric and the stated strategy are in tension.** PERF-03's baseline (D-09) is defined as *"gzip total JS = 504.17 kB = the SUM of every `.js` chunk's gzip size"*. But the primary strategy (D-06 code-splitting / `React.lazy`) **defers** code into separate chunks — it does **not reduce the sum of all chunks**. Meanwhile, dead-dependency removal (D-03) yields **~0 kB** of web-bundle reduction (the only "unused" deps are native platforms or dev tools that never enter the Vite graph). The realistic, defensible operative target is **initial/eager gzip JS** (what downloads before the map renders), which lazy-loading Mapbox slashes from ~504 kB to ~230 kB — far beyond −15%. This needs an explicit planner/user decision (see Open Questions Q1).

3. **`@capacitor/android` must NOT be removed** despite knip flagging it "unused". D-11 mandates the recette runs on a real **Android** device; removing the platform breaks the Android build.

**Primary recommendation:** Split all 6 context hooks into `use{Name}.ts` files (fresh convention); fix the 34 lint problems by category; convert `Map.tsx`, `AdminDashboard.tsx`, `PremiumModal.tsx` to `React.lazy` behind a single `Suspense` boundary with a skeleton fallback; reproduce the exact `ANALYZE=1 npm run build` measurement; and re-frame PERF-03 around **eager (initial-load) gzip JS** while still reporting the summed total. Use **knip** (not depcheck) as the authoritative dead-code tool.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Cleanup covers the ENTIRE accumulated lint debt (currently 34 problems / 27 errors / 7 warnings), not just dead code/deps. `npm run lint` must finish green.
- **D-02:** Fix `cacheSpotImages()` in `src/utils/offline.ts` (synchronous blocking loop) — in scope.
- **D-03:** Obsolete deps = remove **unused** packages only (via `knip`/`depcheck`, already installed). **No version bumps** (minor or major).
- **D-04:** The 3 contexts exporting non-components alongside their Provider (`LanguageContext`, `SessionsContext`, `SpotsContext`) must have hooks/constants extracted to separate files to align with `AuthContext`/`FavoritesContext`/`ProfileContext`. *(See RESEARCH correction #1 — all 6 actually need this.)*
- **D-05:** The Phase-4 harmonized error pattern (rethrow + Toast, no native `alert()`) must be audited and extended to `AuthContext`, `ProfileContext`, `SessionsContext` where they still diverge.
- **D-06:** Primary strategy = code-splitting / lazy-load, not just dep removal + tree-shaking. Mapbox GL (54.5% of gzip JS) → dynamic import.
- **D-07:** During lazy load of the Mapbox chunk on the Carte screen (main screen, shown at login), show a **skeleton/spinner** over the map area — **no** eager preloading at login.
- **D-08:** Code-splitting extends beyond Mapbox to all non-critical conditionally-mounted screens/modals: `AdminDashboard`, `PremiumModal`, and any equivalent identified at planning — via `React.lazy`.
- **D-09:** Verify the −15% target by reproducing **exactly** the Phase-1 methodology: `audit/build-size.txt` + `audit/stats.html` (rollup-plugin-visualizer), reference metric = gzip total JS vs the 504.17 kB firm baseline.
- **D-10:** The checklist is a **full global regression recette** — merge of the QA-01 checklists from Phases 2/3/4 **plus** flows not covered before (avis, session, auth). Not a Phase-5-changes-only checklist.
- **D-11:** Recette tested on **iOS + Android** (real device) — divergence from Phases 3/4 (iOS-only) is intentional.
- **D-12:** The 2 known out-of-scope bugs (push notifs not received on iPhone; incomplete country list in `CommunityStatsScreen`) are listed explicitly in the checklist as **known exclusions**.
- **D-13:** QA-01 runs in a **single final pass**, after CODE-01/02 and PERF-03 are all done — no intermediate recette after the bundle work alone.

### Claude's Discretion
- Exact naming/location of the extracted files for D-04 (e.g. `useSpots.ts` vs another convention).
- Exact technical breakdown of the React.lazy/Suspense split for D-06/D-08 (chunk granularity, `Suspense` boundary placement).
- Exact tool choice between `knip` and `depcheck` (or both cross-checked) for D-03 — both already installed.
- Exact/complementary list of components/modals in "non-critical screens" beyond AdminDashboard/PremiumModal (D-08) — confirm by reading code at planning.

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
- Reviewed-but-not-folded todos: `country-list-incomplete-other-emoji.md` (data/logic bug, referenced only as QA exclusion), `push-notif-no-popup-iphone.md` (out of milestone, referenced only as QA exclusion).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CODE-01 | Dead code + obsolete/unused deps identified then removed | knip inventory verified (§Dead Code); real dead-dep yield ≈ 0 kB — see corrections; `test-fcm.mjs` safe to delete; `geojson` must be added to `package.json` |
| CODE-02 | State management homogenized — coherent patterns across contexts | All 6 contexts need hook-file split (§Context Split); error pattern = rethrow-to-caller, divergences catalogued (§Error Handling) |
| PERF-03 | Bundle reduced vs DS-03 baseline (chiffré target) | Baseline 504.17 kB confirmed; measurement command verified; metric-vs-strategy tension flagged (Q1); lazy-load plan (§Code-Splitting) |
| QA-01 | Critical-flow checklist 100% on manual mobile test, zero regression | Flow surface mapped from `src/components` + `App.tsx`; exclusions D-12 confirmed present in todos/ |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dead code / unused dep detection | Build tooling (knip) | — | Static analysis of the client module graph; runs at dev/CI time, not runtime |
| State homogenization (contexts) | Client (React) | — | Pure client state layer; no server/API change |
| Error feedback (Toast) | Client (calling component) | Client (context rethrows) | Context has no i18n access → rethrows; component owns translated Toast (established Pitfall-4 pattern) |
| Code-splitting / lazy chunks | Build (Vite/Rollup) + Client (React.lazy) | — | Rollup emits chunks; React.lazy + Suspense controls when they load in the WebView |
| Image caching (`cacheSpotImages`) | Client (Cache API / Service Worker storage) | — | Runs in the WebView against the browser Cache API |
| Bundle measurement | Build (rollup-plugin-visualizer) | — | Reproduces Phase-1 artifacts |
| Manual recette | Device (iOS + Android WebView) | — | No automated test infra (locked constraint); human validation |

## Standard Stack

No new packages are introduced this phase. Every tool required is already in `package.json` (verified 2026-07-31).

### Core (already installed — verified via `package.json` + live invocation)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `knip` | ^6.29.0 | Dead files/exports/deps detection | Understands Vite/TS graph; accurate on this stack (verified below) [VERIFIED: ran `npx knip`] |
| `depcheck` | ^1.4.7 | Secondary dep cross-check | Legacy resolver; **many false positives here** — cross-check only [VERIFIED: ran `npx depcheck`] |
| `rollup-plugin-visualizer` | ^7.0.1 | Bundle treemap (`stats.html`) | Exactly the Phase-1 measurement tool; gated behind `ANALYZE` env in `vite.config.ts` [VERIFIED: read `vite.config.ts`] |
| `React.lazy` / `Suspense` | React ^19.2.0 | Code-splitting non-critical screens | Native React API; no new dep needed [CITED: react.dev/reference/react/lazy] |
| `eslint` + `typescript-eslint` | ^9.39.1 / ^8.46.4 | Lint gate (D-01 green target) | Already the project gate [VERIFIED: ran `npm run lint`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `knip` as primary | `depcheck` as primary | depcheck falsely flags `@capacitor/ios`, `tailwindcss`, `postcss`, `knip` itself as unused (they're used via config/native build). knip is far more accurate here. Use depcheck only to widen the candidate net, never to auto-remove. |
| `React.lazy(Map)` | `manualChunks` in `vite.config.ts` | `manualChunks` only *renames/regroups* eager chunks — it does not defer them. Only `React.lazy` (dynamic `import()`) actually delays download. Mapbox is already a separate chunk in the baseline, so `manualChunks` buys nothing for load time; `React.lazy` is required. |

**No installation step required.** If the planner adds `geojson` to `package.json` (currently unlisted, imported by `Map.tsx`), that is a `devDependencies` type-only addition — run the Package Legitimacy Gate on it (§Package Legitimacy Audit).

## Package Legitimacy Audit

**No new runtime packages are installed this phase.** All tooling pre-exists and was invoked live this session. The only candidate addition is a type-only listing of an already-transitively-present package:

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `geojson` | npm | ~9 yrs | ~1M+/wk | github.com/caseycesari/geojson.js | not run (already transitive via `@types/mapbox-gl`) | Approve as explicit `devDependency` — resolves knip "unlisted" flag; already in the graph |

**Packages removed due to slopcheck [SLOP]:** none (no installs).
**Packages flagged [SUS]:** none.

*slopcheck was not run because this phase installs no new runtime packages. If the planner decides to add `geojson` explicitly, gate it behind a `checkpoint:human-verify` per protocol (it is already resolved transitively, so risk is minimal).*

## Architecture Patterns

### System Architecture Diagram

```
                            App entry (main.tsx)
                                   │  static import graph = EAGER load
                                   ▼
                          ┌──────────────────┐
                          │  App.tsx          │  Provider tree:
                          │  AppContent       │  Language>Auth>Spots>Favorites>
                          └──────────────────┘  Profile>Notifications>Sessions
                                   │
              ┌────────────────────┼─────────────────────────┐
   activeTab==='map' (default)     │                          │  conditional mounts
              ▼                     ▼                          ▼
   ┌────────────────────┐   NavBar / lists / Profile   ┌────────────────────┐
   │  Map.tsx           │   (eager, small)             │ AdminDashboard      │ admin-only
   │  └ react-map-gl    │                              │ PremiumModal        │ gated
   │     └ mapbox-gl    │◄── 274.66 kB gzip (54.5%)    │ (isOpen flags)      │
   └────────────────────┘    currently EAGER            └────────────────────┘
              │                                                   │
   PLAN: React.lazy(() => import('./components/Map'))   PLAN: React.lazy(...)
   wrapped in <Suspense fallback={<MapSkeleton/>}>      lazy — only load when opened
              │
              ▼
   mapbox-gl chunk fetched ON DEMAND when map tab first renders
   (still ~immediate since map is default tab, but async + skeleton per D-07,
    and OFF the initial parse/eval critical path)
```

*The map is the default tab, so its chunk still fetches right after login — but as a deferred async chunk with a skeleton, not part of the initial JS parse/eval. That is the load-time win and matches D-07 (skeleton, no eager preload).*

### Pattern 1: Lazy-loading a Mapbox screen behind Suspense (D-06/D-07)

**What:** Convert the static `import Map from './components/Map'` in `App.tsx` to `React.lazy`, wrap the map render in a `Suspense` with a skeleton fallback.
**When to use:** Any large, statically-imported screen that is not needed for first paint of the shell.
**Example:**
```tsx
// App.tsx — Source: react.dev/reference/react/lazy [CITED]
import { lazy, Suspense } from 'react';
const Map = lazy(() => import('./components/Map'));

// inside AppContent, replacing the current <Map .../> :
{activeTab === 'map' && (
  <motion.div key="map" /* …existing motion props… */>
    <Suspense fallback={<MapSkeleton />}>
      <Map
        onSpotClick={handleSpotClick}
        selectedSpot={selectedSpot}
        isAddingSpotMode={isAddingSpotMode}
        onSetAddingSpotMode={setIsAddingSpotMode}
      />
    </Suspense>
  </motion.div>
)}
```
- `Map.tsx` is already a **default export** → `lazy(() => import('./components/Map'))` works directly (no `.then(m => ({default: m.X}))` shim needed).
- `MapSkeleton` = a full-area `div` with the existing spinner classes already used for the auth-loading screen (`w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin`) or a pulsing map-shaped placeholder. Keep it inside the map area so the shell/nav stay interactive.
- The `import 'mapbox-gl/dist/mapbox-gl.css'` currently in `main.tsx` (verified) is a small **eager CSS** side-effect. Optionally move it into `Map.tsx` so the CSS also defers; it does not affect the JS metric.

### Pattern 2: Lazy-loading conditional modals (D-08)

**What:** `AdminDashboard` (490 lines, admin-only) and `PremiumModal` (44 lines) render behind boolean flags. Convert to `lazy`.
**When to use:** Components mounted behind an `isOpen`/role flag that most sessions never trigger.
```tsx
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
// AdminDashboard is always mounted in App.tsx with an isOpen prop; either
//  (a) wrap it in Suspense and keep the isOpen prop, or
//  (b) render it only when isAdminOpen (cheaper — avoids loading the chunk at all until opened).
{isAdminOpen && (
  <Suspense fallback={null}>
    <AdminDashboard isOpen onClose={() => setIsAdminOpen(false)} onSpotSelect={handleSpotSelect} />
  </Suspense>
)}
```
- **Note:** `AdminDashboard` is currently rendered **unconditionally** (mounted always, visibility driven by `isOpen`). Switching to `{isAdminOpen && ...}` is the bigger win — it avoids loading the 490-line chunk (plus its `framer-motion` usage) for non-admins entirely. Confirm no mount-time side-effects are lost.
- `PremiumModal` is imported by `Profile.tsx` (verified via grep) — lazy-load at that call site, not `App.tsx`.
- **fallback for modals = `null`** (or a tiny spinner). No skeleton needed since the trigger is a user tap, not first paint.

### Pattern 3: Context hook-file split (D-04 — applies to ALL 6 contexts)

**What:** Move the `use{Name}()` hook (and any exported constants) into a sibling file so the provider file exports only the component — satisfying `react-refresh/only-export-components`.
**Fresh convention (Claude's discretion — no precedent exists):** Recommended shape, per context:
```
src/context/
  {Name}Context.tsx   → exports {Name}Provider (component) ONLY. Keeps the
                         `const {Name}Context = createContext(...)` but EXPORTS it
                         (so the hook file can import it), or moves the context object
                         into a shared internal module.
  use{Name}.ts         → exports use{Name}(): the useContext + throw-if-outside-provider.
```
- Cleanest split that satisfies the lint rule: **context object + provider in `{Name}Context.tsx`; hook in `use{Name}.ts`.** The context object must be `export`ed (a non-component export) — but `react-refresh` only complains when a **component** shares the file with non-components; a file exporting a context object + a component still trips the rule. **Therefore the provider file must export ONLY the provider component.** Practical arrangement:
  - `{Name}Context.ts` (no JSX, not `.tsx`) → `export const {Name}Context = createContext(...)` + the `interface`/types.
  - `{Name}Provider.tsx` OR keep `{Name}Context.tsx` → the provider component only.
  - `use{Name}.ts` → the hook.
- **Simpler alternative that also passes lint** and touches fewer import sites: keep `{Name}Context.tsx` exporting the provider **and** the context object is fine ONLY IF no hook/other function is exported there. The rule fires on function/const exports alongside a component. Moving just the `use{Name}` hook out is the minimum change. Verify with `npm run lint` after each split.
- **Update all import sites** — `App.tsx` imports `{ useLanguage }`, `{ useFavorites }`, `{ useSpots }`, `{ useAuth }` etc. from the `Context` files today; these must repoint to the new hook files. Grep `from './context/` across `src/` before/after.
- **Do all 6** (`Auth`, `Favorites`, `Profile`, `Language`, `Sessions`, `Spots`) — not just the 3 in D-04 — because lint (D-01) requires all 6 green.

### Pattern 4: Harmonized error handling (D-05 — rethrow to caller)

**Established canonical pattern** (verified in `FavoritesContext.tsx` lines 95-106, mirrored in `ProfileContext`, `SessionsContext`):
```tsx
try {
  // optimistic update already applied
  const { error } = await supabase./* … */;
  if (error) throw error;
} catch (err) {
  console.error('…context-specific message…', err);
  // revert/rollback the optimistic state
  setState(prev => /* undo */);
  // Context has NO i18n access → rethrow so the calling component shows the
  // translated Toast via t() (Pitfall 4).
  throw err;
}
```
Caller side (verified in `App.tsx` line 183):
```tsx
toggleFavorite(spot.id).catch(() => Toast.show({ text: t('fav.error.revert'), duration: 'short' }));
```

### Anti-Patterns to Avoid
- **Direct `Toast.show()` with hardcoded French strings inside a context** — diverges from the rethrow pattern and bypasses i18n. Present in `SpotsContext.addSpot/approveSpot/deleteSpot` (hardcoded French Toasts). D-05 target for harmonization.
- **Native `alert()` / `confirm()`** — `AuthModal.tsx:73` uses `alert(t('auth.alert_signup'))`; `SpotsContext.tsx:235` uses `confirm('Delete this spot?')`. Both are native browser dialogs inconsistent with the Toast/Modal pattern and should be replaced (Toast for the alert; the app's master `Modal` confirm for the delete). Note the `confirm()` string isn't even translated.
- **`manualChunks` as a "size reduction" lever** — it regroups eager chunks; it does not reduce total or defer load. Only dynamic `import()` defers.
- **Removing `@capacitor/android`** — knip flags it unused (no JS import) but D-11 requires an Android build/test. Removing it breaks Android. **Keep it.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead code/dep detection | Manual `grep` for unused exports | `knip` | Understands the TS/Vite graph incl. dynamic imports; catches unused exports/files/deps grep misses |
| Bundle measurement | Custom size script | `rollup-plugin-visualizer` + Vite's own gzip table | Already the frozen Phase-1 methodology (D-09) — reproduce exactly, don't reinvent |
| Lazy loading | Manual `import()` + state machine | `React.lazy` + `Suspense` | Native React handles the pending/error/loaded states and de-dupes concurrent loads |
| Confirm dialog | Native `confirm()` | Existing `src/ui/Modal.tsx` | Consistent styling, no blocking native dialog, translatable |

**Key insight:** Every capability this phase needs already exists in the project or in React core. The work is *applying* existing tools consistently, not adding new ones.

## Runtime State Inventory

This is a refactor/cleanup phase. Runtime-state audit:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None affected.** `localStorage` keys (`updock_spots_cache`, `updock_favorites_cache`) and Cache API (`updock-images-v1`) are read/written by code being refactored, but key names/shapes are NOT changing. Context splits move code, not storage keys. | None — verify keys unchanged after context split |
| Live service config | **None.** No Supabase table, RLS, or edge-function config changes. Edge functions (`notify-session-created` deployed server-side) are NOT touched (knip flags them "unused" only because they're outside the client graph — do NOT delete). | None — leave edge functions in place |
| OS-registered state | **None.** No Capacitor plugin registration, native task, or platform config changes. `@capacitor/android` stays (D-11 Android build). | None |
| Secrets/env vars | **None.** No env var renames. `ANALYZE` env is a build-time flag for the visualizer (already exists in `vite.config.ts`). | None |
| Build artifacts | `dist/` regenerated by `npm run build`; `ios/App/App/public/` (Capacitor sync target) will hold new hashed chunk names after code-splitting. `test-fcm.mjs` (root scratch file) is dead — safe to delete (CODE-01). | Run `npx cap sync` after build so native shells pick up new chunks before the recette (D-11) |

**Cross-platform risk (D-11):** Code-splitting changes chunk file names and adds runtime dynamic `import()` in the Capacitor WebView. See Pitfall 1 (offline chunk loading) — this is the main new cross-platform risk and is exactly why D-11 mandates Android + iOS testing.

## Common Pitfalls

### Pitfall 1: Dynamic-import chunk-load failure in the Capacitor WebView (offline / stale cache)
**What goes wrong:** After code-splitting, the app fetches JS chunks lazily. In a Capacitor WebView the bundle is served from the app's local filesystem (`capacitor://localhost` / `https://localhost`), so there is no network dependency for the chunk itself — but a `React.lazy` import can still reject (e.g. a chunk missing after a bad `cap sync`, or a runtime error inside the module), and an unhandled lazy rejection blanks the screen.
**Why it happens:** `React.lazy` throws on import failure; without an Error Boundary the whole subtree unmounts.
**How to avoid:** Wrap lazy screens in an **Error Boundary** (or a retry wrapper) in addition to `Suspense`. For the map (default screen) provide a "reload" affordance in the boundary fallback. Always run `npm run build && npx cap sync` before device testing so the native `public/` folder has the new hashed chunks.
**Warning signs:** Blank map area on cold launch; console `Failed to fetch dynamically imported module`.
**Confidence:** MEDIUM — pattern is standard React; the specific Capacitor-WebView behavior should be verified on-device during the recette (part of D-11). [ASSUMED]

### Pitfall 2: The "gzip total JS" metric doesn't move from code-splitting alone
**What goes wrong:** Team lazy-loads Mapbox, re-measures the summed gzip JS, and finds it ~unchanged (504 → ~504 kB) because splitting relocates code across chunks without deleting any.
**Why it happens:** D-09 defines the metric as the SUM of all `.js` chunk gzip sizes. Deferred code still counts in the sum.
**How to avoid:** Measure **eager/initial gzip JS** (chunks loaded before the map renders) as the operative PERF-03 number, and report the summed total alongside for continuity. Resolve Q1 before the bundle task starts.
**Warning signs:** −15% target "impossible" despite big code-splitting effort.
**Confidence:** HIGH — verified by the definition in `01-AUDIT.md §2` and the mechanics of Rollup chunking.

### Pitfall 3: Splitting only the 3 contexts in D-04 leaves lint red
**What goes wrong:** Plan splits `Language`/`Sessions`/`Spots` only; `npm run lint` still reports `react-refresh/only-export-components` on `Auth`/`Favorites`/`Profile` → D-01 "green" fails.
**Why it happens:** CONTEXT.md's premise that Auth/Favorites/Profile already split is false (verified — all 6 co-locate the hook).
**How to avoid:** Split all 6 contexts.
**Warning signs:** 3 residual react-refresh errors after the context task.
**Confidence:** HIGH — verified by reading all 6 files + `npm run lint`.

### Pitfall 4: Context has no i18n access
**What goes wrong:** Adding a translated Toast inside a context needs `t()`, but `t` lives in `LanguageContext` and calling a hook inside a non-hook context method is illegal.
**Why it happens:** The Toast/i18n boundary is at the component layer.
**How to avoid:** Keep the rethrow pattern — context rethrows, the calling component (which has `useLanguage`) shows the translated Toast. Already documented in `FavoritesContext` comments.
**Confidence:** HIGH — verified in code.

### Pitfall 5: `set-state-in-effect` fixes can change behavior
**What goes wrong:** `react-hooks/set-state-in-effect` errors in `NotificationsContext` (lines 41, 47) and `ProfileContext` (line 29) tempt a quick "move setState out of effect" fix that alters when state resets (e.g. clearing profile/token on logout).
**Why it happens:** These effects legitimately sync external state (auth → local state) on user change; the lint rule is a performance heuristic, not always a correctness bug.
**How to avoid:** Prefer the idiomatic fix (derive state, use an event handler, or guard) but **preserve the logout-reset behavior**; validate via the auth flow in the recette. Where a genuine refactor is risky, a scoped `eslint-disable-next-line` with justification is acceptable — but D-01 wants green, so document any disable.
**Confidence:** MEDIUM — depends on per-effect intent; flag for careful per-file handling.

## Code Examples

### cacheSpotImages() — async/batched fix (D-02)
**Current (verified `src/utils/offline.ts`):** a sequential `for … of` loop that `await`s each `cache.match` + `fetch` + `cache.put` **one URL at a time**. Called in a `forEach` over favorite spots in `FavoritesContext` (line 47: `favSpots.forEach(s => cacheSpotImages(s.image_urls))`), so N spots × M images serialize. It is `async` (not literally blocking the main thread with sync CPU work) but it **serializes all network I/O** and fires many un-awaited promises — the perf bug is serialization + unbounded concurrency, not a sync CPU loop.

**Idiomatic fix — parallelize within a bounded batch:**
```ts
// Source: MDN Cache API + Promise.all pattern [CITED: developer.mozilla.org/en-US/docs/Web/API/Cache]
export async function cacheSpotImages(imageUrls: string[] | null | undefined) {
  if (!imageUrls || imageUrls.length === 0) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      imageUrls.map(async (url) => {
        try {
          if (await cache.match(url)) return;            // already cached
          const res = await fetch(url, { mode: 'cors' });
          if (res.ok) await cache.put(url, res);
        } catch (e) {
          console.error(`[Offline] Failed to cache: ${url}`, e);
        }
      })
    );
  } catch (error) {
    console.error('[Offline] Cache API error:', error);
  }
}
```
- Parallelizes per-URL work; keeps per-URL try/catch so one failure doesn't abort the batch (matches current resilience).
- **Caller-side improvement (optional, recommended):** the `forEach` in `FavoritesContext` fires all spot-caching in parallel with no bound. Consider batching across spots (e.g. `for` loop with `await` per small batch, or `requestIdleCallback` to defer off the interaction path) so a large favorites list doesn't saturate the network on login. Keep consistent with the file's existing style.
- Confidence: HIGH on the function fix; MEDIUM on the exact caller batching strategy (Claude's discretion per file style).

### Bundle measurement — reproduce Phase-1 methodology (D-09)
**Verified from `vite.config.ts` + `audit/build-size.txt`:**
```bash
# 1. Summed-size table (the source of the 504.17 kB baseline) — plain build:
npm run build            # = tsc -b && vite build ; prints the per-chunk raw│gzip table

# 2. Treemap stats.html (rollup-plugin-visualizer, gated behind ANALYZE env):
ANALYZE=1 npm run build  # writes .planning/phases/01-audit-design-system/audit/stats.html
```
- Baseline (frozen, `01-AUDIT.md §2`): **gzip total JS = 504.17 kB** = sum of all `.js` gzip sizes. Composition: `mapbox-gl-*.js` 274.66 kB gzip (54.5%), `index-*.js` 214.11 kB gzip (42.5%), small `web-*.js` chunks + CSS 13.60 kB.
- **Reproduce into a Phase-5 audit folder**, not by overwriting the Phase-1 artifacts. Suggest `.planning/phases/05-recette-globale-nettoyage-final/audit/` and point the visualizer `filename` there (or copy after build). The `filename` in `vite.config.ts` currently hard-codes the Phase-1 path — the planner should parametrize or copy the output to avoid clobbering the baseline.
- **Report two numbers:** (a) **eager/initial gzip JS** = sum of chunks loaded before the map renders (operative PERF-03 target, expected ≈230 kB after lazy Mapbox) and (b) summed total gzip JS (continuity with baseline). See Q1.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Eager `import Map` | `React.lazy(() => import('./components/Map'))` | This phase | Defers 274 kB gzip Mapbox chunk off the initial parse path |
| Native `alert()`/`confirm()` | Capacitor `Toast` + app `Modal` | D-05 harmonization | Consistent, translatable feedback |
| Hook + provider co-located (react-refresh error) | Hook in `use{Name}.ts`, provider isolated | D-04 (all 6 contexts) | Lint green + Fast Refresh works |
| Serial `for-await` image caching | `Promise.all` batched | D-02 | Parallel I/O, no serialized stalls |

**Deprecated/outdated:**
- `CONCERNS.md` (2026-03-18) Capacitor CLI/core version-mismatch claim — **already resolved** in current `package.json` (both v8). Do not act on it. Use CONCERNS.md only for the `cacheSpotImages` perf context.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PERF-03's real intent is **initial/eager** gzip JS, so lazy-loading satisfies −15% | Summary / Q1 | If the summed-total metric is held strictly, code-splitting won't hit the target and dep removal yields ~0 — target may be unreachable without deeper cuts (framer-motion/lucide tree-shaking, or descope) |
| A2 | Capacitor WebView serves lazy chunks from local FS without network, but lazy rejection still needs an Error Boundary | Pitfall 1 | Missing boundary → blank screen on any chunk/module error; must verify on-device (D-11) |
| A3 | Splitting only the hook out of each context file is enough to clear `react-refresh` (context object may still need relocating to a non-`.tsx`/no-component file) | Pattern 3 | If lint still fires, provider file must export ONLY the component — a slightly larger refactor per context |
| A4 | `firebase` (^12.11.0) direct dep is not in the client web bundle (only `@capacitor-firebase/messaging` native plugin is imported) | Dead Code | If removed and it's a required peer of the messaging plugin, native push breaks — knip did NOT flag it, so treat as USED; do not remove without verifying peer deps |
| A5 | `test-fcm.mjs` is a dead scratch file safe to delete | Dead Code | Low — it's a root-level manual FCM test script, outside the app graph |

**These require planner/user confirmation before becoming locked tasks — especially A1 (the whole PERF-03 sizing) and A4 (dep removal safety).**

## Dead Code Inventory (CODE-01) — verified `npx knip` 2026-07-31

**knip (authoritative for this stack):**
- Unused files (3): `supabase/functions/notify-session-created/index.ts`, `supabase/functions/send-session-reminders/index.ts`, `test-fcm.mjs`. → Edge functions are **deployed server-side**, outside the client graph — **do NOT delete**. `test-fcm.mjs` is a scratch script — **safe to delete**.
- Unused dependency (1): `@capacitor/android` → **KEEP** (Android build required by D-11).
- Unused devDependencies (3): `@capacitor/assets`, `autoprefixer`, `depcheck` → `depcheck` self-flags (invoked via npx). `autoprefixer` used by PostCSS config. `@capacitor/assets` is an asset-generation dev tool. **Verify configs before removing any.**
- Unlisted dependency (1): `geojson` (imported by `Map.tsx:12`) → **add to `package.json`** (type-only; resolves the warning; low risk).

**depcheck (cross-check only — noisy):** additionally flags `@capacitor/ios`, `@tailwindcss/postcss`, `tailwindcss`, `postcss`, `knip` as "unused" — all **false positives** (used via native build / PostCSS / CLI). This confirms **knip is the reliable tool (D-03); depcheck for candidate discovery only, never auto-removal.**

**Net bundle impact of dep removal: ≈ 0 kB** — no removable dep is in the client web JS graph. (Reinforces A1 / Q1.)

## Lint Debt Inventory (CODE-01/D-01) — verified `npm run lint` 2026-07-31

Current: **34 problems (27 errors, 7 warnings)** — matches the CONTEXT.md snapshot exactly (no drift). By rule:

| Rule | Count | Files (verified) |
|------|-------|------------------|
| `react-refresh/only-export-components` | 6 | `AuthContext:52`, `FavoritesContext:118`, `LanguageContext:39`, `ProfileContext:129`, `SessionsContext:369`, `SpotsContext:305` — **all 6 contexts** (D-04 scope is actually all 6) |
| `@typescript-eslint/no-explicit-any` | 6 | `FavoritesContext:41`, `SpotsContext:80,105,197,210,259` (+ likely others in components — full list at planning; contexts confirmed) |
| `react-hooks/set-state-in-effect` | 3 | `NotificationsContext:41,47`, `ProfileContext:29` — handle carefully (Pitfall 5) |
| `react-hooks/exhaustive-deps` | ≥2 (warnings) | `FavoritesContext:52` (missing `spots`), + a `spot.image_urls` warning at `…:151:8` (SpotDetail or similar) |
| remainder | balance to 34 | Includes items in `App.tsx:47`, `FiltersModal.tsx` (per Phase 2 deferred-items) — planner should re-run `npm run lint` and bucket the full list per file |

*The 6 react-refresh + several `any` errors live in the same context files being split for D-04 — sequence the context-split task and the `any`-typing task together per context to avoid double-editing.*

## Error-Handling Audit (CODE-02/D-05) — verified by reading all 6 contexts

| Context | Current pattern | Diverges from rethrow canon? |
|---------|-----------------|------------------------------|
| `FavoritesContext` | Optimistic + revert + **rethrow** (no Toast; caller Toasts). Documents Pitfall 4. | **Canonical** — the reference |
| `ProfileContext` | rollback + **rethrow** on all mutations | Aligned |
| `SessionsContext` | `console.error` + **rethrow** (lines 130,175,207,232) | Aligned |
| `SpotsContext` | `updateSpot` rethrows; **`addSpot`/`approveSpot`/`deleteSpot` call `Toast.show` directly with hardcoded French** + `deleteSpot` uses native **`confirm()`** (line 235) | **Diverges** — direct Toast + native confirm + not i18n |
| `AuthContext` | `signOut` awaits with **no error handling** (silent) | Diverges — swallows errors |
| `AuthModal.tsx` (component) | native **`alert(t('auth.alert_signup'))`** (line 73) | Diverges — native alert (D-05 explicitly targets removing native alert) |

**D-05 work = 3 real divergences:** (1) `SpotsContext` direct-Toast/native-confirm → rethrow + `Modal` confirm; (2) `AuthContext.signOut` → add error handling/rethrow; (3) `AuthModal` native `alert` → Toast. Contexts CONTEXT.md named (`Profile`, `Sessions`) are **already aligned** — audit confirms, minimal work there.

## Validation Architecture

> `nyquist_validation: true` in config, BUT the project has a **locked "no automated test infrastructure" constraint** (REQUIREMENTS Out of Scope; CODE-03 is future-only). Validation for this refactor phase is **gate-based + manual recette**, not a unit-test suite.

### Test "Framework"
| Property | Value |
|----------|-------|
| Framework | **None** (locked constraint). Validation = lint gate + build gate + bundle measurement + manual device recette |
| Config file | `eslint.config.js` (lint), `vite.config.ts` (build/analyze) |
| Quick run command | `npm run lint` |
| Full "suite" command | `npm run lint && npm run build` (+ `ANALYZE=1 npm run build` for stats) |

### Phase Requirements → Validation Map
| Req ID | Behavior | Type | Command / Method |
|--------|----------|------|------------------|
| CODE-01 | No dead code/unused deps; lint green | automated gate | `npm run lint` (0 problems) + `npx knip` (no actionable unused) |
| CODE-02 | Contexts homogenized | automated gate | `npm run lint` (0 `react-refresh`/`any`) + code review of error pattern |
| PERF-03 | Bundle target hit | measurement | `npm run build` table + `ANALYZE=1 npm run build` treemap; compare eager gzip JS vs baseline |
| QA-01 | Zero regression across all flows | **manual (iOS+Android device)** | The merged recette checklist (D-10), single final pass (D-13), with D-12 exclusions |

### Sampling Rate
- **Per task commit:** `npm run lint` (must not increase problem count; target 0 by phase end).
- **Per wave merge:** `npm run lint && npm run build` green.
- **Phase gate:** lint green + build green + bundle measured + full manual recette (D-10/D-11) 100% before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] No automated test files needed (locked constraint) — **do not** scaffold a test framework.
- [ ] Create the merged QA-01 recette checklist artifact (from Phases 2/3/4 checklists + avis/session/auth flows + D-12 exclusions) **before** the recette task. Source flows from `src/components/` (Map, SpotDetail, Profile, AuthModal, AddSpotForm, ReviewForm/List, SessionForm/List, AdminDashboard, FiltersModal, SearchModal) and `App.tsx` tabs (map/favorites/list/profile).
- [ ] Create a Phase-5 `audit/` output target so the visualizer doesn't overwrite Phase-1 baseline artifacts.

## Security Domain

This is an internal refactor with **no new attack surface** — no new auth, crypto, input, or network endpoints. Standard controls to **not regress**:

| ASVS Category | Applies | Standard Control (must not regress) |
|---------------|---------|-------------------------------------|
| V5 Input Validation | indirect | Existing form validation (Phase 4 ROBUST-01) unchanged; recette re-verifies |
| V6 Cryptography | no | None hand-rolled; Supabase handles auth tokens |
| V4 Access Control | indirect | `AdminDashboard` admin gating must survive lazy-loading (verify the role check still fires before the chunk renders) |

| Pattern | STRIDE | Mitigation |
|---------|--------|-----------|
| Lazy-loading admin UI leaks admin bundle to non-admins | Info disclosure | Chunk contents are not a secret (client code), but gate the mount (`{isAdminOpen && ...}`) so non-admins never fetch it; server RLS remains the real access control |

## Open Questions

1. **Which metric governs the PERF-03 −15% gate — summed total gzip JS, or eager/initial gzip JS?** (BLOCKING for the bundle task.)
   - What we know: Baseline is defined as the SUM of all `.js` gzip = 504.17 kB. The primary strategy (code-splitting) defers but doesn't shrink that sum; dep removal yields ~0 kB in the bundle.
   - What's unclear: Whether −15% is expected on the summed total (hard/maybe unreachable without deeper tree-shaking or descope) or on the initial/eager load (easily met by lazy Mapbox).
   - Recommendation: Adopt **eager/initial gzip JS** as the operative PERF-03 number (it reflects D-07's load-time UX intent), report the summed total for continuity, and confirm with the user in discuss/plan. If summed-total is mandatory, add a task to investigate `framer-motion`/`lucide-react` tree-shaking and flag risk of missing target.

2. **Is `firebase` (^12.11.0) a required peer of `@capacitor-firebase/messaging`, or a genuinely removable direct dep?** (CODE-01 cleanliness, not bundle size.)
   - What we know: `firebase` JS is never imported in `src/`; only the native `@capacitor-firebase/messaging` plugin is used. knip does NOT flag `firebase` as unused.
   - Recommendation: Check the plugin's peerDependencies before touching it. If it's a required peer, keep it. Low priority — it's not in the web bundle either way.

3. **`AdminDashboard` currently mounts unconditionally (visibility via `isOpen`).** Switching to `{isAdminOpen && <Suspense>...}` avoids loading the chunk for non-admins — confirm no mount-time side-effect (subscription/fetch) is lost by not mounting it until opened.

## Sources

### Primary (HIGH confidence — live codebase this session)
- `npm run lint`, `npx knip`, `npx depcheck` — run 2026-07-31 (lint debt, dead-code inventory)
- `package.json`, `vite.config.ts` — stack + measurement config
- `src/context/{Auth,Favorites,Profile,Spots,Sessions,Language}Context.tsx` — split + error audit
- `src/App.tsx`, `src/components/Map.tsx`, `src/main.tsx` — lazy-load integration points
- `src/utils/offline.ts` — cacheSpotImages fix
- `.planning/phases/01-audit-design-system/01-AUDIT.md §2-3`, `audit/build-size.txt` — bundle baseline

### Secondary (MEDIUM confidence — official docs, cited)
- react.dev/reference/react/lazy — React.lazy/Suspense API
- developer.mozilla.org/en-US/docs/Web/API/Cache — Cache API for cacheSpotImages

### Tertiary (LOW confidence — needs on-device validation)
- Capacitor WebView dynamic-import chunk-loading behavior (Pitfall 1 / A2) — verify during D-11 recette

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools present, invoked live; no new packages
- Architecture (context split, lazy-load, error pattern): HIGH — every file read and verified
- Bundle strategy: HIGH on mechanics/baseline, MEDIUM on target-reachability (metric ambiguity Q1)
- Pitfalls: HIGH except Capacitor-WebView lazy behavior (MEDIUM, on-device check)

**Research date:** 2026-07-31
**Valid until:** ~2026-08-30 (stable stack; re-run `npm run lint`/`npx knip` if code changes before planning)
