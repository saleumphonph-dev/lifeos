import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Clock, Hash, TrendingUp, LayoutGrid, GitBranch, X, CheckSquare, FileText, Trash2, SquarePen } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge, priorityTone } from '../components/ui/Badge'
import { useApp } from '../state/AppState'
import { relativeDate, cn, getTodayInTimezone, uid } from '../lib/utils'

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     accent: '#6e6e76' },
  { id: 'in_progress', label: 'In Progress', accent: '#4a9eff' },
  { id: 'review',      label: 'Review',      accent: '#ffb547' },
  { id: 'done',        label: 'Done',        accent: '#2ee5a6' },
]

const PROJECT_COLORS = ['#4a9eff', '#2ee5a6', '#ffb547', '#a78bfa', '#ff7eb3', '#5eead4', '#ff5e5e']

export default function Projects() {
  const { state, dispatch } = useApp()
  const [view, setView] = useState('kanban') // 'kanban' | 'matrix'
  const [filterProject, setFilterProject] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#4a9eff')
  const [openTaskId, setOpenTaskId] = useState(null)

  const openTask = state.tasks.find(t => t.id === openTaskId) || null

  function handleAddProject(e) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    dispatch({ type: 'project.add', project: { name: newProjectName.trim(), color: newProjectColor } })
    setNewProjectName('')
    setAddingProject(false)
  }

  function handleRemoveProject(id, name) {
    if (confirm(`Remove project "${name}"? All its tasks will also be deleted.`)) {
      dispatch({ type: 'project.remove', id })
      if (filterProject === id) setFilterProject('all')
    }
  }

  function handleAddTaskToColumn(status) {
    const title = prompt('Task title:')
    if (!title?.trim()) return

    const dueDate = prompt('Due date (YYYY-MM-DD):', getTodayInTimezone())
    if (!dueDate?.trim()) return

    // Use the first project, or filtered project if one is active
    const projectId = filterProject !== 'all'
      ? filterProject
      : state.projects[0]?.id
    if (!projectId) {
      alert('Create a project first before adding tasks.')
      return
    }
    dispatch({ type: 'task.add', task: { title: title.trim(), status, projectId, dueDate: dueDate.trim() } })
  }

  function handleRemoveTask(id, title) {
    if (confirm(`Remove task "${title}"?`)) {
      dispatch({ type: 'task.remove', id })
      if (openTaskId === id) setOpenTaskId(null)
    }
  }

  const tasksFiltered = useMemo(() => {
    return state.tasks.filter(t => filterProject === 'all' || t.projectId === filterProject)
  }, [state.tasks, filterProject])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const tasksByStatus = useMemo(() => {
    const map = { backlog: [], in_progress: [], review: [], done: [] }
    tasksFiltered.forEach(t => map[t.status]?.push(t))
    return map
  }, [tasksFiltered])

  function onDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeTask = state.tasks.find(t => t.id === active.id)
    if (!activeTask) return

    // Dropped on a column id?
    const colId = COLUMNS.find(c => c.id === over.id)?.id
    if (colId && colId !== activeTask.status) {
      dispatch({ type: 'task.move', id: active.id, status: colId })
      return
    }
    // Dropped on another task → move into that task's column
    const overTask = state.tasks.find(t => t.id === over.id)
    if (overTask && overTask.status !== activeTask.status) {
      dispatch({ type: 'task.move', id: active.id, status: overTask.status })
    } else if (overTask) {
      dispatch({ type: 'task.reorder', sourceId: active.id, targetId: over.id })
    }
  }

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Workspace</div>
          <h1 className="font-display text-2xl text-text-primary mt-0.5">Project board</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="h-8 px-2.5 rounded-sm bg-white/[0.04] border border-border-subtle text-[12px] text-text-primary outline-none"
          >
            <option value="all">All projects</option>
            {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex rounded-sm border border-border-subtle overflow-hidden bg-white/[0.03]">
            <button
              onClick={() => setView('kanban')}
              className={cn('h-8 px-2.5 text-[11px] flex items-center gap-1.5', view === 'kanban' ? 'bg-white/[0.08] text-text-primary' : 'text-text-tertiary')}
            >
              <LayoutGrid size={11} /> Kanban
            </button>
            <button
              onClick={() => setView('matrix')}
              className={cn('h-8 px-2.5 text-[11px] flex items-center gap-1.5', view === 'matrix' ? 'bg-white/[0.08] text-text-primary' : 'text-text-tertiary')}
            >
              <GitBranch size={11} /> ICE Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Project chips */}
      <div className="flex flex-wrap gap-2 items-center">
        {state.projects.map(p => {
          const tasksFor = state.tasks.filter(t => t.projectId === p.id && t.status !== 'done').length
          return (
            <div key={p.id} className="relative group/chip">
              <button
                onClick={() => setFilterProject(filterProject === p.id ? 'all' : p.id)}
                className={cn(
                  'flex items-center gap-2 h-8 pl-3 pr-3 rounded-sm border text-[12px] transition-colors',
                  filterProject === p.id
                    ? 'bg-white/[0.08] border-border text-text-primary'
                    : 'bg-white/[0.03] border-border-subtle text-text-secondary hover:bg-white/[0.06]'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                {p.name}
                <span className="font-mono text-[10px] text-text-tertiary">{tasksFor}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveProject(p.id, p.name) }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-quaternary hover:text-accent-red hover:border-accent-red/50 opacity-0 group-hover/chip:opacity-100 transition-opacity"
                title="Remove project"
              >
                <X size={9} strokeWidth={2.5} />
              </button>
            </div>
          )
        })}

        {addingProject ? (
          <form onSubmit={handleAddProject} className="flex items-center gap-2 h-8 pl-2 pr-2 rounded-sm border border-border bg-white/[0.05]">
            <div className="flex gap-1">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewProjectColor(c)}
                  className={cn(
                    'w-4 h-4 rounded-full border transition-all',
                    newProjectColor === c ? 'border-white scale-110' : 'border-transparent'
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              spellCheck="true"
              autoCorrect="on"
              autoCapitalize="sentences"
              className="h-6 bg-transparent text-[12px] text-text-primary outline-none w-32"
            />
            <button type="submit" className="text-[11px] text-accent-blue hover:text-accent-emerald font-medium">Add</button>
            <button type="button" onClick={() => { setAddingProject(false); setNewProjectName('') }} className="text-text-quaternary hover:text-text-secondary">
              <X size={11} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAddingProject(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-sm border border-dashed border-border-subtle text-[12px] text-text-tertiary hover:bg-white/[0.04] hover:text-text-secondary transition-colors"
          >
            <Plus size={11} /> New project
          </button>
        )}
      </div>

      {view === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(col => (
              <Column
                key={col.id}
                column={col}
                tasks={tasksByStatus[col.id]}
                projects={state.projects}
                onAddTask={() => handleAddTaskToColumn(col.id)}
                onRemoveTask={handleRemoveTask}
                onOpenTask={setOpenTaskId}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <TaskCard task={state.tasks.find(t => t.id === activeId)} project={state.projects.find(p => p.id === state.tasks.find(t => t.id === activeId)?.projectId)} dragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <IceMatrix tasks={tasksFiltered} projects={state.projects} />
      )}

      <TaskDetail
        key={openTask?.id}
        task={openTask}
        projects={state.projects}
        dispatch={dispatch}
        onClose={() => setOpenTaskId(null)}
        onRemove={handleRemoveTask}
      />
    </div>
  )
}

function Column({ column, tasks, projects, onAddTask, onRemoveTask, onOpenTask }) {
  const { setNodeRef, isOver } = useSortable({ id: column.id, data: { type: 'column' } })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-md border border-border-subtle bg-white/[0.025] p-3 min-h-[380px] flex flex-col gap-2',
        isOver && 'border-border bg-white/[0.04]'
      )}
    >
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: column.accent }} />
          <span className="text-[11px] uppercase tracking-[0.14em] text-text-secondary font-semibold">{column.label}</span>
          <span className="font-mono text-[10px] text-text-quaternary">{tasks.length}</span>
        </div>
        <button
          onClick={onAddTask}
          className="w-5 h-5 rounded-sm hover:bg-white/[0.08] flex items-center justify-center text-text-tertiary hover:text-text-primary"
          title="Add task"
        >
          <Plus size={11} />
        </button>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 flex-1">
          {tasks.map(t => {
            const project = projects.find(p => p.id === t.projectId)
            return <SortableTask key={t.id} task={t} project={project} onRemove={onRemoveTask} onOpen={onOpenTask} />
          })}
          {tasks.length === 0 && (
            <div className="h-20 rounded-sm border border-dashed border-border-subtle flex items-center justify-center text-[11px] text-text-quaternary">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableTask({ task, project, onRemove, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  // Spread drag listeners on the wrapper, but the × button inside TaskCard
  // calls stopPropagation on pointerdown so it doesn't trigger a drag.
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} project={project} onRemove={onRemove} onOpen={onOpen} />
    </div>
  )
}

function TaskCard({ task, project, dragging, onRemove, onOpen }) {
  if (!task) return null
  const checklist = task.checklist || []
  const doneCount = checklist.filter(i => i.done).length
  return (
    <div
      // A plain click (no 6px drag) opens the task detail on pointer devices.
      // Touch taps can be swallowed by the drag listener, so the pencil button
      // below is the reliable way in on mobile.
      onClick={() => onOpen?.(task.id)}
      className={cn(
        'group relative p-3 rounded-sm bg-bg-elevated border border-border-subtle hover:border-border cursor-grab active:cursor-grabbing transition-colors select-none',
        dragging && 'shadow-2xl border-border bg-bg-elevated rotate-[2deg]'
      )}
    >
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 z-10">
        {onOpen && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onOpen(task.id) }}
            className="w-6 h-6 rounded-sm flex items-center justify-center text-text-quaternary hover:text-accent-blue hover:bg-white/[0.08] transition-colors"
            title="Notes & checklist"
          >
            <SquarePen size={11} />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            // Stop pointer down from bubbling to the drag listener
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(task.id, task.title)
            }}
            className="w-6 h-6 rounded-sm flex items-center justify-center text-text-quaternary hover:text-accent-red hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove task"
          >
            <X size={11} />
          </button>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 mb-2 pr-12">
        <p className="text-[14px] text-text-primary leading-[1.5] flex-1 -tracking-[0.2px]">{task.title}</p>
        <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: project?.color }} />
        <span className="text-[10px] text-text-tertiary truncate">{project?.name}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-text-tertiary font-mono tnum">
        <span className="flex items-center gap-1"><Clock size={9} /> {task.estimatedHours ?? 1}h</span>
        <span className="flex items-center gap-1"><TrendingUp size={9} /> ICE {(task.iceScore ?? 0).toFixed(1)}</span>
        {task.dueDate && <span className="ml-auto text-text-secondary">{relativeDate(task.dueDate)}</span>}
      </div>
      {(checklist.length > 0 || task.notes) && (
        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono tnum">
          {checklist.length > 0 && (
            <span className={cn('flex items-center gap-1', doneCount === checklist.length ? 'text-accent-emerald' : 'text-text-tertiary')}>
              <CheckSquare size={9} /> {doneCount}/{checklist.length}
            </span>
          )}
          {task.notes && <span className="flex items-center gap-1 text-text-tertiary"><FileText size={9} /> note</span>}
        </div>
      )}
      {task.tags?.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {task.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-text-tertiary flex items-center gap-0.5">
              <Hash size={8} />{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Click a card → notes + checklist for that task. Portaled to <body> because
// the route wrapper is transformed (framer-motion), which would otherwise
// make position:fixed resolve against it instead of the viewport.
function TaskDetail({ task, projects, dispatch, onClose, onRemove }) {
  const [title, setTitle] = useState(task?.title || '')
  const [notes, setNotes] = useState(task?.notes || '')
  const [newItem, setNewItem] = useState('')

  const checklist = task?.checklist || []
  const doneCount = checklist.filter(i => i.done).length
  const pct = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0

  // Debounced autosave for the free-text fields
  useEffect(() => {
    if (!task) return
    const t = setTimeout(() => {
      const patch = {}
      if (title.trim() && title !== task.title) patch.title = title.trim()
      if (notes !== (task.notes || '')) patch.notes = notes
      if (Object.keys(patch).length) dispatch({ type: 'task.update', id: task.id, patch })
    }, 400)
    return () => clearTimeout(t)
  }, [title, notes, task, dispatch])

  function close() {
    if (task) {
      const patch = {}
      if (title.trim() && title !== task.title) patch.title = title.trim()
      if (notes !== (task.notes || '')) patch.notes = notes
      if (Object.keys(patch).length) dispatch({ type: 'task.update', id: task.id, patch })
    }
    onClose()
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') close() }
    if (task) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!task) return null

  const update = (patch) => dispatch({ type: 'task.update', id: task.id, patch })
  const setChecklist = (next) => update({ checklist: next })

  function addItem(e) {
    e.preventDefault()
    const text = newItem.trim()
    if (!text) return
    setChecklist([...checklist, { id: uid(), text, done: false }])
    setNewItem('')
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-start justify-center px-4 py-[6vh] overflow-y-auto"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={close}
      >
        <div className="absolute inset-0 bg-bg-deep/70 backdrop-blur-md" />
        <motion.div
          className="relative w-full max-w-lg glass rounded-md border border-border-subtle shadow-2xl p-5 my-auto"
          initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium mb-1">Task</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                spellCheck="true" autoCapitalize="sentences"
                className="w-full bg-transparent text-[17px] font-semibold text-text-primary outline-none -tracking-[0.2px]"
              />
            </div>
            <button onClick={close} className="w-7 h-7 rounded-sm hover:bg-white/[0.06] flex items-center justify-center text-text-tertiary shrink-0">
              <X size={14} />
            </button>
          </div>

          {/* Stage */}
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium mb-1.5">Stage</div>
          <div className="flex items-center gap-1 p-1 rounded-sm bg-white/[0.03] border border-border-subtle mb-4">
            {COLUMNS.map(c => (
              <button
                key={c.id}
                onClick={() => dispatch({ type: 'task.move', id: task.id, status: c.id })}
                className={cn(
                  'flex-1 h-7 rounded-[6px] text-[11px] flex items-center justify-center gap-1.5',
                  task.status === c.id ? 'bg-white/[0.08] text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} />
                {c.label}
              </button>
            ))}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Field label="Project">
              <select value={task.projectId || ''} onChange={(e) => update({ projectId: e.target.value })} className="tdselect">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" value={task.dueDate || ''} onChange={(e) => update({ dueDate: e.target.value })} className="tdselect" />
            </Field>
            <Field label="Priority">
              <select value={task.priority || 'P2'} onChange={(e) => update({ priority: e.target.value })} className="tdselect">
                <option value="P0">P0 — Urgent</option>
                <option value="P1">P1 — High</option>
                <option value="P2">P2 — Medium</option>
                <option value="P3">P3 — Low</option>
              </select>
            </Field>
            <Field label="Est. hours">
              <input type="number" min="0.5" step="0.5" value={task.estimatedHours ?? 1} onChange={(e) => update({ estimatedHours: Number(e.target.value) })} className="tdselect" />
            </Field>
          </div>

          {/* Checklist */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Checklist</div>
            {checklist.length > 0 && (
              <div className="font-mono text-[10px] text-text-tertiary tnum">{doneCount}/{checklist.length} · {pct}%</div>
            )}
          </div>
          {checklist.length > 0 && (
            <div className="h-1 rounded-full overflow-hidden bg-white/[0.05] mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#4a9eff,#2ee5a6)' }} />
            </div>
          )}
          <ul className="space-y-1 mb-2">
            {checklist.map(item => (
              <li key={item.id} className="group flex items-center gap-2.5">
                <button
                  onClick={() => setChecklist(checklist.map(i => (i.id === item.id ? { ...i, done: !i.done } : i)))}
                  className={cn(
                    'w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors',
                    item.done ? 'bg-accent-emerald/20 border-accent-emerald/50 text-accent-emerald' : 'border-border-subtle text-transparent hover:border-accent-emerald/40'
                  )}
                >
                  <CheckSquare size={11} strokeWidth={3} />
                </button>
                <input
                  defaultValue={item.text}
                  onBlur={(e) => {
                    const text = e.target.value.trim()
                    if (text && text !== item.text) setChecklist(checklist.map(i => (i.id === item.id ? { ...i, text } : i)))
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                  spellCheck="true" autoCapitalize="sentences"
                  className={cn(
                    'flex-1 bg-transparent text-[13px] outline-none leading-[1.5]',
                    item.done ? 'text-text-tertiary line-through' : 'text-text-secondary'
                  )}
                />
                <button
                  onClick={() => setChecklist(checklist.filter(i => i.id !== item.id))}
                  className="opacity-0 group-hover:opacity-100 text-text-quaternary hover:text-accent-red transition-opacity shrink-0"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={addItem} className="flex items-center gap-2 mb-4">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add a step…"
              spellCheck="true" autoCapitalize="sentences"
              className="flex-1 h-8 px-2.5 rounded-sm bg-white/[0.03] border border-border-subtle text-[12.5px] text-text-primary outline-none focus:border-border placeholder:text-text-quaternary"
            />
            <button type="submit" className="w-8 h-8 rounded-sm border border-border-subtle bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-text-secondary shrink-0">
              <Plus size={13} />
            </button>
          </form>

          {/* Notes */}
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium mb-1.5">Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Context, decisions, links, what's blocking…"
            spellCheck="true" autoCapitalize="sentences"
            className="w-full resize-y rounded-sm bg-white/[0.03] border border-border-subtle p-3 text-[13px] text-text-secondary leading-[1.6] outline-none focus:border-border placeholder:text-text-quaternary"
          />

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => onRemove(task.id, task.title)}
              className="h-8 px-3 rounded-sm text-[12px] text-text-tertiary hover:text-accent-red hover:bg-white/[0.04] flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={12} /> Delete task
            </button>
            <button onClick={close} className="h-8 px-4 rounded-sm bg-white/[0.06] hover:bg-white/[0.1] border border-border-subtle text-[12px] font-medium text-text-primary">
              Done
            </button>
          </div>

          <style>{`.tdselect { width:100%; height:34px; padding:0 9px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:8px; color:#f5f5f7; font-size:12px; outline:none; }`}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
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

function IceMatrix({ tasks, projects }) {
  // 2D plot: x = ICE, y = priority weight (P0=4,P1=3,P2=2,P3=1)
  const prMap = { P0: 4, P1: 3, P2: 2, P3: 1 }
  return (
    <Card>
      <CardHeader eyebrow="Decide" title="ICE × Priority matrix" />
      <div className="relative h-[440px] rounded-sm border border-border-subtle bg-bg-deep/40 overflow-hidden">
        {/* Quadrant labels */}
        <div className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.16em] text-text-quaternary">High effort · Low priority</div>
        <div className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.16em] text-accent-emerald">★ Do first</div>
        <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.16em] text-text-quaternary">Drop</div>
        <div className="absolute bottom-3 right-3 text-[10px] uppercase tracking-[0.16em] text-text-quaternary">Schedule</div>

        {/* Axes */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border-subtle" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-border-subtle" />

        {tasks.filter(t => t.status !== 'done').map(t => {
          const project = projects.find(p => p.id === t.projectId)
          const x = (t.iceScore / 10) * 100
          const y = 100 - (prMap[t.priority] / 4) * 100
          return (
            <div
              key={t.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className="w-3 h-3 rounded-full ring-2 ring-bg-base"
                style={{ background: project?.color }}
              />
              <div className="absolute left-1/2 -translate-x-1/2 top-5 whitespace-nowrap px-2 py-1 rounded bg-bg-elevated border border-border-subtle text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="text-text-primary">{t.title}</div>
                <div className="text-text-tertiary font-mono">{t.priority} · ICE {t.iceScore.toFixed(1)}</div>
              </div>
            </div>
          )
        })}

        <div className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[9px] uppercase tracking-[0.16em] text-text-quaternary font-mono">ICE →</div>
        <div className="absolute top-1/2 -translate-y-1/2 left-1 text-[9px] uppercase tracking-[0.16em] text-text-quaternary font-mono [writing-mode:vertical-rl] rotate-180">↑ Priority</div>
      </div>
    </Card>
  )
}
