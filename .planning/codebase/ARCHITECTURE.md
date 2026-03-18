# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** React Context-based State Management with Component-Driven UI Architecture

**Key Characteristics:**
- Multi-layered React Context providers for global state management (Auth, Spots, Favorites, Language)
- Tab-based navigation with animated view transitions using Framer Motion
- Real-time Mapbox integration with clustering and filtering
- Progressive data loading with localStorage caching for offline support
- Supabase backend integration for user authentication and data persistence
- Mobile-first responsive design with Capacitor for native mobile features

## Layers

**Presentation (UI Components):**
- Purpose: Render user interface and handle local component state
- Location: `src/components/`
- Contains: React functional components, modal dialogs, forms, map visualization
- Depends on: Context hooks, utils (distance, translations), Mapbox, Lucide icons
- Used by: Main App component and other components
- Key components: `Map.tsx`, `NavBar.tsx`, `SpotDetail.tsx`, `AuthModal.tsx`, `Profile.tsx`, `AdminDashboard.tsx`

**Context/State Management:**
- Purpose: Manage and expose global application state
- Location: `src/context/`
- Contains: React Context providers and custom hooks
- Depends on: Supabase client, localStorage API, geolocation API
- Used by: All components via custom hooks (useAuth, useSpots, useFavorites, useLanguage)
- Key contexts: `AuthContext.tsx`, `SpotsContext.tsx`, `FavoritesContext.tsx`, `LanguageContext.tsx`

**Data Layer:**
- Purpose: Define data types and provide static/default data
- Location: `src/data/`
- Contains: TypeScript interfaces and static spot definitions
- Depends on: None (pure data)
- Used by: Contexts and components
- Key files: `spots.ts` (Spot interface and static spots)

**Integration Layer:**
- Purpose: Communicate with external services and APIs
- Location: `src/lib/`
- Contains: Supabase client initialization
- Depends on: @supabase/supabase-js SDK, environment variables
- Used by: Context providers
- Key files: `supabase.ts`

**Utilities:**
- Purpose: Reusable helper functions and calculations
- Location: `src/utils/`
- Contains: Distance calculation, offline caching, formatting functions
- Depends on: Standard library only
- Used by: Contexts and components
- Key files: `distance.ts` (Haversine formula), `offline.ts` (image caching)

**Configuration:**
- Purpose: Store API keys and application configuration
- Location: `src/config/`
- Contains: Mapbox token and map styling configuration
- Depends on: None
- Used by: Components and initialization
- Key files: `mapbox.ts`

**Localization:**
- Purpose: Provide multi-language support
- Location: `src/translations/`
- Contains: JSON language dictionaries (French, English)
- Depends on: None
- Used by: LanguageContext
- Key files: `fr.json`, `en.json`

## Data Flow

**Authentication Flow:**

1. App initializes with `AuthProvider` wrapper
2. AuthContext checks active Supabase session on mount with `getSession()`
3. Sets up listener with `onAuthStateChange()` to monitor auth state
4. Components access auth state via `useAuth()` hook
5. AuthModal triggers `signInWithPassword()` or `signUp()` via Supabase
6. Auth state change automatically triggers re-render and dashboard access

**Spot Rendering Flow:**

1. SpotsProvider initializes: loads static spots + checks localStorage cache
2. On mount, fetches all spots from Supabase `spots` table
3. Merges static + database spots and caches to localStorage
4. Map component reads spots from `useSpots()` context
5. User location watched via geolocation.watchPosition()
6. nearbySpots computed with Haversine distance calculation (top 10)
7. Mapbox clustering layer visualizes all spots with color coding by type
8. Click on spot triggers `SpotDetail` modal with full information

**Favorites Toggle Flow:**

1. FavoritesContext initializes with localStorage cache
2. On user login, fetches favorites from Supabase `favorites` table
3. toggleFavorite() performs optimistic UI update first
4. Inserts/deletes row in `favorites` table (with user_id and spot_id)
5. On success, triggers `cacheSpotImages()` for offline viewing
6. On error, reverts optimistic update
7. FavoritesSpots computed list used in Favorites tab view

**Spot Creation Flow:**

1. User clicks "Add Spot" button
2. AddSpotForm modal opens with position preset from map click
3. Form submission calls `addSpot()` in SpotsContext
4. Images uploaded to Supabase storage (`spots` bucket)
5. Spot inserted to database with `is_approved: false`
6. Toast notification shown immediately (non-blocking)
7. Background processing handles image upload and DB insertion
8. Spot appears in map immediately but marked as pending (orange)
9. Admin can approve, triggering visibility to other users

**State Management:**

