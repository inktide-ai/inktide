'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query/keys'
import { getPublicActivity } from '../api'
import { groupByDay } from '../lib/group-by-day'
import type { ActivityDayGroup } from '../types'

export function usePublicActivityFeed(slug: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.souls.publicActivity(slug),
    queryFn: ({ pageParam }) =>
      getPublicActivity(slug, { limit: 10, cursor: pageParam ?? undefined }),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const allItems = query.data?.pages.flatMap((p) => p.items) ?? []
  const groups: ActivityDayGroup[] = groupByDay(allItems)

  return {
    groups,
    isLoading: query.isLoading,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  }
}
