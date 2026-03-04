/**
 * WeatherVue Backend Server
 * Routes match exactly what the frontend calls:
 *   GET /api/weather/current?city=X&units=metric
 *   GET /api/weather/current?lat=X&lon=Y&units=metric
 *   GET /api/weather/forecast?city=X&units=metric
 *   GET /api/weather/forecast?lat=X&lon=Y&units=metric
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Debug: log every incoming request ────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`→ ${req.method} ${req.url}`);
  next();
});

// ── Helper ────────────────────────────────────────────────────────────────────
const handleAxiosError = (error, res) => {
  console.error('Axios error:', error.response?.status, error.response?.data || error.message);
  if (error.response) {
    const status = error.response.status;
    if (status === 404) return res.status(404).json({ error: 'City not found.' });
    if (status === 401) return res.status(401).json({ error: 'Invalid API key. Check your OPENWEATHER_API_KEY in .env' });
    return res.status(status).json({ error: `Weather service error: ${status}` });
  }
  return res.status(503).json({ error: 'Network error. Could not reach weather service.' });
};

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    apiKeySet: !!API_KEY && API_KEY !== 'your_api_key_here',
    port: PORT,
  });
});

// ── CURRENT WEATHER ───────────────────────────────────────────────────────────
// Supports both ?city=London  AND  ?lat=51.5&lon=-0.1
app.get('/api/weather/current', async (req, res) => {
  const { city, lat, lon, units = 'metric' } = req.query;

  if (!API_KEY || API_KEY === 'your_api_key_here') {
    return res.status(500).json({
      error: 'API key not configured. Open backend/.env and set OPENWEATHER_API_KEY to your real key.',
    });
  }

  try {
    const params = { units, appid: API_KEY };
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else if (city) {
      params.q = city;
    } else {
      return res.status(400).json({ error: 'Provide city or lat+lon query params.' });
    }

    const { data } = await axios.get(`${BASE_URL}/weather`, { params });
    res.json(data);
  } catch (err) {
    handleAxiosError(err, res);
  }
});

// ── 5-DAY FORECAST ────────────────────────────────────────────────────────────
// Supports both ?city=London  AND  ?lat=51.5&lon=-0.1
app.get('/api/weather/forecast', async (req, res) => {
  const { city, lat, lon, units = 'metric' } = req.query;

  if (!API_KEY || API_KEY === 'your_api_key_here') {
    return res.status(500).json({
      error: 'API key not configured. Open backend/.env and set OPENWEATHER_API_KEY to your real key.',
    });
  }

  try {
    const params = { units, appid: API_KEY };
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else if (city) {
      params.q = city;
    } else {
      return res.status(400).json({ error: 'Provide city or lat+lon query params.' });
    }

    const { data } = await axios.get(`${BASE_URL}/forecast`, { params });
    res.json(data);
  } catch (err) {
    handleAxiosError(err, res);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌤  WeatherVue backend running on http://localhost:${PORT}`);
  console.log(`   API Key configured: ${!!API_KEY && API_KEY !== 'your_api_key_here' ? '✅ YES' : '❌ NO — edit backend/.env!'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});