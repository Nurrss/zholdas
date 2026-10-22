import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH is set by the GitHub Actions workflow (for example /zholdas/).
// Local build and Netlify use /.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  build: {
    // MapLibre alone is about 800 kB; it is cached by the service worker
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      // Two pages: the app and the dispatcher page (/dispatch/)
      input: { main: resolve(__dirname, 'index.html'), dispatch: resolve(__dirname, 'dispatch/index.html') },
      output: {
        // Only the libraries' own files, so small shared helpers do not pull MapLibre into /dispatch/
        manualChunks(id) {
          if (id.includes('commonjsHelpers')) return 'helpers'
          if (id.includes('node_modules/maplibre-gl')) return 'maplibre'
          if (id.includes('node_modules/@mediapipe')) return 'mediapipe'
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'avatar/*.png'],
      manifest: {
        name: 'Zholdas — AI friend for drivers',
        short_name: 'Zholdas',
        description: 'Жолдас следит, чтобы водитель не уснул за рулём.',
        lang: 'ru',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0F2236',
        background_color: '#0F2236',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App + face model + WASM (with SIMD, used by all modern phones) work offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}', 'models/*.task', 'mediapipe/wasm/vision_wasm_internal.*'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        // /dispatch/ is its own page, do not answer it with the app
        navigateFallbackDenylist: [/\/dispatch/],
        runtimeCaching: [
          {
            // Old phones without SIMD: cached on first use
            urlPattern: /\/mediapipe\/wasm\/.*nosimd.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'mediapipe-nosimd' },
          },
          {
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
