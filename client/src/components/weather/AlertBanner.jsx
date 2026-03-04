import { useState } from 'react'
import { useWeather } from '../../context/WeatherContext'

export default function AlertBanner() {
  const { alerts } = useWeather()
  const [dismissed, setDismissed] = useState(false)

  if (!alerts?.length || dismissed) return null

  return (
    <div className="bg-red-600 dark:bg-red-700 text-white px-4 py-3 animate-fade-in">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse-slow">⚠️</span>
          <div>
            <p className="font-semibold text-sm">{alerts[0].event}</p>
            <p className="text-xs text-red-100 line-clamp-1">{alerts[0].description}</p>
          </div>
          {alerts.length > 1 && (
            <span className="bg-red-800 text-xs px-2 py-0.5 rounded-full">+{alerts.length - 1} more</span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-red-200 hover:text-white transition-colors text-xl leading-none"
          aria-label="Dismiss alert"
        >×</button>
      </div>
    </div>
  )
}
