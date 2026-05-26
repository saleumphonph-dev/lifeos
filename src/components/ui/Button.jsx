import { cn } from '../../lib/utils'

const variants = {
  primary:
    'bg-accent-blue/90 hover:bg-accent-blue text-white shadow-[0_0_0_1px_rgba(74,158,255,0.4),0_8px_24px_-8px_rgba(74,158,255,0.4)]',
  secondary:
    'bg-white/[0.06] hover:bg-white/[0.1] text-text-primary border border-border-subtle',
  ghost:
    'hover:bg-white/[0.05] text-text-secondary hover:text-text-primary',
  danger:
    'bg-accent-red/90 hover:bg-accent-red text-white',
  emerald:
    'bg-accent-emerald/90 hover:bg-accent-emerald text-bg-base font-semibold',
}

const sizes = {
  xs: 'h-7 px-2.5 text-[11px]',
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-5 text-sm',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  icon,
  as: As = 'button',
  ...rest
}) {
  return (
    <As
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-sm font-medium',
        'transition-all duration-200 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </As>
  )
}
