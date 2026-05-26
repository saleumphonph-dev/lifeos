import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardHeader } from '../components/ui/Card'
import { StatTile } from '../components/ui/StatTile'
import { useApp } from '../state/AppState'
import { Activity, Brain, Target, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

export function Analytics() {
  const { state } = useApp()
  const [range, setRange] = useState('30d')

  const heatmap = useMemo(() => buildHeatmap(state.focusSessions, 91), [state.focusSessions])
  const projectMix = useMemo(() => {
    return state.projects.map(p => ({
      name: p.name.split(' ')[0],
      color: p.color,
      value: state.focusSessions.filter(s => s.projectId === p.id).reduce((sum, s) => sum + s.duration, 0),
    }))
  }, [state.projects, state.focusSessions])

  const dailyFocus = useMemo(() => buildDailyFocus(state.focusSessions, 14), [state.focusSessions])
  const qualityTrend = useMemo(() => buildQualityTrend(state.focusSessions, 14), [state.focusSessions])

  const totalFocusHrs = (state.focusSessions.reduce((s, x) => s + x.duration, 0) / 60).toFixed(1)
  const avgQuality = (state.focusSessions.reduce((s, x) => s + x.qualityScore, 0) / Math.max(1, state.focusSessions.length)).toFixed(1)
  const completionRate = Math.round(
    (state.tasks.filter(t => t.status === 'done').length / Math.max(1, state.tasks.length)) * 100
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Performance</div>
          <h1 className="font-display text-2xl text-text-primary mt-0.5">Analytics</h1>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-sm bg-white/[0.03] border border-border-subtle">
          {['7d','30d','90d','YTD'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'h-7 px-2.5 rounded-[6px] text-[11px] font-mono transition-colors',
                range === r ? 'bg-white/[0.08] text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
              )}
            >{r}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Total focus" value={totalFocusHrs} unit="hrs" delta={14} deltaLabel="vs prev" icon={Brain} accent="#4a9eff" />
        <StatTile label="Avg quality" value={avgQuality} unit="/10" delta={3.6} deltaLabel="trend" icon={Sparkles} accent="#a78bfa" />
        <StatTile label="Completion" value={completionRate} unit="%" delta={5} icon={Target} accent="#2ee5a6" />
        <StatTile label="Sessions" value={state.focusSessions.length} delta={-4} icon={Activity} accent="#ffb547" />
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader eyebrow="Last 91 days" title="Focus heatmap" />
        <Heatmap data={heatmap} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader eyebrow="Daily" title="Focus minutes" />
          <div className="h-[220px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyFocus} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4a9eff" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#4a9eff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6e6e76' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6e6e76' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#4a9eff" strokeWidth={2} fill="url(#focusArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow="Allocation" title="Project mix" />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3} stroke="none">
                  {projectMix.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-[10px]">
            {projectMix.map(p => (
              <div key={p.name} className="flex items-center gap-1.5 text-text-tertiary">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                <span className="truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader eyebrow="Quality" title="Session score trend" />
          <div className="h-[200px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityTrend} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6e6e76' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6e6e76' }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="score" radius={[4,4,0,0]} fill="#2ee5a6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow="Cycle integrity" title="Plan vs actual" />
          <div className="space-y-3">
            {state.projects.slice(0, 5).map(p => {
              const plan = p.effort.total
              const actual = p.effort.invested
              const pct = Math.min(100, (actual / plan) * 100)
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5 text-[12px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-text-secondary truncate">{p.name}</span>
                    </div>
                    <div className="font-mono tnum text-text-tertiary text-[11px]">
                      {actual}/{plan}h
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden relative">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

function buildHeatmap(sessions, days) {
  const map = {}
  sessions.forEach(s => {
    const d = s.startedAt?.slice(0, 10)
    if (!d) return
    map[d] = (map[d] || 0) + s.duration
  })
  const out = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    out.push({ date: iso, value: map[iso] || 0, dow: d.getDay() })
  }
  return out
}

function Heatmap({ data }) {
  const weeks = []
  let week = Array(7).fill(null)
  // pad first week to align to dow
  const firstDow = data[0]?.dow ?? 0
  for (let i = 0; i < firstDow; i++) week[i] = { empty: true }
  data.forEach(d => {
    week[d.dow] = d
    if (d.dow === 6) { weeks.push(week); week = Array(7).fill(null) }
  })
  if (week.some(Boolean)) weeks.push(week)

  const max = Math.max(...data.map(d => d.value), 1)
  function intensity(v) {
    if (v <= 0) return 'rgba(255,255,255,0.04)'
    const t = Math.min(1, v / max)
    if (t < 0.25) return 'rgba(74,158,255,0.18)'
    if (t < 0.5) return 'rgba(74,158,255,0.38)'
    if (t < 0.75) return 'rgba(46,229,166,0.55)'
    return 'rgba(46,229,166,0.85)'
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-max">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {w.map((d, di) => (
              <div
                key={di}
                title={d && !d.empty ? `${d.date} · ${d.value} min` : ''}
                className="w-3 h-3 rounded-[3px] transition-colors hover:ring-1 hover:ring-white/20"
                style={{ background: d && !d.empty ? intensity(d.value) : 'transparent' }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-text-tertiary">
        <span>Less</span>
        {['rgba(255,255,255,0.06)', 'rgba(74,158,255,0.2)', 'rgba(74,158,255,0.4)', 'rgba(46,229,166,0.6)', 'rgba(46,229,166,0.9)'].map((c, i) => (
          <span key={i} className="w-3 h-3 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function buildDailyFocus(sessions, days) {
  const map = {}
  sessions.forEach(s => {
    const d = s.startedAt?.slice(0, 10)
    if (!d) return
    map[d] = (map[d] || 0) + s.duration
  })
  const out = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    out.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), minutes: map[iso] || 0 })
  }
  return out
}

function buildQualityTrend(sessions, days) {
  const map = {}
  sessions.forEach(s => {
    const d = s.startedAt?.slice(0, 10)
    if (!d) return
    if (!map[d]) map[d] = { sum: 0, n: 0 }
    map[d].sum += s.qualityScore
    map[d].n += 1
  })
  const out = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const v = map[iso]
    out.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), score: v ? +(v.sum / v.n).toFixed(1) : 0 })
  }
  return out
}
