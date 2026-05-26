import { cn } from '../../lib/utils'

const tones = {
  default: 'bg-white/[0.06] text-text-secondary',
  blue: 'bg-accent-blue/12 text-accent-blue',
  emerald: 'bg-accent-emerald/12 text-accent-emerald',
  amber: 'bg-accent-amber/12 text-accent-amber',
  red: 'bg-accent-red/12 text-accent-red',
  purple: 'bg-accent-purple/12 text-accent-purple',
}

export function Badge({ tone = 'default', className, children, dot }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 h-[22px] rounded-[6px]',
        'text-[10px] font-medium uppercase tracking-[0.08em]',
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', `bg-current`)} />}
      {children}
    </span>
  )
}

export const priorityTone = {
  P0: 'red', P1: 'amber', P2: 'blue', P3: 'default',
}

export const statusTone = {
  backlog: 'default',
  in_progress: 'blue',
  review: 'amber',
  done: 'emerald',
  on_track: 'emerald',
  at_risk: 'amber',
  blocked: 'red',
  ahead: 'emerald',
  behind: 'red',
}
