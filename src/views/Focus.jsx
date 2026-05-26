import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, X, Coffee, Brain, ChevronDown } from 'lucide-react'
import { useApp } from '../state/AppState'
import { mmss, cn } from '../lib/utils'

const PRESETS = [
  { label: '25 / 5', focus: 25, rest: 5 },
  { label: '50 / 10', focus: 50, rest: 10 },
  { label: '90 / 20', focus: 90, rest: 20 },
]

export function Focus() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [preset, setPreset] = useState(PRESETS[0])
  const [mode, setMode] = useState('focus') // 'focus' | 'rest'
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(PRESETS[0].focus * 60)
  const [cycle, setCycle] = useState(1)
  const [taskId, setTaskId] = useState(state.tasks.find(t => t.status === 'in_progress')?.id ?? state.tasks[0]?.id)
  const [distractions, setDistractions] = useState(0)
  const intervalRef = useRef(null)

  const task = state.tasks.find(t => t.id === taskId)
  const project = state.projects.find(p => p.id === task?.projectId)

  const totalSeconds = (mode === 'focus' ? preset.focus : preset.rest) * 60
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          // cycle complete
          if (mode === 'focus') {
            dispatch({
              type: 'focus.complete',
              session: {
                taskId, projectId: task?.projectId, duration: preset.focus,
                startedAt: new Date(Date.now() - preset.focus * 60_000).toISOString(),
                completedAt: new Date().toISOString(),
                cyclesPlanned: 4, cyclesCompleted: cycle,
                qualityScore: 8 + Math.random() * 1.5,
                distractionsBlocked: distractions,
              },
            })
            setMode('rest')
            return preset.rest * 60
          } else {
            setMode('focus')
            setCycle(c => c + 1)
            return preset.focus * 60
          }
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode, preset, cycle, taskId, task?.projectId, distractions, dispatch])

  // Keyboard: Space pause/resume, Esc exit
  useEffect(() => {
    function k(e) {
      const tag = (e.target?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (e.code === 'Space') {
        e.preventDefault()
        setRunning(r => !r)
      } else if (e.key === 'Escape') {
        navigate('/dashboard')
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [navigate])

  function reset() {
    setRunning(false)
    setSeconds(preset.focus * 60)
    setMode('focus')
    setCycle(1)
    setDistractions(0)
  }

  function applyPreset(p) {
    setPreset(p)
    setSeconds(p.focus * 60)
    setMode('focus')
    setRunning(false)
  }

  const r = 160
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-deep">
      {/* Ambient glow */}
      <div
        className={cn(
          'absolute inset-0 transition-colors duration-700 pointer-events-none',
        )}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-25 blur-3xl"
          style={{ background: mode === 'focus' ? 'radial-gradient(circle, #4a9eff, transparent 60%)' : 'radial-gradient(circle, #2ee5a6, transparent 60%)' }}
        />
      </div>

      {/* Exit */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-5 right-5 z-20 w-9 h-9 rounded-sm glass border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        title="Exit (esc)"
      >
        <X size={15} />
      </button>

      <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
        <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-accent-blue to-accent-emerald flex items-center justify-center">
          <span className="font-display text-[14px] text-bg-base leading-none">L</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">Deep work mode</div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-8">
          <div className={cn(
            'flex items-center gap-1.5 h-7 px-3 rounded-full text-[10px] uppercase tracking-[0.18em] font-medium',
            mode === 'focus' ? 'bg-accent-blue/15 text-accent-blue' : 'bg-accent-emerald/15 text-accent-emerald'
          )}>
            {mode === 'focus' ? <Brain size={11} /> : <Coffee size={11} />}
            {mode === 'focus' ? 'Focus' : 'Rest'} · Cycle {cycle}
          </div>
        </div>

        {/* Task selector */}
        <div className="mb-10 max-w-md w-full">
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-quaternary text-center mb-2">Working on</div>
          <div className="relative">
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full h-11 px-4 pr-9 rounded-sm glass border border-border-subtle text-[14px] text-text-primary text-center appearance-none outline-none cursor-pointer"
            >
              {state.tasks.filter(t => t.status !== 'done').map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          </div>
          {project && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: project.color }} />
              {project.name}
            </div>
          )}
        </div>

        {/* Timer ring */}
        <div className="relative" style={{ width: 360, height: 360 }}>
          <svg width="360" height="360" className="-rotate-90">
            <defs>
              <linearGradient id="timer-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4a9eff" />
                <stop offset="100%" stopColor="#2ee5a6" />
              </linearGradient>
            </defs>
            <circle cx="180" cy="180" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
            <circle
              cx="180" cy="180" r={r}
              stroke="url(#timer-grad)" strokeWidth="6" fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono tnum text-[64px] md:text-[80px] font-light text-text-primary leading-none">
              {mmss(seconds)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-text-tertiary mt-3">
              {running ? (mode === 'focus' ? 'In session' : 'Resting') : 'Paused'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-10">
          <button
            onClick={reset}
            className="w-11 h-11 rounded-full glass border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            title="Reset"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => setRunning(r => !r)}
            className="h-14 px-8 rounded-full bg-gradient-to-r from-accent-blue to-accent-emerald text-bg-base font-semibold text-[14px] flex items-center gap-2 shadow-[0_0_40px_-8px_rgba(74,158,255,0.6)] hover:shadow-[0_0_60px_-8px_rgba(46,229,166,0.6)] transition-shadow"
          >
            {running ? <><Pause size={16} fill="currentColor" /> Pause</> : <><Play size={16} fill="currentColor" /> {seconds < (mode === 'focus' ? preset.focus : preset.rest) * 60 ? 'Resume' : 'Start'}</>}
            <span className="font-mono text-[10px] opacity-60 ml-1">Space</span>
          </button>
          <button
            onClick={() => setDistractions(d => d + 1)}
            className="w-11 h-11 rounded-full glass border border-border-subtle flex items-center justify-center text-text-secondary hover:text-accent-amber transition-colors font-mono text-[11px]"
            title="Log distraction"
          >
            +{distractions}
          </button>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 mt-8 p-1 rounded-sm glass border border-border-subtle">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={cn(
                'h-7 px-3 rounded-[6px] text-[11px] font-mono transition-colors',
                preset.label === p.label
                  ? 'bg-white/[0.08] text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Today snapshot */}
        <div className="mt-10 grid grid-cols-3 gap-6 text-center">
          <Stat label="Today's cycles" value={state.focusSessions.filter(s => s.startedAt?.slice(0,10) === new Date().toISOString().slice(0,10)).length} />
          <Stat label="Distractions blocked" value={distractions} />
          <Stat label="Cycle" value={cycle} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-mono tnum text-2xl text-text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary mt-1">{label}</div>
    </div>
  )
}
