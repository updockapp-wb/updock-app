# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Mapping:**
- Mapbox GL - Interactive satellite/street maps
  - SDK: `mapbox-gl` 2.15.0, `react-map-gl` 7.1.7
  - Configuration: `src/config/mapbox.ts`
  - Auth: Public access token (pk.eyJ1...) hardcoded in config
  - Usage: `src/components/Map.tsx` renders interactive map with spot locations

## Data Storage

**Primary Database:**
- Supabase PostgreSQL - Core data persistence
  - Connection: `src/lib/supabase.ts`
  - Client: `@supabase/supabase-js` 2.87.2
  - Tables:
    - `spots` - Spot locations with latitude/longitude, type, difficulty, height, image URLs
    - `favorites` - User favorites (user_id, spot_id foreign keys)
    - `profiles` - User profiles with avatar selection
    - `auth.users` - Supabase Auth native table

**File Storage:**
- Supabase Storage - Image uploads for spots
  - Bucket: `spots` (public read, authenticated write)
  - Location: `supabase/migrations/supabase_storage_setup.sql` defines RLS policies
  - Access: Public read via Supabase signed URLs, authenticated user uploads only

**Client-Side Caching:**
- Browser LocalStorage - Persistent cache
  - `updock_favorites_cache` - JSON array of favorited spot IDs (`src/context/FavoritesContext.tsx` lines 17, 43, 57)
  - `updock_spots_cache` - JSON array of spot objects (`src/context/SpotsContext.tsx` line 26)
  - Fallback for offline access and initial load performance

**Browser Cache API:**
- Image caching for offline support (`src/utils/offline.ts`)
  - Cache name: `updock-images-v1`
  - Caches spot images for offline viewing
  - Populated when user adds to favorites or navigates

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password authentication
  - Implementation: OAuth2-compatible, email magic links
  - Client hook: `src/context/AuthContext.tsx`
  - Flow: `getSession()` on app load, `onAuthStateChange()` listener for real-time updates
  - Email confirmation redirects detected in `src/App.tsx` lines 39-45 (hash parsing for `access_token=` and `type=signup`)
  - Session stored in Supabase client (HttpOnly cookies when available)

**RLS (Row-Level Security):**
- Enabled on all tables (`supabase/migrations/create_profiles_table.sql`)
- Users can only access/modify their own data:
  - Profiles: Read all, write own
  - Favorites: Read own, write own (enforced by RLS)
  - Auth trigger: Auto-creates profile on signup (`handle_new_user()` function)

## Monitoring & Observability

**Error Tracking:**
- None detected - no Sentry, LogRocket, or similar

**Logs:**
- Browser console only
- Error logging with `console.error()` in:
  - `src/context/SpotsContext.tsx` (Supabase fetch errors)
  - `src/context/FavoritesContext.tsx` (favorite operations)
  - `src/utils/offline.ts` (cache API errors)

## CI/CD & Deployment

**Hosting:**
- Web: Unknown (configured for static build to `dist/` folder)
- Native: iOS/Android via App Store/Play Store (Capacitor-based)
- Build target: `webDir: 'dist'` in `capacitor.config.ts`

**CI Pipeline:**
- None detected - no GitHub Actions, GitLab CI, or similar

## Native Platform Integrations

**iOS/Android (via Capacitor):**
- `@capacitor/share` - Native share dialog
  - Used in spot detail or discovery features
- `@capacitor/toast` - Native toast notifications
  - Used for user feedback on actions
- WebView container - React app runs in native WebView
- Asset generation: Icons and splash screens from `assets/icon.png` and `assets/splash.png`

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL (e.g., https://xxx.supabase.co)
- `VITE_SUPABASE_KEY` - Supabase anonymous public key (NOT secret)
- `VITE_MAPBOX_TOKEN` - Mapbox access token (public key, pk.eyJ...)

**How to configure:**
1. Create `.env` file in project root
2. Add variables as `VITE_*` (Vite convention for frontend exposure)
3. Access in code via `import.meta.env.VITE_*`
4. Validation in `src/lib/supabase.ts` throws error if missing

**Secrets location:**
- `.env` file (gitignored, local development only)
- Environment variables must be set in CI/CD and production hosting
- Mapbox token is intentionally public (frontend usage pattern)
- Supabase key is anonymous/public key (safe to expose)

## Webhooks & Callbacks

**Incoming:**
- Email confirmation callback - Supabase redirects to app with `access_token=` hash parameter
  - Handler: `src/App.tsx` lines 39-45 detects and clears hash, triggers welcome screen

**Outgoing:**
- None detected

## Database Schema

**Spot Record:**
```sql
id (uuid)
user_id (uuid, foreign key to auth.users)
position [latitude, longitude] (numeric[])
name (text)
type (text, stored as JSON array)
difficulty (text)
height (numeric)
image_url (text)
image_urls (text[], new column for multi-photo support)
is_approved (boolean, admin moderation)
created_at (timestamp)
```

**Favorites Record:**
```sql
user_id (uuid, foreign key to auth.users, RLS enforced)
spot_id (uuid, foreign key to spots)
```

**Profiles Record:**
```sql
id (uuid, primary key, references auth.users)
avatar_id (smallint, 1-5)
updated_at (timestamp)
```

**Migrations Applied:**
- `create_profiles_table.sql` - Initial profile setup with RLS
- `update_schema.sql` - Added height, difficulty columns
- `supabase_storage_setup.sql` - Storage bucket and RLS policies
- `migrate_to_multi_photos.sql` - Multi-image support
- `admin_permissions.sql` - Admin approval workflow

## Geolocation

**Browser Geolocation API:**
- Used in `src/context/SpotsContext.tsx` lines 40-51
- `navigator.geolocation.watchPosition()` - Continuous location tracking
- Accuracy: High (`enableHighAccuracy: true`)
- Updates map and calculates nearby spots (top 10)
- Silent error handling (user may deny permission)

## Internationalization

**Languages Supported:**
- French (fr.json)
- English (en.json)
- Files: `src/translations/fr.json`, `src/translations/en.json`
- Context: `src/context/LanguageContext.tsx` manages language switching
- Usage: `t()` function from `useLanguage()` hook throughout app

---

*Integration audit: 2026-03-18*
