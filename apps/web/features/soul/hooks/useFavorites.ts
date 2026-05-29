'use client'
import { useGlobalPreferences, usePatchGlobalPreferences } from '@/shared/hooks/useGlobalPreferences'

export function useFavorites() {
  const { data } = useGlobalPreferences()
  const { mutate } = usePatchGlobalPreferences()

  const favs = new Set<string>(data?.favorites ?? [])

  const toggle = (id: string) => {
    const next = new Set(favs)
    next.has(id) ? next.delete(id) : next.add(id)
    mutate({ favorites: [...next] })
  }

  return { favs, toggle }
}
