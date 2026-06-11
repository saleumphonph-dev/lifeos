import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { storage } from '../lib/storage'
import { writeDailyBackup } from '../lib/backup'
import { uid, getTodayInTimezone } from '../lib/utils'
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

// Default shape for the self-reflection / Identity module.
export function defaultIdentity() {
  return {
    ikigai: { love: '', goodAt: '', worldNeeds: '', paidFor: '', statement: '' },
    hats: [
      { id: 'h-founder', label: 'Founder' },
      { id: 'h-operator', label: 'Operator' },
      { id: 'h-investor', label: 'Investor' },
      { id: 'h-creator', label: 'Creator' },
      { id: 'h-family', label: 'Family' },
      { id: 'h-learner', label: 'Learner' },
    ],
    activeHatId: null,
    selfWorth: 70,
    selfWorthNote: '',
    circleNow: Array.from({ length: 5 }, () => ({ name: '', note: '' })),
    circleAspire: Array.from({ length: 5 }, () => ({ name: '', note: '' })),
    // Munger-style inversion: the surest ways to fail. Avoid all of these
    // and success largely takes care of itself. `clear` = staying clear of it.
    failurePaths: [
      { id: 'f1', text: 'Break your word — be unreliable.', clear: false },
      { id: 'f2', text: 'Stop learning; let your edge go dull.', clear: false },
      { id: 'f3', text: "Only learn from your own mistakes, never others'.", clear: false },
      { id: 'f4', text: 'Quit at the first hard setback.', clear: false },
      { id: 'f5', text: 'Let envy, resentment or self-pity steer decisions.', clear: false },
      { id: 'f6', text: 'Neglect health, sleep and exercise.', clear: false },
      { id: 'f7', text: 'Make big decisions tired, rushed or emotional.', clear: false },
      { id: 'f8', text: 'Spread across too many bets with no focus.', clear: false },
      { id: 'f9', text: 'Avoid the numbers and the hard truths.', clear: false },
      { id: 'f10', text: 'Keep company that drags you down.', clear: false },
      { id: 'f11', text: 'Spend the seed corn — stop reinvesting.', clear: false },
      { id: 'f12', text: 'Trust without verifying; ignore the incentives.', clear: false },
    ],
  }
}

const initialState = () => {
  const persisted = storage.get(STORAGE_KEY)
  if (persisted) return { ...persisted, identity: persisted.identity || defaultIdentity(), _isSeed: false }
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
    identity: defaultIdentity(),
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

  // "Reset to demo" loads sample data LOCALLY ONLY. It is flagged _isSeed so
  // it can NEVER be pushed to Supabase — this is what previously let demo
  // data clobber real cloud data. It's now a safe, local-only preview.
  if (action.type === 'state.reset') {
    return {
      user: USER,
      projects: SEED_PROJECTS, tasks: SEED_TASKS, goals: SEED_GOALS,
      habits: SEED_HABITS, journal: SEED_JOURNAL, focusSessions: SEED_FOCUS,
      settings: state.settings ?? { soundsEnabled: true, focusDuration: 25, breakDuration: 5 },
      _isSeed: true,
      lastModifiedAt: null,
    }
  }

  // "Clear all" is an authoritative wipe. We stamp clearedAt so the sync
  // merge treats this empty state as intentional (won't resurrect old items
  // from the cloud) as long as it's newer than the remote snapshot.
  if (action.type === 'state.clear') {
    const now = new Date().toISOString()
    return {
      user: state.user,
      projects: [], tasks: [], goals: [], habits: [], journal: [], focusSessions: [],
      settings: state.settings,
      _isSeed: false,
      clearedAt: now,
      lastModifiedAt: now,
    }
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
      const today = getTodayInTimezone()
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
    case 'identity.update':
      return { ...state, identity: { ...defaultIdentity(), ...(state.identity || {}), ...action.patch } }
    case 'goal.add':
      return {
        ...state,
        goals: [
          { id: uid(), progress: 0, status: 'on_track', linkedProjectIds: [], archived: false, type: 'monthly', metric: 'percent', targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), ...action.goal },
          ...state.goals,
        ],
      }
    case 'goal.update':
      return { ...state, goals: state.goals.map(g => (g.id === action.id ? { ...g, ...action.patch } : g)) }
    case 'goal.archive':
      return { ...state, goals: state.goals.map(g => (g.id === action.id ? { ...g, archived: true } : g)) }
    case 'goal.unarchive':
      return { ...state, goals: state.goals.map(g => (g.id === action.id ? { ...g, archived: false } : g)) }
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
    // state.reset and state.clear are handled in the top-level reducer.
    default:
      return state
  }
}

