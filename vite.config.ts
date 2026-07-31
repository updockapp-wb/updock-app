import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    ...(process.env.ANALYZE
      ? [
          visualizer({
            // Env-driven so the frozen Phase-1 baseline (01-audit-design-system/audit/stats.html)
            // is never clobbered (D-09/T-05-08). Defaults to the current Phase-5 audit folder.
            filename:
              process.env.ANALYZE_OUT ||
              '.planning/phases/05-recette-globale-nettoyage-final/audit/stats.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
          }) as PluginOption,
        ]
      : []),
  ],
})
