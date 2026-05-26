import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Will be null until env vars are set — app works fully offline without them
export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        // Detect and process magic link tokens in URL hash/query on page load
        detectSessionInUrl: true,
        // Keep session across page refreshes (uses localStorage)
        persistSession: true,
        // Refresh token automatically before it expires
        autoRefreshToken: true,
        // Implicit flow works with hash fragments from magic links
        flowType: 'implicit',
      },
    })
  : null

export const isSupabaseReady = Boolean(url && key)
