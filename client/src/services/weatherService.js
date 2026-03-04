import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 15000
})

// Attach Supabase auth token to every request
API.interceptors.request.use(async (config) => {
  try {
    const { supabase } = await import('./supabaseClient')
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (_) {}
  return config
})

// ── Weather endpoints ────────────────────────────────────────────────────────
export const weatherService = {
  /** Current weather + AQI + UV by city name */
  getCurrentWeather: (city) => API.get('/api/weather/current', { params: { city } }),

  /** Current weather + AQI + UV by coordinates */
  getCurrentWeatherByCoords: (lat, lon) =>
    API.get('/api/weather/current', { params: { lat, lon } }),

  /** 7-day daily forecast */
  getForecast: (city) => API.get('/api/weather/forecast', { params: { city } }),

  /** Historical data for past 7 days (one call per day, aggregated on server) */
  getHistorical: (lat, lon) => API.get('/api/weather/historical', { params: { lat, lon } }),

  /** Severe weather alerts */
  getAlerts: (lat, lon) => API.get('/api/weather/alerts', { params: { lat, lon } }),
}

// ── Location / Favorites endpoints ──────────────────────────────────────────
export const locationService = {
  getFavorites: ()       => API.get('/api/locations/favorites'),
  addFavorite:  (city)   => API.post('/api/locations/favorites', { city }),
  removeFavorite: (id)   => API.delete(`/api/locations/favorites/${id}`),
}

// ── Preferences endpoints ────────────────────────────────────────────────────
export const preferencesService = {
  get:    ()     => API.get('/api/preferences'),
  update: (prefs) => API.put('/api/preferences', prefs),
}
