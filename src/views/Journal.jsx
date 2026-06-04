import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, Save, Sparkles, FolderKanban, Target, CheckSquare } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useApp } from '../state/AppState'
import { cn, getTodayInTimezone } from '../lib/utils'

// Where each mention type lives, for click-through navigation.
const MENTION_ROUTES = { project: '/projects', goal: '/goals', task: '/projects' }
const MENTION_EMOJI = { project: '📁', goal: '🎯', task: '✓' }

const MOODS = [
  { id: 'low',   emoji: '🌧',  label: 'Low',   color: '#ff5e5e' },
  { id: 'okay',  emoji: '⛅',  label: 'Okay',  color: '#ffb547' },
  { id: 'good',  emoji: '☀️',  label: 'Good',  color: '#4a9eff' },
  { id: 'great', emoji: '✨',  label: 'Great', color: '#2ee5a6' },
  { id: 'flow',  emoji: '🌊',  label: 'Flow',  color: '#a78bfa' },
]

export default function Journal() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [activeDate, setActiveDate] = useState(getTodayInTimezone())

  // ── @-mention picker state ───────────────────────────────────────────
  // `mention` is null when closed, otherwise { items, index, top, left,
  // node, at, caretOffset } describing the active trigger.
  const [mention, setMention] = useState(null)
  const mentionRef = useRef(null)
  useEffect(() => { mentionRef.current = mention }, [mention])

  // Flat, searchable list of everything that can be linked.
  const mentionables = useMemo(() => {
    const projects = state.projects.map(p => ({ type: 'project', id: p.id, label: p.name }))
    const goals = state.goals.filter(g => !g.archived).map(g => ({ type: 'goal', id: g.id, label: g.name }))
    const tasks = state.tasks.map(t => ({ type: 'task', id: t.id, label: t.title }))
    return [...projects, ...goals, ...tasks]
  }, [state.projects, state.goals, state.tasks])

  const existing = state.journal.find(j => j.date === activeDate)
  const [draft, setDraft] = useState(() => existing ?? makeEmpty(activeDate))
  const [saveLabel, setSaveLabel] = useState('Saved')
  const editorRef = useRef(null)
  const saveTimer = useRef(null)
  const draftRef = useRef(draft)

  // ── Spell-check state ────────────────────────────────────────────────
  // The engine + dictionary (~540KB) is loaded lazily on first mount so it
  // never touches the initial bundle. `nativeSpell` stays true until our
  // custom checker is active, so unsupported browsers keep native squiggles.
  const spellRef = useRef(null)
  const spellTimer = useRef(null)
  const [nativeSpell, setNativeSpell] = useState(true)
  const [spellMenu, setSpellMenu] = useState(null) // right-click correction menu

  // Keep ref in sync so commit() always sees latest draft
  useEffect(() => { draftRef.current = draft }, [draft])

  // Load the spell-checker once, then run an initial pass.
  useEffect(() => {
    let cancelled = false
    import('../lib/spellcheck').then(mod => {
      if (cancelled) return
      spellRef.current = mod
      if (mod.isSupported()) {
        setNativeSpell(false) // hand off from native squiggles to ours
        mod.getSpeller() // warm up
        runSpellcheck()
      }
    }).catch(() => { /* keep native spellcheck on failure */ })
    return () => {
      cancelled = true
      clearTimeout(spellTimer.current)
      spellRef.current?.clearHighlights?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-scan the editor for misspellings (debounced).
  function runSpellcheck() {
    const mod = spellRef.current
    if (!mod || !mod.isSupported() || !editorRef.current) return
    clearTimeout(spellTimer.current)
    spellTimer.current = setTimeout(() => {
      mod.highlightEditor(editorRef.current)
    }, 300)
  }

  // Only reload editor when the date changes (NOT on every state.journal change —
  // that's what was causing the cursor to jump to the start while typing).
  useEffect(() => {
    const found = state.journal.find(j => j.date === activeDate)
    const loaded = found ?? makeEmpty(activeDate)
    setDraft(loaded)
    if (editorRef.current) editorRef.current.innerHTML = loaded.body || ''
    setSpellMenu(null)
    runSpellcheck() // re-check the freshly loaded entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate])

  // Track the latest pending patch so we can flush it on unmount/blur
  const pendingPatchRef = useRef(null)
  const activeDateRef = useRef(activeDate)
  useEffect(() => { activeDateRef.current = activeDate }, [activeDate])

  function flushSave() {
    if (!pendingPatchRef.current) return
    clearTimeout(saveTimer.current)
    const next = { ...draftRef.current, ...pendingPatchRef.current, date: activeDateRef.current }
    pendingPatchRef.current = null
    setDraft(next)
    dispatch({ type: 'journal.upsert', entry: next })
    setSaveLabel('Saved')
  }

  function commit(patch) {
    setSaveLabel('Saving…')
    // Merge with any pending patch so we don't lose earlier edits in a burst
    pendingPatchRef.current = { ...(pendingPatchRef.current || {}), ...patch }
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flushSave, 350)
  }

  // Flush any pending save when the date changes, the tab is hidden,
  // or the component unmounts — so the user never loses what they typed
  // even if they navigate away within the 350ms debounce window.
  useEffect(() => {
    function onHide() { if (document.hidden) flushSave() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flushSave)
    window.addEventListener('beforeunload', flushSave)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flushSave)
      window.removeEventListener('beforeunload', flushSave)
      flushSave() // flush on unmount (e.g., route change)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onEditorInput() {
    commit({ body: editorRef.current.innerHTML })
    detectMention()
    runSpellcheck()
  }

  // ── Spelling correction menu ─────────────────────────────────────────
  // Opens when a misspelled word is clicked (or right-clicked). The menu is
  // anchored just below the word so it doesn't sit under the pointer.
  function openSpellMenuAt(clientX, clientY) {
    const mod = spellRef.current
    if (!mod || !mod.isSupported()) return false
    const hit = mod.wordAtPoint(editorRef.current, clientX, clientY)
    if (!hit) return false
    const rect = hit.range.getBoundingClientRect()
    setSpellMenu({
      anchorLeft: rect.left, anchorTop: rect.top, anchorBottom: rect.bottom,
      word: hit.word, node: hit.node, start: hit.start, end: hit.end,
      suggestions: hit.suggestions,
    })
    return true
  }

  // After the menu renders, measure it and clamp inside the viewport —
  // shift left if it overflows the right edge, flip above the word if it
  // would run off the bottom.
  const spellMenuRef = useRef(null)
  useLayoutEffect(() => {
    if (!spellMenu || !spellMenuRef.current) return
    const el = spellMenuRef.current
    const { width, height } = el.getBoundingClientRect()
    const pad = 8
    let left = spellMenu.anchorLeft
    let top = spellMenu.anchorBottom + 4
    if (left + width > window.innerWidth - pad) left = window.innerWidth - width - pad
    if (left < pad) left = pad
    if (top + height > window.innerHeight - pad) {
      const above = spellMenu.anchorTop - height - 4
      top = above > pad ? above : Math.max(pad, window.innerHeight - height - pad)
    }
    el.style.left = `${left}px`
    el.style.top = `${top}px`
    el.style.visibility = 'visible'
  }, [spellMenu])

  function onEditorContextMenu(e) {
    // Only hijack the native menu when we actually hit a misspelled word.
    if (openSpellMenuAt(e.clientX, e.clientY)) e.preventDefault()
  }

  // Replace the misspelled word's range with the chosen text.
  function applySpellReplace(replacement) {
    const m = spellMenu
    if (!m) return
    const range = document.createRange()
    try {
      range.setStart(m.node, m.start)
      range.setEnd(m.node, m.end)
    } catch { setSpellMenu(null); return }
    range.deleteContents()
    const tn = document.createTextNode(replacement)
    range.insertNode(tn)
    const after = document.createRange()
    after.setStart(tn, tn.length)
    after.collapse(true)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(after)
    setSpellMenu(null)
    editorRef.current?.focus()
    onEditorInput()
  }

  function addWordToDictionary() {
    const mod = spellRef.current
    if (mod && spellMenu) mod.addToDictionary(spellMenu.word)
    setSpellMenu(null)
    runSpellcheck()
  }

  function ignoreSpellWord() {
    const mod = spellRef.current
    if (mod && spellMenu) mod.ignoreWord(spellMenu.word)
    setSpellMenu(null)
    runSpellcheck()
  }

  // Close the spelling menu on any outside interaction.
  useEffect(() => {
    if (!spellMenu) return
    function close(e) {
      if (!e.target.closest?.('[data-spell-menu]')) setSpellMenu(null)
    }
    function onKey(e) { if (e.key === 'Escape') setSpellMenu(null) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', () => setSpellMenu(null), true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [spellMenu])

  // Inspect the text just before the caret. If it looks like an in-progress
  // "@query" token, open the picker with matching items; otherwise close it.
  function detectMention() {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) { setMention(null); return }
    const range = sel.getRangeAt(0)
    const node = range.startContainer
    if (!range.collapsed || node.nodeType !== Node.TEXT_NODE) { setMention(null); return }
    // Make sure the caret is actually inside our editor
    if (!editorRef.current || !editorRef.current.contains(node)) { setMention(null); return }

    const upToCaret = node.textContent.slice(0, range.startOffset)
    const at = upToCaret.lastIndexOf('@')
    if (at === -1) { setMention(null); return }
    // The char before @ must be a boundary (start, space, or newline)
    const prev = at === 0 ? ' ' : upToCaret[at - 1]
    if (!/\s/.test(prev)) { setMention(null); return }
    const query = upToCaret.slice(at + 1)
    if (query.length > 40 || /[\n\t]/.test(query)) { setMention(null); return }

    const q = query.trim().toLowerCase()
    const items = mentionables
      .filter(m => !q || m.label.toLowerCase().includes(q))
      .slice(0, 7)
    if (items.length === 0) { setMention(null); return }

    // Position the popup just below the caret.
    const rect = range.getBoundingClientRect()
    const editorRect = editorRef.current.getBoundingClientRect()
    const top = (rect.bottom || editorRect.top) + 6
    const left = rect.left || editorRect.left
    setMention(prev => ({
      items, top, left, node, at, caretOffset: range.startOffset,
      index: prev && prev.index < items.length ? prev.index : 0,
    }))
  }

  // Replace the "@query" text with a non-editable chip linking the entity.
  function insertMention(item) {
    const ctx = mentionRef.current
    if (!ctx) return
    const range = document.createRange()
    try {
      range.setStart(ctx.node, ctx.at)
      range.setEnd(ctx.node, ctx.caretOffset)
    } catch { setMention(null); return }
    range.deleteContents()

    const chip = document.createElement('span')
    chip.className = 'mention'
    chip.contentEditable = 'false'
    chip.dataset.type = item.type
    chip.dataset.id = item.id
    chip.dataset.route = MENTION_ROUTES[item.type] || '/dashboard'
    chip.textContent = `${MENTION_EMOJI[item.type] || '🔗'} ${item.label}`
    range.insertNode(chip)

    // A trailing non-breaking space so the caret has somewhere to land.
    const space = document.createTextNode(' ')
    chip.after(space)
    const after = document.createRange()
    after.setStart(space, 1)
    after.collapse(true)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(after)

    setMention(null)
    editorRef.current?.focus()
    onEditorInput()
  }

  // Arrow/Enter/Escape navigation while the picker is open.
  function onEditorKeyDown(e) {
    const m = mentionRef.current
    if (!m) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setMention(p => ({ ...p, index: (p.index + 1) % p.items.length }))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setMention(p => ({ ...p, index: (p.index - 1 + p.items.length) % p.items.length }))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertMention(m.items[m.index])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setMention(null)
    }
  }

  // Clicking a chip jumps to the linked entity's view; clicking a misspelled
  // word opens its suggestion menu.
  function onEditorClick(e) {
    const chip = e.target.closest?.('.mention')
    if (chip && chip.dataset.route) {
      e.preventDefault()
      navigate(chip.dataset.route)
      return
    }
    openSpellMenuAt(e.clientX, e.clientY)
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

  function addDecision(text, reviewDate) {
    if (!text.trim()) return
    const decision = { text: text.trim(), status: 'open', reviewDate: reviewDate || undefined }
    const next = { ...draft, decisions: [...(draft.decisions || []), decision] }
    setDraft(next)
    dispatch({ type: 'journal.upsert', entry: { ...next, date: activeDate } })
  }

  function cycleDecisionStatus(idx) {
    // open → review → confirmed → open
    const order = ['open', 'review', 'confirmed']
    const decisions = (draft.decisions || []).map((d, i) => {
      if (i !== idx) return d
      const cur = d.status || 'open'
      const ni = (order.indexOf(cur) + 1) % order.length
      return { ...d, status: order[ni] }
    })
    const next = { ...draft, decisions }
    setDraft(next)
    dispatch({ type: 'journal.upsert', entry: { ...next, date: activeDate } })
  }

  function removeDecision(idx) {
    const next = { ...draft, decisions: (draft.decisions || []).filter((_, i) => i !== idx) }
    setDraft(next)
    dispatch({ type: 'journal.upsert', entry: { ...next, date: activeDate } })
  }

  const recentDates = useMemo(() => {
    const dates = new Set([getTodayInTimezone(), ...state.journal.map(j => j.date)])
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
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={onEditorInput}
              onKeyDown={onEditorKeyDown}
              onKeyUp={(e) => { if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') detectMention() }}
              onClick={onEditorClick}
              onContextMenu={onEditorContextMenu}
              onBlur={() => setTimeout(() => setMention(null), 150)}
              data-placeholder="What's on your mind? Type @ to link a project, goal, or task…"
              className="min-h-[240px] outline-none px-4 py-3 text-[16px] text-text-primary leading-[1.8] font-mono -tracking-[0.2px] [&_p]:mb-3 [&_p]:last:mb-0"
              suppressContentEditableWarning
              lang="en"
              spellCheck={nativeSpell}
              autoCorrect="on"
              autoCapitalize="sentences"
            />
            {mention && (
              <ul
                className="fixed z-50 w-72 max-h-64 overflow-y-auto rounded-md border border-border-subtle bg-bg-elevated shadow-2xl py-1"
                style={{ top: mention.top, left: mention.left }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {mention.items.map((item, i) => {
                  const Icon = item.type === 'project' ? FolderKanban : item.type === 'goal' ? Target : CheckSquare
                  return (
                    <li key={`${item.type}-${item.id}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setMention(p => ({ ...p, index: i }))}
                        onClick={() => insertMention(item)}
                        className={cn(
                          'w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px]',
                          i === mention.index ? 'bg-white/[0.07] text-text-primary' : 'text-text-secondary'
                        )}
                      >
                        <Icon size={13} className="shrink-0 text-text-tertiary" />
                        <span className="flex-1 truncate">{item.label}</span>
                        <span className="text-[9px] uppercase tracking-wider text-text-quaternary shrink-0">{item.type}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {spellMenu && createPortal(
              <div
                data-spell-menu
                ref={spellMenuRef}
                className="fixed z-[60] w-56 rounded-md border border-border-subtle bg-bg-elevated shadow-2xl py-1"
                style={{ top: spellMenu.anchorBottom + 4, left: spellMenu.anchorLeft, visibility: 'hidden' }}
              >
                {spellMenu.suggestions.length > 0 ? (
                  spellMenu.suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySpellReplace(s)}
                      className="w-full text-left px-3 py-1.5 text-[13px] text-text-primary hover:bg-white/[0.07]"
                    >{s}</button>
                  ))
                ) : (
                  <div className="px-3 py-1.5 text-[12px] text-text-quaternary italic">No suggestions</div>
                )}
                <div className="my-1 border-t border-border-subtle" />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addWordToDictionary}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-text-secondary hover:bg-white/[0.07]"
                >Add to dictionary</button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={ignoreSpellWord}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-text-secondary hover:bg-white/[0.07]"
                >Ignore</button>
              </div>,
              document.body
            )}
          </div>
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
          <ul className="space-y-2 mb-3">
            {(draft.decisions || []).map((d, i) => (
              <li key={i} className="group flex items-center gap-3 p-3 rounded-sm bg-white/[0.025] border border-border-subtle">
                <button
                  type="button"
                  onClick={() => cycleDecisionStatus(i)}
                  title="Click to cycle status (open → review → confirmed)"
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0 transition-colors',
                    d.status === 'confirmed' ? 'bg-accent-emerald' :
                    d.status === 'review' ? 'bg-accent-amber' :
                    'bg-text-quaternary'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-text-primary leading-[1.5] -tracking-[0.2px]">{d.text}</div>
                  {d.reviewDate && <div className="text-[10px] text-text-tertiary mt-0.5">Review by {d.reviewDate}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => cycleDecisionStatus(i)}
                  className="shrink-0"
                  title="Click to change status"
                >
                  <Badge tone={d.status === 'confirmed' ? 'emerald' : d.status === 'review' ? 'amber' : 'default'}>
                    {d.status || 'open'}
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => removeDecision(i)}
                  className="opacity-0 group-hover:opacity-100 text-text-quaternary hover:text-accent-red text-[14px] leading-none w-5 h-5 flex items-center justify-center"
                  title="Remove decision"
                >
                  ×
                </button>
              </li>
            ))}
            {(!draft.decisions || draft.decisions.length === 0) && (
              <li className="text-[12px] text-text-tertiary italic px-1">No open decisions logged for this day.</li>
            )}
          </ul>
          <DecisionForm onAdd={addDecision} />
          <p className="text-[10px] text-text-quaternary mt-2 leading-relaxed">
            Tip: click the status badge or the dot to cycle open → review → confirmed.
          </p>
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
          <li key={i} className="group flex items-center gap-2 text-[13px] text-text-secondary leading-[1.5] -tracking-[0.15px]">
            <span className="w-1 h-1 rounded-full bg-text-quaternary shrink-0 mt-0.5" />
            <span className="flex-1">{it}</span>
            <button
              onClick={() => onRemove(i)}
              className="opacity-0 group-hover:opacity-100 text-text-quaternary hover:text-accent-red text-[14px] leading-none shrink-0"
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
          spellCheck="true"
          autoCorrect="on"
          autoCapitalize="sentences"
          className="flex-1 h-9 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[13px] outline-none focus:border-border -tracking-[0.15px]"
        />
        <button type="submit" className="w-8 h-8 rounded-sm border border-border-subtle bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-text-secondary">
          <Plus size={12} />
        </button>
      </form>
    </Card>
  )
}

function DecisionForm({ onAdd }) {
  const [text, setText] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        onAdd(text, reviewDate)
        setText('')
        setReviewDate('')
      }}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's the decision? (e.g. Hire a junior dev for Liepngarm)"
        spellCheck="true"
        autoCorrect="on"
        autoCapitalize="sentences"
        className="flex-1 h-10 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[14px] outline-none focus:border-border -tracking-[0.2px]"
      />
      <input
        type="date"
        value={reviewDate}
        onChange={(e) => setReviewDate(e.target.value)}
        title="Optional review-by date"
        className="h-10 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[13px] text-text-secondary outline-none focus:border-border -tracking-[0.15px] sm:w-[160px]"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="h-9 px-4 rounded-sm bg-accent-blue text-white text-[12px] font-medium disabled:opacity-40 inline-flex items-center gap-1.5"
      >
        <Plus size={12} /> Add decision
      </button>
    </form>
  )
}

function makeEmpty(date) {
  return { date, mood: 'okay', energy: 6, body: '', wins: [], misses: [], lessons: [], decisions: [] }
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
