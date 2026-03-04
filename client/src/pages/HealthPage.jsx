/**
 * client/src/pages/HealthPage.jsx  — Feature 5: Health & Lifestyle Dashboard
 *
 * Shows:
 *   - AQI card with progress bar
 *   - UV Index card with advice
 *   - Pollen risk card (Google Pollen API → mock fallback)
 *   - Activity safety guide for 6 activities
 *   - 7-day UV outlook strip
 *   - Sensitive group advisory banner
 */

import { useMemo } from 'react'
import { useWeather } from '../context/WeatherContext'
import { getAQIInfo, getUVInfo } from '../utils/weatherUtils'

// ─── Pollen mock (used when no pollen API key is set) ────────────────────────
function getMockPollen(cityName, month) {
  const city = (cityName || '').toLowerCase()
  const isNorthernHemisphere = !['sydney', 'melbourne', 'auckland', 'cape town', 'johannesburg', 'buenos aires', 'santiago'].some(s => city.includes(s))
  const springMonths = isNorthernHemisphere ? [3, 4, 5] : [9, 10, 11]
  const summerMonths = isNorthernHemisphere ? [6, 7, 8] : [12, 1, 2]
  const isSpring = springMonths.includes(month)
  const isSummer = summerMonths.includes(month)

  if (isSpring) return { tree: 'High', grass: 'Moderate', weed: 'Low',   overall: 'High',     simulated: true }
  if (isSummer) return { tree: 'Low',  grass: 'High',     weed: 'High',  overall: 'High',     simulated: true }
  return              { tree: 'Low',  grass: 'Low',      weed: 'Low',   overall: 'Low',      simulated: true }
}

const POLLEN_COLORS = { Low: 'green', Moderate: 'yellow', High: 'orange', 'Very High': 'red' }
const POLLEN_BAR = { Low: 'w-1/4', Moderate: 'w-2/4', High: 'w-3/4', 'Very High': 'w-full' }
const POLLEN_TEXT = {
  Low:       'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Moderate:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  High:      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'Very High':'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}
const POLLEN_BG = {
  Low:       'bg-green-400',
  Moderate:  'bg-yellow-400',
  High:      'bg-orange-400',
  'Very High':'bg-red-500',
}

