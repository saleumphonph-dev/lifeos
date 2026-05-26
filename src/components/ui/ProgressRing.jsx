export function ProgressRing({
  size = 56,
  strokeWidth = 5,
  progress = 0,
  gradient = ['#4a9eff', '#2ee5a6'],
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  const gradId = `pg-${gradient.join('-')}-${size}`

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {label && <div className="font-mono text-[13px] font-semibold text-text-primary tnum">{label}</div>}
        {sublabel && <div className="text-[9px] uppercase tracking-wider text-text-tertiary mt-0.5">{sublabel}</div>}
      </div>
    </div>
  )
}
