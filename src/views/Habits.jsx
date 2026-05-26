import { useMemo, useState } from 'react'
import * as Icons from 'lucide-react'
import { Flame, Check, Plus, X } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { useApp } from '../state/AppState'
import { cn, todayISO } from '../lib/utils'

const HABIT_COLORS = ['#4a9eff', '#2ee5a6', '#ffb547', '#a78bfa', '#ff7eb3', '#5eead4', '#ff5e5e']

export default function Habits() {
  const { state, dispatch } = useApp()
  const today = todayISO()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#4a9eff')

  function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    dispatch({ type: 'habit.add', habit: { name: newName.trim(), color: newColor, frequency: 'daily', icon: 'Activity' } })
    setNewName('')
    setAdding(false)
  }

  function handleRemove(id) {
    if (confirm('Remove this habit? Streak will be lost.')) {
      dispatch({ type: 'habit.remove', id })
    }
  }
  const last30 = useMemo(() => {
    const out = []
    const t = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(t)
      d.setDate(t.getDate() - i)
      out.push(d.toISOString().slice(0, 10))
    }
    return out
  }, [])

  const totalCompletion = Math.round(
    (state.habits.reduce((sum, h) => sum + (h.completedDates || []).length, 0) /
      Math.max(1, state.habits.length * 28)) * 100
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Daily energy</div>
          <h1 className="font-display text-2xl text-text-primary mt-0.5">Habits</h1>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-text-tertiary">
          <div>
            <div className="font-mono text-base text-accent-emerald tnum">{totalCompletion}%</div>
            <div>Last 28d</div>
          </div>
          <div>
            <div className="font-mono text-base text-text-primary tnum">{state.habits.reduce((s, h) => s + h.streak, 0)}</div>
            <div>Total streak days</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader eyebrow="Last 30 days" title="Habit grid" />
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-[10px] uppercase tracking-[0.14em] text-text-quaternary font-medium px-2 pb-3">Habit</th>
                {last30.map(d => {
                  const dt = new Date(d)
                  const isToday = d === today
                  return (
                    <th key={d} className={cn('w-6 pb-3 text-[9px] font-mono', isToday ? 'text-accent-blue' : 'text-text-quaternary')}>
                      {dt.getDate() % 5 === 0 || isToday ? dt.getDate() : ''}
                    </th>
                  )
                })}
                <th className="w-16 pb-3 text-right pr-2 text-[10px] uppercase tracking-[0.14em] text-text-quaternary">Streak</th>
              </tr>
            </thead>
            <tbody>
              {state.habits.map(h => {
                const IconComp = Icons[h.icon] || Icons.Activity
                const set = new Set(h.completedDates || [])
                return (
                  <tr key={h.id} className="group">
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-sm flex items-center justify-center"
                          style={{ background: h.color + '20', color: h.color }}
                        >
                          <IconComp size={13} />
                        </div>
                        <div>
                          <div className="text-[13px] text-text-primary leading-none">{h.name}</div>
                          <div className="text-[10px] text-text-tertiary mt-0.5">{h.frequency}</div>
                        </div>
                      </div>
                    </td>
                    {last30.map(d => {
                      const done = set.has(d)
                      const isToday = d === today
                      return (
                        <td key={d} className="text-center py-1.5">
                          <button
                            disabled={!isToday}
                            onClick={() => isToday && dispatch({ type: 'habit.toggle', id: h.id })}
                            title={d}
                            className={cn(
                              'w-4 h-4 rounded-[3px] mx-auto block',
                              done ? '' : 'bg-white/[0.04] hover:bg-white/[0.07]',
                              isToday && 'ring-1 ring-accent-blue/40 cursor-pointer',
                              !isToday && 'cursor-default'
                            )}
                            style={done ? { background: h.color } : undefined}
                          />
                        </td>
                      )
                    })}
                    <td className="text-right pr-2 py-1.5">
                      <div className="inline-flex items-center gap-1 px-1.5 h-5 rounded-sm bg-white/[0.05] text-[11px] font-mono tnum text-accent-amber">
                        <Flame size={10} />
                        {h.streak}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.habits.map(h => {
          const IconComp = Icons[h.icon] || Icons.Activity
          const completionPct = Math.round(((h.completedDates || []).length / 28) * 100)
          return (
            <Card key={h.id} className="relative group">
              <button
                onClick={() => handleRemove(h.id)}
                className="absolute top-3 right-3 w-7 h-7 rounded-sm flex items-center justify-center text-text-quaternary hover:text-accent-red hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="Remove habit"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center"
                  style={{ background: h.color + '20', color: h.color }}
                >
                  <IconComp size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-text-primary">{h.name}</div>
                  <div className="text-[11px] text-text-tertiary capitalize">{h.frequency} · {completionPct}% adherence</div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'habit.toggle', id: h.id })}
                  className={cn(
                    'h-9 w-9 rounded-sm flex items-center justify-center border transition-colors',
                    (h.completedDates || []).includes(today)
                      ? 'border-transparent text-bg-base'
                      : 'border-border-subtle text-text-tertiary hover:bg-white/[0.06]'
                  )}
                  style={(h.completedDates || []).includes(today) ? { background: h.color } : undefined}
                >
                  <Check size={14} />
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
                  <span>Streak</span>
                  <span className="font-mono text-accent-amber">{h.streak}🔥</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${completionPct}%`, background: h.color }} />
                </div>
              </div>
            </Card>
          )
        })}

        {adding ? (
          <Card>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-1.5">Habit name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Morning workout"
                  className="w-full h-10 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[13px] text-text-primary outline-none focus:border-accent-blue/40"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-1.5">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {HABIT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={cn(
                        'w-7 h-7 rounded-full border-2 transition-all',
                        newColor === c ? 'border-white scale-110' : 'border-transparent'
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 h-9 rounded-sm bg-accent-blue text-white text-[12px] font-medium">Add habit</button>
                <button type="button" onClick={() => { setAdding(false); setNewName('') }} className="h-9 px-4 rounded-sm bg-white/[0.04] border border-border-subtle text-[12px] text-text-secondary">Cancel</button>
              </div>
            </form>
          </Card>
        ) : (
          <Card
            className="border-dashed flex items-center justify-center min-h-[120px] cursor-pointer hover:bg-white/[0.04]"
            onClick={() => setAdding(true)}
          >
            <div className="text-center text-text-tertiary">
              <Plus className="mx-auto mb-2" size={20} />
              <div className="text-[12px]">Add habit</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
