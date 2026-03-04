const { owmService } = require('../services/owmService')

const weatherController = {
  /** GET /api/weather/current?city=London  OR  ?lat=51.5&lon=-0.12 */
  async getCurrent(req, res) {
    try {
      const { city, lat, lon } = req.query
      let weather

      if (lat && lon) {
        weather = await owmService.getCurrentByCoords(parseFloat(lat), parseFloat(lon))
      } else if (city) {
        // Quick check to warn if coordinates were accidentally passed into the city parameter
        if (city.includes(',') && !isNaN(parseFloat(city.split(',')[0]))) {
          console.warn(`⚠️ Warning: Frontend sent coordinates (${city}) to the 'city' parameter instead of lat/lon!`);
        }
        weather = await owmService.getCurrentByCity(city)
      } else {
        return res.status(400).json({ error: 'Provide city or lat/lon query parameters.' })
      }

      const { lat: wLat, lon: wLon } = weather.coord

      // Fetch AQI and UVI in parallel
      const [aqi, uvi] = await Promise.all([
        owmService.getAQI(wLat, wLon),
        owmService.getUVI(wLat, wLon),
      ])

      res.json({ ...weather, aqi, uvi })
    } catch (err) {
      console.error("\n❌ [getCurrent] API Error:", err.response?.data || err.message);
      
      const status = err.response?.status || 500;
      const message = status === 404 ? 'City not found.' : 'Failed to fetch current weather data.';
      res.status(status).json({ message, details: err.response?.data });
    }
  },

  /** GET /api/weather/forecast?city=London  OR  ?lat&lon */
  async getForecast(req, res) {
    try {
      const { city, lat, lon } = req.query
      let coords = { lat: parseFloat(lat), lon: parseFloat(lon) }

      if (city && !lat) {
        const w = await owmService.getCurrentByCity(city)
        coords = w.coord
      }

      const forecast = await owmService.getForecast(coords.lat, coords.lon)
      res.json(forecast)
    } catch (err) {
      console.error("\n❌ [getForecast] API Error:", err.response?.data || err.message);
      const status = err.response?.status || 500;
      res.status(status).json({ message: 'Failed to fetch forecast.', details: err.response?.data });
    }
  },

  /** GET /api/weather/historical?lat=&lon= */
  async getHistorical(req, res) {
    try {
      const { lat, lon } = req.query
      if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required.' })

      const now  = Math.floor(Date.now() / 1000)
      const days = Array.from({ length: 7 }, (_, i) => now - (i + 1) * 86400)

      const results = await Promise.all(
        days.map(dt => owmService.getHistoricalDay(parseFloat(lat), parseFloat(lon), dt)
          .then(d => ({
            date: dt,
            temp: { max: d.data?.[12]?.temp ?? null, min: d.data?.[6]?.temp ?? null },
            rain: d.data?.reduce((acc, h) => acc + (h.rain?.['1h'] || 0), 0) || 0,
          }))
          .catch(() => null)
        )
      )

      res.json(results.filter(Boolean).reverse())
    } catch (err) {
      console.error("\n❌ [getHistorical] API Error:", err.response?.data || err.message);
      res.status(500).json({ message: 'Failed to fetch historical data.' })
    }
  },

  /** GET /api/weather/alerts?lat=&lon= */
  async getAlerts(req, res) {
    try {
      const { lat, lon } = req.query
      if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required.' })
      
      const data = await owmService.getAlerts(parseFloat(lat), parseFloat(lon))
      res.json(data)
    } catch (err) {
      console.error("\n❌ [getAlerts] API Error:", err.response?.data || err.message);
      res.status(500).json({ message: 'Failed to fetch alerts.' })
    }
  },
}

module.exports = { weatherController }
