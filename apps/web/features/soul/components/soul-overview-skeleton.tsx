import { Skeleton } from '@/components/ui/skeleton'

function CardShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <article className={`rounded-xl border border-[var(--border-card)] bg-[var(--surface-card)] p-3 ${className ?? ''}`}>
      {children}
    </article>
  )
}

export function SoulOverviewSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-2.5">
      {/* Character card col-span-5 */}
      <div className="col-span-5">
        <CardShell>
          <div className="flex gap-3">
            <Skeleton className="h-[224px] w-[182px] rounded-lg" />
            <div className="flex-1 space-y-3 pt-1">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="mt-2 h-[84px] w-full rounded-lg" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-10 rounded" />
              </div>
            </div>
          </div>
        </CardShell>
      </div>

      {/* Status card col-span-7 */}
      <div className="col-span-7">
        <CardShell>
          <Skeleton className="mb-3 h-4 w-24" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2">
                <Skeleton className="mb-2 h-2.5 w-12" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="mt-2 h-1 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2">
                <Skeleton className="mb-1.5 h-3 w-12" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            ))}
          </div>
        </CardShell>
      </div>

      {/* Secondary cards — 4×col-span-3 */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="col-span-3">
          <CardShell>
            <Skeleton className="mb-3 h-4 w-28" />
            <div className="space-y-1.5">
              {[...Array(3)].map((__, j) => (
                <Skeleton key={j} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </CardShell>
        </div>
      ))}

      {/* Graph preview col-span-6 */}
      <div className="col-span-6">
        <CardShell>
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="h-44 w-full rounded-md" />
        </CardShell>
      </div>

      {/* Voice card col-span-3 */}
      <div className="col-span-3">
        <CardShell>
          <Skeleton className="mb-3 h-4 w-24" />
          <div className="grid grid-cols-[118px_1fr] gap-2">
            <Skeleton className="h-[124px] rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-[58px] rounded-md" />
              <Skeleton className="h-[58px] rounded-md" />
            </div>
          </div>
        </CardShell>
      </div>

      {/* Quick actions col-span-3 */}
      <div className="col-span-3">
        <CardShell>
          <Skeleton className="mb-3 h-4 w-24" />
          <div className="space-y-1.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </CardShell>
      </div>
    </div>
  )
}
