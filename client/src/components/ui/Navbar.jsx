import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useWeather } from '../../context/WeatherContext'
import PushNotificationBell from '../notifications/PushNotificationBell'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { unit, toggleUnit } = useWeather()

  const navCls = ({ isActive }) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto max-w-7xl px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-primary-600 dark:text-primary-400 text-lg">
          <span className="text-2xl">🌤️</span> WeatherVue
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/"       className={navCls} end>Home</NavLink>
          <NavLink to="/map"    className={navCls}>Map</NavLink>
          <NavLink to="/health" className={navCls}>Health</NavLink>
          {user && <NavLink to="/dashboard" className={navCls}>Dashboard</NavLink>}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Feature 3: Push notification bell */}
          <PushNotificationBell />

          {/* Unit toggle */}
          <button onClick={toggleUnit} className="btn-secondary text-xs px-3 py-1.5 font-mono">
            {unit === 'metric' ? '°C' : '°F'}
          </button>

          {/* Dark mode toggle */}
          <button onClick={toggleTheme} className="btn-secondary text-sm px-3 py-1.5" aria-label="Toggle theme">
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/settings" className="btn-secondary text-xs px-3 py-1.5">Settings</Link>
              <button onClick={signOut} className="btn-primary text-xs px-3 py-1.5">Sign Out</button>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary text-sm">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  )
}
