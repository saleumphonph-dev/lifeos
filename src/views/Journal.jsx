import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Plus, Save, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useApp } from '../state/AppState'
import { cn, todayISO } from '../lib/utils'

const MOODS = [
  { id: 'low',   emoji: '🌧',  label: 'Low',   color: '#ff5e5e' },
  { id: 'okay',  emoji: '⛅',  label: 'Okay',  color: '#ffb547' },
  { id: 'good',  emoji: '☀️',  label: 'Good',  color: '#4a9eff' },
  { id: 'great', emoji: '✨',  label: 'Great', color: '#2ee5a6' },
  { id: 'flow',  emoji: '🌊',  label: 'Flow',  color: '#a78bfa' },
]

export default function Journal() {
  const { state, dispatch } = useApp()
  const [activeDate, setActiveDate] = useState(todayISO())

  const existing = state.journal.find(j => j.date === activeDate)
  const [draft, setDraft] = useState(() => existing ?? makeEmpty(activeDate))
  const [saveLabel, setSaveLabel] = useState('Saved')
  const editorRef = useRef(null)
  const saveTimer = useRef(null)
  const draftRef = useRef(draft)

  // Keep ref in sync so commit() always sees latest draft
  useEffect(() => { draftRef.current = draft }, [draft])

  // Only reload editor when the date changes (NOT on every state.journal change —
  // that's what was causing the cursor to jump to the start while typing).
  useEffect(() => {
    const found = state.journal.find(j => j.date === activeDate)
    const loaded = found ?? makeEmpty(activeDate)
    setDraft(loaded)
    if (editorRef.current) editorRef.current.innerHTML = loaded.body || ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate])

  function commit(patch) {
    setSaveLabel('Saving…')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const next = { ...draftRef.current, ...patch, date: activeDate }
      setDraft(next)
      dispatch({ type: 'journal.upsert', entry: next })
      setSaveLabel('Saved')
    }, 350)
  }

  function onEditorInput() {
    commit({ body: editorRef.current.innerHTML })
  }

  function addArrayItem(field, value) {
    if (!value.trim()) return
    const next = { ...draft, [field]: [...(draft[field] || []), value.trim()] }
    setDraft(next)
    dispatch({ type: 'journal.upsert', entry: { ...next, date: activeDate } })
  }

  function removeArrayItem(field, idx) {
    const next = { ...draft, [field]: draft[field].filter((_, i) => i !== idx) }
    setDraft(next)
    dispatch({ type: 'journal.upsert', entry: { ...next, date: activeDate } })
  }

  const recentDates = useMemo(() => {
    const dates = new Set([todayISO(), ...state.journal.map(j => j.date)])
    return Array.from(dates).sort().reverse().slice(0, 14)
  }, [state.journal])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
      {/* Date rail */}
      <div className="space-y-3">
        <Card padding="p-4">
          <CardHeader eyebrow="Journal" title="Entries" />
          <ul className="space-y-1 max-h-[60vh] overflow-y-auto -mx-1 pr-1">
            {recentDates.map(d => {
              const entry = state.journal.find(j => j.date === d)
              const dt = new Date(d)
              const mood = entry?.mood
              const moodMeta = MOODS.find(m => m.id === mood)
              return (
                <li key={d}>
                  <button
                    onClick={() => setActiveDate(d)}
                    className={cn(
                      'w-full text-left px-2.5 h-12 rounded-sm flex items-center gap-3 transition-colors',
                      activeDate === d ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="text-center w-9 shrink-0">
                      <div className="font-mono text-[15px] text-text-primary leading-none">{dt.getDate()}</div>
                      <div className="text-[9px] uppercase tracking-wider text-text-tertiary mt-0.5">{dt.toLocaleDateString('en-US', { month: 'short' })}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-text-secondary truncate">
                        {entry ? stripHtml(entry.body).slice(0, 36) || 'Untitled' : 'No entry'}
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-0.5 capitalize">
                        {entry ? `${entry.mood} · energy ${entry.energy}` : '—'}
                      </div>
                    </div>
                    {moodMeta && (
                      <span className="w-2 h-2 rounded-full" style={{ background: moodMeta.color }} />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      {/* Editor */}
      <div className="space-y-5">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Today's reflection</div>
              <h1 className="font-display text-3xl text-text-primary mt-1">
                {new Date(activeDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
              <Save size={12} className={saveLabel === 'Saved' ? 'text-accent-emerald' : 'text-accent-amber'} />
              <span>{saveLabel}</span>
            </div>
          </div>

          {/* Mood */}
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium mb-2">Mood</div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => commit({ mood: m.id })}
                  className={cn(
                    'h-9 px-3 rounded-sm border text-[12px] flex items-center gap-2 transition-colors',
                    draft.mood === m.id
                      ? 'border-border bg-white/[0.06]'
                      : 'border-border-subtle hover:bg-white/[0.04]'
                  )}
                  style={draft.mood === m.id ? { boxShadow: `inset 0 0 0 1px ${m.color}40` } : undefined}
                >
                  <span className="text-base">{m.emoji}</span>
                  <span style={{ color: draft.mood === m.id ? m.color : undefined }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium mb-2">
              <span>Energy</span>
              <span className="font-mono text-text-primary text-[11px] tnum">{draft.energy}/10</span>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={draft.energy}
              onChange={(e) => commit({ energy: Number(e.target.value) })}
              className="w-full accent-accent-blue"
              style={{ accentColor: '#4a9eff' }}
            />
          </div>

          {/* Body */}
          <div
            ref={editorRef}
            contentEditable
            onInput={onEditorInput}
            data-placeholder="What's on your mind? What happened today?…"
            className="min-h-[200px] outline-none text-[14px] text-text-primary leading-relaxed font-serif [&_p]:mb-3"
            suppressContentEditableWarning
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ListPanel
            title="Wins"
            accent="emerald"
            items={draft.wins || []}
            placeholder="What went well?"
            onAdd={(v) => addArrayItem('wins', v)}
            onRemove={(i) => removeArrayItem('wins', i)}
          />
          <ListPanel
            title="Misses"
            accent="red"
            items={draft.misses || []}
            placeholder="What didn't?"
            onAdd={(v) => addArrayItem('misses', v)}
            onRemove={(i) => removeArrayItem('misses', i)}
          />
          <ListPanel
            title="Lessons"
            accent="blue"
            items={draft.lessons || []}
            placeholder="What did you learn?"
            onAdd={(v) => addArrayItem('lessons', v)}
            onRemove={(i) => removeArrayItem('lessons', i)}
          />
        </div>

        <Card>
          <CardHeader
            eyebrow="Open decisions"
            title="What you're deciding"
            action={<Badge tone="purple"><Sparkles size={9} className="mr-1" />Auto-resurface</Badge>}
          />
          <ul className="space-y-2">
            {(draft.decisions || []).map((d, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-sm bg-white/[0.025] border border-border-subtle">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  d.status === 'confirmed' ? 'bg-accent-emerald' :
                  d.status === 'review' ? 'bg-accent-amber' :
                  'bg-text-quaternary'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-text-primary">{d.text}</div>
                  {d.reviewDate && <div className="text-[10px] text-text-tertiary mt-0.5">Review by {d.reviewDate}</div>}
                </div>
                <Badge tone={d.status === 'confirmed' ? 'emerald' : d.status === 'review' ? 'amber' : 'default'}>
                  {d.status}
                </Badge>
              </li>
            ))}
            {(!draft.decisions || draft.decisions.length === 0) && (
              <li className="text-[12px] text-text-tertiary italic">No open decisions logged for this day.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function ListPanel({ title, accent, items, placeholder, onAdd, onRemove }) {
  const [v, setV] = useState('')
  const accentColor = { emerald: '#2ee5a6', red: '#ff5e5e', blue: '#4a9eff' }[accent]
  return (
    <Card padding="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
          <span className="text-[11px] uppercase tracking-[0.14em] text-text-secondary font-semibold">{title}</span>
        </div>
        <span className="font-mono text-[10px] text-text-quaternary">{items.length}</span>
      </div>
      <ul className="space-y-1.5 mb-3">
        {items.map((it, i) => (
          <li key={i} className="group flex items-center gap-2 text-[12.5px] text-text-secondary">
            <span className="w-1 h-1 rounded-full bg-text-quaternary" />
            <span className="flex-1">{it}</span>
            <button
              onClick={() => onRemove(i)}
              className="opacity-0 group-hover:opacity-100 text-text-quaternary hover:text-accent-red text-[14px] leading-none"
            >×</button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => { e.preventDefault(); onAdd(v); setV('') }}
        className="flex items-center gap-1.5"
      >
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-8 px-2.5 rounded-sm bg-white/[0.04] border border-border-subtle text-[12px] outline-none focus:border-border"
        />
        <button type="submit" className="w-8 h-8 rounded-sm border border-border-subtle bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-text-secondary">
          <Plus size={12} />
        </button>
      </form>
    </Card>
  )
}

function makeEmpty(date) {
  return { date, mood: 'okay', energy: 6, body: '', wins: [], misses: [], lessons: [], decisions: [] }
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
