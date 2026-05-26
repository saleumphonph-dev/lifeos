import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Will be null until env vars are set — app works fully offline without them
export const supabase = url && key ? createClient(url, key) : null

export const isSupabaseReady = Boolean(url && key)
