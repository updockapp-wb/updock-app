# Updock

Application mobile de découverte et de partage de pumpfoil (dockstart, rockstart, deadstart...).

## Stack

| Couche | Tech |
|--------|------|
| Frontend | React 19 + TypeScript + Vite |
| Mobile | Capacitor 8 (iOS + Android) |
| Backend | Supabase (Auth + Postgres + Storage) |
| Carte | Mapbox GL + react-map-gl |
| UI | Tailwind CSS 4 + Framer Motion + Lucide |
| i18n | FR / EN |

## Prérequis

- Node.js 18+
- Un projet Supabase actif
- Un token Mapbox
- Xcode (pour le build iOS)

## Installation

```bash
npm install
```

## Variables d'environnement

Crée un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_MAPBOX_TOKEN=...
```

## Développement web

```bash
npm run dev
```

## Build web

```bash
npm run build
```

## Build iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Les icônes et splash screens iOS sont générés depuis `assets/icon.png` et `assets/splash.png` via `@capacitor/assets` :

```bash
npx @capacitor/assets generate
```

## Structure `src/`

```
src/
├── components/     # Composants UI (Map, SpotDetail, Profile, NavBar, ...)
├── context/        # Contextes React (Auth, Favorites, Spots, Language)
├── data/           # Données statiques (spots.ts)
├── lib/            # Client Supabase
├── translations/   # Fichiers i18n (fr.json, en.json)
└── utils/          # Helpers (distance, offline cache)
```

## Base de données

Les migrations SQL sont dans `supabase/migrations/`. À appliquer via la CLI Supabase ou le dashboard.