- **Auth State:** Managed by Supabase session; checked on app load and on hash change (email confirmation redirect)
- **Spots State:** Merged from static array + Supabase; cached to localStorage for offline access
- **User Location:** Watched continuously via geolocation API; triggers nearby computation
- **Favorites:** Stored in Supabase; synced to localStorage for offline viewing
- **Language:** Persisted to localStorage; loaded on app start (defaults to 'fr')
- **UI State:** Local component state for modals, tabs, selections

## Key Abstractions

**Spot Type System:**
- Purpose: Categorize water sports entry points with specific difficulty and equipment
- Examples: `src/data/spots.ts`
- Pattern: Union type `StartType = 'Dockstart' | 'Rockstart' | 'Dropstart' | 'Deadstart' | 'Rampstart'`
- Used in: Spot interface, Map layer filtering, type badge display

**Context Hook Pattern:**
- Purpose: Provide type-safe access to global state
- Examples: `useAuth()`, `useSpots()`, `useFavorites()`, `useLanguage()`
- Pattern: Create context → Create provider component → Create custom hook with error boundary
- Usage: Throw error if hook used outside provider to catch misconfigurations

**Translation Dictionary Pattern:**
- Purpose: Enable multi-language UI without conditional rendering
- Examples: `src/translations/fr.json`, `src/translations/en.json`
- Pattern: Flat JSON keys → LanguageContext.t() function
- Fallback: Returns key itself if translation missing

**Modal/Drawer Pattern:**
- Purpose: Display focused content over main app
- Examples: AuthModal, SpotDetail (uses Vaul drawer), FiltersModal, PremiumModal
- Pattern: AnimatePresence + motion.div with Framer Motion + conditional rendering
- Usage: Close handlers lift state up to App.tsx, prevent multiple modals overlapping

**Spot Clustering on Map:**
- Purpose: Visualize many spots efficiently with aggregation
- Examples: `src/components/Map.tsx` layers
- Pattern: Mapbox GeoJSON source with clustering enabled; dynamic circle size/color based on cluster
- Single spots use color-coding by type; clusters show point count

## Entry Points

**App Root:**
- Location: `src/main.tsx`
- Triggers: Browser load
- Responsibilities: Mounts React app to DOM, applies StrictMode

**App Wrapper:**
- Location: `src/App.tsx`
- Triggers: ReactDOM.render in main.tsx
- Responsibilities:
  - Wraps entire app with Context providers (Language, Auth, Spots, Favorites)
  - Renders AppContent component
  - Manages top-level lifted state for modals and active tab

**AppContent:**
- Location: `src/App.tsx` (function AppContent)
- Triggers: When App.tsx renders
- Responsibilities:
  - Detects auth state: shows LandingPage if not logged in
  - Renders tabbed interface (map, favorites, list, profile) if logged in
  - Manages activeTab, selectedSpot, isAddingSpotMode state
  - Detects email confirmation redirects via hash parsing
  - Renders mobile/desktop layout adaptively

**Landing Page:**
- Location: `src/components/LandingPage.tsx`
- Triggers: When user is not authenticated
- Responsibilities: Display welcome screen and "Get Started" button

**Map Component:**
- Location: `src/components/Map.tsx`
- Triggers: When activeTab === 'map'
- Responsibilities:
  - Initialize and manage Mapbox instance
  - Handle clustering logic
  - Respond to spot clicks
  - Show add-spot mode when enabled
  - Display navigation and geolocation controls

## Error Handling

**Strategy:** Try-catch blocks at API boundaries with fallback values and user-facing toast notifications

**Patterns:**

- **Supabase Auth Errors:** Caught in AuthModal.handleSubmit(); mapped to user-friendly messages via `mapAuthError()`
- **Spot Fetch Errors:** Logged to console; falls back to static spots
- **Favorite Toggle Errors:** Logged and optimistic update reverted; doesn't block UI
- **Image Upload Errors:** Logged; spot still created without images
- **Geolocation Errors:** Silently handled (no UI feedback); app continues with null location

## Cross-Cutting Concerns

**Logging:** Console.error/warn used for debugging; no centralized logging service

**Validation:**
- Form validation in AuthModal (email/password required)
- Supabase RLS enforces data access control
- Frontend trusts Supabase constraints (no duplicate validation)

**Authentication:**
- Supabase JWT session-based
- Verified on app load via getSession()
- Monitored with onAuthStateChange() listener
- Sign-out clears session and resets favorites

**Caching Strategy:**
- localStorage keys: `updock_spots_cache`, `updock_favorites_cache`, `updock_language`
- Spots refreshed on app load; favorites synced when user logs in
- Offline mode: users can browse cached spots and favorites without network

**Performance Optimizations:**
- useMemo for nearbySpots computation (depends on spots + userLocation)
- Mapbox clustering reduces DOM nodes for large spot counts
- Image caching via IndexedDB for offline viewing (cacheSpotImages utility)
- Optimistic UI updates for favorites (no wait for DB response)

---

*Architecture analysis: 2026-03-18*
