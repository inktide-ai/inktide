import { useCallback, useState } from 'react'

/**
 * SSR-safe localStorage hook.
 *
 * - Returns `initialValue` on the server (typeof window === 'undefined')
 * - Catches JSON.parse errors (corrupted data) and quota-exceeded errors on setItem
 * - Typed: T inferred from initialValue
 *
 * Usage:
 *   const [layout, setLayout] = useLocalStorage('hub-layout', 'default')
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setStoredValue = useCallback(
    (val: T | ((prev: T) => T)) => {
      setValue(prev => {
        const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(next))
          } catch {
            // quota exceeded or private browsing — state still updates in-memory
          }
        }
        return next
      })
    },
    [key],
  )

  return [value, setStoredValue]
}

/**
 * Removes the key from localStorage and resets to initialValue.
 */
export function removeLocalStorageItem(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}
