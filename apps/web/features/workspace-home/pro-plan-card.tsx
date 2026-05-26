import { Card } from '@/shared/ui/card'

interface ProPlanCardProps {
  renewalLabel: string
  charactersUsed: number
  charactersMax: number
  storageUsedGb: number
  storageMaxGb: number
}

function Meter({ value, max }: { value: number, max: number }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)]">
      <div className="h-full rounded-full bg-[var(--accent-hover)]" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function ProPlanCard({
  renewalLabel,
  charactersUsed,
  charactersMax,
  storageUsedGb,
  storageMaxGb,
}: ProPlanCardProps) {
  const storagePercent = Math.round((storageUsedGb / storageMaxGb) * 100)
  return (
    <Card variant="inset" className="p-3">
      <p className="text-[14px] font-medium text-[var(--text-primary)]">Pro Plan</p>
      <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">{renewalLabel}</p>
      <div className="mt-3 space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-[14px] text-[var(--text-secondary)]">
            <span>Characters</span>
            <span>{charactersUsed} / {charactersMax}</span>
          </div>
          <Meter value={charactersUsed} max={charactersMax} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[14px] text-[var(--text-secondary)]">
            <span>Storage</span>
            <span>{storageUsedGb} / {storageMaxGb} GB</span>
          </div>
          <div className="flex items-center gap-2">
            <Meter value={storageUsedGb} max={storageMaxGb} />
            <span className="text-[14px] text-[var(--text-tertiary)]">{storagePercent}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
