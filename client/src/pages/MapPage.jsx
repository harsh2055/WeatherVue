import WeatherMap from '../components/maps/WeatherMap'
import SearchBar from '../components/weather/SearchBar'

export default function MapPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">🗺️ Live Weather Map</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Search a location then explore live weather layers</p>
      </div>
      <SearchBar />
      <WeatherMap />
    </div>
  )
}
