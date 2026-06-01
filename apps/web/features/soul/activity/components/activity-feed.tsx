'use client'

import { useRef, useEffect } from 'react'
import { usePublicActivityFeed } from '../hooks/usePublicActivityFeed'
import { ActivityDayGroup } from './activity-day-group'
import { ActivitySkeleton } from './activity-skeleton'
import { ActivityEmptyState } from './activity-empty-state'
import { formatDayLabel } from '../lib/format-day-label'

interface Props {
  slug: string
}

export default function ActivityFeed({ slug }: Props) {
  const { groups, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePublicActivityFeed(slug)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '120px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <ActivitySkeleton />
  if (groups.length === 0) return <ActivityEmptyState />

  let runningIndex = 0

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const startIdx = runningIndex
        runningIndex += group.events.length
        return (
          <ActivityDayGroup
            key={group.dayKey}
            label={formatDayLabel(group.dayKey)}
            events={group.events}
            startIndex={startIdx}
          />
        )
      })}

      <div ref={sentinelRef} className="h-px" />

      {isFetchingNextPage && (
        <p className="pb-2 text-center text-xs text-[var(--text-tertiary)]">Loading more…</p>
      )}
    </div>
  )
}
