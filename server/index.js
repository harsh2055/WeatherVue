require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

// Routes
const weatherRoutes     = require('./routes/weather')
const locationRoutes    = require('./routes/locations')
const preferencesRoutes = require('./routes/preferences')
const aiRoutes          = require('./routes/ai')
const pushRoutes        = require('./routes/push')   // Feature 3

// Cron jobs
require('./jobs/dailyBriefing')

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(express.json({ limit: '50kb' }))

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://weather-vue-ruddy.vercel.app',
  ],
  credentials: true,
}))

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  validate: { xForwardedForHeader: false },
}))

app.use('/api/weather',      weatherRoutes)
app.use('/api/locations',    locationRoutes)
app.use('/api/preferences',  preferencesRoutes)
app.use('/api/ai',           aiRoutes)
app.use('/api/push',         pushRoutes)   // Feature 3

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))
