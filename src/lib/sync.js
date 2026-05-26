/**
 * Offline-first sync layer
 *
 * Strategy:
 *  - LocalStorage is the source of truth at all times
 *  - When online + Supabase is ready, we upsert the entire state
 *    into a single `snapshots` row keyed by user_id
 *  - On load, if Supabase is available we pull the remote snapshot
 *    and merge it (remote wins for data that's newer)
 *
 * This "single-row snapshot" approach keeps it simple for a solo user
 * and avoids complex conflict resolution.
 */

import { supabase, isSupabaseReady } from './supabase'

// Namespaced in public schema — works with Supabase's default API config
const TABLE = 'lifeos_snapshots'

/** Push full state to Supabase (called after every state change, debounced) */
export async function pushState(state) {
  if (!isSupabaseReady || !supabase) return
  if (!navigator.onLine) return

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from(TABLE).upsert(
      { user_id: user.id, payload: state, synced_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  } catch (err) {
    // Silent fail — offline or network hiccup, LocalStorage still holds state
    console.debug('[sync] push skipped:', err.message)
  }
}

/** Pull state from Supabase (called once on app load) */
export async function pullState() {
  if (!isSupabaseReady || !supabase) return null
  if (!navigator.onLine) return null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from(TABLE)
      .select('payload')
      .eq('user_id', user.id)
      .single()

    if (error || !data) return null
    return data.payload
  } catch (err) {
    console.debug('[sync] pull skipped:', err.message)
    return null
  }
}

/** Sign in with magic link (passwordless email) */
export async function signInWithEmail(email) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) throw error
}

/** Sign out */
export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

/** Get current session */
export async function getSession() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/** Subscribe to auth state changes */
export function onAuthChange(cb) {
  if (!supabase) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange(cb)
  return () => subscription.unsubscribe()
}
