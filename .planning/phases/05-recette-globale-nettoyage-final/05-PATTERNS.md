# Phase 5: Recette globale & nettoyage final - Pattern Map

**Mapped:** 2026-07-31
**Files analyzed:** 14 modified + 6 new hook files (~20 touch points)
**Analogs found:** 8 with in-repo analog / 20 total (React.lazy + context-split are NEW patterns with no precedent — flagged below)

> **Refactor-phase caveat:** This is a cleanup/refactor phase, not greenfield. Most "new files" are the 6 `use{Name}.ts` hook extractions, which have **no existing precedent** in the codebase (all 6 contexts currently co-locate hook + provider — verified). React.lazy/Suspense is likewise **absent** from the codebase. For those, the analog is the *current shape being refactored away* (the "before"), and the pattern to write comes from RESEARCH.md Patterns 1–3, not from an existing file. The strong in-repo analog is `FavoritesContext.tsx` for the error-handling canon (D-05).

## File Classification

| File to create/modify | Role | Data Flow | Closest Analog | Match Quality |
|-----------------------|------|-----------|----------------|---------------|
| `src/context/useAuth.ts` (new) | hook | request-response | none (fresh convention) | NO ANALOG — new pattern |
| `src/context/useFavorites.ts` (new) | hook | request-response | none (fresh convention) | NO ANALOG — new pattern |
| `src/context/useProfile.ts` (new) | hook | request-response | none (fresh convention) | NO ANALOG — new pattern |
| `src/context/useLanguage.ts` (new) | hook | request-response | none (fresh convention) | NO ANALOG — new pattern |
| `src/context/useSessions.ts` (new) | hook | request-response | none (fresh convention) | NO ANALOG — new pattern |
| `src/context/useSpots.ts` (new) | hook | request-response | none (fresh convention) | NO ANALOG — new pattern |
| `src/context/AuthContext.tsx` (mod) | provider | event-driven | self (split hook out) + `FavoritesContext` (error canon) | role-match |
| `src/context/SpotsContext.tsx` (mod) | provider | CRUD | `FavoritesContext.tsx` (error canon) | exact (same role+flow) |
| `src/context/{Favorites,Profile,Language,Sessions}Context.tsx` (mod) | provider | CRUD/event-driven | self (split hook out only) | self-refactor |
| `src/App.tsx` (mod) | provider/router | request-response | none (React.lazy new) | NO ANALOG — new pattern |
| `src/components/Map.tsx` (mod) | component | request-response | self (lazy target; default export ready) | self-refactor |
| `src/components/AdminDashboard.tsx` (mod call site) | component | CRUD | none (React.lazy new) | NO ANALOG — new pattern |
| `src/components/PremiumModal.tsx` (mod call site in `Profile.tsx`) | component | request-response | none (React.lazy new) | NO ANALOG — new pattern |
| `src/utils/offline.ts` (mod) | utility | file-I/O (Cache API) | self (`cacheSpotImages` in place) | self-refactor |
| `src/components/AuthModal.tsx` (mod) | component | request-response | `SpotsContext` Toast usage → migrate to `Toast` | partial |
| `src/main.tsx` (mod, optional) | config | — | self | self-refactor |
| `vite.config.ts` (mod) | config | — | self (parametrize `filename`) | self-refactor |

## Pattern Assignments

### `src/context/use{Name}.ts` × 6 (hook, request-response) — NEW CONVENTION

**Analog:** None. All 6 contexts co-locate the hook today. Verified `react-refresh/only-export-components` fires on the co-located hook export at:
`AuthContext.tsx:52`, `FavoritesContext.tsx:118`, `LanguageContext.tsx:39`, `ProfileContext.tsx:129`, `SessionsContext.tsx:369`, `SpotsContext.tsx:305`.

**Current co-located hook shape to EXTRACT** (identical structure in all 6 — example from `FavoritesContext.tsx:118-124`):
```tsx
export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
```

