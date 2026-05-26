import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Flame, Zap, TrendingUp, Clock, Target, ArrowRight,
  Calendar, Activity, CheckCircle2, AlertCircle, Sunrise,
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader } from '../components/ui/Card'
import { StatTile } from '../components/ui/StatTile'
import { ProgressRing } from '../components/ui/ProgressRing'
import { Badge, statusTone, priorityTone } from '../components/ui/Badge'
import { useApp } from '../state/AppState'
import { relativeDate } from '../lib/utils'

export default function Dashboard() {
  const { state } = useApp()
  const { tasks, projects, focusSessions, journal, habits, goals, user } = state

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    []
  )

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const todaySessions = focusSessions.slice(0, 6)
  const focusMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const completedToday = tasks.filter(t => t.status === 'done').slice(0, 12).length
  const activeTasks = tasks.filter(t => t.status === 'in_progress')
  const upNext = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    .slice(0, 5)

  const weeklyTrend = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
      output: 4 + Math.round(Math.sin(i * 0.9) * 2 + Math.random() * 3),
      focus: 3 + Math.round(Math.cos(i * 0.6) * 1.5 + Math.random() * 2),
    }))
  }, [])

  const habitCompletionToday = habits.filter(h => {
    const today = new Date().toISOString().slice(0, 10)
    return (h.completedDates || []).includes(today)
  }).length

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <Card className="relative overflow-hidden" padding="p-7">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent-blue/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 -left-12 w-64 h-64 rounded-full bg-accent-emerald/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-text-tertiary font-medium">
              <Sunrise size={12} />
              <span>{todayLabel} · {user.location}</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl mt-3 leading-[1.05]">
              {greeting}, <em className="text-accent-blue not-italic">{user.name}.</em>
              <br />
              <span className="text-text-secondary">3 deep blocks open today.</span>
            </h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/focus">
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-sm bg-accent-blue/90 hover:bg-accent-blue text-white text-[13px] font-medium transition-colors">
                  Start focus session <ArrowRight size={13} />
                </span>
              </Link>
              <Link to="/projects">
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-sm bg-white/[0.06] hover:bg-white/[0.1] border border-border-subtle text-[13px] font-medium transition-colors">
                  View projects
                </span>
              </Link>
            </div>
          </div>
        </Card>

        {/* Today snapshot */}
        <Card padding="p-5">
          <CardHeader eyebrow="Today" title="Snapshot" />
          <div className="flex items-center gap-5">
            <ProgressRing
              size={92}
              strokeWidth={7}
              progress={Math.min(100, (focusMinutes / 180) * 100)}
              label={`${Math.round(focusMinutes / 60)}h`}
              sublabel="FOCUS"
            />
            <div className="space-y-2 text-[12px] flex-1">
              <Row label="Tasks done" value={completedToday} accent="emerald" />
              <Row label="Sessions" value={todaySessions.length} accent="blue" />
              <Row label="Habits" value={`${habitCompletionToday}/${habits.length}`} accent="purple" />
            </div>
          </div>
        </Card>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Output Score" value="84" unit="/100" delta={6.4} deltaLabel="vs last wk" icon={Activity} accent="#4a9eff" />
        <StatTile label="Deep Work" value={Math.round(focusMinutes/60)} unit="hrs" delta={12} deltaLabel="7d" icon={Clock} accent="#2ee5a6" />
        <StatTile label="Streak" value="22" unit="days" delta={3.1} deltaLabel="rolling" icon={Flame} accent="#ffb547" />
        <StatTile label="Velocity" value="2.4x" delta={-2.1} deltaLabel="vs avg" icon={Zap} accent="#a78bfa" />
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Up next */}
        <Card className="lg:col-span-2">
          <CardHeader
            eyebrow="Up next"
            title="Today's most important"
            action={<Link to="/projects" className="text-[11px] text-text-tertiary hover:text-text-secondary flex items-center gap-1">All <ArrowRight size={11} /></Link>}
          />
          <ul className="space-y-1.5">
            {upNext.map(t => {
              const project = projects.find(p => p.id === t.projectId)
              return (
                <li key={t.id} className="group flex items-center gap-3 h-12 px-3 -mx-3 rounded-sm hover:bg-white/[0.04] transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: project?.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-text-primary truncate">{t.title}</div>
                    <div className="text-[10px] text-text-tertiary mt-0.5 flex items-center gap-2">
                      <span>{project?.name}</span>
                      {t.dueDate && <><span>·</span><span>{relativeDate(t.dueDate)}</span></>}
                    </div>
                  </div>
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                  <Badge tone={statusTone[t.status]}>{t.status.replace('_',' ')}</Badge>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Weekly trend */}
        <Card>
          <CardHeader eyebrow="Last 7 days" title="Output & focus" />
          <div className="h-[180px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="outputG" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#4a9eff" />
                    <stop offset="100%" stopColor="#2ee5a6" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6e6e76' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6e6e76' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Line type="monotone" dataKey="output" stroke="url(#outputG)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="focus" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-text-tertiary mt-2">
            <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-accent-blue rounded" /> Output</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-accent-purple rounded" /> Focus hrs</span>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active projects */}
        <Card className="lg:col-span-2">
          <CardHeader
            eyebrow="Portfolio"
            title="Active projects"
            action={<Link to="/projects" className="text-[11px] text-text-tertiary hover:text-text-secondary flex items-center gap-1">Open <ArrowRight size={11} /></Link>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.slice(0, 4).map(p => {
              // Compute task counts from live state (user-created projects may not have a static taskCount field)
              const projectTasks = tasks.filter(t => t.projectId === p.id)
              const activeCount = projectTasks.filter(t => t.status !== 'done').length
              const doneCount = projectTasks.filter(t => t.status === 'done').length
              return (
                <div key={p.id} className="relative p-4 rounded-md bg-white/[0.025] border border-border-subtle hover:border-border transition-all duration-200 hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-[13px] font-medium text-text-primary truncate">{p.name}</span>
                    </div>
                    <Badge tone={statusTone[p.status]}>{p.status.replace('_',' ')}</Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="font-mono tnum text-2xl text-text-primary">{p.progress}%</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">
                        {activeCount} active · {doneCount} done
                      </div>
                    </div>
                    <ProgressRing size={44} strokeWidth={4} progress={p.progress} gradient={[p.color, '#2ee5a6']} />
                  </div>
                  <div className="h-1 mt-3 rounded-full overflow-hidden bg-white/[0.05]">
                    <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: `linear-gradient(90deg, ${p.color}, ${p.color}99)` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Goals + journal nudge */}
        <div className="space-y-5">
          <Card>
            <CardHeader eyebrow="Goals" title="Tracking" action={<Link to="/goals" className="text-[11px] text-text-tertiary hover:text-text-secondary">View</Link>} />
            <ul className="space-y-3">
              {goals.slice(0, 3).map(g => (
                <li key={g.id}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-secondary truncate">{g.name}</span>
                    <span className="font-mono tnum text-text-primary text-[11px]">{g.progress}%</span>
                  </div>
                  <div className="h-1 mt-1.5 rounded-full overflow-hidden bg-white/[0.05]">
                    <div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: g.status === 'behind' ? '#ff5e5e' : 'linear-gradient(90deg,#4a9eff,#2ee5a6)' }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader eyebrow="Reflect" title="Last journal" action={<Link to="/journal" className="text-[11px] text-text-tertiary hover:text-text-secondary">Open</Link>} />
            {journal[0] ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MoodDot mood={journal[0].mood} />
                  <span className="text-[11px] text-text-tertiary capitalize">{journal[0].mood} · energy {journal[0].energy}/10</span>
                </div>
                <p
                  className="text-[12.5px] text-text-secondary leading-relaxed line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: journal[0].body || '' }}
                />
                {(journal[0].decisions || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-text-quaternary mb-1.5">Open decision</div>
                    <div className="text-[12px] text-text-primary">{journal[0].decisions[0].text}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[12px] text-text-tertiary">No entries yet.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent }) {
  const color = { blue: '#4a9eff', emerald: '#2ee5a6', purple: '#a78bfa', amber: '#ffb547' }[accent] || '#4a9eff'
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-mono tnum text-text-primary text-[13px]" style={{ color }}>{value}</span>
    </div>
  )
}

function MoodDot({ mood }) {
  const map = { low: '#ff5e5e', okay: '#ffb547', good: '#4a9eff', great: '#2ee5a6', flow: '#a78bfa' }
  return <span className="w-2 h-2 rounded-full" style={{ background: map[mood] }} />
}
