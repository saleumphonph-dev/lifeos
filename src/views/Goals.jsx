import { useState } from 'react'
import { Target, Calendar, TrendingUp, Compass, Plus, X } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge, statusTone } from '../components/ui/Badge'
import { ProgressRing } from '../components/ui/ProgressRing'
import { useApp } from '../state/AppState'
import { cn, relativeDate, formatMoney } from '../lib/utils'

const TYPES = [
  { id: 'annual', label: 'Annual', icon: Compass },
  { id: 'quarterly', label: 'Quarterly', icon: Target },
  { id: 'monthly', label: 'Monthly', icon: Calendar },
  { id: 'weekly', label: 'Weekly', icon: TrendingUp },
]

export default function Goals() {
  const { state, dispatch } = useApp()
  const [filter, setFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('monthly')
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  const [newMetric, setNewMetric] = useState('percent') // 'percent' | 'lak' | 'usd'
  const [newCurrent, setNewCurrent] = useState('')
  const [newTarget, setNewTarget] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const goal = { name: newName.trim(), type: newType, targetDate: newDate }
    if (newMetric === 'lak' || newMetric === 'usd') {
      const target = Number(newTarget) || 0
      const current = Number(newCurrent) || 0
      goal.metric = 'currency'
      goal.currency = newMetric === 'usd' ? '$' : '₭'
      goal.targetValue = target
      goal.currentValue = current
      goal.progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
    }
    dispatch({ type: 'goal.add', goal })
    setNewName(''); setNewMetric('percent'); setNewCurrent(''); setNewTarget('')
    setAdding(false)
  }

  // Update a currency goal's current value, re-deriving its progress %.
  function setGoalCurrentValue(g, raw) {
    const current = Number(raw) || 0
    const target = g.targetValue || 0
    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
    dispatch({ type: 'goal.update', id: g.id, patch: { currentValue: current, progress } })
  }

  function handleArchive(id, isArchived) {
    if (isArchived) {
      if (confirm('Unarchive this goal?')) {
        dispatch({ type: 'goal.unarchive', id })
      }
    } else {
      if (confirm('Archive this goal? You can view it later in archived goals.')) {
        dispatch({ type: 'goal.archive', id })
      }
    }
  }

  const goals = (filter === 'all' ? state.goals : state.goals.filter(g => g.type === filter)).filter(g => showArchived ? g.archived : !g.archived)
  const archivedCount = state.goals.filter(g => g.archived).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Strategy</div>
          <h1 className="font-display text-2xl text-text-primary mt-0.5">Goals & horizons</h1>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-sm bg-white/[0.03] border border-border-subtle">
          <button
            onClick={() => setFilter('all')}
            className={cn('h-7 px-3 rounded-[6px] text-[11px]', filter === 'all' ? 'bg-white/[0.08] text-text-primary' : 'text-text-tertiary hover:text-text-secondary')}
          >All</button>
          {TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                'h-7 px-3 rounded-[6px] text-[11px] flex items-center gap-1.5',
                filter === t.id ? 'bg-white/[0.08] text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              <t.icon size={11} /> {t.label}
            </button>
          ))}
          {archivedCount > 0 && (
            <>
              <div className="w-px h-4 bg-border-subtle opacity-50" />
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={cn('h-7 px-3 rounded-[6px] text-[11px]', showArchived ? 'bg-white/[0.08] text-text-primary' : 'text-text-tertiary hover:text-text-secondary')}
              >
                {showArchived ? 'Archived' : `Archived (${archivedCount})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Horizon timeline */}
      <Card>
        <CardHeader eyebrow="2026" title="The horizon" />
        <div className="relative h-28">
          {/* Goal dots — top half, two staggered rows above the timeline */}
          {state.goals.filter(g => g.type === 'annual' || g.type === 'quarterly').map((g, idx) => {
            const target = new Date(g.targetDate)
            const m = target.getMonth()
            const top = idx % 2 === 0 ? '15%' : '35%'
            const color = g.status === 'behind' ? '#ff5e5e' : g.status === 'ahead' ? '#2ee5a6' : '#4a9eff'
            return (
              <div key={g.id} className="absolute -translate-x-1/2 group z-10" style={{ left: `${(m / 11) * 100}%`, top }}>
                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-bg-base" style={{ background: color }} />
                <div className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap px-2 py-1 rounded bg-bg-elevated border border-border-subtle text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {g.name}
                </div>
              </div>
            )
          })}
          {/* Horizontal timeline line at 60% */}
          <div className="absolute left-0 right-0 h-px bg-border-subtle" style={{ top: '60%' }} />
          {/* Month ticks + labels — bottom area, below the line */}
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => {
            const date = new Date(2026, m, 1)
            return (
              <div key={m} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${(m / 11) * 100}%`, top: '60%' }}>
                <div className="w-px h-2 bg-border-subtle" />
                <div className="text-[9px] text-text-tertiary mt-1 font-mono">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(g => {
          const linkedProjects = state.projects.filter(p => (g.linkedProjectIds || []).includes(p.id))
          return (
            <Card key={g.id} className={cn('relative group', g.archived && 'bg-white/[0.02] opacity-60')}>
              <button
                onClick={() => handleArchive(g.id, g.archived)}
                className="absolute top-3 right-3 w-7 h-7 rounded-sm flex items-center justify-center text-text-quaternary hover:text-accent-red hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
                title={g.archived ? 'Unarchive goal' : 'Archive goal'}
              >
                <X size={14} />
              </button>
              <div className="flex items-start gap-4">
                <ProgressRing
                  size={68} strokeWidth={5}
                  progress={g.progress}
                  gradient={
                    g.status === 'behind' ? ['#ff5e5e', '#ffb547'] :
                    g.status === 'ahead' ? ['#2ee5a6', '#4a9eff'] :
                    ['#4a9eff', '#2ee5a6']
                  }
                  label={`${g.progress}%`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone="default">{g.type}</Badge>
                    <Badge tone={statusTone[g.status]}>{g.status.replace('_',' ')}</Badge>
                  </div>
                  <h3 className="text-[16px] font-semibold text-text-primary leading-[1.4] -tracking-[0.2px]">{g.name}</h3>
                  {g.metric === 'currency' && (
                    <div className="font-mono text-[13px] text-text-secondary mt-1 tnum">
                      {formatMoney(g.currentValue, g.currency)}
                      <span className="text-text-quaternary"> / {formatMoney(g.targetValue, g.currency)}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-text-tertiary mt-1">
                    Target {relativeDate(g.targetDate)}
                  </div>
                </div>
              </div>

              {linkedProjects.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-text-quaternary mb-2">Linked projects</div>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedProjects.map(p => (
                      <span key={p.id} className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded bg-white/[0.04] border border-border-subtle">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {g.metric === 'currency' ? (
                <div className="mt-4 flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-[0.14em] text-text-quaternary shrink-0">Current</label>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="font-mono text-[12px] text-text-tertiary">{g.currency}</span>
                    <input
                      type="number" min="0" step="any"
                      value={g.currentValue ?? 0}
                      onChange={(e) => setGoalCurrentValue(g, e.target.value)}
                      className="flex-1 h-8 px-2 rounded-sm bg-white/[0.04] border border-border-subtle text-[13px] font-mono text-text-primary outline-none focus:border-accent-blue/40 tnum"
                    />
                  </div>
                  <span className="font-mono text-[11px] text-text-tertiary tnum w-10 text-right">{g.progress}%</span>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="range" min="0" max="100" step="1"
                    value={g.progress}
                    onChange={(e) => dispatch({ type: 'goal.update', id: g.id, patch: { progress: Number(e.target.value) } })}
                    className="flex-1"
                    style={{ accentColor: '#4a9eff' }}
                  />
                  <span className="font-mono text-[11px] text-text-tertiary tnum w-10 text-right">{g.progress}%</span>
                </div>
              )}
            </Card>
          )
        })}

        {adding ? (
          <Card>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-1.5">Goal name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Launch LANI v2 capsule"
                  spellCheck="true"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  className="w-full h-10 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[14px] text-text-primary outline-none focus:border-accent-blue/40 -tracking-[0.2px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-1.5">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full h-10 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[14px] text-text-primary outline-none -tracking-[0.2px]"
                  >
                    {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-1.5">Target date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[14px] text-text-primary outline-none -tracking-[0.2px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-1.5">Measure by</label>
                <div className="flex items-center gap-1 p-1 rounded-sm bg-white/[0.03] border border-border-subtle">
                  {[
                    { id: 'percent', label: '% Progress' },
                    { id: 'lak', label: 'Amount ₭' },
                    { id: 'usd', label: 'Amount $' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewMetric(opt.id)}
                      className={cn('flex-1 h-7 rounded-[6px] text-[11px]', newMetric === opt.id ? 'bg-white/[0.08] text-text-primary' : 'text-text-tertiary hover:text-text-secondary')}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
              {(newMetric === 'lak' || newMetric === 'usd') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-1.5">Current ({newMetric === 'usd' ? '$' : '₭'})</label>
                    <input
                      type="number" min="0" step="any"
                      value={newCurrent}
                      onChange={(e) => setNewCurrent(e.target.value)}
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[14px] font-mono text-text-primary outline-none focus:border-accent-blue/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-1.5">Target ({newMetric === 'usd' ? '$' : '₭'})</label>
                    <input
                      type="number" min="0" step="any"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      placeholder="e.g. 1200000000"
                      className="w-full h-10 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[14px] font-mono text-text-primary outline-none focus:border-accent-blue/40"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 h-9 rounded-sm bg-accent-blue text-white text-[12px] font-medium">Add goal</button>
                <button type="button" onClick={() => { setAdding(false); setNewName('') }} className="h-9 px-4 rounded-sm bg-white/[0.04] border border-border-subtle text-[12px] text-text-secondary">Cancel</button>
              </div>
            </form>
          </Card>
        ) : (
          <Card
            className="border-dashed flex items-center justify-center min-h-[180px] cursor-pointer hover:bg-white/[0.04]"
            onClick={() => setAdding(true)}
          >
            <div className="text-center text-text-tertiary">
              <Plus className="mx-auto mb-2" size={20} />
              <div className="text-[12px]">Add a new goal</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
