import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: { host: true }, // lets you open the app from your phone on the same Wi-Fi
  build: { chunkSizeWarningLimit: 2000 }, // all course content is bundled so it works offline
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Ready to Answer',
        short_name: 'Ready',
        description: 'A personal course in apologetics and evangelism.',
        theme_color: '#1d3557',
        background_color: '#f7f4ee',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png}'], maximumFileSizeToCacheInBytes: 5_000_000 },
    }),
  ],
})
