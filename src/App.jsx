import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AppStateProvider } from './state/AppState'
import { AuthProvider, useIsAuthenticated } from './state/AuthState'
import { isSupabaseReady } from './lib/supabase'
import { Dashboard } from './views/Dashboard'
import { Projects } from './views/Projects'
import { Focus } from './views/Focus'
import { Analytics } from './views/Analytics'
import { Journal } from './views/Journal'
import { Goals } from './views/Goals'
import { Habits } from './views/Habits'
import { AIAssistant } from './views/AIAssistant'
import { Login } from './views/Login'

function AuthGuard({ children }) {
  const { isAuth, loading } = useIsAuthenticated()

  // If Supabase isn't configured, always allow through (local-only mode)
  if (!isSupabaseReady) return children

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-accent-blue/30 border-t-accent-blue animate-spin" />
      </div>
    )
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AppStateProvider>
    </AuthProvider>
  )
}
