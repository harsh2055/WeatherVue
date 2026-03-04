import { useWeather } from '../../context/WeatherContext'
import { formatTemp, formatDate } from '../../utils/weatherUtils'

export default function ForecastCard() {
  const { forecast, unit } = useWeather()
  if (!forecast?.daily) return null

  return (
    <div className="card animate-slide-up">
      <h3 className="text-lg font-semibold mb-4">7-Day Forecast</h3>
      <div className="space-y-2">
        {forecast.daily.slice(0, 7).map((day, i) => (
          <div key={day.dt} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <span className="w-24 text-sm font-medium">{i === 0 ? 'Today' : formatDate(day.dt)}</span>
            <img
              src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
              alt={day.weather[0].description}
              className="w-10 h-10"
              title={day.weather[0].description}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 w-28 text-center capitalize hidden sm:block">
              {day.weather[0].description}
            </span>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-slate-400">{formatTemp(day.temp.min, unit)}</span>
              <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-orange-400" />
              <span>{formatTemp(day.temp.max, unit)}</span>
            </div>
            <span className="text-xs text-blue-500 w-10 text-right">
              {Math.round(day.pop * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
