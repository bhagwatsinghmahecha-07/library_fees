import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { clientsClaim: true, skipWaiting: true, cleanupOutdatedCaches: true },
      manifest: {
        name: 'Library Fees', short_name: 'Library', description: 'Manage students and monthly fees',
        display: 'standalone', start_url: '/', background_color: '#f3f5f7', theme_color: '#14213d',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
