'use client'

import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('common')
  const storagePercent = Math.round((storageUsedGb / storageMaxGb) * 100)
  const unlimitedChars = !isFinite(charactersMax)
  return (
    <Card variant="inset" className="p-3">
      <p className="text-body font-medium text-[var(--text-primary)]">{t('proPlan.title')}</p>
      <p className="mt-0.5 text-body text-[var(--text-secondary)]">{renewalLabel}</p>
      <div className="mt-3 space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-body text-[var(--text-secondary)]">
            <span>{t('proPlan.characters')}</span>
            <span>{unlimitedChars ? `${charactersUsed} / ∞` : `${charactersUsed} / ${charactersMax}`}</span>
          </div>
          {!unlimitedChars && <Meter value={charactersUsed} max={charactersMax} />}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-body text-[var(--text-secondary)]">
            <span>{t('proPlan.storage')}</span>
            <span>{storageUsedGb} / {storageMaxGb} GB</span>
          </div>
          <div className="flex items-center gap-2">
            <Meter value={storageUsedGb} max={storageMaxGb} />
            <span className="text-body text-[var(--text-tertiary)]">{storagePercent}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
