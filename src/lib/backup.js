// Local safety net: rolling on-device backups + manual file export/import.
// These live OUTSIDE the sync layer so a bad sync can never touch them.

import { storage } from './storage'
import { getTodayInTimezone } from './utils'

const INDEX_KEY = 'backups.index'
const MAX_BACKUPS = 7

/**
 * Keep a rolling daily snapshot in localStorage (last 7 days). Throttled so a
 * burst of edits doesn't thrash storage. Never backs up demo/seed data.
 */
export function writeDailyBackup(state, minIntervalMs = 5 * 60 * 1000) {
  if (!state || state._isSeed) return
  const date = getTodayInTimezone()
  const key = `backup.${date}`
  const existing = storage.get(key)
  if (existing && existing.savedAt && Date.now() - Date.parse(existing.savedAt) < minIntervalMs) {
    return // already backed up recently today
  }
  storage.set(key, { savedAt: new Date().toISOString(), state })
  const idx = storage.get(INDEX_KEY, [])
  if (!idx.includes(date)) idx.push(date)
  idx.sort()
  while (idx.length > MAX_BACKUPS) {
    const old = idx.shift()
    storage.remove(`backup.${old}`)
  }
  storage.set(INDEX_KEY, idx)
}

export function listBackups() {
  const idx = storage.get(INDEX_KEY, [])
  return idx
    .map(d => ({ date: d, ...(storage.get(`backup.${d}`) || {}) }))
    .filter(b => b.state)
    .reverse()
}

/** Download the current state as a JSON file the user keeps off-device. */
export function exportStateToFile(state) {
  const data = JSON.stringify(state, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lifeos-backup-${getTodayInTimezone()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Parse + validate an imported backup file. Resolves to a state object. */
export function readImportedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.projects)) {
          reject(new Error('This file does not look like a LifeOS backup.'))
          return
        }
        resolve(parsed)
      } catch (e) {
        reject(new Error('Could not read this file: ' + e.message))
      }
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsText(file)
  })
}
