'use client'
import { cn } from '@/lib/utils'

export type WizardProviderItem = {
  id: string
  name: string
  subtitle?: string
  iconSrc: string
  darkIcon?: boolean
}

export function WizardProviderCard({
  item,
  selected,
  active,
  onSelect,
}: {
  item: WizardProviderItem
  selected: boolean
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-lg border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-0)]"
    >
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-lg p-2.5',
          'transition-[background-color,box-shadow] duration-150 ease-out',
          active
            ? 'bg-[var(--surface-card-hover)] shadow-[inset_0_0_0_1.5px_var(--accent-base)]'
            : selected
              ? 'bg-[var(--surface-2)] shadow-[inset_0_0_0_1px_var(--border-default)]'
              : 'bg-[var(--surface-2)]/60 shadow-[inset_0_0_0_1px_var(--border-subtle)] hover:bg-[var(--surface-2)] hover:shadow-[inset_0_0_0_1px_var(--border-default)]',
        )}
      >
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px]',
          item.darkIcon && 'bg-white p-1.5',
        )}>
          <img
            src={item.iconSrc}
            alt={item.name}
            className={cn('object-contain', item.darkIcon ? 'h-full w-full' : 'h-9 w-9 rounded-[8px]')}
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium leading-4 text-[var(--text-primary)]">
            {item.name}
          </span>
          {item.subtitle && (
            <span className="block truncate text-[12px] leading-4 text-[var(--text-tertiary)]">
              {item.subtitle}
            </span>
          )}
        </div>
        {selected && !active && (
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--accent-base) 40%, transparent)' }}
          >
            <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5" aria-hidden>
              <path d="M1 4l3 3 5-6" stroke="var(--accent-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>
    </button>
  )
}
