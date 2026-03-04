import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // CRITICAL: Tells Vite to use your custom SW file
      srcDir: 'src',                // Directory where your custom SW lives
      filename: 'sw-custom.js',     // The exact name of your custom SW file
      registerType: 'autoUpdate', 
      injectRegister: 'auto',     
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'WeatherVue - Weather App',
        short_name: 'WeatherVue',
        description: 'Real-time weather forecasts, AQI, UV Index, and more.',
        theme_color: '#1e3a5f',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // IMPORTANT FIX: This safely enables the Service Worker in dev mode 
      // without breaking the WebSocket/HMR connection
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      }
    })
  ],
  server: {
    port: 5173,
    // Explicitly define HMR to prevent routing confusion
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})