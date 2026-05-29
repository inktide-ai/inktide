import { Skeleton } from '@/shared/ui/skeleton'

export default function HomeLoading() {
  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-[1300px]">
        {/* Top bar */}
        <div className="mb-7 flex items-center justify-between">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>

        {/* Stat cards */}
        <div className="mb-7 grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border-card)] bg-[var(--surface-card)] p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Soul cards section */}
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="mb-7 grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border-card)] bg-[var(--surface-card)]">
              <Skeleton className="h-[160px] w-full rounded-t-xl rounded-b-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Projects section */}
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--surface-card)] px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
