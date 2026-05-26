import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, KanbanSquare, BookOpen, Focus, Plus, MoreHorizontal,
  BarChart3, Target, Repeat, Sparkles, X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const TABS = [
  { to: '/dashboard', label: 'Home',   icon: Home },
  { to: '/projects',  label: 'Plan',   icon: KanbanSquare },
  { to: '/journal',   label: 'Journal',icon: BookOpen },
]

const MORE_ITEMS = [
  { to: '/focus',     label: 'Focus',     icon: Focus,     desc: 'Pomodoro timer' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, desc: 'Heatmap & trends' },
  { to: '/goals',     label: 'Goals',     icon: Target,    desc: 'Track horizons' },
  { to: '/habits',    label: 'Habits',    icon: Repeat,    desc: 'Daily streaks' },
  { to: '/ai',        label: 'AI',        icon: Sparkles,  desc: 'Productivity assistant' },
]

export function MobileTabBar({ onNew }) {
  const nav = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer when route changes
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-border-subtle"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="h-16 grid grid-cols-5 items-center">
          <Tab tab={TABS[0]} />
          <Tab tab={TABS[1]} />
          <div className="flex items-center justify-center">
            <button
              onClick={onNew ?? (() => nav('/projects'))}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-blue to-accent-emerald flex items-center justify-center text-bg-base shadow-[0_8px_24px_-6px_rgba(74,158,255,0.5)] -mt-6"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
          <Tab tab={TABS[2]} />
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium text-text-tertiary"
          >
            <MoreHorizontal size={18} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Drawer */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute bottom-0 inset-x-0 glass border-t border-border-subtle rounded-t-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Navigate</div>
                <h3 className="font-display text-lg text-text-primary mt-0.5">More views</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-sm flex items-center justify-center text-text-tertiary hover:bg-white/[0.05]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-3 pb-5">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-sm transition-colors',
                      isActive ? 'bg-white/[0.06] text-text-primary' : 'text-text-secondary hover:bg-white/[0.04]'
                    )
                  }
                >
                  <div className="w-10 h-10 rounded-sm bg-white/[0.04] flex items-center justify-center shrink-0">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium">{item.label}</div>
                    <div className="text-[11px] text-text-tertiary">{item.desc}</div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Tab({ tab }) {
  return (
    <NavLink
      to={tab.to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium',
          isActive ? 'text-text-primary' : 'text-text-tertiary'
        )
      }
    >
      <tab.icon size={18} />
      <span>{tab.label}</span>
    </NavLink>
  )
}
