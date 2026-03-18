# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript 5.9.3 - All source files, configuration, and components

**Secondary:**
- JavaScript - Build configuration (Vite, PostCSS, ESLint)

## Runtime

**Environment:**
- Node.js 18+ (required per README)
- Browser (React 19.2.0)
- Native iOS/Android (via Capacitor 8)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.2.0 - UI framework (`src/App.tsx`, component tree)
- React DOM 19.2.0 - DOM rendering

**Mobile:**
- Capacitor 8.0.0 - Native platform bridge (iOS/Android)
  - `@capacitor/core` 8.0.0 - Core platform APIs
  - `@capacitor/ios` 8.0.0 - iOS implementation
  - `@capacitor/android` 8.0.0 - Android implementation
  - `@capacitor/share` 8.0.0 - Native share dialog
  - `@capacitor/toast` 8.0.0 - Native toast notifications
  - `@capacitor/cli` 7.4.4 - CLI tooling (dev)
  - `@capacitor/assets` 3.0.5 - Asset generation for iOS/Android (dev)

**Build & Dev:**
- Vite 7.2.4 - Build tool and dev server (`vite.config.ts`)
- `@vitejs/plugin-react` 5.1.1 - React HMR support

**Styling:**
- Tailwind CSS 4.1.17 - Utility-first CSS framework
- `@tailwindcss/postcss` 4.1.17 - PostCSS plugin
- PostCSS 8.5.6 - CSS processing (`postcss.config.js`)
- Autoprefixer 10.4.22 - Browser vendor prefix support

**Animation & UI:**
- Framer Motion 12.23.25 - Animation library (`src/App.tsx`, modals, transitions)
- Lucide React 0.556.0 - Icon library (Heart, navigation icons)
- Vaul 1.1.2 - Drawer component library

**Mapping:**
- Mapbox GL 2.15.0 - WebGL map rendering
- React Map GL 7.1.7 - React wrapper for Mapbox
- `@types/mapbox-gl` 2.7.13 - TypeScript definitions

**Testing:**
- None detected (no test framework configured)

**Linting & Type Checking:**
- ESLint 9.39.1 - JavaScript linter (`eslint.config.js`)
- `@eslint/js` 9.39.1 - ESLint JS config
- `typescript-eslint` 8.46.4 - TypeScript ESLint plugin
- `eslint-plugin-react-hooks` 7.0.1 - React Hooks linter
- `eslint-plugin-react-refresh` 0.4.24 - React Fast Refresh linter
- TypeScript compiler (`tsc`) - Type checking (run in build step)

**Type Definitions:**
- `@types/react` 19.2.5 - React types
- `@types/react-dom` 19.2.3 - React DOM types
- `@types/node` 24.10.1 - Node.js types
- `globals` 16.5.0 - Global type definitions

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.87.2 - Backend API client (`src/lib/supabase.ts`)
  - Provides auth, database, storage, real-time subscriptions
  - Used throughout contexts and data operations

**Infrastructure:**
- None beyond what's listed above (no HTTP client needed - Supabase handles API)

## Configuration

**Environment:**
- `.env` file (not version controlled)
- Required variables documented in `README.md`:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_KEY` - Supabase anonymous key (public, safe)
  - `VITE_MAPBOX_TOKEN` - Mapbox access token (public-facing in `src/config/mapbox.ts`)

**Build:**
- `vite.config.ts` - Vite configuration with React plugin
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node/build tool TypeScript config
- `capacitor.config.ts` - Capacitor native configuration (appId: `com.updock.app.wandrille`, webDir: `dist`)

**TypeScript:**
- Strict mode enabled (via typescript-eslint)
- Module: ES2020
- Target: ES2020

## Platform Requirements

**Development:**
- Node.js 18+
- Xcode (for iOS builds, Apple developer account)
- Java/Android SDK (for Android builds)
- npm for package management

**Production:**
- iOS 13+ (estimated from Capacitor 8 support)
- Android 8+ (estimated from Capacitor 8 support)
- Web browsers (Chrome, Safari, Firefox - ES2020 compatible)

## Scripts

**Available commands** (from `package.json`):
```bash
npm run dev       # Start Vite dev server on http://localhost:5173
npm run build     # TypeScript check + Vite build to dist/
npm run lint      # Run ESLint on all .ts/.tsx files
npm run preview   # Preview production build locally
```

**Native build workflow:**
```bash
npm run build                    # Build web assets to dist/
npx cap sync ios                # Sync to Xcode project
npx cap open ios                # Open in Xcode for building/deployment
npx @capacitor/assets generate  # Generate icons/splash screens from src assets
```

---

*Stack analysis: 2026-03-18*