// ── Sync merge ─────────────────────────────────────────────────────────
// Combine a local snapshot with a remote one WITHOUT losing data. Items are
// unioned by id; when the same id exists on both sides, the snapshot that was
// modified more recently wins for that item's fields. This replaces the old
// "whole-snapshot, newest-wins" behavior that let one device wipe another.
function mergeById(localArr = [], remoteArr = [], preferRemote, key = 'id') {
  const map = new Map()
  const lower = preferRemote ? localArr : remoteArr
  const higher = preferRemote ? remoteArr : localArr
  for (const it of lower) if (it && it[key] != null) map.set(it[key], it)
  for (const it of higher) if (it && it[key] != null) map.set(it[key], it)
  return Array.from(map.values())
}

// Habits need their check-in history preserved from BOTH devices, so we union
// completedDates and recompute the streak rather than picking one side.
function mergeHabits(localArr = [], remoteArr = [], preferRemote) {
  const ids = new Set([...localArr, ...remoteArr].filter(Boolean).map(h => h.id))
  const localById = new Map(localArr.filter(Boolean).map(h => [h.id, h]))
  const remoteById = new Map(remoteArr.filter(Boolean).map(h => [h.id, h]))
  const out = []
  for (const id of ids) {
    const l = localById.get(id)
    const r = remoteById.get(id)
    if (l && r) {
      const dates = Array.from(new Set([...(l.completedDates || []), ...(r.completedDates || [])])).sort()
      const base = preferRemote ? { ...l, ...r } : { ...r, ...l }
      out.push({ ...base, completedDates: dates, streak: computeStreak(dates) })
    } else {
      out.push(l || r)
    }
  }
  return out
}

export function mergeState(local, remote, remoteSyncedAt) {
  if (!remote) return local
  const localTime = local.lastModifiedAt ? Date.parse(local.lastModifiedAt) : 0
  const remoteTime = remoteSyncedAt ? Date.parse(remoteSyncedAt) : 0
  const preferRemote = remoteTime > localTime

  // Respect an intentional local "Clear all": if we cleared more recently than
  // the remote snapshot, don't resurrect the remote's old items.
  if (local.clearedAt && Date.parse(local.clearedAt) > remoteTime) {
    return local
  }

  const base = preferRemote ? remote : local // user/settings come from newer side
  return {
    ...base,
    user: base.user,
    settings: base.settings,
    projects: mergeById(local.projects, remote.projects, preferRemote),
    tasks: mergeById(local.tasks, remote.tasks, preferRemote),
    goals: mergeById(local.goals, remote.goals, preferRemote),
    habits: mergeHabits(local.habits, remote.habits, preferRemote),
    focusSessions: mergeById(local.focusSessions, remote.focusSessions, preferRemote),
    journal: mergeById(local.journal, remote.journal, preferRemote, 'date'),
    _isSeed: false,
    lastModifiedAt: new Date().toISOString(),
  }
}

function computeStreak(dates) {
  const set = new Set(dates)
  let streak = 0
  const todayISO = getTodayInTimezone()
  const today = new Date(todayISO)
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateISO = d.toISOString().slice(0, 10)
    if (set.has(dateISO)) streak++
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

    // Keep a rolling on-device daily backup (outside the sync layer).
    writeDailyBackup(state)

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

      if (local._isSeed) {
        // Fresh device showing demo data — adopt the cloud snapshot wholesale.
        dispatch({ type: 'state.hydrate', state: remote.payload })
      } else {
        // Real local data — MERGE with the cloud rather than overwriting, so
        // neither side can wipe the other. The merged result is then pushed
        // back, healing any items a previous bad sync had dropped.
        const merged = mergeState(local, remote.payload, remote.syncedAt)
        dispatch({ type: 'state.hydrate', state: merged })
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
