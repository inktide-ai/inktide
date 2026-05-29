import { Card } from '@/shared/ui/card'
import { Sparkline } from '@/features/workspace-home/sparkline'

export const STAT_CARD_COLORS = {
  violet: '#8B5CF6',
  green:  '#22C55E',
  indigo: '#6366F1',
  amber:  '#FACC15',
} as const

interface StatCardProps {
  label: string
  value: string
  accentColor: string
  spark?: number[]
  progress?: {
    value: number
    max: number
    percentageLabel: string
  }
}

export function StatCard({ label, value, accentColor, spark, progress }: StatCardProps) {
  const ratio = progress ? Math.max(0, Math.min(1, progress.value / progress.max)) : 0

  return (
    <Card className="h-24 px-4 py-3">
      <p className="home-ui-font text-body font-medium text-[var(--text-secondary)]">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="home-heading-font text-[29px] font-bold leading-none tracking-[-0.02em] text-[var(--text-primary)]">{value}</p>
        {spark && <Sparkline values={spark} color={accentColor} />}
      </div>
      {progress && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${ratio * 100}%`, backgroundColor: accentColor }}
            />
          </div>
          <span className="home-ui-font text-body font-medium text-[var(--text-secondary)]">{progress.percentageLabel}</span>
        </div>
      )}
    </Card>
  )
}
