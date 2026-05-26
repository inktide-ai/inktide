'use client'
import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AiCardListItem } from '@/shared/types/soul-api'
import type { ICardRepository } from '@/shared/types/ICardRepository'
import { queryKeys } from '@/shared/lib/query/keys'

export function useCharacterList(repo: ICardRepository) {
  const queryClient = useQueryClient()

  const { data: cardList = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.souls.all,
    queryFn: () => repo.listCards(),
  })

  const { data: llmModels = [] } = useQuery({
    queryKey: queryKeys.catalog.llmModels,
    queryFn: () => repo.listLlmModels(),
  })

  const loadError = error instanceof Error ? error.message : error ? 'Failed to load' : null

  const updateListItem = useCallback((
    id: string,
    patch: Partial<Pick<AiCardListItem, 'name' | 'slug' | 'personality' | 'is_active' | 'avatar_url'>>,
  ) => {
    queryClient.setQueryData<AiCardListItem[]>(queryKeys.souls.all, (prev = []) =>
      prev.map((c) => c.id === id ? { ...c, ...patch } : c),
    )
  }, [queryClient])

  const addListItem = useCallback((item: AiCardListItem) => {
    queryClient.setQueryData<AiCardListItem[]>(queryKeys.souls.all, (prev = []) => [...prev, item])
  }, [queryClient])

  const removeListItem = useCallback((id: string) => {
    queryClient.setQueryData<AiCardListItem[]>(queryKeys.souls.all, (prev = []) => prev.filter((c) => c.id !== id))
  }, [queryClient])

  return { cardList, llmModels, loading, loadError, updateListItem, addListItem, removeListItem }
}
