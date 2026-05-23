export function SoulMoodCard() {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-medium text-[var(--text-heading)]">Mood</p>
        <span className="rounded-full bg-[var(--accent-violet-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-violet-text)]">
          Focused
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-[28px] leading-none font-semibold text-[var(--text-heading)]">Focused</p>
        <p className="text-[12px] text-[var(--text-secondary)]">Анализирует информацию.</p>
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>Intensity</span><span>73%</span>
          </div>
          <div className="h-1 rounded-full bg-[var(--surface-2)]">
            <div className="h-full w-[73%] rounded-full bg-[var(--accent-hover)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
