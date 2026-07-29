/**
 * Client preferences for Appearance (account settings).
 * Source of truth: server (GET /api/me/preferences).
 * localStorage is used only as a warm read-through cache for zero-flicker paint.
 * Accent hex is synced to `--inktide-accent-base` on `<html>`; see globals.css derivatives.
 */

// Key kept for backward compat - useGlobalPreferences migration reads it once then removes it.
export const USER_APPEARANCE_STORAGE_KEY = 'inktide_user_appearance' as const

export interface AppearancePrefs {
  theme: 'dark' | 'light' | 'system'
  accentColor: string
  fontSize: 'sm' | 'md' | 'lg'
  compact: boolean
  reduceMotion: boolean
}

export const DEFAULT_APPEARANCE_PREFS: AppearancePrefs = {
  theme: 'dark',
  accentColor: '#6c47ff',
  fontSize: 'md',
  compact: false,
  reduceMotion: false,
}

export const ACCENT_COLORS = [
  '#6c47ff',
  '#e11d48',
  '#2563eb',
  '#059669',
  '#ca8a04', 
  '#ea580c'] as const

export const ACCENT_NAMES: Record<string, string> = {
  '#6c47ff': 'Violet',
  '#e11d48': 'Rose',
  '#2563eb': 'Blue',
  '#059669': 'Emerald',
  '#ca8a04': 'Amber',
  '#ea580c': 'Orange',
}

const ACCENT_PROPERTY = '--inktide-accent-base'

export function normalizeAccentHex(hex: string): string | null {
  const t = hex.trim()
  const m = /^#?([0-9a-f]{6})$/i.exec(t)
  if (!m) return null
  return `#${m[1].toLowerCase()}`
}

/** Apply validated hex as the global accent base; invalid clears override (CSS fallbacks apply). */
export function applyUserAccent(hex: string): void {
  if (typeof document === 'undefined') return
  const n = normalizeAccentHex(hex)
  const root = document.documentElement
  if (!n) {
    root.style.removeProperty(ACCENT_PROPERTY)
    return
  }
  root.style.setProperty(ACCENT_PROPERTY, n)
}

/** Read merged prefs from localStorage; safe on SSR (defaults when no window). */
export function loadAppearancePrefs(): AppearancePrefs {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE_PREFS
  try {
    const raw = localStorage.getItem(USER_APPEARANCE_STORAGE_KEY)
    if (!raw) return DEFAULT_APPEARANCE_PREFS
    return { ...DEFAULT_APPEARANCE_PREFS, ...JSON.parse(raw) as Partial<AppearancePrefs> }
  }
  catch {
    return DEFAULT_APPEARANCE_PREFS
  }
}

/** Re-read storage and refresh accent tokens (startup + cross-tab sync). */
export function syncUserAccentFromStorage(): void {
  applyUserAccent(loadAppearancePrefs().accentColor)
}
