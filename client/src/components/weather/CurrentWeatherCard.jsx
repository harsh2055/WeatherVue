import { useWeather } from '../../context/WeatherContext'
import { formatTemp, formatTime, degreesToDirection, getAQIInfo, getUVInfo, getRecommendation } from '../../utils/weatherUtils'
import { useAuth } from '../../context/AuthContext'
import { locationService } from '../../services/weatherService'
import { useState } from 'react'

export default function CurrentWeatherCard() {
  const { current, unit } = useWeather()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  if (!current) return null

  const { name, sys, main, weather, wind, visibility } = current
  const icon = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`
  const rec  = getRecommendation({ temp: main.temp, description: weather[0].description, wind_speed: wind.speed, humidity: main.humidity })
  const aqi  = current.aqi  ? getAQIInfo(current.aqi)  : null
  const uvi  = current.uvi  ? getUVInfo(current.uvi)   : null

  const handleSave = async () => {
    if (!user || saved) return
    await locationService.addFavorite(name)
    setSaved(true)
  }

  return (
    <div className="card animate-slide-up space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{name}, {sys.country}</h2>
          <p className="text-slate-500 dark:text-slate-400 capitalize">{weather[0].description}</p>
        </div>
        {user && (
          <button onClick={handleSave} disabled={saved} className="btn-secondary text-sm">
            {saved ? '⭐ Saved' : '☆ Save'}
          </button>
        )}
      </div>

      {/* Temp + Icon */}
      <div className="flex items-center gap-4">
        <img src={icon} alt={weather[0].description} className="w-20 h-20" />
        <div>
          <p className="text-6xl font-bold">{formatTemp(main.temp, unit)}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Feels like {formatTemp(main.feels_like, unit)}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Humidity',    value: `${main.humidity}%`,             icon: '💧' },
          { label: 'Wind',        value: `${Math.round(wind.speed)} m/s ${degreesToDirection(wind.deg)}`, icon: '💨' },
          { label: 'Visibility',  value: `${(visibility / 1000).toFixed(1)} km`, icon: '👁️' },
          { label: 'Pressure',    value: `${main.pressure} hPa`,          icon: '🌡️' },
          { label: 'Sunrise',     value: formatTime(sys.sunrise),          icon: '🌅' },
          { label: 'Sunset',      value: formatTime(sys.sunset),           icon: '🌇' },
          aqi ? { label: 'AQI', value: aqi.label, icon: '🌿', cls: aqi.cls } : null,
          uvi ? { label: 'UV Index', value: `${Math.round(current.uvi)} – ${uvi.label}`, icon: '☀️' } : null,
        ].filter(Boolean).map(({ label, value, icon: ic, cls }) => (
          <div key={label} className={`rounded-xl p-3 bg-slate-50 dark:bg-slate-700/50 ${cls || ''}`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">{ic} {label}</p>
            <p className="font-semibold text-sm mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
        <span className="text-3xl">{rec.icon}</span>
        <p className="text-sm text-primary-800 dark:text-primary-200">{rec.text}</p>
      </div>
    </div>
  )
}
