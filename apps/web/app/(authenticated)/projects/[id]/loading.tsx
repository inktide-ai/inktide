import { Skeleton } from '@/shared/ui/skeleton'

export default function ProjectLoading() {
  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* Scene preview 16:9 */}
      <div className="mb-6 overflow-hidden rounded-xl border border-[var(--border-card)]" style={{ aspectRatio: '16/9' }}>
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* 2-col: Character + Scene */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {[0, 1].map(i => (
          <div key={i} className="overflow-hidden rounded-xl border border-[var(--border-card)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="space-y-3 bg-[var(--bg-0)] px-5 py-4">
              {[0, 1, 2].map(j => (
                <Skeleton key={j} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 2-col: Channels + Soul */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {[0, 1].map(i => (
          <div key={i} className="overflow-hidden rounded-xl border border-[var(--border-card)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="space-y-2 bg-[var(--bg-0)] px-5 py-4">
              {[0, 1].map(j => (
                <Skeleton key={j} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* OBS full-width */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-card)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="bg-[var(--bg-0)] px-5 py-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
