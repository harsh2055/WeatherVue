const axios = require('axios')

const OWM_BASE  = 'https://api.openweathermap.org/data/2.5'
const OWM_BASE3 = 'https://api.openweathermap.org/data/3.0'
const KEY       = process.env.OWM_API_KEY

if (!KEY) console.warn('⚠️  OWM_API_KEY is not set. Weather requests will fail.')

const owm = axios.create({ baseURL: OWM_BASE, params: { appid: KEY, units: 'metric' } })
const owm3 = axios.create({ baseURL: OWM_BASE3, params: { appid: KEY, units: 'metric' } })

const owmService = {
  /** Current weather by city name */
  async getCurrentByCity(city) {
    const res = await owm.get('/weather', { params: { q: city } })
    return res.data
  },

  /** Current weather by coordinates */
  async getCurrentByCoords(lat, lon) {
    const res = await owm.get('/weather', { params: { lat, lon } })
    return res.data
  },

  /** AQI data */
  async getAQI(lat, lon) {
    const res = await owm.get('/air_pollution', { params: { lat, lon } })
    return res.data?.list?.[0]?.main?.aqi
  },

  /** UV Index (via One Call) */
  async getUVI(lat, lon) {
    const res = await owm3.get('/onecall', {
      params: { lat, lon, exclude: 'minutely,hourly,daily,alerts' }
    })
    return res.data?.current?.uvi
  },

  /** 7-day daily forecast */
  async getForecast(lat, lon) {
    const res = await owm3.get('/onecall', {
      params: { lat, lon, exclude: 'current,minutely,hourly,alerts' }
    })
    return res.data
  },

  /** Alerts */
  async getAlerts(lat, lon) {
    const res = await owm3.get('/onecall', {
      params: { lat, lon, exclude: 'current,minutely,hourly,daily' }
    })
    return res.data
  },

  /** Historical data for a specific Unix timestamp */
  async getHistoricalDay(lat, lon, dt) {
    const res = await owm3.get('/onecall/timemachine', { params: { lat, lon, dt } })
    return res.data
  },
}

module.exports = { owmService }
