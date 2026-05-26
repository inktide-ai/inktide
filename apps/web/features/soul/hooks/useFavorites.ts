'use client'
import { useState } from 'react'

const KEY = 'v1_inktide_favorites'

export function useFavorites() {
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]) }
    catch { return new Set() }
  })

  const toggle = (id: string) => setFavs(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]))
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        console.warn('[useFavorites] localStorage quota exceeded — favorites not persisted')
      } else {
        throw err
      }
    }
    return next
  })

  return { favs, toggle }
}
