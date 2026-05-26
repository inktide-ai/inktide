import { Skeleton } from '@/shared/ui/skeleton'

export function SoulCardVerticalSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]">
      <Skeleton className="h-[180px] w-full rounded-none rounded-t-2xl" />
      <div className="px-3 py-2.5">
        <Skeleton className="mb-1.5 h-4 w-2/3" />
        <Skeleton className="h-3 w-2/5" />
      </div>

    </div>
  )
}
