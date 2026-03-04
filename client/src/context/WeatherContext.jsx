import { createContext, useContext, useReducer, useCallback } from 'react'
import { weatherService } from '../services/weatherService'

const WeatherContext = createContext(null)

const initialState = {
  current: null,
  forecast: null,
  historical: null,
  alerts: [],
  loading: false,
  error: null,
  unit: localStorage.getItem('unit') || 'metric',
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':        return { ...state, loading: true, error: null }
    case 'SET_CURRENT':    return { ...state, loading: false, current: action.payload }
    case 'SET_FORECAST':   return { ...state, forecast: action.payload }
    case 'SET_HISTORICAL': return { ...state, historical: action.payload }
    case 'SET_ALERTS':     return { ...state, alerts: action.payload }
    case 'ERROR':          return { ...state, loading: false, error: action.payload }
    case 'TOGGLE_UNIT':
      const newUnit = state.unit === 'metric' ? 'imperial' : 'metric'
      localStorage.setItem('unit', newUnit)
      return { ...state, unit: newUnit }
    default: return state
  }
}

export function WeatherProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchWeather = useCallback(async (query) => {
    dispatch({ type: 'LOADING' })
    try {
      const isCoords = query.lat !== undefined

      // 1. Fetch Current Weather FIRST
      const currentRes = await (isCoords
        ? weatherService.getCurrentWeatherByCoords(query.lat, query.lon)
        : weatherService.getCurrentWeather(query.city))

      dispatch({ type: 'SET_CURRENT',  payload: currentRes.data })

      // 2. Extract precise coords and the REAL city name from the API response
      const { lat, lon } = currentRes.data.coord
      const cityName = currentRes.data.name 

      // 3. Fetch everything else using the confirmed data!
      const [forecastRes, histRes, alertRes] = await Promise.all([
        weatherService.getForecast(cityName), // Safe! No more squished coordinates.
        weatherService.getHistorical(lat, lon),
        weatherService.getAlerts(lat, lon),
      ])

      dispatch({ type: 'SET_FORECAST', payload: forecastRes.data })
      dispatch({ type: 'SET_HISTORICAL', payload: histRes.data })
      dispatch({ type: 'SET_ALERTS',     payload: alertRes.data?.alerts || [] })

    } catch (err) {
      dispatch({ type: 'ERROR', payload: err.response?.data?.message || 'Failed to fetch weather data.' })
    }
  }, [])

  const toggleUnit = () => dispatch({ type: 'TOGGLE_UNIT' })

  return (
    <WeatherContext.Provider value={{ ...state, fetchWeather, toggleUnit }}>
      {children}
    </WeatherContext.Provider>
  )
}

export const useWeather = () => {
  const ctx = useContext(WeatherContext)
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider')
  return ctx
}
