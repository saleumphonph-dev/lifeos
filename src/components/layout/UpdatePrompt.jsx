import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

// Surfaces a banner when a new deployed version is available, and applies it
// on tap (skipWaiting + reload). Also polls for updates so a new deploy is
// noticed without the user having to relaunch — fixes the "update lags a
// reload behind" problem on installed PWAs.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Check for a new version every 60s and whenever the app regains focus.
      const check = () => registration.update().catch(() => {})
      setInterval(check, 60 * 1000)
      window.addEventListener('focus', check)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) check()
      })
    },
  })

  if (!needRefresh) return null

  return (
    <div
      className="fixed z-[80] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm rounded-md glass border border-border-subtle shadow-2xl px-4 py-3 flex items-center gap-3"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
    >
      <RefreshCw size={16} className="text-accent-blue shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-text-primary">Update available</div>
        <div className="text-[11px] text-text-tertiary">A new version of LifeOS is ready.</div>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="shrink-0 h-8 px-3 rounded-sm bg-gradient-to-r from-accent-blue to-accent-emerald text-bg-base text-[12px] font-semibold"
      >
        Reload
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="shrink-0 h-8 px-2 rounded-sm text-[12px] text-text-tertiary hover:text-text-secondary"
      >
        Later
      </button>
    </div>
  )
}
