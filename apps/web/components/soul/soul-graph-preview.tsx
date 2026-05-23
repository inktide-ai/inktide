export function SoulGraphPreview() {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-medium text-[var(--text-heading)]">Graph Overview</p>
        <button type="button" className="text-[12px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          Open →
        </button>
      </div>
      <div className="grid h-[108px] grid-cols-4 gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--graph-node-bg)] p-2">
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">Twitch</div>
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">Message</div>
        <div className="rounded border border-[var(--graph-node-active-border)] bg-[var(--graph-node-active-bg)] p-1 text-[9px] text-[var(--accent-violet-text)]">Intent</div>
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">OBS</div>
        <div className="col-span-2 rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">Memory Search</div>
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">Generate</div>
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">Discord</div>
      </div>
    </div>
  )
}
