import { cn } from '../../lib/utils'

export function Card({ className, children, glass = true, padding = 'p-5', as: As = 'div', ...rest }) {
  return (
    <As
      className={cn(
        glass ? 'glass' : 'bg-bg-surface border border-border-subtle',
        'rounded-md',
        padding,
        'transition-colors duration-200',
        className
      )}
      {...rest}
    >
      {children}
    </As>
  )
}

export function CardHeader({ title, eyebrow, action, className }) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium mb-1.5">
            {eyebrow}
          </div>
        )}
        {title && <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>}
      </div>
      {action}
    </div>
  )
}
