import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { storage } from '../lib/storage'
import { uid } from '../lib/utils'
import { pushState, pullState, onAuthChange } from '../lib/sync'
import { isSupabaseReady } from '../lib/supabase'
import {
  PROJECTS as SEED_PROJECTS,
  TASKS as SEED_TASKS,
  GOALS as SEED_GOALS,
  HABITS as SEED_HABITS,
  JOURNAL_ENTRIES as SEED_JOURNAL,
  FOCUS_SESSIONS as SEED_FOCUS,
  USER,
} from '../lib/mockData'

const STORAGE_KEY = 'state.v1'

const initialState = () => {
  const persisted = storage.get(STORAGE_KEY)
  if (persisted) return { ...persisted, _isSeed: false }
  // Fresh device — start with seed data, but flag so we don't push it
  // to Supabase before we've had a chance to pull the real cloud state.
  return {
    user: USER,
    projects: SEED_PROJECTS,
    tasks: SEED_TASKS,
    goals: SEED_GOALS,
    habits: SEED_HABITS,
    journal: SEED_JOURNAL,
    focusSessions: SEED_FOCUS,
    settings: { soundsEnabled: true, focusDuration: 25, breakDuration: 5 },
    _isSeed: true,
    lastModifiedAt: null,
  }
}

function reducer(state, action) {
  // Bypass the modification tracking when replacing the whole state from
  // a Supabase pull — that's not a "user change", just a hydration.
  if (action.type === 'state.hydrate') {
    return { ...action.state, _isSeed: false }
  }

  const next = reducerCore(state, action)
  if (next === state) return state // no-op, don't touch timestamps
  return {
    ...next,
    _isSeed: false,
    lastModifiedAt: new Date().toISOString(),
  }
}

function reducerCore(state, action) {
  switch (action.type) {
    case 'task.add':
      return { ...state, tasks: [{ id: uid(), tags: [], status: 'backlog', priority: 'P2', iceScore: 5, estimatedHours: 1, ...action.task }, ...state.tasks] }
    case 'task.update':
      return { ...state, tasks: state.tasks.map(t => (t.id === action.id ? { ...t, ...action.patch } : t)) }
    case 'task.remove':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) }
    case 'task.move': {
      const { id, status } = action
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : t.completedAt } : t
        ),
      }
    }
    case 'task.reorder': {
      const { sourceId, targetId } = action
      const sourceIdx = state.tasks.findIndex(t => t.id === sourceId)
      const targetIdx = state.tasks.findIndex(t => t.id === targetId)
      if (sourceIdx < 0 || targetIdx < 0) return state
      const next = [...state.tasks]
      const [moved] = next.splice(sourceIdx, 1)
      next.splice(targetIdx, 0, moved)
      return { ...state, tasks: next }
    }
    case 'journal.upsert': {
      const idx = state.journal.findIndex(j => j.date === action.entry.date)
      if (idx >= 0) {
        const next = [...state.journal]
        next[idx] = { ...next[idx], ...action.entry }
        return { ...state, journal: next }
      }
      return { ...state, journal: [{ id: uid(), ...action.entry }, ...state.journal] }
    }
    case 'habit.toggle': {
      const today = new Date().toISOString().slice(0, 10)
      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id !== action.id) return h
          const has = h.completedDates.includes(today)
          const completedDates = has
            ? h.completedDates.filter(d => d !== today)
            : [...h.completedDates, today]
          return { ...h, completedDates, streak: computeStreak(completedDates) }
        }),
      }
    }
    case 'focus.complete':
      return { ...state, focusSessions: [{ id: uid(), ...action.session }, ...state.focusSessions] }
    case 'goal.add':
      return {
        ...state,
        goals: [
          { id: uid(), progress: 0, status: 'on_track', linkedProjectIds: [], type: 'monthly', targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), ...action.goal },
          ...state.goals,
        ],
      }
    case 'goal.update':
      return { ...state, goals: state.goals.map(g => (g.id === action.id ? { ...g, ...action.patch } : g)) }
    case 'goal.remove':
      return { ...state, goals: state.goals.filter(g => g.id !== action.id) }
    case 'habit.add':
      return {
        ...state,
        habits: [
          { id: uid(), streak: 0, completedDates: [], frequency: 'daily', color: '#4a9eff', icon: 'Activity', ...action.habit },
          ...state.habits,
        ],
      }
    case 'habit.remove':
      return { ...state, habits: state.habits.filter(h => h.id !== action.id) }
    case 'project.add':
      return {
        ...state,
        projects: [
          { id: uid(), color: '#4a9eff', status: 'active', progress: 0, ...action.project },
          ...state.projects,
        ],
      }
    case 'project.update':
      return { ...state, projects: state.projects.map(p => (p.id === action.id ? { ...p, ...action.patch } : p)) }
    case 'project.remove':
      // Also remove this project's tasks so we don't orphan them
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.id),
        tasks: state.tasks.filter(t => t.projectId !== action.id),
      }
    case 'settings.update':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'state.reset':
      // Re-seeds with the original mock data
      return {
        user: USER,
        projects: SEED_PROJECTS,
        tasks: SEED_TASKS,
        goals: SEED_GOALS,
        habits: SEED_HABITS,
        journal: SEED_JOURNAL,
        focusSessions: SEED_FOCUS,
        settings: { soundsEnabled: true, focusDuration: 25, breakDuration: 5 },
      }
    case 'state.clear':
      // Wipes everything — start fresh for actual daily logging
      return {
        user: state.user,
        projects: [],
        tasks: [],
        goals: [],
        habits: [],
        journal: [],
        focusSessions: [],
        settings: state.settings,
      }
    default:
      return state
  }
}

function computeStreak(dates) {
  const set = new Set(dates)
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (set.has(d.toISOString().slice(0, 10))) streak++
    else if (i > 0) break
  }
  return streak
}

const Ctx = createContext(null)

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const syncTimer = useRef(null)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Persist to LocalStorage immediately + debounced push to Supabase
  useEffect(() => {
    storage.set(STORAGE_KEY, state)

    // Don't push seed data to Supabase — that would clobber the real
    // cloud snapshot before we've had a chance to pull it.
    if (state._isSeed) return

    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => pushState(state), 3000)
  }, [state])

  // Pull remote state on mount + whenever auth changes (e.g. sign-in).
  // This is what makes the iPhone-after-Mac scenario work — without it,
  // a fresh device just keeps showing seed data forever.
  useEffect(() => {
    if (!isSupabaseReady) return

    let cancelled = false

    async function attemptPull() {
      const remote = await pullState()
      if (cancelled || !remote) return

      const local = stateRef.current
      const localTime = local.lastModifiedAt ? new Date(local.lastModifiedAt).getTime() : 0
      const remoteTime = remote.syncedAt ? new Date(remote.syncedAt).getTime() : 0

      // Remote wins when: local is still seed data, OR remote is newer than
      // anything we've modified locally. This keeps unsynced offline edits
      // safe while still bringing fresh devices up to speed.
      const shouldUseRemote = local._isSeed || remoteTime > localTime
      if (shouldUseRemote) {
        dispatch({ type: 'state.hydrate', state: remote.payload })
      }
    }

    // Try right away (in case session is already restored)
    attemptPull()

    // Also try whenever auth state changes — handles the case where the
    // user signs in after the app has already mounted.
    const unsub = onAuthChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        attemptPull()
      }
    })

    return () => {
      cancelled = true
      unsub && unsub()
    }
  }, [])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be inside AppStateProvider')
  return ctx
}

export function useProjectById(id) {
  const { state } = useApp()
  return state.projects.find(p => p.id === id)
}
