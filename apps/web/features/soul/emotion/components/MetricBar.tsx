interface MetricBarProps {
  label: string
  value: number
}

export default function MetricBar({ label, value }: MetricBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="mb-[14px] last:mb-0">
      <div className="flex items-center justify-between mb-[6px]">
        <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
        <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">{pct}%</span>
      </div>
      <div className="h-[2px] bg-[var(--border-subtle)] relative">
        <div
          className="absolute inset-y-0 left-0 bg-[var(--text-primary)] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
