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
        'text-left p-3 rounded-xl border transition-all duration-150 w-full',
        isActive
          ? 'border-[var(--accent-primary)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]',
      )}
      style={isActive ? { background: 'color-mix(in srgb, var(--accent-primary) 9%, transparent)' } : undefined}
    >
      <p className={cn('text-body font-semibold leading-snug mb-0.5', isActive ? 'text-[var(--accent-violet-text)]' : 'text-[var(--text-primary)]')}>
        {meta.label}
      </p>
      <p className="text-xs text-[var(--text-tertiary)] mb-2.5">{meta.tagline}</p>
      <div className="flex gap-1 items-center">
        {meta.dots.map((d, i) => (
          <div
            key={i}
            className="h-[3px] rounded-full flex-1 transition-opacity duration-300"
            style={{ opacity: 0.15 + d * 0.85, background: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          />
        ))}
      </div>
    </button>
  )
}
