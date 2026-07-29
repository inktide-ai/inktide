import type { ParsedCombo } from './types'

// Resolved once at module init - not on every keydown.
const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

export const MOD: 'meta' | 'ctrl' = isMac ? 'meta' : 'ctrl'

/**
 * Parse a combo string into a canonical key used as the registry Map key.
 * Supports: "meta+k", "ctrl+,", "$mod+k", "escape", "shift+meta+z", etc.
 * Token order doesn't matter: "shift+meta+k" === "meta+shift+k".
 */
export function parseCombo(raw: string): string {
  const parts = raw
    .toLowerCase()
    .split('+')
    .map(p => p.trim())
    .map(p => (p === '$mod' ? MOD : p))

  let key = ''
  let meta = false
  let ctrl = false
  let shift = false
  let alt = false

  for (const part of parts) {
    if (part === 'meta' || part === 'cmd' || part === 'command') { meta = true; continue }
    if (part === 'ctrl' || part === 'control') { ctrl = true; continue }
    if (part === 'shift') { shift = true; continue }
    if (part === 'alt' || part === 'option') { alt = true; continue }
    key = part
  }

  return canonical({ key, meta, ctrl, shift, alt })
}

export function canonical(c: ParsedCombo): string {
  const mods = [
    c.meta  && 'meta',
    c.ctrl  && 'ctrl',
    c.shift && 'shift',
    c.alt   && 'alt',
  ].filter(Boolean)
  return [...mods, c.key].join('+')
}

/** Build a canonical string directly from a KeyboardEvent. */
export function comboFromEvent(e: KeyboardEvent): string {
  return canonical({
    key:   e.key.toLowerCase(),
    meta:  e.metaKey,
    ctrl:  e.ctrlKey,
    shift: e.shiftKey,
    alt:   e.altKey,
  })
}

/** Human-readable hint for display (e.g. "CmdK", "Ctrl+,"). */
export function formatCombo(raw: string): string {
  const parts = raw
    .toLowerCase()
    .split('+')
    .map(p => p.trim())
    .map(p => (p === '$mod' ? MOD : p))

  const tokens: string[] = []
  let key = ''

  for (const part of parts) {
    if (part === 'meta' || part === 'cmd')     { tokens.push(isMac ? '⌘' : 'Win'); continue }
    if (part === 'ctrl' || part === 'control') { tokens.push(isMac ? '⌃' : 'Ctrl'); continue }
    if (part === 'shift')                      { tokens.push(isMac ? '⇧' : 'Shift'); continue }
    if (part === 'alt' || part === 'option')   { tokens.push(isMac ? '⌥' : 'Alt'); continue }
    key = part.length === 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)
  }

  tokens.push(key)
  return isMac ? tokens.join('') : tokens.join('+')
}
