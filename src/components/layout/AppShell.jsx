import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar, NAV } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileTabBar } from './MobileTabBar'
import { CommandPalette } from './CommandPalette'
import { NewTaskModal } from './NewTaskModal'

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const isFocus = location.pathname.startsWith('/focus')

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)

  // Context-aware "New": on Goals/Habits/Projects, trigger that view's own
  // add flow (via a ?new=1 signal the view reads); elsewhere, a new task.
  function handleNew() {
    const p = location.pathname
    if (p.startsWith('/goals')) navigate('/goals?new=1')
    else if (p.startsWith('/habits')) navigate('/habits?new=1')
    else setTaskOpen(true) // Projects, Dashboard, etc. → new task
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      const tag = (e.target?.tagName || '').toLowerCase()
      const editing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable
      // ⌘K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (editing) return
      // N — new task
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setTaskOpen(true)
        return
      }
      // 1-9 — switch views
      if (/^[1-9]$/.test(e.key)) {
        const target = NAV[Number(e.key) - 1]
        if (target) navigate(target.to)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  if (isFocus) {
    // Full-screen Focus mode
    return (
      <div className="min-h-screen bg-bg-base text-text-primary ambient-shell">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-bg-base text-text-primary ambient-shell">
      <Sidebar onSearch={() => setPaletteOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar onCommand={() => setPaletteOpen(true)} onNewTask={handleNew} />

        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="p-5 lg:p-7 lg:pb-7 max-w-[1600px] mx-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileTabBar onNew={handleNew} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NewTaskModal open={taskOpen} onClose={() => setTaskOpen(false)} />
    </div>
  )
}
