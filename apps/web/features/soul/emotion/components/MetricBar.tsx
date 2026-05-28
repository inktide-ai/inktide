interface MetricBarProps {
  label: string
  value: number
  positive?: boolean
}

export default function MetricBar({ label, value, positive = false }: MetricBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="flex items-center gap-3 py-[3px]">
      <span className="text-body text-[var(--text-tertiary)] w-[116px] shrink-0 leading-none">{label}</span>
      <div className="flex-1 h-[2px] rounded-full bg-[rgba(255,255,255,0.07)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: positive ? 'var(--success-text)' : 'var(--accent-primary)' }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums text-[var(--text-tertiary)] w-7 text-right">{pct}%</span>
    </div>
  )
}
