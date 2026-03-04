// ── Temperature helpers ──────────────────────────────────────────────────────
export const celsiusToFahrenheit = (c) => Math.round((c * 9) / 5 + 32)
export const formatTemp = (tempC, unit) =>
  unit === 'imperial' ? `${celsiusToFahrenheit(tempC)}°F` : `${Math.round(tempC)}°C`

// ── AQI ──────────────────────────────────────────────────────────────────────
export const AQI_LEVELS = [
  { max: 1, label: 'Good',      color: 'green',  cls: 'aqi-good'   },
  { max: 2, label: 'Fair',      color: 'yellow', cls: 'aqi-fair'   },
  { max: 3, label: 'Moderate',  color: 'orange', cls: 'aqi-poor'   },
  { max: 4, label: 'Poor',      color: 'red',    cls: 'aqi-bad'    },
  { max: 5, label: 'Hazardous', color: 'purple', cls: 'aqi-hazard' },
]

export const getAQIInfo = (aqi) => AQI_LEVELS.find(l => aqi <= l.max) || AQI_LEVELS.at(-1)

// ── UV Index ─────────────────────────────────────────────────────────────────
export const getUVInfo = (uvi) => {
  if (uvi <= 2)  return { label: 'Low',       color: 'green',  advice: 'No protection needed.' }
  if (uvi <= 5)  return { label: 'Moderate',  color: 'yellow', advice: 'Wear sunscreen SPF 30+.' }
  if (uvi <= 7)  return { label: 'High',      color: 'orange', advice: 'Seek shade midday.' }
  if (uvi <= 10) return { label: 'Very High', color: 'red',    advice: 'Protective clothing required.' }
  return           { label: 'Extreme',       color: 'purple', advice: 'Avoid sun exposure.' }
}

// ── Weather Recommendations ───────────────────────────────────────────────────
export const getRecommendation = ({ temp, description, wind_speed, humidity }) => {
  const desc = description?.toLowerCase() || ''
  const isRain  = desc.includes('rain') || desc.includes('drizzle')
  const isSnow  = desc.includes('snow')
  const isStorm = desc.includes('thunder') || desc.includes('storm')
  const isClear = desc.includes('clear')
  const isCloudy = desc.includes('cloud')
  const isHot   = temp >= 30
  const isCold  = temp <= 5
  const isWindy = wind_speed > 10
  const isHumid = humidity > 80

  if (isStorm) return { icon: '⛈️', text: 'Storm incoming — stay indoors and off the roads.' }
  if (isSnow)  return { icon: '❄️', text: 'Snowy conditions — layer up and drive carefully.' }
  if (isRain && isWindy) return { icon: '🌧️', text: 'Wet and windy — a good day to work from home.' }
  if (isRain)  return { icon: '☔', text: 'Bring an umbrella — rain expected today.' }
  if (isHot && isHumid) return { icon: '🥵', text: 'Hot & humid — stay hydrated and avoid peak sun hours.' }
  if (isHot && isClear) return { icon: '🏖️', text: 'Hot and sunny — great for a beach day! Use SPF 50+.' }
  if (isCold)  return { icon: '🧣', text: 'Bundle up — temperatures are near freezing.' }
  if (isClear && temp >= 18 && temp < 28) return { icon: '🏃', text: 'Perfect weather for a run or outdoor workout!' }
  if (isCloudy && !isRain) return { icon: '🚴', text: 'Mild and overcast — ideal for cycling.' }
  if (isWindy) return { icon: '🪁', text: 'Windy day — maybe fly a kite!' }
  return { icon: '🌤️', text: 'Pleasant conditions — enjoy your day!' }
}

// ── Date / Time ───────────────────────────────────────────────────────────────
export const formatDate = (unixTimestamp) =>
  new Date(unixTimestamp * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

export const formatTime = (unixTimestamp) =>
  new Date(unixTimestamp * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

// ── Wind direction ────────────────────────────────────────────────────────────
export const degreesToDirection = (deg) => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}
