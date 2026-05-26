import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, onAuthChange } from '../lib/sync'
import { isSupabaseReady } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  // If Supabase isn't configured, treat user as always logged in (local-only mode)
  const [session, setSession] = useState(isSupabaseReady ? undefined : 'LOCAL')
  const [loading, setLoading] = useState(isSupabaseReady)

  useEffect(() => {
    if (!isSupabaseReady) return

    getSession().then(s => {
      setSession(s)
      setLoading(false)
    })

    const unsub = onAuthChange((event, s) => {
      setSession(s)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthCtx.Provider value={{ session, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}

export function useIsAuthenticated() {
  const { session, loading } = useAuth()
  return { isAuth: Boolean(session), loading }
}
