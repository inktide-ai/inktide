import { cn } from '@/lib/utils'
import type { PresetMeta } from '@/shared/data/personality-presets'

interface ProfileCardProps {
  id: string
  meta: PresetMeta
  isActive: boolean
  onClick: () => void
}

export default function ProfileCard({ meta, isActive, onClick }: ProfileCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left p-3 rounded-lg border transition-all duration-150 w-full min-h-[64px]',
        isActive
          ? 'border-[var(--text-primary)]/20 bg-[var(--surface-2)]'
          : 'border-[var(--border-card)] bg-[var(--surface-1)] hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]',
      )}
    >
      <p className={cn(
        'text-[12px] font-medium leading-snug mb-1',
        isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
      )}>
        {meta.label}
      </p>
      <p className="text-[10px] text-[var(--text-tertiary)] leading-[1.4]">{meta.tagline}</p>
    </button>
  )
}
