import { useMemo, useState } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Clock, Hash, TrendingUp, LayoutGrid, GitBranch } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge, priorityTone } from '../components/ui/Badge'
import { useApp } from '../state/AppState'
import { relativeDate, cn } from '../lib/utils'

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     accent: '#6e6e76' },
  { id: 'in_progress', label: 'In Progress', accent: '#4a9eff' },
  { id: 'review',      label: 'Review',      accent: '#ffb547' },
  { id: 'done',        label: 'Done',        accent: '#2ee5a6' },
]

export function Projects() {
  const { state, dispatch } = useApp()
  const [view, setView] = useState('kanban') // 'kanban' | 'matrix'
  const [filterProject, setFilterProject] = useState('all')
  const [activeId, setActiveId] = useState(null)

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
      <div className="flex flex-wrap gap-2">
        {state.projects.map(p => {
          const tasksFor = state.tasks.filter(t => t.projectId === p.id && t.status !== 'done').length
          return (
            <button
              key={p.id}
              onClick={() => setFilterProject(filterProject === p.id ? 'all' : p.id)}
              className={cn(
                'flex items-center gap-2 h-8 px-3 rounded-sm border text-[12px] transition-colors',
                filterProject === p.id
                  ? 'bg-white/[0.08] border-border text-text-primary'
                  : 'bg-white/[0.03] border-border-subtle text-text-secondary hover:bg-white/[0.06]'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
              {p.name}
              <span className="font-mono text-[10px] text-text-tertiary">{tasksFor}</span>
            </button>
          )
        })}
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
              <Column key={col.id} column={col} tasks={tasksByStatus[col.id]} projects={state.projects} />
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
    </div>
  )
}

function Column({ column, tasks, projects }) {
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
        <button className="w-5 h-5 rounded-sm hover:bg-white/[0.08] flex items-center justify-center text-text-tertiary"><Plus size={11} /></button>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 flex-1">
          {tasks.map(t => {
            const project = projects.find(p => p.id === t.projectId)
            return <SortableTask key={t.id} task={t} project={project} />
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

function SortableTask({ task, project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} project={project} />
    </div>
  )
}

function TaskCard({ task, project, dragging }) {
  if (!task) return null
  return (
    <div
      className={cn(
        'group p-3 rounded-sm bg-bg-elevated border border-border-subtle hover:border-border cursor-grab active:cursor-grabbing transition-colors',
        dragging && 'shadow-2xl border-border bg-bg-elevated rotate-[2deg]'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[13px] text-text-primary leading-snug flex-1">{task.title}</p>
        <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: project?.color }} />
        <span className="text-[10px] text-text-tertiary truncate">{project?.name}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-text-tertiary font-mono tnum">
        <span className="flex items-center gap-1"><Clock size={9} /> {task.estimatedHours}h</span>
        <span className="flex items-center gap-1"><TrendingUp size={9} /> ICE {task.iceScore.toFixed(1)}</span>
        {task.dueDate && <span className="ml-auto text-text-secondary">{relativeDate(task.dueDate)}</span>}
      </div>
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
