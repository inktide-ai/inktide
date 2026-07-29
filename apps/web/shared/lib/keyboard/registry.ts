import { parseCombo, comboFromEvent } from './parse'
import type { ShortcutEntry, ShortcutOptions } from './types'

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isInputTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null
  if (!el) return false
  if (INPUT_TAGS.has(el.tagName)) return true
  if (el.isContentEditable) return true
  return false
}

// Safe in SSR - document access only inside KeyboardProvider's useEffect.
class ShortcutRegistry {
  private handlers = new Map<string, ShortcutEntry[]>()

  register(
    comboRaw: string,
    handler: () => void,
    opts?: ShortcutOptions,
  ): () => void {
    const canonical = parseCombo(comboRaw)
    const resolved: Required<ShortcutOptions> = {
      allowInInput:   opts?.allowInInput   ?? false,
      preventDefault: opts?.preventDefault ?? true,
      enabled:        opts?.enabled        ?? true,
      priority:       opts?.priority       ?? 0,
    }
    const entry: ShortcutEntry = { canonical, handler, opts: resolved }

    const existing = this.handlers.get(canonical) ?? []
    // Insert sorted by priority descending so index 0 = highest priority.
    const inserted = [...existing, entry].sort((a, b) => b.opts.priority - a.opts.priority)
    this.handlers.set(canonical, inserted)

    return () => {
      const list = this.handlers.get(canonical)
      if (!list) return
      const next = list.filter(e => e !== entry)
      if (next.length === 0) this.handlers.delete(canonical)
      else this.handlers.set(canonical, next)
    }
  }

  handleKeyDown(e: KeyboardEvent): void {
    const combo = comboFromEvent(e)
    const list = this.handlers.get(combo)
    if (!list || list.length === 0) return

    // Walk highest-priority first, stop at first enabled handler.
    for (const entry of list) {
      if (!entry.opts.enabled) continue
      if (!entry.opts.allowInInput && isInputTarget(e)) continue

      if (entry.opts.preventDefault) e.preventDefault()
      entry.handler()
      return
    }
  }
}

export const registry = new ShortcutRegistry()
