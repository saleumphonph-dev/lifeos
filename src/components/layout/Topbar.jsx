import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Plus, Command, Settings, Trash2, RotateCcw, LogOut } from 'lucide-react'
import { NAV } from './Sidebar'
import { useApp } from '../../state/AppState'
import { isSupabaseReady } from '../../lib/supabase'
import { signOut } from '../../lib/sync'

export function Topbar({ onCommand, onNewTask }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const current = NAV.find((n) => pathname.startsWith(n.to))
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  function clearAllData() {
    if (confirm('Clear ALL data?\n\nThis removes every project, task, goal, habit, journal entry, and focus session — so you can start logging your real daily life.\n\nThis cannot be undone.')) {
      dispatch({ type: 'state.clear' })
      setMenuOpen(false)
    }
  }

  function resetToDemo() {
    if (confirm('Reset to demo data?\n\nThis restores the original sample projects, tasks, and habits. Your current data will be lost.')) {
      dispatch({ type: 'state.reset' })
      setMenuOpen(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header
      className="shrink-0 flex items-end justify-between px-5 lg:px-7 border-b border-border-subtle bg-bg-deep/30 backdrop-blur-glass relative z-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)', paddingBottom: '10px', minHeight: '56px' }}
    >
      <div>
        <div className="text-[15px] font-semibold text-text-primary leading-none">
          {current?.label ?? 'LifeOS'}
        </div>
        <div className="text-[11px] text-text-tertiary mt-1 leading-none">{dateLabel}</div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onCommand}
          className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border-subtle bg-white/[0.04] hover:bg-white/[0.07] text-[11px] text-text-tertiary transition-colors"
        >
          <Command size={11} />
          <span className="font-mono">K</span>
        </button>
        <button
          onClick={onNewTask}
          className="h-8 px-3 rounded-sm bg-white/[0.06] hover:bg-white/[0.1] border border-border-subtle text-[12px] font-medium text-text-primary flex items-center gap-1.5 transition-colors"
        >
          <Plus size={13} />
          <span>New</span>
          <span className="hidden sm:inline font-mono text-[10px] text-text-quaternary ml-0.5">N</span>
        </button>

        {/* Settings menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-8 h-8 rounded-sm hover:bg-white/[0.05] flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
            title="Settings"
          >
            <Settings size={14} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-64 rounded-md glass border border-border-subtle shadow-2xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border-subtle">
                <div className="text-[10px] uppercase tracking-[0.14em] text-text-quaternary font-medium">Data</div>
              </div>
              <button
                onClick={clearAllData}
                className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.04] text-left transition-colors"
              >
                <Trash2 size={14} className="text-accent-red mt-0.5 shrink-0" />
                <div>
                  <div className="text-[12.5px] text-text-primary font-medium">Clear all data</div>
                  <div className="text-[10.5px] text-text-tertiary mt-0.5">Wipe everything to start logging your real life</div>
                </div>
              </button>
              <button
                onClick={resetToDemo}
                className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.04] text-left transition-colors"
              >
                <RotateCcw size={14} className="text-text-tertiary mt-0.5 shrink-0" />
                <div>
                  <div className="text-[12.5px] text-text-primary font-medium">Reset to demo data</div>
                  <div className="text-[10.5px] text-text-tertiary mt-0.5">Restore the original sample projects</div>
                </div>
              </button>
              {isSupabaseReady && (
                <>
                  <div className="border-t border-border-subtle" />
                  <button
                    onClick={handleSignOut}
                    className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.04] text-left transition-colors"
                  >
                    <LogOut size={14} className="text-text-tertiary shrink-0" />
                    <div className="text-[12.5px] text-text-primary font-medium">Sign out</div>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
