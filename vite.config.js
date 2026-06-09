import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// Base path: '/lifeos/' for GitHub Pages project page, '/' otherwise.
// Set via VITE_BASE env var at build time (GitHub Actions sets this).
const BASE = process.env.VITE_BASE || '/'

// Build identity — surfaced in the app so you can confirm which build is live.
const APP_VERSION = process.env.npm_package_version || '0.1.0'
let APP_COMMIT = (process.env.GITHUB_SHA || '').slice(0, 7)
if (!APP_COMMIT) {
  try { APP_COMMIT = execSync('git rev-parse --short HEAD').toString().trim() } catch { APP_COMMIT = 'dev' }
}
const BUILD_TIME = new Date().toISOString()

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_COMMIT__: JSON.stringify(APP_COMMIT),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' so a new build waits and we can surface an in-app
      // "Update available" banner instead of silently lagging a reload.
      registerType: 'prompt',
      injectRegister: false, // we register via useRegisterSW in <UpdatePrompt/>
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'LifeOS',
        short_name: 'LifeOS',
        description: 'Personal command center',
        theme_color: '#0a0a0b',
        background_color: '#0a0a0b',
        display: 'standalone',
        orientation: 'portrait',
        scope: BASE,
        start_url: BASE,
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache the app shell and assets for full offline support
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
})
