# STRUCTURE.md — Directory Layout & Organization

## Root Layout

```
updock-app/
├── src/                    # Application source code
├── ios/                    # iOS native project (Capacitor)
├── supabase/               # Database migrations
├── public/                 # Static assets served at root
├── assets/                 # App icon and splash assets
├── .agent/                 # BMAD agent workflows and rules
├── .planning/              # GSD planning documents
├── index.html              # Vite entry HTML
├── vite.config.ts          # Build configuration
├── capacitor.config.ts     # Capacitor/iOS config
├── package.json
├── tsconfig.json
└── eslint.config.js
```

## Source Directory (`src/`)

```
src/
├── App.tsx                 # Root component — routing, modal orchestration, auth gate
├── main.tsx                # Vite entry point, React DOM render
├── index.css               # Global styles, Tailwind base imports
│
├── components/             # UI components (all presentational + local state)
│   ├── LandingPage.tsx     # Unauthenticated landing/marketing page
│   ├── WelcomeScreen.tsx   # Post-auth onboarding welcome screen
│   ├── Map.tsx             # Main Mapbox GL map view
│   ├── NavBar.tsx          # Bottom navigation bar
│   ├── SpotDetail.tsx      # Spot detail sheet/modal
│   ├── AddSpotForm.tsx     # Form to add a new spot
│   ├── AddSpotInfoModal.tsx # Info modal for add-spot flow
│   ├── NearbySpotsList.tsx # List view of nearby spots
│   ├── SearchModal.tsx     # Search/filter spots modal
│   ├── FiltersModal.tsx    # Advanced filters modal
│   ├── AuthModal.tsx       # Login/signup modal
│   ├── Profile.tsx         # User profile screen
│   ├── AdminDashboard.tsx  # Admin-only moderation dashboard
│   └── PremiumModal.tsx    # Premium upsell modal
│
├── context/                # React Context providers (global state)
│   ├── AuthContext.tsx     # User session, Supabase auth state
│   ├── SpotsContext.tsx    # Spots data, CRUD operations
│   ├── FavoritesContext.tsx # Favorited spots (offline-capable)
│   └── LanguageContext.tsx # i18n locale selection
│
├── config/
│   └── mapbox.ts           # Mapbox token and map style config
│
├── lib/
│   └── supabase.ts         # Supabase client initialization
│
├── utils/
│   ├── distance.ts         # Haversine distance calculations
│   └── offline.ts          # LocalStorage offline persistence helpers
│
├── data/
│   └── spots.ts            # Static/fallback spot data (development)
│
├── assets/
│   └── avatars/            # SVG avatar assets (avatar1–5.svg)
│
└── translations/
    ├── en.json             # English i18n strings
    └── fr.json             # French i18n strings
```

## iOS Native Project (`ios/`)

```
ios/App/
├── App/
│   ├── AppDelegate.swift           # iOS app delegate
│   ├── Info.plist                  # iOS permissions and metadata
│   ├── Assets.xcassets/            # App icons (all sizes) and splash
│   └── Base.lproj/                 # Storyboards (launch + main)
├── Podfile                         # CocoaPods dependencies
├── App.xcodeproj/                  # Xcode project file
└── App.xcworkspace/                # Xcode workspace
```

## Database (`supabase/migrations/`)

```
supabase/migrations/
├── create_profiles_table.sql       # User profiles schema
├── update_schema.sql               # Spots table updates
├── migrate_to_multi_photos.sql     # Photos array migration
├── supabase_storage_setup.sql      # Storage bucket config
└── admin_permissions.sql           # RLS admin role policies
```

## Key File Locations

| Purpose | File |
|---|---|
| App entry | `src/main.tsx` |
| Root routing/layout | `src/App.tsx` |
| Auth state | `src/context/AuthContext.tsx` |
| Spots CRUD | `src/context/SpotsContext.tsx` |
| Supabase client | `src/lib/supabase.ts` |
| Map token | `src/config/mapbox.ts` |
| Env variables | `.env` |
| Build config | `vite.config.ts` |
| Capacitor config | `capacitor.config.ts` |

## Naming Conventions

- **Components**: PascalCase, one component per file, `.tsx` extension
- **Contexts**: PascalCase with `Context` suffix (`AuthContext.tsx`)
- **Utilities**: camelCase, descriptive noun (`distance.ts`, `offline.ts`)
- **Config files**: camelCase (`mapbox.ts`)
- **Translations**: lowercase locale code (`en.json`, `fr.json`)
- **Migrations**: snake_case describing intent (`create_profiles_table.sql`)

## Where to Add New Code

| Adding | Location |
|---|---|
| New screen/view | `src/components/` |
| New global state | `src/context/` |
| New utility/helper | `src/utils/` |
| New external client | `src/lib/` |
| New config value | `src/config/` |
| New DB table/policy | `supabase/migrations/` |
| New translation string | `src/translations/en.json` + `fr.json` |
