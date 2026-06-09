// Build identity, injected at build time via Vite `define` (see vite.config.js).
/* global __APP_VERSION__, __APP_COMMIT__, __BUILD_TIME__ */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'
export const APP_COMMIT = typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : 'dev'
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : ''

/** Short human label, e.g. "v0.1.0 · a1b2c3d · Jun 9, 2026". */
export function versionLabel() {
  let when = ''
  try {
    if (BUILD_TIME) {
      when = new Date(BUILD_TIME).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  } catch { /* ignore */ }
  return `v${APP_VERSION} · ${APP_COMMIT}${when ? ' · ' + when : ''}`
}
