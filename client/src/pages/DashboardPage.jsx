import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useWeather } from '../context/WeatherContext'
import { locationService } from '../services/weatherService'
import HistoricalChart from '../components/charts/HistoricalChart'
import CurrentWeatherCard from '../components/weather/CurrentWeatherCard'

export default function DashboardPage() {
  const { user } = useAuth()
  const { fetchWeather, loading } = useWeather()
  const [favorites, setFavorites] = useState([])
  const [favLoading, setFavLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const res = await locationService.getFavorites()
      setFavorites(res.data)
    } catch (_) {
    } finally {
      setFavLoading(false)
    }
  }

  const handleRemove = async (id) => {
    await locationService.removeFavorite(id)
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📊 My Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back, {user?.email}</p>
      </div>

      {/* Saved cities */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">⭐ Saved Cities</h2>
        {favLoading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : favorites.length === 0 ? (
          <p className="text-slate-400 text-sm">No saved cities yet. Search a city and click "Save".</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {favorites.map(fav => (
              <div key={fav.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                <button
                  onClick={() => fetchWeather({ city: fav.city_name })}
                  className="text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 truncate"
                  disabled={loading}
                >
                  📍 {fav.city_name}
                </button>
                <button onClick={() => handleRemove(fav.id)} className="text-slate-400 hover:text-red-500 ml-2 text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weather data for selected city */}
      <CurrentWeatherCard />
      <HistoricalChart />
    </div>
  )
}
