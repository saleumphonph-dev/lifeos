import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppShell } from './components/layout/AppShell'
import { AppStateProvider } from './state/AppState'
import { AuthProvider, useIsAuthenticated } from './state/AuthState'
import { isSupabaseReady } from './lib/supabase'
import { Login } from './views/Login'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy load all route views for code-splitting
const Dashboard = lazy(() => import('./views/Dashboard'))
const Projects = lazy(() => import('./views/Projects'))
const Focus = lazy(() => import('./views/Focus'))
const Analytics = lazy(() => import('./views/Analytics'))
const Journal = lazy(() => import('./views/Journal'))
const Goals = lazy(() => import('./views/Goals'))
const Habits = lazy(() => import('./views/Habits'))
const AIAssistant = lazy(() => import('./views/AIAssistant'))

function RouteLoader() {
  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-accent-blue/30 border-t-accent-blue animate-spin" />
    </div>
  )
}

function AuthGuard({ children }) {
  const { isAuth, loading } = useIsAuthenticated()

  // If Supabase isn't configured, always allow through (local-only mode)
  if (!isSupabaseReady) return children

  if (loading) {
    return <RouteLoader />
  }

  if (!isAuth) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ErrorBoundary><Suspense fallback={<RouteLoader />}><Dashboard /></Suspense></ErrorBoundary>} />
            <Route path="/projects" element={<ErrorBoundary><Suspense fallback={<RouteLoader />}><Projects /></Suspense></ErrorBoundary>} />
            <Route path="/focus" element={<ErrorBoundary><Suspense fallback={<RouteLoader />}><Focus /></Suspense></ErrorBoundary>} />
            <Route path="/analytics" element={<ErrorBoundary><Suspense fallback={<RouteLoader />}><Analytics /></Suspense></ErrorBoundary>} />
            <Route path="/journal" element={<ErrorBoundary><Suspense fallback={<RouteLoader />}><Journal /></Suspense></ErrorBoundary>} />
            <Route path="/goals" element={<ErrorBoundary><Suspense fallback={<RouteLoader />}><Goals /></Suspense></ErrorBoundary>} />
            <Route path="/habits" element={<ErrorBoundary><Suspense fallback={<RouteLoader />}><Habits /></Suspense></ErrorBoundary>} />
            <Route path="/ai" element={<ErrorBoundary><Suspense fallback={<RouteLoader />}><AIAssistant /></Suspense></ErrorBoundary>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AppStateProvider>
    </AuthProvider>
  )
}
