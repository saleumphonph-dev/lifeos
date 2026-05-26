export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

export function formatLAK(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US').format(n) + ' ₭'
}

export function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n)
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a)
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function relativeDate(iso) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 0 && diff <= 7) return `In ${diff}d`
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)}d ago`
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function mmss(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
