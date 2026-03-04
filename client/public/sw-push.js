/**
 * client/public/sw-push.js  — Feature 3: Push Service Worker
 *
 * This file must be at the root of your public directory so it gets
 * served from / and has the broadest possible scope.
 *
 * Handles:
 *   - push events   → shows OS notification
 *   - notificationclick → focuses/opens the app
 *   - pushsubscriptionchange → auto-rotates subscription (Firefox/Safari)
 */

const APP_URL = self.location.origin

// Show the push notification
self.addEventListener('push', (event) => {
  let data = { title: '🌤️ WeatherVue', body: 'You have a new weather alert.' }
  try {
    if (event.data) data = event.data.json()
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-96x96.png',
      tag: data.tag || 'weathervue-notification',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: APP_URL },
    })
  )
})

// Open / focus the app when user taps notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || APP_URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.startsWith(APP_URL) && 'focus' in c)
      if (existing) return existing.focus()
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// Handle subscription rotation (important for Firefox and some Safari versions)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(async newSub => {
        // Re-register with the server
        await fetch(`${APP_URL}/api/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: newSub.toJSON() }),
        })
      })
  )
})
