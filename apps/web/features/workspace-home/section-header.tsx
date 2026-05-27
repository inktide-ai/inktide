'use client'

import { CaretLeftSmall, CaretRightSmall } from '@/shared/ui/icons'

interface SectionTab {
  id: string
  label: string
  active?: boolean
}

interface SectionHeaderProps {
  title: string
  tabs?: SectionTab[]
  withArrows?: boolean
}

export function SectionHeader({ title, tabs, withArrows = true }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <h2 className="font-serif text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{title}</h2>
        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 rounded-xl bg-[var(--surface-1)] p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`home-ui-font h-7 rounded-lg px-3 text-[14px] font-medium transition-colors ${
                  tab.active
                    ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {withArrows && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-7 w-7 rounded-md bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]"
          >
            <CaretLeftSmall size={15} className="mx-auto" />
          </button>
          <button
            type="button"
            className="h-7 w-7 rounded-md bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
          >
            <CaretRightSmall size={15} className="mx-auto" />
          </button>
        </div>
      )}
    </div>
  )
}