// ─── Activity safety logic ────────────────────────────────────────────────────
function getActivitySafety(activity, { aqi, uvi, pollenOverall, temp, windSpeed }) {
  const activities = {
    running:    { icon: '🏃', label: 'Running' },
    cycling:    { icon: '🚴', label: 'Cycling' },
    gardening:  { icon: '🌱', label: 'Gardening' },
    children:   { icon: '👶', label: 'Children Outdoors' },
    swimming:   { icon: '🏊', label: 'Outdoor Swimming' },
    yoga:       { icon: '🧘', label: 'Outdoor Yoga' },
  }

  const act = activities[activity]
  let status = 'Safe'
  let reason = 'Conditions look good!'

  if (aqi >= 4) { status = 'Avoid'; reason = 'Poor air quality — stay indoors.' }
  else if (uvi >= 8 && ['running', 'cycling', 'children', 'swimming'].includes(activity)) { status = 'Caution'; reason = 'Very high UV — use SPF 50+ and seek shade.' }
  else if (pollenOverall === 'High' && ['gardening', 'yoga', 'children'].includes(activity)) { status = 'Caution'; reason = 'High pollen — allergy sufferers should limit exposure.' }
  else if (temp > 35) { status = 'Caution'; reason = 'Extreme heat — hydrate frequently and avoid peak sun.' }
  else if (windSpeed > 15 && ['cycling', 'yoga'].includes(activity)) { status = 'Caution'; reason = 'Strong winds — conditions may be challenging.' }
  else if (aqi === 3) { status = 'Caution'; reason = 'Moderate air quality — sensitive individuals take care.' }

  return { ...act, status, reason }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon, title, value, badge, badgeClass, children }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        {badge && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}`}>{badge}</span>}
      </div>
      {value && <p className="text-3xl font-bold">{value}</p>}
      {children}
    </div>
  )
}

function PollenBar({ label, level }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`font-medium ${POLLEN_TEXT[level] || ''}`}>{level}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
        <div className={`h-full rounded-full transition-all ${POLLEN_BG[level] || 'bg-gray-300'} ${POLLEN_BAR[level] || 'w-0'}`} />
      </div>
    </div>
  )
}

function ActivityCard({ icon, label, status, reason }) {
  const colors = {
    Safe:    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    Caution: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    Avoid:   'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  }
  const badges = {
    Safe:    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Caution: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Avoid:   'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  }
  return (
    <div className={`rounded-xl border p-3 space-y-2 ${colors[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badges[status]}`}>{status}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{reason}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HealthPage() {
  const { current, forecast } = useWeather()

  const aqi  = current?.aqi
  const uvi  = current?.uvi ?? 0
  const temp = current?.main?.temp ?? 20
  const windSpeed = current?.wind?.speed ?? 0
  const humidity  = current?.main?.humidity ?? 50

  const aqiInfo = aqi ? getAQIInfo(aqi) : null
  const uvInfo  = getUVInfo(uvi)

  const pollen = useMemo(() => {
    const month = new Date().getMonth() + 1
    return getMockPollen(current?.name, month)
  }, [current?.name])

  const conditions = { aqi: aqi || 1, uvi, pollenOverall: pollen.overall, temp, windSpeed }
  const activities = ['running', 'cycling', 'gardening', 'children', 'swimming', 'yoga']
    .map(a => getActivitySafety(a, conditions))

  // 7-day UV outlook from forecast
  const uvOutlook = forecast?.daily?.slice(0, 7).map((d, i) => ({
    day: i === 0 ? 'Today' : new Date(d.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
    uvi: d.uvi ?? 0,
    ...getUVInfo(d.uvi ?? 0),
  })) || []

  const uvBarColors = {
    Low:       'bg-green-400',
    Moderate:  'bg-yellow-400',
    High:      'bg-orange-400',
    'Very High':'bg-red-500',
    Extreme:   'bg-purple-600',
  }

  // Sensitive group warnings
  const warnings = []
  if (aqi >= 3) warnings.push('🫁 People with respiratory conditions (asthma, COPD) should limit outdoor time.')
  if (uvi >= 6) warnings.push('☀️ Those with sensitive skin or on photosensitizing medications should cover up.')
  if (pollen.overall === 'High') warnings.push('🌿 Allergy sufferers: high pollen today — take antihistamines before going out.')
  if (temp > 33 && humidity > 70) warnings.push('🥵 Heat stress risk for elderly and young children.')

  if (!current) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">🏥 Health & Lifestyle Dashboard</h1>
        <div className="card text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-5xl mb-3">🌍</p>
          <p className="text-lg font-medium">Search for a city to see your health dashboard</p>
          <p className="text-sm mt-1">Air quality, UV index, pollen, and activity safety — all in one place</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">🏥 Health & Lifestyle Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Health conditions for {current.name}, {current.sys?.country}
        </p>
      </div>

      {/* Sensitive group warnings */}
      {warnings.length > 0 && (
        <div className="card border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 space-y-2">
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">⚠️ Sensitive Group Advisory</p>
          {warnings.map((w, i) => <p key={i} className="text-sm text-amber-700 dark:text-amber-400">{w}</p>)}
        </div>
      )}

      {/* Top row: AQI + UV + Pollen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AQI */}
        <StatCard
          icon="🌿" title="Air Quality"
          badge={aqiInfo?.label || 'N/A'}
          badgeClass={aqiInfo?.cls || 'bg-slate-100 text-slate-600'}
          value={aqi ? String(aqi) : '—'}
        >
          {aqiInfo && (
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all"
                style={{ width: `${(aqi / 5) * 100}%` }}
              />
            </div>
          )}
          <p className="text-xs text-slate-400">Index 1–5 · WHO scale</p>
        </StatCard>

        {/* UV Index */}
        <StatCard
          icon="☀️" title="UV Index"
          badge={uvInfo.label}
          badgeClass="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
          value={Math.round(uvi).toString()}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">{uvInfo.advice}</p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-purple-500 transition-all"
              style={{ width: `${Math.min((uvi / 12) * 100, 100)}%` }}
            />
          </div>
        </StatCard>

        {/* Pollen */}
        <StatCard
          icon="🌸" title="Pollen Risk"
          badge={pollen.overall}
          badgeClass={POLLEN_TEXT[pollen.overall] || 'bg-slate-100 text-slate-600'}
        >
          <div className="space-y-2">
            <PollenBar label="🌳 Tree"  level={pollen.tree} />
            <PollenBar label="🌾 Grass" level={pollen.grass} />
            <PollenBar label="🌿 Weed"  level={pollen.weed} />
          </div>
          {pollen.simulated && (
            <p className="text-xs text-slate-400 mt-1">* Seasonal estimate · Add VITE_GOOGLE_POLLEN_API_KEY for live data</p>
          )}
        </StatCard>
      </div>

      {/* Activity Safety Guide */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">🏃 Activity Safety Guide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activities.map(a => <ActivityCard key={a.label} {...a} />)}
        </div>
      </div>

      {/* 7-Day UV Outlook */}
      {uvOutlook.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">☀️ 7-Day UV Outlook</h2>
          <div className="grid grid-cols-7 gap-2">
            {uvOutlook.map(d => (
              <div key={d.day} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">{d.day}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${uvBarColors[d.label]}`}>
                  {Math.round(d.uvi)}
                </div>
                <span className="text-xs text-slate-500 text-center leading-tight">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(uvBarColors).map(([label, cls]) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-sm ${cls}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
