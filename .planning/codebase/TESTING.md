# TESTING.md — Test Structure & Practices

## Current State

**No testing infrastructure exists in this codebase.**

- No test runner installed (no Vitest, Jest, or similar)
- No test files (`*.test.ts`, `*.spec.ts`)
- No testing libraries in `package.json`
- No CI test step configured

## Recommended Setup (When Adding Tests)

### Framework

**Vitest** — natural fit for Vite-based projects.

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

`vite.config.ts` additions:
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
}
```

### Proposed Directory Structure

```
src/
├── test/
│   └── setup.ts            # Global test setup (mock Supabase, etc.)
├── utils/
│   ├── distance.test.ts    # Pure function tests
│   └── offline.test.ts     # LocalStorage mock tests
├── context/
│   └── FavoritesContext.test.tsx
└── components/
    └── NavBar.test.tsx
```

### Mocking Strategy

**Supabase** — mock `src/lib/supabase.ts` at module level:
```ts
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn() })),
    auth: { getUser: vi.fn() },
  }
}))
```

**Mapbox GL** — mock entirely (no DOM renderer in test env):
```ts
vi.mock('mapbox-gl', () => ({ Map: vi.fn(), ... }))
```

**LocalStorage** — use `jsdom`'s built-in implementation; reset between tests.

## Critical Areas to Test First

| Area | Why |
|---|---|
| `src/utils/distance.ts` | Pure functions, easy wins |
| `src/utils/offline.ts` | LocalStorage logic, storage edge cases |
| `src/context/FavoritesContext.tsx` | Core offline feature, complex sync logic |
| `src/context/AuthContext.tsx` | Auth gate controls all access |
| `src/context/SpotsContext.tsx` | Main data layer, CRUD operations |

## Notes

- The app uses no server-side rendering — all tests are client-side
- Offline/favorites logic (`offline.ts`) is the highest-risk area with no tests
- Supabase calls are scattered across context files — worth wrapping in a service layer before adding tests
