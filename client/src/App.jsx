import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/ui/Navbar'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import MapPage from './pages/MapPage'
import AuthPage from './pages/AuthPage'
import SettingsPage from './pages/SettingsPage'
import HealthPage from './pages/HealthPage'
import AlertBanner from './components/weather/AlertBanner'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AlertBanner />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/map"       element={<MapPage />} />
          <Route path="/health"    element={<HealthPage />} />
          <Route path="/auth"      element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
