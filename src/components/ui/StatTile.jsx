import { cn } from '../../lib/utils'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export function StatTile({ label, value, unit, delta, deltaLabel, icon: Icon, accent = '#4a9eff', className }) {
  const positive = delta != null && delta >= 0
  return (
    <div className={cn('glass rounded-md p-5 relative overflow-hidden', className)}>
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between mb-3 relative">
        <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">{label}</div>
        {Icon && (
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center"
            style={{ background: accent + '20', color: accent }}
          >
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 relative">
        <div className="font-mono tnum text-2xl font-semibold text-text-primary">{value}</div>
        {unit && <div className="text-xs text-text-tertiary">{unit}</div>}
      </div>
      {delta != null && (
        <div className="flex items-center gap-1 mt-2 relative">
          {positive ? (
            <ArrowUpRight size={12} className="text-accent-emerald" />
          ) : (
            <ArrowDownRight size={12} className="text-accent-red" />
          )}
          <span className={cn('text-[11px] font-medium font-mono tnum', positive ? 'text-accent-emerald' : 'text-accent-red')}>
            {positive ? '+' : ''}{delta}%
          </span>
          {deltaLabel && <span className="text-[11px] text-text-tertiary ml-0.5">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
