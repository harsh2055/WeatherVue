/**
 * server/routes/push.js  — Feature 3: Web Push Notifications
 *
 * Endpoints:
 *   GET  /api/push/vapid-public-key   — Returns VAPID public key to client
 *   POST /api/push/subscribe          — Save a push subscription
 *   DELETE /api/push/unsubscribe      — Remove a push subscription
 *   POST /api/push/test               — Send a test notification (dev/debug)
 *
 * Setup:
 *   npm install web-push (server)
 *   Generate keys once:
 *     node -e "const wp=require('web-push'); console.log(wp.generateVAPIDKeys())"
 *   Add to server/.env:
 *     VAPID_PUBLIC_KEY=...
 *     VAPID_PRIVATE_KEY=...
 *     VAPID_EMAIL=mailto:you@example.com
 */

const express = require('express')
const webpush = require('web-push')
const { authenticate } = require('../middleware/auth')
const { supabase } = require('../config/supabase')

const router = express.Router()

// Configure VAPID — required before any push calls
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@weathervue.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
} else {
  console.warn('[Push] VAPID keys not set — push notifications will not work.')
}

/** GET /api/push/vapid-public-key — public, no auth needed */
router.get('/vapid-public-key', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push notifications are not configured on this server.' })
  }
  res.json({ key: process.env.VAPID_PUBLIC_KEY })
})

/** POST /api/push/subscribe — save subscription for current user + city */
router.post('/subscribe', authenticate, async (req, res) => {
  const { subscription, city } = req.body
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'subscription.endpoint is required.' })
  }

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: req.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        city_name: city || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' })

    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('[Push] Subscribe error:', err.message)
    res.status(500).json({ error: 'Failed to save subscription.' })
  }
})

/** DELETE /api/push/unsubscribe — remove subscription for this endpoint */
router.delete('/unsubscribe', authenticate, async (req, res) => {
  const { endpoint } = req.body
  if (!endpoint) return res.status(400).json({ error: 'endpoint is required.' })

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', req.user.id)

    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err.message)
    res.status(500).json({ error: 'Failed to remove subscription.' })
  }
})

/** POST /api/push/test — send a test push to the authenticated user */
router.post('/test', authenticate, async (req, res) => {
  try {
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', req.user.id)

    if (error) throw error
    if (!subs?.length) return res.status(404).json({ error: 'No subscriptions found for this user.' })

    const city = subs[0].city_name || 'your city'
    const payload = JSON.stringify({
      title: '🌤️ WeatherVue Test Alert',
      body: `Push notifications are working for ${city}!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'test-notification',
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    // Clean up stale subscriptions (410 Gone = unsubscribed)
    const stale = subs.filter((_, i) => {
      const r = results[i]
      return r.status === 'rejected' && r.reason?.statusCode === 410
    })
    if (stale.length) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', stale.map(s => s.endpoint))
    }

    res.json({ sent: true, city })
  } catch (err) {
    console.error('[Push] Test error:', err.message)
    res.status(500).json({ error: 'Failed to send test notification.' })
  }
})

/**
 * sendWeatherAlert — called by cron / other controllers
 * Broadcasts a push notification to all subscribers of a city.
 */
async function sendWeatherAlert(cityName, title, body) {
  if (!process.env.VAPID_PUBLIC_KEY) return

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .ilike('city_name', cityName)

  if (!subs?.length) return

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: `weather-alert-${cityName}`,
  })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  // Cleanup stale
  const stale = subs.filter((_, i) => results[i].status === 'rejected' && results[i].reason?.statusCode === 410)
  if (stale.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', stale.map(s => s.endpoint))
  }
}

module.exports = router
module.exports.sendWeatherAlert = sendWeatherAlert
