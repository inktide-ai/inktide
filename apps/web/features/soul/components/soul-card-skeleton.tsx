import { Skeleton } from '@/shared/ui/skeleton'

export function SoulCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--surface-card)]">
      {/* top: image left + content right */}
      <div className="flex">
        <div className="w-[130px] shrink-0 self-stretch" style={{ minHeight: '220px' }}>
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          {/* status + star */}
          <div className="mb-2.5 flex items-center justify-between">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-[34px] w-[34px] rounded-full" />
          </div>
          {/* name */}
          <Skeleton className="mb-1 h-6 w-3/5" />
          {/* subtitle */}
          <Skeleton className="mb-3 h-3.5 w-2/5" />
          {/* description 3 lines */}
          <Skeleton className="mb-1 h-3.5 w-full" />
          <Skeleton className="mb-1 h-3.5 w-full" />
          <Skeleton className="mb-3 h-3.5 w-4/5" />
          {/* platform icons */}
          <div className="flex gap-3">
            <Skeleton className="h-[18px] w-[18px]" />
            <Skeleton className="h-[18px] w-[18px]" />
            <Skeleton className="h-[18px] w-[18px]" />
          </div>
        </div>
      </div>
      {/* divider */}
      <div className="h-px bg-[var(--border-card)]" />
      {/* bottom: buttons */}
      <div className="flex gap-2 p-4">
        <Skeleton className="h-[42px] flex-1 rounded-[10px]" />
        <Skeleton className="h-[42px] w-[42px] rounded-[10px]" />
      </div>
    </div>
  )
}