**Fresh convention to write** (RESEARCH.md Pattern 3 — Claude's discretion, no precedent). Cleanest arrangement that clears the lint rule:
- `{Name}Context.tsx` → exports the **Provider component only**. The `createContext(...)` object and the `interface {Name}ContextType` must be **exported** from here (a non-component export alongside a component still trips `react-refresh` — so if lint stays red, relocate the context object + types into a `.ts` module per RESEARCH.md A3).
- `use{Name}.ts` → the `useContext` + throw-if-outside-provider hook, importing the context object.

Recommended minimal split (verify with `npm run lint` after EACH context):
```
src/context/
  {Name}Context.tsx   → { {Name}Provider }  (+ export the context object & types)
  use{Name}.ts        → export function use{Name}() { ... useContext ... throw ... }
```

**Import-site repoint (REQUIRED):** every `import { useXxx } from '../context/XxxContext'` must repoint to `'../context/useXxx'`. Verified consumers include `App.tsx:32` (`useFavorites`), `FavoritesContext.tsx:3,5` (`useAuth`, `useSpots`), `ProfileContext.tsx:3` (`useAuth`), `SessionsContext.tsx:3` (`useAuth`), `Profile.tsx:3-9`, `AuthModal.tsx:4`, `Map.tsx:9-10`. Grep `from '.*context/.*Context'` across `src/` before and after.

> **Sequencing note (RESEARCH Pitfall 3 + Lint Inventory):** the same 6 files also hold most `@typescript-eslint/no-explicit-any` errors (`FavoritesContext:41`, `SpotsContext:80,105,197,210,259`). Fix the `any` typing in the same task as the split to avoid double-editing.

---

### `src/context/SpotsContext.tsx` (provider, CRUD) — ERROR HARMONIZATION (D-05)

**Analog:** `src/context/FavoritesContext.tsx` (canonical rethrow pattern).

**Canonical pattern to COPY** (`FavoritesContext.tsx:95-106`):
```tsx
} catch (err) {
    console.error('Error updating favorites:', err);
    // Revert on error
    setFavorites(prev =>
        isCurrentlyFavorite
            ? [...prev, spotId]
            : prev.filter(id => id !== spotId)
    );
    // Propager l'echec apres le revert : le composant appelant affiche
    // le feedback traduit (t()) — le context n'a pas acces a i18n (Pitfall 4).
    throw err;
}
```
Caller side to mirror (`App.tsx:183`):
```tsx
toggleFavorite(spot.id).catch(() => Toast.show({ text: t('fav.error.revert'), duration: 'short' }));
```

**Divergences in `SpotsContext.tsx` to FIX** (verified):
- `addSpot` — hardcoded French `Toast.show` at lines `128` (`'You must be logged in.'`), `133-136` (`'Envoi du spot en cours...'`), `205-208` (`'Spot envoyé !...'`), `212-215` (`` `Erreur : ...` ``). → rethrow + caller Toast with `t()`.
- `approveSpot` — hardcoded Toast at `230` (`"Échec de l'approbation."`). → rethrow.
- `deleteSpot` — native **`confirm('Delete this spot?')`** at line `235` (untranslated) + hardcoded Toast at `262`. → replace `confirm()` with the app's `src/ui/Modal.tsx` confirm shell (see Shared Patterns) and rethrow.
- `updateSpot` (lines `266-287`) is **already canonical** (rethrows at `286`) — use as the in-file reference.

---

### `src/context/AuthContext.tsx` (provider, event-driven) — split + silent-error fix (D-05)

**Analog:** self + `FavoritesContext` canon.

**Divergence to FIX — `signOut` swallows errors** (`AuthContext.tsx:37-39`):
```tsx
const signOut = async () => {
    await supabase.auth.signOut();
};
```
Add error handling consistent with the rethrow canon (wrap in try/catch, `console.error`, `throw err`) so the calling component (`Profile.tsx`) can surface a translated Toast.

**Also split** the hook (`AuthContext.tsx:52-58`) into `useAuth.ts` per Pattern 3.

> `ProfileContext` and `SessionsContext` are **already aligned** (rethrow verified — `ProfileContext:64,82,93,119`; `SessionsContext` tail rethrows). They need the **hook split only**, no error changes.

---

### `src/components/AuthModal.tsx` (component, request-response) — native alert → Toast (D-05)

**Divergence to FIX — native `alert()`** (`AuthModal.tsx:73`):
```tsx
alert(t('auth.alert_signup'));
```
Replace with Capacitor `Toast` (already the app convention — see `SpotsContext.tsx:5` `import { Toast } from '@capacitor/toast'`). `AuthModal` already has `t` via `useLanguage` (`AuthModal.tsx:4`), so: `Toast.show({ text: t('auth.alert_signup'), duration: 'short' })`. Note: this file's error state already uses a clean pattern (`mapAuthError` at line ~77) — only the `alert` diverges.

---

### `src/App.tsx` (React.lazy Map + AdminDashboard) — NEW PATTERN (D-06/D-07/D-08)

**Analog:** None (no `React.lazy`/`Suspense` anywhere in repo). Source = RESEARCH.md Patterns 1 & 2.

**Current eager imports to CONVERT:**
```tsx
import Map from './components/Map';           // App.tsx:8
import AdminDashboard from './components/AdminDashboard';  // App.tsx:27
```
Both are **default exports** (`Map.tsx:107` `export default function MapComponent`), so `lazy(() => import('./components/Map'))` works with no `.then(m => ({default: ...}))` shim.

**Map render site to wrap** (`App.tsx:134-142`, currently `{activeTab === 'map' && (<motion.div>...<Map .../>...)}`):
```tsx
const Map = lazy(() => import('./components/Map'));
// ...
{activeTab === 'map' && (
  <motion.div key="map" /* existing motion props */>
    <Suspense fallback={<MapSkeleton />}>
      <Map onSpotClick={handleSpotClick} selectedSpot={selectedSpot}
           isAddingSpotMode={isAddingSpotMode} onSetAddingSpotMode={setIsAddingSpotMode} />
    </Suspense>
  </motion.div>
)}
```
**`MapSkeleton` fallback** — reuse the existing spinner classes verbatim from the auth-loading screen (`App.tsx:98`):
```tsx
<div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
```
Keep the skeleton confined to the map area so nav stays interactive (D-07).

**AdminDashboard** is currently mounted **unconditionally** (`App.tsx:259-263`, visibility via `isOpen={isAdminOpen}`). Convert to gated lazy mount so non-admins never fetch the 490-line chunk (RESEARCH Pattern 2 / Q3 — confirm no mount-time side-effect lost):
```tsx
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
// ...
{isAdminOpen && (
  <Suspense fallback={null}>
    <AdminDashboard isOpen onClose={() => setIsAdminOpen(false)} onSpotSelect={handleSpotSelect} />
  </Suspense>
)}
```

> **Pitfall 1 (RESEARCH):** wrap lazy screens in an **Error Boundary** in addition to Suspense — a rejected dynamic import in the Capacitor WebView blanks the subtree. There is no existing Error Boundary in the repo (new component). Provide a reload affordance for the map fallback.

---

### `src/components/PremiumModal.tsx` (lazy at Profile.tsx call site) — NEW PATTERN (D-08)

**Lazy at the call site, NOT App.tsx** (imported by `Profile.tsx:10`, rendered `Profile.tsx:441` behind `isPremiumOpen` state `Profile.tsx:29`):
```tsx
const PremiumModal = lazy(() => import('./PremiumModal'));   // replaces Profile.tsx:10
// ...
{isPremiumOpen && (
  <Suspense fallback={null}>
    <PremiumModal isOpen onClose={() => setIsPremiumOpen(false)} />
  </Suspense>
)}
```
fallback = `null` (user-tap trigger, not first paint).

---

### `src/utils/offline.ts` (utility, Cache API file-I/O) — async batch fix (D-02)

**Analog:** self (in-place refactor). Source = RESEARCH.md Code Examples.

**Current serial loop to REPLACE** (`offline.ts:7-31`) — sequential `for…of` awaiting each `cache.match`+`fetch`+`cache.put` one URL at a time:
```ts
for (const url of imageUrls) {
    const response = await cache.match(url);
    if (!response) { /* await fetch; await cache.put */ }
}
```
**Fix — parallelize within the batch** (keeps per-URL try/catch resilience, existing `CACHE_NAME`/`console.error` style):
```ts
await Promise.all(imageUrls.map(async (url) => {
    try {
        if (await cache.match(url)) return;
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) await cache.put(url, res);
    } catch (e) { console.error(`[Offline] Failed to cache: ${url}`, e); }
}));
```
**Caller** (`FavoritesContext.tsx:47` `favSpots.forEach(s => cacheSpotImages(s.image_urls))`) fires all spots un-awaited/unbounded — optionally bound concurrency (Claude's discretion, keep file style).

---

### `vite.config.ts` (config) — parametrize audit output path (D-09)

**Current hardcoded Phase-1 path** (`vite.config.ts:19`):
```ts
filename: '.planning/phases/01-audit-design-system/audit/stats.html',
```
Point to a Phase-5 target (e.g. `.planning/phases/05-recette-globale-nettoyage-final/audit/stats.html`) or copy the output post-build, so the Phase-1 baseline artifact is not clobbered. Measurement command unchanged: `ANALYZE=1 npm run build`.

---

### `src/main.tsx` (config, optional) — defer Mapbox CSS

**Optional** (does not affect JS metric): move `import 'mapbox-gl/dist/mapbox-gl.css'` (`main.tsx:4`) into `Map.tsx` so the CSS side-effect also defers with the lazy chunk.

## Shared Patterns

### Error Handling — rethrow-to-caller canon (D-05)
**Source:** `src/context/FavoritesContext.tsx:95-106` (documented reference; `SpotsContext.tsx:266-287` `updateSpot` is a second in-file example).
**Apply to:** `SpotsContext` (`addSpot`/`approveSpot`/`deleteSpot`), `AuthContext.signOut`. (`Profile`/`Sessions` already aligned.)
```tsx
} catch (err) {
    console.error('…context-specific message…', err);
    setState(prev => /* revert optimistic update */);
    throw err; // caller (has useLanguage) shows translated Toast — Pitfall 4
}
```

### Confirm dialog — app Modal, not native `confirm()`
**Source:** `src/ui/Modal.tsx` (master modal shell, `default export Modal({ isOpen, onClose, children, surface, layout })`).
**Apply to:** `SpotsContext.deleteSpot:235` (`confirm('Delete this spot?')` → app Modal confirm, translated via caller).

### User feedback — Capacitor Toast, not native `alert()`
**Source:** `import { Toast } from '@capacitor/toast'` (`SpotsContext.tsx:5`); caller pattern `App.tsx:183`.
**Apply to:** `AuthModal.tsx:73` (`alert(...)` → `Toast.show({ text: t(...), duration: 'short' })`).

### Context hook file split (D-04 — all 6)
**Source:** No precedent; convention defined in RESEARCH.md Pattern 3. Extract the co-located hook (e.g. `FavoritesContext.tsx:118-124`) into `use{Name}.ts`, repoint all import sites, verify `npm run lint` after each.

### React.lazy + Suspense (+ Error Boundary) (D-06/D-08)
**Source:** No precedent; RESEARCH.md Patterns 1–2. Default-export components → `lazy(() => import(...))`; wrap in `Suspense` (skeleton for map = `App.tsx:98` spinner classes; `null` for modals); add an Error Boundary for Capacitor WebView chunk-load failures (Pitfall 1).

## No Analog Found

Planner should use RESEARCH.md patterns (not an existing file) for these:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/context/use{Name}.ts` × 6 | hook | request-response | No context is split yet — fresh convention (RESEARCH Pattern 3) |
| `src/App.tsx` (lazy Map/Admin) | provider/router | request-response | No `React.lazy`/`Suspense` anywhere in repo (RESEARCH Pattern 1/2) |
| Error Boundary component (new) | component | event-driven | No Error Boundary exists; required for lazy chunk-load safety (Pitfall 1) |
| `PremiumModal`/`AdminDashboard` lazy call sites | component | request-response | New dynamic-import pattern (RESEARCH Pattern 2) |

## Metadata

**Analog search scope:** `src/context/` (all 6 contexts), `src/components/` (App, Map, AdminDashboard, PremiumModal, AuthModal, Profile), `src/utils/offline.ts`, `src/ui/Modal.tsx`, `src/main.tsx`, `vite.config.ts`
**Files scanned:** 13 source files read/grepped
**Pattern extraction date:** 2026-07-31
