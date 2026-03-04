/**
 * client/src/components/maps/WeatherMap.jsx  — Feature 4: Advanced Map
 *
 * NEW vs original:
 *   ① Follow Me — real-time GPS tracking with pulsing marker + accuracy circle
 *   ② Radar Time-Lapse — animates precipitation frames with play/pause/scrubber
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, Circle, Marker } from 'react-leaflet'
import { useWeather } from '../../context/WeatherContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const OWM_KEY = import.meta.env.VITE_OWM_API_KEY || ''

const MAP_LAYERS = [
  { id: 'precipitation_new', label: '🌧️ Precipitation' },
  { id: 'temp_new',          label: '🌡️ Temperature' },
  { id: 'clouds_new',        label: '☁️ Cloud Cover' },
  { id: 'wind_new',          label: '💨 Wind Speed' },
]

function buildRadarFrames() {
  const now = Math.floor(Date.now() / 1000)
  const step = 30 * 60
  return Array.from({ length: 6 }, (_, i) => now - (5 - i) * step)
}

const pulsingIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:20px;height:20px">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.35);animation:wv-pulse 1.8s ease-out infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,.3);"></div>
  </div>
  <style>@keyframes wv-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(3);opacity:0}}</style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function MapController({ followPos, radarActive, radarFrame }) {
  const map = useMap()

  useEffect(() => {
    if (followPos) map.panTo([followPos.lat, followPos.lng], { animate: true })
  }, [followPos, map])

  return (
    <>
      {!radarActive && (
        <TileLayer
          key="owm-layer"
          url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
          opacity={0.5}
          attribution="© OpenWeatherMap"
        />
      )}
      {radarActive && radarFrame && (
        <TileLayer
          key={`radar-${radarFrame}`}
          url={`https://tilecache.rainviewer.com/v2/radar/${radarFrame}/256/{z}/{x}/{y}/2/1_1.png`}
          opacity={0.7}
          attribution="© RainViewer"
        />
      )}
      {followPos && (
        <>
          <Marker position={[followPos.lat, followPos.lng]} icon={pulsingIcon} />
          {followPos.accuracy && (
            <Circle
              center={[followPos.lat, followPos.lng]}
              radius={followPos.accuracy}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
            />
          )}
        </>
      )}
    </>
  )
}

export default function WeatherMap() {
  const { current } = useWeather()
  const [activeLayer, setActiveLayer] = useState('precipitation_new')

  const [followMe, setFollowMe] = useState(false)
  const [followPos, setFollowPos] = useState(null)
  const [geoError, setGeoError] = useState(null)
  const watchRef = useRef(null)

  const [radarActive, setRadarActive] = useState(false)
  const [radarFrames] = useState(buildRadarFrames)
  const [frameIndex, setFrameIndex] = useState(5)
  const [playing, setPlaying] = useState(false)
  const playRef = useRef(null)

  const center = current?.coord ? [current.coord.lat, current.coord.lon] : [20, 0]

  const stopFollowMe = useCallback(() => {
    if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null }
    setFollowPos(null)
  }, [])

  const toggleFollowMe = () => {
    if (followMe) { stopFollowMe(); setFollowMe(false); return }
    if (!navigator.geolocation) { setGeoError('Geolocation not supported.'); return }
    setGeoError(null)
    watchRef.current = navigator.geolocation.watchPosition(
      pos => setFollowPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => { setGeoError(err.code === 1 ? 'Permission denied.' : 'Cannot get location.'); setFollowMe(false) },
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    setFollowMe(true)
  }

  useEffect(() => () => stopFollowMe(), [stopFollowMe])

  const stopPlaying = useCallback(() => {
    setPlaying(false)
    if (playRef.current) { clearInterval(playRef.current); playRef.current = null }
  }, [])

  const startPlaying = useCallback(() => {
    setPlaying(true)
    playRef.current = setInterval(() => setFrameIndex(i => (i + 1) % radarFrames.length), 800)
  }, [radarFrames.length])

  const toggleRadar = () => {
    if (radarActive) { stopPlaying(); setRadarActive(false) }
    else { setRadarActive(true); setFrameIndex(5); startPlaying() }
  }

  useEffect(() => () => stopPlaying(), [stopPlaying])

  const frameTime = new Date(radarFrames[frameIndex] * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card p-0 overflow-hidden animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        {!radarActive && MAP_LAYERS.map(l => (
          <button key={l.id} onClick={() => setActiveLayer(l.id)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${activeLayer === l.id ? 'bg-primary-600 text-white' : 'btn-secondary'}`}>
            {l.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={toggleFollowMe}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${followMe ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>
          {followMe ? '📡' : '📍'}<span>{followMe ? 'Following' : 'Follow Me'}</span>
          {followMe && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
        </button>
        <button onClick={toggleRadar}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${radarActive ? 'bg-red-500 text-white' : 'btn-secondary'}`}>
          📡<span>{radarActive ? 'Radar On 🔴' : 'Radar'}</span>
        </button>
      </div>

      {geoError && <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">📍 {geoError}</div>}

      <MapContainer center={center} zoom={current ? 8 : 3} style={{ height: '450px', width: '100%' }} className="z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://osm.org/copyright">OpenStreetMap</a>' />
        <MapController followPos={followPos} radarActive={radarActive} radarFrame={radarFrames[frameIndex]} />
      </MapContainer>

      {radarActive && (
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center gap-3">
          <button onClick={() => { stopPlaying(); setFrameIndex(i => Math.max(0, i - 1)) }} className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm">⏮</button>
          <button onClick={() => playing ? stopPlaying() : startPlaying()} className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-sm">{playing ? '⏸' : '▶'}</button>
          <button onClick={() => { stopPlaying(); setFrameIndex(i => Math.min(radarFrames.length - 1, i + 1)) }} className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm">⏭</button>
          <input type="range" min={0} max={radarFrames.length - 1} value={frameIndex}
            onChange={e => { stopPlaying(); setFrameIndex(Number(e.target.value)) }}
            className="flex-1 accent-blue-500" />
          <span className="text-xs font-mono w-16 text-right text-slate-300">{frameTime}</span>
          <div className="flex gap-1">
            {radarFrames.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === frameIndex ? 'bg-blue-400' : 'bg-slate-600'}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
