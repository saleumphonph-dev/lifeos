import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, ArrowRight } from 'lucide-react'
import { NAV } from './Sidebar'
import { useApp } from '../../state/AppState'

export function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const inputRef = useRef(null)
  const { state } = useApp()

  useEffect(() => {
    if (open) {
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    function key(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])

  const lower = q.toLowerCase()
  const navMatches = NAV.filter(n => !lower || n.label.toLowerCase().includes(lower))
  const projMatches = state.projects.filter(p => !lower || p.name.toLowerCase().includes(lower)).slice(0, 5)
  const taskMatches = state.tasks.filter(t => !lower || t.title.toLowerCase().includes(lower)).slice(0, 5)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-bg-deep/70 backdrop-blur-md" />
          <motion.div
            className="relative w-full max-w-xl glass rounded-md border border-border-subtle overflow-hidden shadow-2xl"
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 h-12 border-b border-border-subtle">
              <Search size={14} className="text-text-tertiary" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search views, projects, tasks…"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="off"
                className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-quaternary outline-none"
              />
              <kbd className="text-[10px] font-mono text-text-tertiary px-1.5 py-0.5 rounded bg-white/[0.06]">esc</kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              <Section title="Navigate" />
              {navMatches.map((n) => (
                <Row
                  key={n.to}
                  icon={<n.icon size={14} />}
                  label={n.label}
                  sub={n.to}
                  hint={n.shortcut}
                  onClick={() => { nav(n.to); onClose() }}
                />
              ))}
              {projMatches.length > 0 && <Section title="Projects" />}
              {projMatches.map((p) => (
                <Row
                  key={p.id}
                  icon={<span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />}
                  label={p.name}
                  sub={`${p.progress}% complete`}
                  onClick={() => { nav('/projects'); onClose() }}
                />
              ))}
              {taskMatches.length > 0 && <Section title="Tasks" />}
              {taskMatches.map((t) => (
                <Row
                  key={t.id}
                  icon={<span className="text-[10px] font-mono text-text-tertiary">{t.priority}</span>}
                  label={t.title}
                  sub={t.status}
                  onClick={() => { nav('/projects'); onClose() }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Section({ title }) {
  return <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-text-quaternary font-medium">{title}</div>
}

function Row({ icon, label, sub, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 h-10 hover:bg-white/[0.04] text-left group"
    >
      <div className="w-6 h-6 rounded-sm bg-white/[0.04] flex items-center justify-center text-text-secondary">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-primary truncate">{label}</div>
        {sub && <div className="text-[10px] text-text-tertiary truncate">{sub}</div>}
      </div>
      {hint && <kbd className="text-[10px] font-mono text-text-tertiary px-1.5 py-0.5 rounded bg-white/[0.06]">{hint}</kbd>}
      <ArrowRight size={12} className="text-text-quaternary opacity-0 group-hover:opacity-100 transition" />
    </button>
  )
}
