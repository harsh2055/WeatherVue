import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useWeather } from '../context/WeatherContext'
import { useAuth } from '../context/AuthContext'
import { preferencesService } from '../services/weatherService'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { unit, toggleUnit } = useWeather()
  const { user } = useAuth()
  const [emailBriefing, setEmailBriefing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    preferencesService.get().then(res => {
      if (res.data?.email_briefing !== undefined) setEmailBriefing(res.data.email_briefing)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await preferencesService.update({ unit, theme, email_briefing: emailBriefing })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (_) {}
    setSaving(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Settings</h1>

      <div className="card space-y-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-300">Preferences</h2>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Theme</p>
            <p className="text-xs text-slate-400">Choose your display mode</p>
          </div>
          <button onClick={toggleTheme} className="btn-secondary text-sm">
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        {/* Units */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
          <div>
            <p className="font-medium text-sm">Temperature Unit</p>
            <p className="text-xs text-slate-400">Currently: {unit === 'metric' ? 'Celsius' : 'Fahrenheit'}</p>
          </div>
          <button onClick={toggleUnit} className="btn-secondary text-sm">
            Switch to {unit === 'metric' ? '°F' : '°C'}
          </button>
        </div>

        {/* Email briefing */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
          <div>
            <p className="font-medium text-sm">Daily Email Briefing</p>
            <p className="text-xs text-slate-400">Get morning weather summary at {user?.email}</p>
          </div>
          <button
            onClick={() => setEmailBriefing(e => !e)}
            className={`relative w-12 h-6 rounded-full transition-colors ${emailBriefing ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailBriefing ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
        {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Preferences'}
      </button>
    </div>
  )
}
