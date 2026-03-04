import { useState } from 'react'
import { useWeather } from '../../context/WeatherContext'
import { useGeolocation } from '../../hooks/useGeolocation'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const { fetchWeather, loading } = useWeather()
  const { getPosition, loading: geoLoading, error: geoError } = useGeolocation()

  const handleSearch = (e) => {
    e.preventDefault()
    const city = query.trim()
    if (!city) return
    fetchWeather({ city })
  }

  const handleGeolocate = async () => {
    try {
      const coords = await getPosition()
      fetchWeather(coords)
    } catch (_) {}
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city... e.g. London, Tokyo, New York"
          className="input flex-1"
          disabled={loading}
        />
        <button type="submit" className="btn-primary whitespace-nowrap" disabled={loading || !query.trim()}>
          {loading ? '...' : '🔍 Search'}
        </button>
      </form>

      <button
        onClick={handleGeolocate}
        disabled={geoLoading || loading}
        className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
      >
        <span>{geoLoading ? '📡 Locating...' : '📍 Use My Location'}</span>
      </button>

      {geoError && <p className="text-sm text-red-500">{geoError}</p>}
    </div>
  )
}
