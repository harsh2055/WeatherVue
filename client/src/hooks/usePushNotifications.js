/**
 * client/src/hooks/usePushNotifications.js  — Feature 3
 *
 * Manages the full push notification lifecycle:
 *   1. Fetches VAPID key from backend
 *   2. Registers / activates service worker
 *   3. Subscribes / unsubscribes with one call
 *   4. Persists subscription to backend
 */

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Convert a base64url VAPID key to a Uint8Array for the browser API
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications({ user, cityName }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [vapidKey, setVapidKey] = useState(null)

  // Check browser support
  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)
  }, [])

  // Fetch VAPID public key from server
  useEffect(() => {
    if (!isSupported) return
    axios.get(`${API_BASE}/api/push/vapid-public-key`)
      .then(res => setVapidKey(res.data.key))
      .catch(() => setIsSupported(false))
  }, [isSupported])

  // Check if already subscribed when component mounts
  useEffect(() => {
    if (!isSupported || !user) return
    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    }).catch(() => {})
  }, [isSupported, user])

  // Get auth token from Supabase
  const getToken = async () => {
    try {
      const { supabase } = await import('../services/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch {
      return null
    }
  }

  const subscribe = useCallback(async () => {
    if (!isSupported || !vapidKey || !user) return
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Notification permission denied.')
        setLoading(false)
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const token = await getToken()
      await axios.post(
        `${API_BASE}/api/push/subscribe`,
        { subscription: subscription.toJSON(), city: cityName },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )

      setIsSubscribed(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enable notifications.')
    } finally {
      setLoading(false)
    }
  }, [isSupported, vapidKey, user, cityName])

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.getSubscription()
      if (subscription) {
        const token = await getToken()
        await axios.delete(
          `${API_BASE}/api/push/unsubscribe`,
          {
            data: { endpoint: subscription.endpoint },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        await subscription.unsubscribe()
      }
      setIsSubscribed(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disable notifications.')
    } finally {
      setLoading(false)
    }
  }, [isSupported, user])

  const toggle = useCallback(() => {
    if (isSubscribed) return unsubscribe()
    return subscribe()
  }, [isSubscribed, subscribe, unsubscribe])

  return { isSupported, isSubscribed, loading, error, toggle, subscribe, unsubscribe }
}
