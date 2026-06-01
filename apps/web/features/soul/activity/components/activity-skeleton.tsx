export function ActivitySkeleton() {
  return (
    <div className="space-y-px" aria-hidden aria-label="Loading activity">
      <div className="flex items-center gap-2 py-1">
        <div className="h-2.5 w-12 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3 py-2.5">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-[var(--surface-2)]" />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <div
              className="h-2.5 animate-pulse rounded bg-[var(--surface-2)]"
              style={{ width: `${70 + i * 8}%` }}
            />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-[var(--surface-2)]" />
          </div>
          <div className="h-2.5 w-9 shrink-0 animate-pulse rounded bg-[var(--surface-2)]" />
        </div>
      ))}
    </div>
  )
}
