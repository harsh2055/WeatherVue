import SearchBar from '../components/weather/SearchBar'
import CurrentWeatherCard from '../components/weather/CurrentWeatherCard'
import ForecastCard from '../components/weather/ForecastCard'
import HistoricalChart from '../components/charts/HistoricalChart'
import WeatherAssistant from '../components/ai/WeatherAssistant'
import { useWeather } from '../context/WeatherContext'

export default function HomePage() {
  const { current, loading, error } = useWeather()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">🌤️ WeatherVue</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time weather, forecasts & insights</p>
      </div>

      <SearchBar />

      {error && (
        <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="card flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500">Fetching weather data...</p>
          </div>
        </div>
      )}

      {!loading && current && (
        <>
          <CurrentWeatherCard />
          <ForecastCard />
          <HistoricalChart />
          <WeatherAssistant />
        </>
      )}

      {!loading && !current && !error && (
        <div className="card text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-5xl mb-3">🌍</p>
          <p className="text-lg font-medium">Search for any city to get started</p>
          <p className="text-sm mt-1">Or use your location for instant local weather</p>
        </div>
      )}
    </div>
  )
}
