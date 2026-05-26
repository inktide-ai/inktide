const ACTIONS = ['Chat with Soul', 'Force Memory Save', 'Restart Soul']

export function SoulQuickActions() {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-medium text-[var(--text-heading)]">Quick Actions</p>
      </div>
      <div className="space-y-1.5">
        {ACTIONS.map(item => (
          <button
            key={item}
            type="button"
            className="flex h-7 w-full items-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className="flex h-7 w-full items-center rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2.5 text-[12px] text-[var(--danger-text)] hover:bg-[var(--danger-bg-hover)]"
        >
          Shutdown Soul
        </button>
      </div>
    </div>
  )
}
