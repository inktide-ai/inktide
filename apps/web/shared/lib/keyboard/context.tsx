'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import { registry } from './registry'
import type { ShortcutOptions } from './types'

export function KeyboardProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => registry.handleKeyDown(e)
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  return <>{children}</>
}

/**
 * Register a keyboard shortcut for the lifetime of the calling component.
 *
 * Combo syntax: "meta+k" | "ctrl+," | "$mod+k" | "escape" | "shift+$mod+z"
 * "$mod" resolves to "meta" on Mac and "ctrl" on Win/Linux at module init time.
 *
 * handler does NOT need to be wrapped in useCallback — it is stored in a ref
 * so the shortcut registration is stable across re-renders.
 */
export function useShortcut(
  combo: string | string[],
  handler: () => void,
  opts?: ShortcutOptions,
) {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler })

  const enabled = opts?.enabled

  useEffect(() => {
    const combos = Array.isArray(combo) ? combo : [combo]
    const stable = () => handlerRef.current()
    const unregisterFns = combos.map(c => registry.register(c, stable, opts))
    return () => unregisterFns.forEach(fn => fn())
    // Re-register only when the combo or enabled flag changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(combo) ? combo.join(',') : combo, enabled])
}
