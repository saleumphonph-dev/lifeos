import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '../ui/Button'
import { useApp } from '../../state/AppState'
import { getTodayInTimezone } from '../../lib/utils'

export function NewTaskModal({ open, onClose }) {
  const { state, dispatch } = useApp()
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? '')
  const [priority, setPriority] = useState('P2')
  const [hours, setHours] = useState(2)
  const [dueDate, setDueDate] = useState(getTodayInTimezone())
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTitle(''); setPriority('P2'); setHours(2); setDueDate(getTodayInTimezone())
      setProjectId(state.projects[0]?.id ?? '')
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open, state.projects])

  useEffect(() => {
    function k(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  function submit(e) {
    e?.preventDefault()
    if (!title.trim()) return
    dispatch({
      type: 'task.add',
      task: { title: title.trim(), projectId, priority, estimatedHours: Number(hours), status: 'backlog', iceScore: 6, tags: [], dueDate },
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-bg-deep/70 backdrop-blur-md" />
          <motion.form
            onSubmit={submit}
            className="relative w-full max-w-md glass rounded-md border border-border-subtle p-5 shadow-2xl"
            initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">New task</div>
                <div className="font-display text-xl text-text-primary mt-1">What needs done?</div>
              </div>
              <button type="button" onClick={onClose} className="w-7 h-7 rounded-sm hover:bg-white/[0.06] flex items-center justify-center text-text-tertiary">
                <X size={14} />
              </button>
            </div>

            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title…"
              spellCheck="true"
              autoCorrect="on"
              autoCapitalize="sentences"
              className="w-full h-11 px-3 rounded-sm bg-white/[0.04] border border-border-subtle text-[14px] text-text-primary placeholder:text-text-quaternary outline-none focus:border-accent-blue/40"
            />

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Field label="Project">
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="select">
                  {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Due date">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="select" />
              </Field>
              <Field label="Priority">
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="select">
                  <option value="P0">P0 — Urgent</option>
                  <option value="P1">P1 — High</option>
                  <option value="P2">P2 — Medium</option>
                  <option value="P3">P3 — Low</option>
                </select>
              </Field>
              <Field label="Est. hours">
                <input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} className="select" />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary">Create task</Button>
            </div>

            <style>{`.select { width:100%; height:36px; padding:0 10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:8px; color:#f5f5f7; font-size:12px; outline:none; }`}</style>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium mb-1">{label}</div>
      {children}
    </label>
  )
}
