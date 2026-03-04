# 🌤️ WeatherVue — Full-Stack Weather PWA

A production-ready full-stack weather application and Progressive Web App (PWA) built with React, Node.js, Supabase, and the OpenWeatherMap API.

**Live Demo:** https://weather-vue-ruddy.vercel.app/

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Charts | Recharts |
| Maps | Leaflet.js + react-leaflet |
| Backend | Node.js, Express 4 |
| Auth & DB | Supabase (PostgreSQL + Auth) |
| Weather Data | OpenWeatherMap One Call API 3.0 |
| Email | Nodemailer |
| Cron | node-cron |
| PWA | vite-plugin-pwa + Workbox |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
weathervue/
├── client/                        # React frontend (Vite + Tailwind)
│   ├── public/
│   │   └── manifest.webmanifest   # PWA manifest
│   └── src/
│       ├── components/
│       │   ├── weather/           # SearchBar, CurrentWeatherCard, ForecastCard, AlertBanner
│       │   ├── charts/            # HistoricalChart (Recharts)
│       │   ├── maps/              # WeatherMap (Leaflet.js)
│       │   └── ui/                # Navbar
│       ├── context/               # AuthContext, ThemeContext, WeatherContext
│       ├── hooks/                 # useGeolocation
│       ├── pages/                 # HomePage, MapPage, DashboardPage, AuthPage, SettingsPage
│       ├── services/              # supabaseClient.js, weatherService.js
│       └── utils/                 # weatherUtils.js (AQI, UV, recommendations, formatting)
│
└── server/                        # Node.js + Express backend
    ├── config/
    │   ├── supabase.js            # Supabase admin client
    │   └── db.js                  # Neon database client
    ├── controllers/
    │   └── weatherController.js   # Business logic for weather endpoints
    ├── jobs/
    │   └── dailyBriefing.js       # node-cron job (07:00 UTC daily)
    ├── middleware/
    │   └── auth.js                # Supabase JWT verification middleware
    ├── routes/
    │   ├── weather.js             # /api/weather/*
    │   ├── locations.js           # /api/locations/favorites
    │   └── preferences.js         # /api/preferences
    └── services/
        ├── owmService.js          # OpenWeatherMap API wrapper
        └── emailService.js        # Nodemailer HTML email service
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenWeatherMap](https://openweathermap.org/api) API key (One Call API 3.0)
- A Gmail account (or SMTP provider) for daily email briefings

---

### Step 1 — Database Setup

1. Go to your Supabase project → **SQL Editor**
2. Paste and run the contents of `supabase_schema.sql`
3. In **Authentication → Settings**, configure email confirmations as needed

---

### Step 2 — Backend Setup

```bash
cd server
cp .env.example .env
# Fill in all required values in .env

npm install
npm run dev        # Starts on http://localhost:5000
```

**Required environment variables (`server/.env`):**

| Variable | Description |
|----------|-------------|
| `OWM_API_KEY` | OpenWeatherMap API key |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (backend admin) |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password or app password |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:5173`) |

---

### Step 3 — Frontend Setup

```bash
cd client
cp .env.example .env
# Fill in the values below

npm install
npm run dev        # Starts on http://localhost:5173
```

**Required environment variables (`client/.env`):**

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_API_BASE_URL` | Backend URL (e.g. `http://localhost:5000`) |
| `VITE_OWM_API_KEY` | OpenWeatherMap API key (used for map tile layers) |

---

## 🌐 API Reference

### Weather Endpoints (Public)

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/weather/current` | `city` or `lat` + `lon` | Current weather + AQI + UV Index |
| `GET` | `/api/weather/forecast` | `city` or `lat` + `lon` | 7-day daily forecast |
| `GET` | `/api/weather/historical` | `lat`, `lon` | Past 7 days of weather data |
| `GET` | `/api/weather/alerts` | `lat`, `lon` | Active severe weather alerts |

### Location Endpoints (🔐 Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/locations/favorites` | Get all saved cities |
| `POST` | `/api/locations/favorites` | Save a city (`{ city: "London" }`) |
| `DELETE` | `/api/locations/favorites/:id` | Remove a saved city |

### Preferences Endpoints (🔐 Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/preferences` | Get user preferences |
| `PUT` | `/api/preferences` | Update preferences (`unit`, `theme`, `email_briefing`) |

---

## 🗄️ Database Schema

### `saved_locations`
Stores user favorite cities with Row-Level Security (RLS) so each user can only access their own records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users` |
| `city_name` | TEXT | City name |
| `created_at` | TIMESTAMPTZ | Auto-set |

### `user_preferences`
Stores per-user settings: temperature unit, display theme, and email briefing opt-in.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users` |
| `unit` | TEXT | `metric` or `imperial` |
| `theme` | TEXT | `light` or `dark` |
| `email_briefing` | BOOLEAN | Daily email opt-in |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

A database trigger (`on_auth_user_created`) automatically inserts a default `user_preferences` row whenever a new user signs up.

---

## 🔔 Daily Email Briefing

The cron job in `server/jobs/dailyBriefing.js` runs every day at **07:00 UTC**. It:

1. Queries all users with `email_briefing = true`
2. Fetches the user's email via the Supabase Auth admin API
3. Retrieves their first saved city
4. Fetches current weather and 7-day forecast for that city
5. Sends a formatted HTML email via Nodemailer

To change the time or timezone, edit the cron schedule and `timezone` option in `dailyBriefing.js`.

---

## 📱 PWA Features

- **Installable** — Web app manifest enables "Add to Home Screen" on iOS and Android
- **Offline support** — Workbox service worker caches API responses (30 min TTL) and map tiles (1 hr TTL)
- **Auto-updates** — Service worker refreshes automatically on new deployments via `registerType: 'autoUpdate'`

---

## 🚢 Deployment

### Frontend → Vercel

```bash
vercel --prod
```

Set these environment variables in the Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- `VITE_OWM_API_KEY`

The `client/vercel.json` includes a catch-all rewrite rule for React Router SPA navigation.

### Backend → Render

Connect your GitHub repo to Render and use the included `render.yaml` configuration. Set all secret environment variables in the Render dashboard (they are marked `sync: false` in the config).

After deploying, update the `origin` array in `server/index.js` to include your Vercel frontend URL.

---

## ✨ Key Features

- **Real-time weather** — Current conditions including temperature, humidity, wind, visibility, and pressure
- **7-day forecast** — Daily high/low, precipitation probability, and weather icons
- **Historical trends** — 7-day historical chart for temperature and rainfall (Recharts)
- **AQI & UV Index** — Air quality index and UV level with health recommendations
- **Weather alerts** — Dismissible banner for active severe weather warnings
- **Interactive map** — Leaflet map with switchable OWM tile layers (precipitation, temperature, cloud cover, wind)
- **Geolocation** — One-click weather for the user's current location
- **Saved cities** — Authenticated users can save and manage favorite locations
- **Daily email briefing** — Opt-in morning weather summary delivered via email
- **Dark mode** — Full dark/light theme toggle, persisted to localStorage
- **Unit toggle** — Switch between Celsius and Fahrenheit at any time
- **PWA** — Installable on mobile and desktop with offline support
