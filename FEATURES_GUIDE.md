# WeatherVue — Feature Upgrade Guide (Features 3, 4, 5)

## What Was Added

| Feature | What it does | New files |
|---------|-------------|-----------|
| **Feature 3** | Web Push Notifications (bell icon, subscribe/unsubscribe, test push) | `server/routes/push.js`, `client/src/hooks/usePushNotifications.js`, `client/src/components/notifications/PushNotificationBell.jsx`, `client/public/sw-push.js` |
| **Feature 4** | Advanced Map — Follow Me GPS + Radar Time-Lapse | `client/src/components/maps/WeatherMap.jsx` (replaced) |
| **Feature 5** | Health & Lifestyle Dashboard — AQI, UV, Pollen, Activity Safety | `client/src/pages/HealthPage.jsx` |

### Files also modified / fixed
- `server/index.js` — added push route
- `server/routes/ai.js` — fixed missing `validate` flag on rate limiter
- `server/routes/locations.js` — added missing DELETE route
- `server/controllers/aiController.js` — fixed `require('openai').default` + corrected Gemini model name
- `client/src/App.jsx` — added `/health` route
- `client/src/components/ui/Navbar.jsx` — added Health nav link + bell icon
- `client/src/hooks/useAIChat.js` — removed unused `abortRef` (was breaking lint)
- `client/vite.config.js` — removed duplicate `test:{}` block
- `client/vitest.config.js` — created (was missing)
- `supabase_schema.sql` — fixed critical copy-paste bug (user_preferences table was never created) + added push_subscriptions table

---

## Feature 3 Setup — Web Push Notifications

### Step 1 — Install web-push on server
```bash
cd server
npm install
# web-push is already in package.json
```

### Step 2 — Generate VAPID keys (one time only)
```bash
cd server
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log('VAPID_PUBLIC_KEY='+k.publicKey); console.log('VAPID_PRIVATE_KEY='+k.privateKey);"
```

### Step 3 — Add to server/.env
```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:you@example.com
```

### Step 4 — Add push_subscriptions table to Supabase
Run the updated `supabase_schema.sql` in your Supabase SQL Editor.
The new table is in **Section 3** of the schema.

### Step 5 — Add VITE_API_BASE_URL to client/.env (if not already set)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### How it works
1. Sign in → bell icon (🔕) appears in the Navbar
2. Click it → browser asks for notification permission
3. Allow → bell turns yellow (🔔) with green dot
4. Test it: `curl -X POST http://localhost:5000/api/push/test -H "Authorization: Bearer YOUR_JWT"`
5. Click bell again to unsubscribe

### Vercel/Render deployment note
- VAPID keys must be set in Render dashboard (already in render.yaml)
- The service worker `sw-push.js` is in `client/public/` so it auto-deploys with Vercel

---

## Feature 4 — No Setup Required

WeatherMap.jsx was replaced in place. It's a drop-in with the same component name.

**Follow Me**: Click "Follow Me 📍" on the Map page → browser asks for location → map tracks you in real time.

**Radar Time-Lapse**: Click "Radar 📡" → precipitation animation starts. Uses RainViewer tiles (free, no API key needed). Play/pause/scrub through the last ~3 hours.

Both features work simultaneously. To test GPS in Chrome DevTools: DevTools → More tools → Sensors → set custom lat/lng.

---

## Feature 5 — No Setup Required

Navigate to `/health` after searching a city. All data comes from existing weather API calls — no new API key needed for basic use.

**Optional: Real pollen data**
```env
# client/.env
VITE_GOOGLE_POLLEN_API_KEY=your_key_here
```
Get a key at: https://developers.google.com/maps/documentation/pollen
Without it, the dashboard shows seasonal estimates with a "simulated" badge.

---

## Quick Start (all features)

```bash
# 1. Database
# Run supabase_schema.sql in your Supabase SQL Editor (fresh run — all tables)

# 2. Server
cd server
npm install
# Add to server/.env:
#   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
#   GEMINI_API_KEY (for Feature 1 AI assistant)
npm run dev

# 3. Client
cd client
npm install
npm run dev

# 4. Open http://localhost:5173
#    - Search any city
#    - Click "Health" in navbar → Feature 5
#    - Click "Map" → Follow Me + Radar → Feature 4
#    - Sign in → bell icon in navbar → Feature 3
```

---

## Environment Variable Summary

### server/.env
```env
# Existing
OWM_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
DATABASE_URL=
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=
EMAIL_PASS=
CLIENT_URL=http://localhost:5173

# Feature 1 (AI)
GEMINI_API_KEY=
OPENAI_API_KEY=       # optional fallback

# Feature 3 (Push)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:you@example.com
```

### client/.env
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:5000
VITE_OWM_API_KEY=

# Feature 5 (optional real pollen data)
VITE_GOOGLE_POLLEN_API_KEY=
```
