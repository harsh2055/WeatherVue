/**
 * client/src/sw-custom.js
 *
 * Custom Service Worker code for handling push events.
 * This file is injected into the Workbox-generated service worker
 * via the vite-plugin-pwa `injectManifest` strategy.
 *
 * IMPORTANT - Switch vite.config.js from registerType: 'autoUpdate' to
 * injectManifest strategy. See the updated vite.config.js section below.
 *
 * This file runs IN the service worker context (no DOM, no React).
 */

// Workbox precache/route manifests injected here by the build tool
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Cache API responses - Network First (30 min)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/weather'),
  new NetworkFirst({
    cacheName: 'weather-api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 60 })],
  })
)

// Cache map tiles - Cache First (1 hour)
registerRoute(
  ({ url }) => url.hostname.includes('tile.openweathermap.org') ||
               url.hostname.includes('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'map-tiles-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 })],
  })
)

// ---- Push Event Handler -----------------------------------------------------

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: 'WeatherVue',
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      data: { url: '/' },
    }
  }

  const options = {
    body:             payload.body,
    icon:             payload.icon || '/icons/icon-192x192.png',
    badge:            payload.badge || '/icons/badge-72x72.png',
    tag:              payload.tag || 'weathervue-notification',
    requireInteraction: payload.requireInteraction || false,
    data:             payload.data || {},
    // Action buttons shown on the notification (desktop Chrome / Android)
    actions: payload.type === 'WEATHER_ALERT'
      ? [
          { action: 'view',    title: 'View Alert' },
          { action: 'dismiss', title: 'Dismiss'    },
        ]
      : [
          { action: 'view', title: 'View Forecast' },
        ],
    // Vibration pattern for mobile (alert = urgent, briefing = gentle)
    vibrate: payload.type === 'WEATHER_ALERT' ? [200, 100, 200, 100, 200] : [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'WeatherVue', options)
  )
})

// ---- Notification Click Handler ---------------------------------------------

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// ---- Push Subscription Change Handler ---------------------------------------
// Handles browsers that auto-rotate push subscriptions (Safari, Firefox)

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(async (newSubscription) => {
        // POST new subscription to backend - fire and forget
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: newSubscription }),
        })
      })
      .catch(err => console.error('[SW] pushsubscriptionchange failed:', err))
  )
})