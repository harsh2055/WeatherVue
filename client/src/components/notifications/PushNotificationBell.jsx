/**
 * client/src/components/notifications/PushNotificationBell.jsx  — Feature 3
 *
 * A compact bell icon that handles subscribe/unsubscribe.
 * Drop it anywhere — it is fully self-contained.
 *
 * Usage:
 *   import PushNotificationBell from '../components/notifications/PushNotificationBell'
 *   <PushNotificationBell />
 */

import { useAuth } from '../../context/AuthContext'
import { useWeather } from '../../context/WeatherContext'
import { usePushNotifications } from '../../hooks/usePushNotifications'

export default function PushNotificationBell() {
  const { user } = useAuth()
  const { current } = useWeather()
  const cityName = current?.name || null

  const { isSupported, isSubscribed, loading, error, toggle } = usePushNotifications({ user, cityName })

  // Only show for logged-in users on supported browsers
  if (!user || !isSupported) return null

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={loading}
        title={isSubscribed ? 'Disable weather alerts' : 'Enable weather alerts'}
        className={`btn-secondary text-sm px-3 py-1.5 flex items-center gap-1.5 transition-all ${
          isSubscribed
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
            : ''
        }`}
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-base leading-none">{isSubscribed ? '🔔' : '🔕'}</span>
        )}
        <span className="hidden sm:inline text-xs">
          {isSubscribed ? 'Alerts On' : 'Alerts'}
        </span>
        {isSubscribed && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
        )}
      </button>

      {error && (
        <div className="absolute top-full right-0 mt-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2 w-48 z-50 shadow border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  )
}
