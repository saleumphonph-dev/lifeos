import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Catches render errors in child components so a crash in one view
 * doesn't take down the whole app (e.g. AppStateProvider). This is
 * critical because, without it, any uncaught error would unmount the
 * provider tree and silently drop pending state dispatches (like
 * Journal's debounced auto-save).
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Log for debugging — visible in browser console
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full glass border border-border-subtle rounded-md p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 text-accent-amber" size={28} />
            <h2 className="font-display text-lg text-text-primary mb-1">Something went wrong</h2>
            <p className="text-[13px] text-text-secondary mb-4">
              This view hit an error. Your data is safe — only this screen is affected.
            </p>
            <pre className="text-[11px] text-text-tertiary bg-white/[0.03] border border-border-subtle rounded p-3 mb-4 text-left overflow-x-auto">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.reset}
                className="h-9 px-4 rounded-sm bg-accent-blue text-white text-[12px] font-medium inline-flex items-center gap-1.5"
              >
                <RefreshCw size={12} /> Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="h-9 px-4 rounded-sm bg-white/[0.04] border border-border-subtle text-[12px] text-text-secondary"
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
