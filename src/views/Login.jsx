import { useState } from 'react'
import { Sparkles, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { signInWithEmail } from '../lib/sync'

const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL || ''

export function Login() {
  const [email, setEmail] = useState(ALLOWED_EMAIL)
  const [status, setStatus] = useState('idle') // idle | loading | sent | error
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrMsg('')
    try {
      await signInWithEmail(email.trim())
      setStatus('sent')
    } catch (err) {
      setErrMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent-blue/8 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-accent-emerald/6 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-accent-blue to-accent-emerald flex items-center justify-center shadow-[0_0_40px_-8px_rgba(74,158,255,0.6)]">
            <span className="font-display text-[18px] text-bg-base leading-none">L</span>
          </div>
          <div>
            <div className="font-display text-xl text-text-primary">LifeOS</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Personal command center</div>
          </div>
        </div>

        {status === 'sent' ? (
          <div className="glass border border-border-subtle rounded-md p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 text-accent-emerald" size={32} />
            <h2 className="font-display text-xl text-text-primary mb-2">Check your inbox</h2>
            <p className="text-[13px] text-text-secondary">
              Magic link sent to <strong className="text-text-primary">{email}</strong>.
              Click the link to sign in — no password needed.
            </p>
            <p className="text-[11px] text-text-tertiary mt-4">Check your spam folder if you don't see it.</p>
          </div>
        ) : (
          <div className="glass border border-border-subtle rounded-md p-8">
            <h2 className="font-display text-2xl text-text-primary mb-1">Welcome back</h2>
            <p className="text-[13px] text-text-secondary mb-7">
              Sign in with a magic link — no password needed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium block mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-11 pl-9 pr-4 rounded-sm bg-white/[0.04] border border-border-subtle text-[14px] text-text-primary outline-none focus:border-accent-blue/50 transition-colors"
                  />
                </div>
              </div>

              {errMsg && (
                <p className="text-[12px] text-accent-red">{errMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full h-11 rounded-sm bg-gradient-to-r from-accent-blue to-accent-emerald text-bg-base font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_0_30px_-8px_rgba(74,158,255,0.5)] hover:shadow-[0_0_40px_-8px_rgba(74,158,255,0.7)] transition-shadow disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>Send magic link <ArrowRight size={14} /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border-subtle flex items-center gap-2 text-[11px] text-text-tertiary">
              <Sparkles size={11} className="text-accent-purple" />
              <span>Your data stays local. Supabase only for sync &amp; auth.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
