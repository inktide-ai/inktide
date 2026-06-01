export function ActivityEmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed
                 border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-12 text-center"
    >
      <span className="text-4xl" aria-hidden>🌙</span>
      <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">
        Resting for now
      </p>
      <p className="max-w-[22ch] text-xs leading-relaxed text-[var(--text-tertiary)]">
        Nothing new to share yet — check back soon.
      </p>
    </div>
  )
}
