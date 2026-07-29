export const mapboxConfig = {
    accessToken: 'pk.eyJ1IjoidXBkb2NrZXIiLCJhIjoiY21qMXhlbXE0MGJlOTNmc2F3MzB5M3FkaiJ9.jdboYlp7mrq3DSXIQuCSdw',
    styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12' // Default to satellite as requested
};

/**
 * Couleurs des layers Mapbox (clusters + markers) — point de vérité unique (D-01).
 *
 * Ces valeurs sont des littéraux hex volontaires, PAS des tokens CSS :
 * - Mapbox GL ne lit pas les custom properties CSS dans ses expressions `paint`.
 * - Ces couleurs encodent le TYPE DE SPOT — aucune correspondance 1:1 avec les
 *   6 tokens sémantiques de src/index.css.
 * - `#38bdf8` est sky-400 (hex v3-era) ≠ `--color-primary` (sky-500, v4 ≈ #00a6f4
 *   en OKLCH, cf. src/index.css lignes 8-13). Wirer l'un sur l'autre NE SERAIT PAS
 *   byte-identique → tout reste littéral ici.
 *
 * Extraites verbatim de src/components/Map.tsx (layers `clusterLayer`,
 * `clusterCountLayer`, `unclusteredPointLayer`). `markerStroke` conserve la forme
 * courte `'#fff'` de l'original — ne pas normaliser en `'#ffffff'` (byte-identique).
 */
export const MAP_COLORS = {
    clusterSmall: '#22d3ee',    // Cyan-400 (< 5)
    clusterMedium: '#38bdf8',   // Sky-400 (5-20)
    clusterLarge: '#ffffff',    // White (> 20)
    clusterTextLight: '#ffffff',// White text on Cyan / Sky Blue
    clusterTextDark: '#0f172a', // Dark text on White circle
    pending: '#f97316',         // Orange for pending spots (is_approved === false)
    Dockstart: '#38bdf8',
    Rockstart: '#f472b6',
    Dropstart: '#2dd4bf',
    Deadstart: '#818cf8',
    Rampstart: '#fbbf24',
    Beachstart: '#f59e0b',
    markerStroke: '#fff'        // forme courte volontaire (byte-identique à l'original)
} as const;
