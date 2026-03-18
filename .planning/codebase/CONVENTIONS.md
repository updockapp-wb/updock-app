# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- Components: PascalCase (`AuthModal.tsx`, `Map.tsx`, `NavBar.tsx`)
- Utilities: camelCase (`distance.ts`, `offline.ts`)
- Contexts: PascalCase with Context suffix (`AuthContext.tsx`, `FavoritesContext.tsx`)
- Data/configuration: camelCase (`spots.ts`, `supabase.ts`, `mapbox.ts`)

**Functions:**
- camelCase for all functions (`getDistance`, `toggleFavorite`, `fetchSpots`, `handleSubmit`)
- Callback handlers use `handle` prefix: `handleSpotClick`, `handleImageSelect`, `handleSubmit`
- Custom hooks use `use` prefix: `useAuth`, `useFavorites`, `useSpots`, `useLanguage`
- Utility functions are descriptive: `formatDistance`, `cacheSpotImages`

**Variables:**
- State variables: camelCase (`activeTab`, `isLoading`, `selectedSpot`)
- Boolean state: `is*` or `has*` prefix (`isOpen`, `isAddingSpotMode`, `isLogin`, `isSending`)
- Array variables: plural names (`favorites`, `spots`, `imageFiles`, `imagePreviews`)
- Constants: camelCase (`CACHE_NAME`)

**Types:**
- Interfaces: PascalCase with `Type` suffix for context types (`AuthContextType`, `FavoritesContextType`)
- Discriminated unions: PascalCase (`StartType: 'Dockstart' | 'Rockstart' | 'Dropstart' | 'Deadstart' | 'Rampstart'`)
- Component props: `[ComponentName]Props` interface pattern (`AuthModalProps`, `MapProps`, `AddSpotFormProps`)

## Code Style

**Formatting:**
- ESLint with TypeScript support (`eslint.config.js`)
- No external Prettier config; relies on ESLint defaults
- Target: ES2022
- JSX: react-jsx (automatic runtime)

**Linting:**
- `@eslint/js` recommended config
- `typescript-eslint` recommended config
- React Hooks rules enabled (`eslint-plugin-react-hooks`)
- React Refresh plugin for HMR
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Run with: `npm run lint`

## Import Organization

**Order:**
1. External libraries (React, Framer Motion, Lucide icons, Mapbox)
2. Types (from data or library types)
3. Relative imports (components, contexts, utilities, config)
4. Type imports separated with `type` keyword

**Example from `src/App.tsx`:**
```typescript
import { useState, useEffect as useLayoutEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './components/Map';
import NavBar from './components/NavBar';
import { useAuth } from './context/AuthContext';
import { type Spot } from './data/spots';
```

**Path Aliases:**
- None configured; uses relative paths throughout
- Imports from config files: `import { mapboxConfig } from '../config/mapbox'`
- Imports from lib: `import { supabase } from '../lib/supabase'`

## Error Handling

**Patterns:**
- Try-catch blocks with error logging via `console.error()` in async functions
- Error mapping for user-facing messages: `mapAuthError()` in `AuthModal.tsx` translates backend errors to user-facing strings
- Optimistic UI updates with fallback: Toggle favorites optimistically, revert on error (see `FavoritesContext.tsx:66-103`)
- Validation happens before submission: `if (!position) return` pattern
- Errors displayed inline in modals: `{error && <div>{error}</div>}` pattern

**Example from `AuthModal.tsx:23-28`:**
```typescript
const mapAuthError = (message: string) => {
    if (message.includes('Invalid login credentials')) return t('error.invalid_credentials');
    if (message.includes('User already registered')) return t('error.email_exists');
    if (message.includes('Password should be at least 6 characters')) return t('error.weak_password');
    return t('error.generic');
};
```

## Logging

**Framework:** Native `console` object only

**Patterns:**
- `console.error()` for errors: `console.error('Error fetching favorites:', error)`
- Contextual logging with prefixes: `console.error('[Offline] Cache API error:', error)`
- No debug/info logging in production code
- Silent failures for non-critical operations (geolocation errors)

## Comments

**When to Comment:**
- JSDoc for exported functions and utility functions
- Inline comments for complex logic or non-obvious decisions
- Comments above sections explaining purpose: `// Lifted state used for Map interaction triggered from NavBar`
- No comments for self-documenting code

**JSDoc/TSDoc:**
- Used in utility functions: `/** Calculates the distance between two points on Earth in kilometers using the Haversine formula. */`
- Type annotations preferred over JSDoc types (TypeScript handles documentation)

**Example from `src/utils/distance.ts`:**
```typescript
/**
 * Calculates the distance between two points on Earth in kilometers using the Haversine formula.
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
```

## Function Design

**Size:**
- Component render functions range 50-400 lines (e.g., `AdminDashboard.tsx` is 427 lines)
- Custom logic extracted to hooks and contexts
- Long components use internal helper functions for readability

**Parameters:**
- Destructured props for components: `export default function AuthModal({ isOpen, onClose }: AuthModalProps)`
- Single object parameter for complex data: `addSpot(spot, imageFiles)`
- Callback handlers as props: `onClose: () => void`, `onSpotClick: (spot: Spot) => void`

**Return Values:**
- React components return JSX directly
- Utility functions return typed values: `function getDistance(...): number`
- Context hooks return object with state and methods: `{ favorites, toggleFavorite, isFavorite }`
- Async functions return Promise: `async function fetchSpots(): Promise<void>`

## Module Design

**Exports:**
- Named exports for contexts and hooks: `export function useAuth() {...}`
- Default export for components: `export default function AuthModal(...)`
- Default export for context providers: `export function AuthProvider(...)`
- Type exports: `export type StartType = ...` and `export interface Spot {...}`

**Barrel Files:**
- Not used; each file exports what it defines
- Contexts live in `src/context/` directory
- Components live in `src/components/` directory
- Utilities live in `src/utils/` directory
- Config in `src/config/` directory
- Data in `src/data/` directory

## State Management

**Pattern:** React Context API

**Structure:**
- Context defined with TypeScript interface: `interface AuthContextType { ... }`
- Provider wraps children: `<AuthProvider><App /></AuthProvider>`
- Custom hook exposes context: `function useAuth()` with error guard if not in provider
- Initialization in provider: `useState` with localStorage fallback
- Multiple contexts composed: `App` wraps content in 4 providers (`LanguageProvider`, `AuthProvider`, `SpotsProvider`, `FavoritesProvider`)

**Example from `AuthContext.tsx`:**
```typescript
interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
```

## Animation & Transitions

**Framework:** Framer Motion

**Pattern:**
- `<AnimatePresence>` wraps conditional renders for exit animations
- `<motion.div>` with `initial`, `animate`, `exit` props for transitions
- Stagger effect using `transition={{ delay: index * 0.05 }}`
- Predefined transitions: `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`

**Example from `NearbySpotsList.tsx:31-35`:**
```typescript
<motion.button
    key={spot.id}
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={() => onSpotClick(spot)}
>
```

## UI Component Patterns

**Styling:** Tailwind CSS only (no CSS-in-JS)

**Icon Library:** Lucide React

**Modal/Drawer Pattern:**
- `isOpen` boolean prop controls visibility
- `onClose` callback to dismiss
- `AnimatePresence` from Framer Motion wraps modal
- Backdrop with blur: `bg-black/60 backdrop-blur-md`
- Glass morphism style: `bg-white/10 backdrop-blur-xl border border-white/20`

---

*Convention analysis: 2026-03-18*
