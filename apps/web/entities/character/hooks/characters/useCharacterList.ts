'use client'
import { useCallback, useMemo } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { AiCardListItem } from '@/shared/types/soul-api'
import type { PagedResult } from '@/shared/types/paged-result'
import type { ICardRepository } from '@/shared/types/ICardRepository'
import { queryKeys } from '@/shared/lib/query/keys'

function mutatePage<T>(
  old: InfiniteData<PagedResult<T>> | undefined,
  predicate: (item: T) => boolean,
  transform: (items: T[]) => T[],
): InfiniteData<PagedResult<T>> | undefined {
  if (!old) return old
  const pageIdx = old.pages.findIndex((p) => p.items?.some(predicate))
  if (pageIdx === -1) return old
  const pages = [...old.pages]
  pages[pageIdx] = { ...pages[pageIdx], items: transform(pages[pageIdx].items!) }
  return { ...old, pages }
}

export function useCharacterList(repo: ICardRepository) {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.souls.all,
    queryFn: ({ pageParam }) => repo.listCards({ cursor: pageParam ?? undefined }),
    getNextPageParam: (lastPage: PagedResult<AiCardListItem>) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  })

  const cardList = useMemo(
    () => data?.pages.flatMap((p) => p.items ?? []) ?? [],
    [data],
  )

  const { data: llmModels = [] } = useQuery({
    queryKey: queryKeys.catalog.llmModels,
    queryFn: () => repo.listLlmModels(),
  })

  const loadError = error instanceof Error ? error.message : error ? 'Failed to load' : null

  const updateListItem = useCallback((
    id: string,
    patch: Partial<Pick<AiCardListItem, 'name' | 'slug' | 'personality' | 'is_active' | 'avatar_url'>>,
  ) => {
    queryClient.setQueryData<InfiniteData<PagedResult<AiCardListItem>>>(
      queryKeys.souls.all,
      (old) => mutatePage(old, (c) => c.id === id, (items) => items.map((c) => c.id === id ? { ...c, ...patch } : c)),
    )
  }, [queryClient])

  const addListItem = useCallback((item: AiCardListItem) => {
    queryClient.setQueryData<InfiniteData<PagedResult<AiCardListItem>>>(
      queryKeys.souls.all,
      (old) => {
        if (!old?.pages.length) return old
        const pages = [...old.pages]
        pages[pages.length - 1] = {
          ...pages[pages.length - 1],
          items: [...(pages[pages.length - 1].items ?? []), item],
        }
        return { ...old, pages }
      },
    )
  }, [queryClient])

  const removeListItem = useCallback((id: string) => {
    queryClient.setQueryData<InfiniteData<PagedResult<AiCardListItem>>>(
      queryKeys.souls.all,
      (old) => mutatePage(old, (c) => c.id === id, (items) => items.filter((c) => c.id !== id)),
    )
  }, [queryClient])

  return {
    cardList,
    llmModels,
    loading,
    loadError,
    updateListItem,
    addListItem,
    removeListItem,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  }
}
