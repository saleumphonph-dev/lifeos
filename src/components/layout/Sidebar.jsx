import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, KanbanSquare, Focus, BarChart3, BookOpen,
  Target, Repeat, Sparkles, Command, Search, LogOut,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import { isSupabaseReady } from '../../lib/supabase'
import { signOut } from '../../lib/sync'

export const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
  { to: '/projects',  label: 'Projects',  icon: KanbanSquare,    shortcut: '2' },
  { to: '/focus',     label: 'Focus',     icon: Focus,            shortcut: '3' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3,        shortcut: '4' },
  { to: '/journal',   label: 'Journal',   icon: BookOpen,         shortcut: '5' },
  { to: '/goals',     label: 'Goals',     icon: Target,           shortcut: '6' },
  { to: '/habits',    label: 'Habits',    icon: Repeat,           shortcut: '7' },
  { to: '/ai',        label: 'AI',        icon: Sparkles,         shortcut: '8' },
]

export function Sidebar({ onSearch }) {
  const { state } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-[220px] shrink-0 hidden lg:flex flex-col border-r border-border-subtle bg-bg-deep/40 backdrop-blur-glass relative z-10">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border-subtle">
        <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-accent-blue to-accent-emerald flex items-center justify-center">
          <span className="font-display text-[15px] text-bg-base leading-none">L</span>
        </div>
        <div>
          <div className="font-display text-[15px] leading-none">LifeOS</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-text-quaternary mt-0.5">
            v0.1
          </div>
        </div>
      </div>

      {/* Search */}
      <button
        onClick={onSearch}
        className="mx-3 mt-3 h-9 rounded-sm bg-white/[0.04] hover:bg-white/[0.07] border border-border-subtle flex items-center gap-2 px-2.5 text-xs text-text-tertiary transition-colors"
      >
        <Search size={13} />
        <span>Search…</span>
        <span className="ml-auto flex items-center gap-0.5 text-text-quaternary">
          <Command size={10} />
          <span className="font-mono">K</span>
        </span>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map((item) => {
          const active = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-center gap-2.5 h-9 px-2.5 rounded-sm text-[13px] font-medium relative',
                'transition-colors duration-200',
                active ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-sm bg-white/[0.06] border border-border-subtle"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon size={15} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
              <span className="relative z-10 ml-auto font-mono text-[10px] text-text-quaternary group-hover:text-text-tertiary">
                {item.shortcut}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border-subtle">
        <div className="flex items-center gap-2.5 p-2 rounded-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-[11px] font-semibold text-bg-base shrink-0">
            {state.user.shortName}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-text-primary truncate">{state.user.name}</div>
            <div className="text-[10px] text-text-tertiary truncate">{state.user.location}</div>
          </div>
          {isSupabaseReady && (
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="w-7 h-7 rounded-sm flex items-center justify-center text-text-quaternary hover:text-accent-red hover:bg-white/[0.04] transition-colors"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
