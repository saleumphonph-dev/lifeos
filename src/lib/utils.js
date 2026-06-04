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

// Compact money formatting for goal targets, e.g. ₭1.2B, $450K, ₭38M.
// `currency` is the symbol to prefix ('₭' or '$'). Defaults to ₭ (LAK).
export function formatMoney(n, currency = '₭') {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  let out
  if (abs >= 1e9) out = (n / 1e9).toFixed(abs % 1e9 === 0 ? 0 : 1) + 'B'
  else if (abs >= 1e6) out = (n / 1e6).toFixed(abs % 1e6 === 0 ? 0 : 1) + 'M'
  else if (abs >= 1e3) out = (n / 1e3).toFixed(abs % 1e3 === 0 ? 0 : 1) + 'K'
  else out = new Intl.NumberFormat('en-US').format(n)
  return `${currency}${out}`
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function getTodayInTimezone(tzOffsetMinutes = -420) {
  // tzOffsetMinutes: ICT is UTC+7, which is -420 minutes offset
  // Browser timezone offset is -420 for ICT
  const now = new Date()
  const localOffset = now.getTimezoneOffset()

  // If browser is already in ICT, use it directly
  if (localOffset === tzOffsetMinutes) {
    return now.toISOString().slice(0, 10)
  }

  // Otherwise, adjust to ICT offset
  const diff = (localOffset - tzOffsetMinutes) * 60 * 1000
  const ictTime = new Date(now.getTime() + diff)
  return ictTime.toISOString().slice(0, 10)
}

export function todayISO() {
  return getTodayInTimezone()
}

export function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a)
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function relativeDate(iso) {
  // Use timezone-aware today for proper day boundary
  const todayISO = getTodayInTimezone()
  const today = new Date(todayISO)
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
