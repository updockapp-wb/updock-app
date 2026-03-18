# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

**Type Safety and Any Types:**
- Issue: Excessive use of `any` type in critical data transformation functions. Spot type parsing from Supabase uses unchecked `any` casts, losing type safety when transforming database responses.
- Files: `src/context/SpotsContext.tsx` (line 83: `data.map((s: any)`), `src/context/FavoritesContext.tsx` (line 41: `(row: any)`), `src/components/AddSpotForm.tsx` (line 11: `onSubmit: (data: any)`)
- Impact: Runtime errors when database schema changes; invalid data can silently corrupt state; refactoring becomes risky
- Fix approach: Create proper TypeScript interfaces for Supabase response shapes. Validate and type-cast responses explicitly using Zod or similar validation library.

**Unstructured Error Handling:**
- Issue: Errors use browser `alert()` for critical operations instead of consistent error UI. Silent failures in async background tasks with only console logging.
- Files: `src/context/SpotsContext.tsx` (line 231: `alert('Failed to approve.')`), line 263: `alert('[DEBUG] Failed to delete...')`; background spot upload (lines 141-218) fails silently
- Impact: Users cannot understand what went wrong; debug mode strings in production; mobile/app experience degraded by native alerts
- Fix approach: Implement centralized error boundary component; use toast notifications consistently; add proper error logging service

**Commented-out Code and TODO Comments:**
- Issue: Obsolete comments left in production code suggesting incomplete refactoring. Lines 48-50 in `src/context/AuthContext.tsx` contain decision comments about API design.
- Files: `src/context/AuthContext.tsx` (lines 48-50), `src/components/AddSpotForm.tsx` (lines 65-67), `src/context/SpotsContext.tsx` (lines 7-8, 23-25)
- Impact: Code clarity reduced; maintenance burden increased; suggests incomplete migration from previous design
- Fix approach: Remove all decision/design comments; replace with clean implementation or GitHub issues for design decisions

**String-based Type Coercion:**
- Issue: Spot type stored as JSON string in database, parsed with try-catch fallbacks that hide actual schema issues. Default fallback to `['Dockstart']` masks data problems.
- Files: `src/context/SpotsContext.tsx` (lines 84-100, 186-191), `src/components/Map.tsx` (line 149: uses `spot.type[0]` assuming array)
- Impact: Silent data loss if type field is corrupted; map clusters only show first type; filtering may be incomplete
- Fix approach: Store type as ARRAY in Postgres, not JSON string. Add database migration with validation trigger.

## Known Bugs

**Geolocation Callback Race Condition:**
- Symptoms: Map may not zoom to user location if user denies geolocation permission during same render cycle as map load
- Files: `src/components/Map.tsx` (lines 266-280: `onLoad` handler)
- Trigger: Fast user interaction denying geolocation followed by map style.load event
- Workaround: None; location defaults to globe view (0, 20)

**URL Hash Not Fully Cleared on Email Confirmation:**
- Symptoms: After email verification redirect, window.location.hash is cleared but parent pathname remains dirty
- Files: `src/App.tsx` (lines 38-46: Email confirmation detection)
- Trigger: Supabase email confirmation redirect with fragment identifiers
- Workaround: Manual browser refresh may be needed on some clients

**Image Upload Memory Leak in AddSpotForm:**
- Symptoms: URL.createObjectURL() calls in image preview not properly revoked; memory grows as user adds/removes images
- Files: `src/components/AddSpotForm.tsx` (line 51: `URL.createObjectURL()`)
- Trigger: User selects multiple images, removes them, selects more
- Workaround: None; revoke URLs in cleanup phase not implemented

**Admin Dashboard Preview Modal State Leak:**
- Symptoms: `currentPhotoIndex` state persists when navigating between preview modals for different spots
- Files: `src/components/AdminDashboard.tsx` (line 20: `const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)`)
- Trigger: Click preview on spot A, navigate back, preview spot B — index stays at previous value
- Workaround: State resets on open (line 95), but there's a frame where wrong image displays

**Spot Deletion Cascading Issue:**
- Symptoms: RLS policies may prevent cascade delete of favorites when user is not admin; orphaned favorites records possible
- Files: `src/context/SpotsContext.tsx` (lines 245-253: Manual cascade before spot delete)
- Trigger: Concurrent delete requests; RLS policy conflicts
- Workaround: Manual cascade implemented but fragile; two-step delete required

