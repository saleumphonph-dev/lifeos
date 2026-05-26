import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, Send, Loader2, Wand2, Brain, Target, Calendar } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { useApp } from '../state/AppState'
import { cn } from '../lib/utils'

const SUGGESTIONS = [
  { icon: Wand2,   prompt: 'Plan my next 90 minutes for maximum output.' },
  { icon: Brain,   prompt: 'Summarize what I worked on this week and what slipped.' },
  { icon: Target,  prompt: 'Which goal needs the most attention right now?' },
  { icon: Calendar, prompt: 'Suggest a focus block schedule for tomorrow.' },
]

export default function AIAssistant() {
  const { state } = useApp()
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', text: `Morning, ${state.user.name}. I've reviewed your last 7 days — energy is trending up, café project is the weakest link.` },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const insights = useMemo(() => buildInsights(state), [state])

  function send(text) {
    const t = (text ?? input).trim()
    if (!t) return
    setMessages(m => [...m, { role: 'user', text: t }])
    setInput('')
    setBusy(true)
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', text: mockReply(t, state) }])
      setBusy(false)
    }, 700 + Math.random() * 500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 h-[calc(100vh-13rem)]">
      {/* Chat */}
      <Card padding="p-0" className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-text-primary">Productivity assistant</div>
              <div className="text-[11px] text-text-tertiary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                Online · uses your local data
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] rounded-md px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                m.role === 'user'
                  ? 'bg-accent-blue/15 text-text-primary border border-accent-blue/30'
                  : 'bg-white/[0.04] text-text-secondary border border-border-subtle'
              )}>
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex">
              <div className="bg-white/[0.04] border border-border-subtle rounded-md px-3.5 py-2.5 flex items-center gap-2 text-[12px] text-text-tertiary">
                <Loader2 size={12} className="animate-spin" /> thinking…
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border-subtle p-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s.prompt)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-sm bg-white/[0.04] hover:bg-white/[0.08] border border-border-subtle text-[11px] text-text-secondary transition-colors"
              >
                <s.icon size={11} />
                {s.prompt}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your work…"
              className="flex-1 h-10 px-3.5 rounded-sm bg-white/[0.04] border border-border-subtle text-[13px] outline-none focus:border-accent-blue/40"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="h-10 w-10 rounded-sm bg-accent-blue/90 hover:bg-accent-blue disabled:opacity-40 text-white flex items-center justify-center transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </Card>

      {/* Side: insights */}
      <div className="space-y-4 overflow-y-auto">
        <Card>
          <CardHeader eyebrow="Insights" title="From your data" />
          <ul className="space-y-3">
            {insights.map((it, i) => (
              <li key={i} className="p-3 rounded-sm bg-white/[0.025] border border-border-subtle">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: it.color }} />
                  <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">{it.eyebrow}</div>
                </div>
                <div className="text-[12.5px] text-text-primary leading-snug">{it.body}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader eyebrow="Suggested action" title="Right now" />
          <p className="text-[13px] text-text-secondary leading-relaxed">
            You have <span className="text-accent-blue font-medium">{state.tasks.filter(t => t.priority === 'P0' && t.status !== 'done').length} P0 tasks</span> open. Start a 50-min focus block on{' '}
            <span className="text-text-primary">{state.tasks.find(t => t.priority === 'P0' && t.status !== 'done')?.title ?? '—'}</span>.
          </p>
          <button
            onClick={() => send('Start a 50/10 focus block on my top P0 task.')}
            className="w-full mt-3 h-9 rounded-sm bg-gradient-to-r from-accent-blue to-accent-emerald text-bg-base font-semibold text-[12px]"
          >
            Apply suggestion
          </button>
        </Card>
      </div>
    </div>
  )
}

function buildInsights(state) {
  const p0Open = state.tasks.filter(t => t.priority === 'P0' && t.status !== 'done').length
  const totalFocus = (state.focusSessions.reduce((s, x) => s + x.duration, 0) / 60).toFixed(1)
  const cafe = state.projects.find(p => p.id === 'p-cafe')
  return [
    { eyebrow: 'Workload', body: `${p0Open} P0 tasks in progress. Don't open a P1 until at least 2 of these clear.`, color: '#ff5e5e' },
    { eyebrow: 'Focus', body: `${totalFocus} hrs of deep work logged — well above your monthly avg.`, color: '#4a9eff' },
    { eyebrow: 'Watch', body: `${cafe?.name} is at ${cafe?.progress}% with health ${cafe?.healthScore}. Decide this week.`, color: '#ffb547' },
    { eyebrow: 'Pattern', body: `Tuesdays + Thursdays are your highest output days. Defend them.`, color: '#2ee5a6' },
  ]
}

function mockReply(prompt, state) {
  const lower = prompt.toLowerCase()
  if (lower.includes('90 minute') || lower.includes('next')) {
    return `Run a 50/10/50/10 split. Block 1: ${state.tasks.find(t => t.status !== 'done')?.title}. Block 2: review the Real Estate deck financials. Phone in another room, Slack closed.`
  }
  if (lower.includes('summarize') || lower.includes('week')) {
    return `Last 7d: ${state.focusSessions.filter(s => Date.now() - new Date(s.startedAt) < 7*864e5).length} sessions, output score 84 (+6%). UN ADCO and LANI capsule moved meaningfully. Café slipped.`
  }
  if (lower.includes('goal')) {
    const behind = state.goals.find(g => g.status === 'behind')
    return behind ? `"${behind.name}" is behind. It's blocked by the same supplier delay as Café Expansion — consider parallelizing instead of waiting.` : `Goals look healthy. Nothing in the red.`
  }
  if (lower.includes('schedule') || lower.includes('tomorrow')) {
    return `Tomorrow blueprint — 6:30am workout, 7:30 review, 8–10 deep block on Real Estate deck, 10:15–12:15 LANI capsule, 14–16 investment thesis memo, 16:30 admin batch (capped at 45m).`
  }
  return `I parsed "${prompt}". On your current state — ${state.tasks.filter(t => t.status === 'in_progress').length} active threads, ${state.goals.filter(g => g.status === 'on_track').length} goals on track. What slice would you like to drill into?`
}
