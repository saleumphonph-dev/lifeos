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
import { relativeDate, getTodayInTimezone } from '../lib/utils'

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

  const todayStr = getTodayInTimezone()
  const todaySessions = focusSessions.filter(s => (s.date || s.startedAt || '').slice(0, 10) === todayStr)
  const focusMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const completedToday = tasks.filter(t => t.status === 'done' && (t.completedAt || '').slice(0, 10) === todayStr).length
  const activeTasks = tasks.filter(t => t.status === 'in_progress')
  const openTaskCount = tasks.filter(t => t.status !== 'done').length
  const upNext = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    .slice(0, 5)

  // --- Real KPI computations (replacing previous hardcoded demo numbers) ---
  // Output Score: % of all tasks completed (capped 0-100)
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const outputScore = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Deep Work hours over last 7 days
  const weekAgoMs = Date.now() - 7 * 86400000
  const weekFocusMinutes = focusSessions
    .filter(s => {
      const ts = new Date(s.date || s.startedAt || 0).getTime()
      return ts >= weekAgoMs
    })
    .reduce((sum, s) => sum + (s.duration || 0), 0)
  const deepWorkHours = Math.round(weekFocusMinutes / 60)

  // Streak: longest current streak across all habits
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0)

  // Velocity: tasks completed this week
  const tasksThisWeek = tasks.filter(t => {
    if (t.status !== 'done' || !t.completedAt) return false
    return new Date(t.completedAt).getTime() >= weekAgoMs
  }).length

  // Real weekly trend computed from tasks completed + focus minutes per day
  const weeklyTrend = useMemo(() => {
    const days = []
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const output = tasks.filter(t => t.status === 'done' && (t.completedAt || '').slice(0, 10) === iso).length
      const focusMin = focusSessions
        .filter(s => (s.date || s.startedAt || '').slice(0, 10) === iso)
        .reduce((sum, s) => sum + (s.duration || 0), 0)
      days.push({ day: dayLabels[d.getDay()], output, focus: Math.round(focusMin / 60) })
    }
    return days
  }, [tasks, focusSessions])

  const habitCompletionToday = habits.filter(h => {
    const today = getTodayInTimezone()
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
              <span className="text-text-secondary">
                {openTaskCount > 0
                  ? `${openTaskCount} ${openTaskCount === 1 ? 'task' : 'tasks'} open today.`
                  : 'A clean slate. Plan something great.'}
              </span>
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

      {/* KPI strip — all metrics computed from real state */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Output Score" value={outputScore} unit="/100" deltaLabel={`${doneTasks}/${totalTasks} tasks done`} icon={Activity} accent="#4a9eff" />
        <StatTile label="Deep Work" value={deepWorkHours} unit="hrs" deltaLabel="last 7 days" icon={Clock} accent="#2ee5a6" />
        <StatTile label="Streak" value={longestStreak} unit={longestStreak === 1 ? 'day' : 'days'} deltaLabel="best habit" icon={Flame} accent="#ffb547" />
        <StatTile label="Velocity" value={tasksThisWeek} unit={tasksThisWeek === 1 ? 'task' : 'tasks'} deltaLabel="completed this wk" icon={Zap} accent="#a78bfa" />
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
                    <div className="text-[14px] text-text-primary truncate leading-[1.4] -tracking-[0.2px]">{t.title}</div>
                    <div className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-2 leading-[1.3]">
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
                      <span className="text-[14px] font-medium text-text-primary truncate leading-[1.4] -tracking-[0.2px]">{p.name}</span>
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
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-text-secondary truncate leading-[1.4] -tracking-[0.15px]">{g.name}</span>
                    <span className="font-mono tnum text-text-primary text-[12px]">{g.progress}%</span>
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
                  className="text-[13px] text-text-secondary leading-[1.6] line-clamp-3 -tracking-[0.15px]"
                  dangerouslySetInnerHTML={{ __html: journal[0].body || '' }}
                />
                {(journal[0].decisions || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-text-quaternary mb-1.5">Open decision</div>
                    <div className="text-[13px] text-text-primary leading-[1.5] -tracking-[0.15px]">{journal[0].decisions[0].text}</div>
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