## Security Considerations

**Supabase Anon Key Exposed in Frontend:**
- Risk: Public `VITE_SUPABASE_ANON_KEY` visible in bundled JS; allows direct API abuse if RLS policies are misconfigured
- Files: `src/lib/supabase.ts` (lines 3-4), `.env` configuration
- Current mitigation: RLS policies must be in place; key is public/anon by design
- Recommendations: Audit all RLS policies on `favorites`, `spots` tables; implement rate limiting at Supabase level; never put secret key in VITE_* variables

**Missing Input Validation on User-Generated Content:**
- Risk: Spot names, descriptions, and coordinates from `AddSpotForm` sent to database without length/format validation
- Files: `src/components/AddSpotForm.tsx` (lines 83-90), `src/context/SpotsContext.tsx` (lines 169-179)
- Current mitigation: None visible; relies on Postgres constraints
- Recommendations: Add client-side validation; implement length limits (name: max 100, description: max 2000); validate coordinates are within bounds

**Unverified File Upload:**
- Risk: Image uploads from form accept any file type; no MIME type validation; large files possible
- Files: `src/components/AddSpotForm.tsx` (line 45: `handleImageSelect()` with no type check), `src/context/SpotsContext.tsx` (line 151: file upload)
- Current mitigation: None visible
- Recommendations: Add file type validation (image/* only); enforce max file size (5MB per image); verify via magic bytes not extension

**Missing CSRF Protection on Form Submissions:**
- Risk: AddSpotForm and Auth operations lack CSRF tokens; direct Supabase calls vulnerable if user session hijacked
- Files: `src/components/AuthModal.tsx` (lines 37-58), `src/components/AddSpotForm.tsx` (lines 75-96)
- Current mitigation: Supabase SDK handles session management
- Recommendations: Verify Supabase session tokens are HttpOnly; implement automatic token refresh; add request deduplication

## Performance Bottlenecks

**Unoptimized Spot Fetching on Every App Load:**
- Problem: `SpotsContext` fetches all spots on mount regardless of visible viewport. No pagination or lazy loading.
- Files: `src/context/SpotsContext.tsx` (lines 68-125)
- Cause: `useEffect` with empty dependency array triggers full `.select('*')` on spots table
- Improvement path: Implement viewport-based filtering; add limit/offset pagination; cache with stale-while-revalidate; use Mapbox vector tiles for large datasets

**Expensive Nearby Spots Calculation on Every Render:**
- Problem: `useMemo` recalculates 10 nearest spots for all ~50+ spots on every userLocation change. O(n log n) sort not needed.
- Files: `src/context/SpotsContext.tsx` (lines 54-65)
- Cause: Full sort even when userLocation changes fractionally (meters); recalculation happens too frequently
- Improvement path: Use geohash bucketing; pre-compute clusters; implement debounced location updates; consider WebWorker for distance calc

**Map Clustering Re-renders on Spot Filter Changes:**
- Problem: Map GeoJSON feature collection regenerated on every filter toggle; no memoization of cluster source.
- Files: `src/components/Map.tsx` (lines 136-154: `spotsGeoJson` useMemo)
- Cause: `useMemo` depends on `[spots, filter]`; when filter changes, entire feature collection rebuilds even for static spots
- Improvement path: Separate feature generation from filtering; memoize geojson features; update layer filter property instead of rebuilding features

**localStorage Serialization on Every Favorites Change:**
- Problem: Full JSON.stringify of entire favorites array on every single toggle, even with many favorites.
- Files: `src/context/FavoritesContext.tsx` (lines 55-59: `JSON.stringify()` on change)
- Cause: useEffect triggers setItem on every update with no debounce
- Improvement path: Batch writes with debounce; consider IndexedDB for larger datasets; write only on unmount

**Image Caching Strategy Not Optimized:**
- Problem: `cacheSpotImages()` loops through all images synchronously; blocks main thread during add spot operation.
- Files: `src/utils/offline.ts` (lines 13-26), called from `src/context/SpotsContext.tsx` (line 47)
- Cause: Sequential fetch + cache.put in loop; called after spot insert when user is waiting
- Improvement path: Use batch cache API; move to Web Worker; implement retry logic for failed images

## Fragile Areas

**AuthContext Session Management:**
- Files: `src/context/AuthContext.tsx`
- Why fragile: `useAuth()` hook throws error if context is undefined, but context wrapping could be accidentally removed by future refactors. No fallback or warning.
- Safe modification: Ensure AuthProvider wraps all consumers at app root (verified in `src/App.tsx` lines 240-247, but add comment); add optional hook with default values for non-critical uses
- Test coverage: No unit tests visible; auth state changes untested; session lifecycle not tested

**Spot Type Normalization Logic:**
- Files: `src/context/SpotsContext.tsx` (lines 84-100)
- Why fragile: Complex parsing logic duplicated in multiple places (lines 84-100, 186-191, and partially in Map.tsx). Any change breaks in multiple spots.
- Safe modification: Extract to utility function `parseSpotTypes()` in `src/utils/`; use consistently; add unit tests
- Test coverage: No tests for edge cases (empty string, malformed JSON, null type)

**Email Confirmation Hash Detection:**
- Files: `src/App.tsx` (lines 38-46)
- Why fragile: Regex matching on window.location.hash assumes Supabase format; could break if Supabase changes URL structure
- Safe modification: Call Supabase.auth.refreshSession() instead of parsing hash manually; let SDK handle confirmation
- Test coverage: No tests for redirect scenarios; manual testing only

**Mobile-Only NavBar Duplication:**
- Files: `src/App.tsx` (lines 91-96, 212-217)
- Why fragile: NavBar component rendered twice (desktop sidebar version + mobile bottom version) with conditional visibility via CSS
- Safe modification: Extract NavBar logic to hooks (`useNavBar()`); render once with layout hook that shows/hides based on viewport
- Test coverage: No responsive design tests; different desktop/mobile behavior untested

**Static Spots Merge with Database Spots:**
- Files: `src/context/SpotsContext.tsx` (line 116: merge, line 34: init)
- Why fragile: Static spots always added with `is_approved: true`, database spots may have duplicates with same ID
- Safe modification: Move static spots to database migration; remove from code; use feature flags for backend toggle
- Test coverage: No tests for duplicate detection; merge logic untested

## Scaling Limits

**Static Spots Hardcoded in Memory:**
- Current capacity: ~50-100 static spots in `src/data/spots.ts`
- Limit: App size grows with every new hardcoded spot; memory usage for duplication when merging with DB spots
- Scaling path: Migrate all spots to database; implement backend admin interface for spot management; serve static spots via CMS

**Browser Storage for Favorites Cache:**
- Current capacity: localStorage holds ~2KB per 10 favorites (rough estimate)
- Limit: Browser storage quota ~5-10MB; typical quota reached with 5,000+ favorites (unlikely but possible for power users)
- Scaling path: Implement intelligent cache eviction; migrate to IndexedDB for larger capacity; server-side sessions

**Map Clustering with 1000+ Spots:**
- Current capacity: Mapbox clustering tested with hundreds of features
- Limit: GeoJSON regeneration performance degrades beyond 5,000+ features; browser memory issues
- Scaling path: Implement vector tiles from Mapbox Tiling Service; use data-driven clustering; implement lazy-loading by viewport bounds

**Supabase RLS Policy Complexity:**
- Current capacity: Basic user_id checks on favorites table
- Limit: Complex policies with multiple joins slow down queries; cascade deletes hit row-level policy checks
- Scaling path: Pre-compute user-specific data views; implement materialized views; consider multi-tenant architecture

## Dependencies at Risk

**Capacitor Version Mismatch:**
- Risk: @capacitor/cli is v7.4.4 while core plugins are @capacitor/core v8.0.0 (lines 13-17, 31 in package.json)
- Impact: Version mismatch can cause plugin compatibility issues; native build failures
- Migration plan: Upgrade CLI to v8.4.x to match core version; test on both iOS and Android before deploying

**Tailwind CSS v4 Migration Incomplete:**
- Risk: Using `@tailwindcss/postcss` v4.1.17 (new plugin-based system) while many components may expect older tailwind patterns
- Impact: Class compilation errors if utilities are missing; future updates could break class names
- Migration plan: Verify all custom class usage works with v4; test production build output for dead code elimination

**Framer Motion Security/Updates:**
- Risk: framer-motion v12 has been actively developed; animations could have performance regressions
- Impact: Page transitions could become slow on low-end devices; animation frame drops on long lists
- Migration plan: Monitor framer-motion releases; test animations on mobile devices; consider lightweight alternative for motion

**Mapbox GL License:**
- Risk: Mapbox GL v2.15.0 is proprietary; token management in frontend is necessary but public
- Impact: Token abuse could cause billing surprises; no fallback if Mapbox becomes unavailable
- Migration plan: Monitor Mapbox costs; implement rate limiting; consider OpenMapTiles as backup source

## Missing Critical Features

**No Offline Mode Beyond Image Cache:**
- Problem: App requires live Supabase connection; favorites don't work offline; spot list not fully cached
- Blocks: Users with poor connectivity cannot browse spots or mark favorites offline
- Solution: Implement service worker with full spot database cache; offline-first sync queue for favorites; display cached data when network unavailable

**No Admin Moderation UI for Flagged Spots:**
- Problem: AdminDashboard only shows pending approval; no way to flag inappropriate content or handle reports
- Blocks: Community moderation impossible; offensive content can accumulate
- Solution: Add flag mechanism in SpotDetail; create moderation queue in AdminDashboard; implement soft-delete with review

**No Real-time Spot Updates:**
- Problem: Multiple users viewing same spot see stale data; no WebSocket or polling updates
- Blocks: Collaborative features impossible; race conditions on spot edits
- Solution: Implement Supabase realtime subscriptions in SpotsContext; add optimistic updates for edits

**No Analytics or Tracking:**
- Problem: Cannot identify which spots are popular; no user engagement metrics
- Blocks: Data-driven decisions impossible; cannot improve UX based on usage patterns
- Solution: Implement anonymous analytics with Plausible or Fathom; add spot view counts to database

**No Push Notifications:**
- Problem: No way to notify users of new spots near them or favorite spot updates
- Blocks: User retention features impossible; engagement limited
- Solution: Integrate Capacitor Push; implement backend notification service; add notification preferences in Profile

## Test Coverage Gaps

**No Unit Tests for Context Logic:**
- What's not tested: FavoritesContext toggle/sync, SpotsContext fetch/merge logic, spot type parsing
- Files: `src/context/*.tsx` (all)
- Risk: Refactoring favorite toggle could break offline cache sync; spot type parsing bugs would only appear in production
- Priority: High — context bugs affect entire app state

**No Integration Tests for Auth Flow:**
- What's not tested: Signup → email confirmation → redirect → session state; login persistence; logout cleanup
- Files: `src/context/AuthContext.tsx`, `src/components/AuthModal.tsx`
- Risk: Auth state could become corrupted; session tokens not properly cleared; users stay logged in after logout
- Priority: High — security-critical path

**No E2E Tests for Spot Upload:**
- What's not tested: Image upload validation; form submission with network failure; retry behavior
- Files: `src/components/AddSpotForm.tsx`, `src/context/SpotsContext.tsx` (addSpot)
- Risk: File upload errors fail silently; users think spot was submitted when it wasn't; orphaned image uploads
- Priority: High — user-facing data flow

**No Mobile Device Tests:**
- What's not tested: Touch interactions on Map; bottom navigation on small screens; safe-area padding on notched devices
- Files: `src/components/Map.tsx`, `src/App.tsx` (mobile layout)
- Risk: Map interaction broken on iOS Safari; NavBar hidden by notch; layout overflow on small phones
- Priority: High — app is mobile-first

**No Accessibility Tests:**
- What's not tested: Keyboard navigation; screen reader labels; color contrast; focus management in modals
- Files: All components
- Risk: App unusable for visually/motor-impaired users; WCAG compliance failures
- Priority: Medium — user inclusivity, legal risk

**No Visual Regression Tests:**
- What's not tested: Map styles with different data; responsive design breakpoints; modal animations
- Files: Responsive design, Map component
- Risk: CSS refactoring breaks layout silently; design regressions appear only in production
- Priority: Medium — UI quality assurance

---

*Concerns audit: 2026-03-18*
