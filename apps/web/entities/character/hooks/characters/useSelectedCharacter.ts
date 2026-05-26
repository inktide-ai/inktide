'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { AiCharacter } from '@/lib/character/types'
import type { ICardRepository } from '@/types/ICardRepository'
import { apiResponseToCharacter } from '@/lib/character/mappers'
import { queryKeys } from '@/lib/query/keys'

const SOUL_STORAGE_KEY = 'inktide_selected_soul'

export function useSelectedCharacter(repo: ICardRepository) {
  const queryClient = useQueryClient()
  const requestSeqRef = useRef(0)
  const [characters, setCharacters] = useState<Map<string, AiCharacter>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(SOUL_STORAGE_KEY)
  })
  const [cardLoadError, setCardLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedId) localStorage.setItem(SOUL_STORAGE_KEY, selectedId)
    else localStorage.removeItem(SOUL_STORAGE_KEY)
  }, [selectedId])

  const selected = selectedId ? characters.get(selectedId) ?? null : null

  // Uses TanStack Query for deduplication and cache — staleTime: Infinity
  // prevents background refetches while the user is editing.
  const loadFullCard = useCallback(async (id: string): Promise<AiCharacter> => {
    const char = await queryClient.fetchQuery({
      queryKey: queryKeys.souls.detail(id),
      queryFn: async () => apiResponseToCharacter(await repo.getCard(id)),
      staleTime: Infinity,
    })
    setCharacters((prev) => new Map(prev).set(id, char))
    return char
  }, [queryClient, repo])

  const selectCard = useCallback(async (
    id: string,
    onSnapshotUpdate: (char: AiCharacter) => void,
  ) => {
    const requestToken = ++requestSeqRef.current
    setSelectedId(id)
    setCardLoadError(null)
    const existing = characters.get(id)
    if (!existing) {
      try {
        const char = await loadFullCard(id)
        if (requestSeqRef.current !== requestToken) return
        onSnapshotUpdate(char)
      } catch (err) {
        console.error('[selectCard] failed to load card', id, err)
        if (requestSeqRef.current !== requestToken) return
        setCardLoadError('Failed to load soul')
      }
    } else {
      onSnapshotUpdate(existing)
    }
  }, [characters, loadFullCard])

  const reloadCard = useCallback(async (
    id: string,
    onSnapshotUpdate: (char: AiCharacter) => void,
  ) => {
    const requestToken = ++requestSeqRef.current
    setSelectedId(id)
    try {
      // Evict cache so fetchQuery always hits the network
      queryClient.removeQueries({ queryKey: queryKeys.souls.detail(id) })
      const char = await loadFullCard(id)
      if (requestSeqRef.current !== requestToken) return
      onSnapshotUpdate(char)
    } catch {
      /* ignore */
    }
  }, [loadFullCard, queryClient])

  const setCharacter = useCallback((id: string, char: AiCharacter) => {
    setCharacters((prev) => new Map(prev).set(id, char))
    queryClient.setQueryData(queryKeys.souls.detail(id), char)
  }, [queryClient])

  const patchCharacter = useCallback((id: string, patch: Partial<AiCharacter>) => {
    setCharacters((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      return new Map(prev).set(id, { ...existing, ...patch })
    })
  }, [])

  const removeCharacterById = useCallback((id: string) => {
    setCharacters((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    queryClient.removeQueries({ queryKey: queryKeys.souls.detail(id) })
    setSelectedId((sid) => (sid === id ? null : sid))
  }, [queryClient])

  return {
    characters,
    selectedId,
    setSelectedId,
    selected,
    cardLoadError,
    selectCard,
    reloadCard,
    setCharacter,
    patchCharacter,
    removeCharacterById,
  }
}
