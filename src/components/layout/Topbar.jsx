import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Plus, Command, Settings, Trash2, RotateCcw, LogOut, RefreshCw, Download, Upload } from 'lucide-react'
import { NAV } from './Sidebar'
import { useApp, mergeState } from '../../state/AppState'
import { isSupabaseReady } from '../../lib/supabase'
import { signOut } from '../../lib/sync'
import { exportStateToFile, readImportedFile } from '../../lib/backup'

export function Topbar({ onCommand, onNewTask }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const fileRef = useRef(null)
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
    if (confirm('Show demo data on THIS device?\n\nThis loads the sample projects locally for a preview. It will NOT sync or overwrite your cloud data — sign in / reload to get your real data back.')) {
      dispatch({ type: 'state.reset' })
      setMenuOpen(false)
    }
  }

  function exportData() {
    exportStateToFile(state)
    setMenuOpen(false)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file later
    if (!file) return
    try {
      const imported = await readImportedFile(file)
      // Merge rather than overwrite, so importing can only ADD data back.
      const merged = mergeState(state, imported, new Date().toISOString())
      dispatch({ type: 'state.hydrate', state: merged })
      alert('Backup imported and merged with your current data.')
    } catch (err) {
      alert(err.message)
    }
    setMenuOpen(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function hardRefresh() {
    if (confirm('Hard refresh the app?\n\nThis will clear all cached files and reload. Your data is safe in localStorage.')) {
      try {
        // Unregister all service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.unregister()
          }
        }
        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName)
          }
        }
        // Force reload with cache busting
        window.location.href = window.location.href + '?t=' + Date.now()
      } catch (err) {
        console.error('Hard refresh error:', err)
        alert('Error during hard refresh. Please try again.')
      }
    }
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
                onClick={exportData}
                className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.04] text-left transition-colors"
              >
                <Download size={14} className="text-accent-emerald mt-0.5 shrink-0" />
                <div>
                  <div className="text-[12.5px] text-text-primary font-medium">Export backup</div>
                  <div className="text-[10.5px] text-text-tertiary mt-0.5">Download all your data as a JSON file</div>
                </div>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.04] text-left transition-colors"
              >
                <Upload size={14} className="text-accent-blue mt-0.5 shrink-0" />
                <div>
                  <div className="text-[12.5px] text-text-primary font-medium">Import backup</div>
                  <div className="text-[10.5px] text-text-tertiary mt-0.5">Restore from a JSON file (merges, never wipes)</div>
                </div>
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
              <div className="border-t border-border-subtle" />
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
              <button
                onClick={hardRefresh}
                className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.04] text-left transition-colors"
              >
                <RefreshCw size={14} className="text-text-tertiary mt-0.5 shrink-0" />
                <div>
                  <div className="text-[12.5px] text-text-primary font-medium">Hard refresh</div>
                  <div className="text-[10.5px] text-text-tertiary mt-0.5">Clear cache and reload the app</div>
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
