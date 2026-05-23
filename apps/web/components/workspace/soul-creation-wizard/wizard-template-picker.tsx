'use client'
import { cn } from '@/lib/utils'
import { CaretRightSmall } from '@/components/icons'
import type { SoulTemplate } from '@/data/soul-templates'

export function TemplateSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="home-ui-font mb-1 mt-4 px-1 text-[10.5px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] first:mt-0">
      {children}
    </p>
  )
}

export function TemplateListItem({ template, onSelect }: { template: SoulTemplate; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border border-transparent',
        'px-3 py-2.5 text-left outline-none',
        'transition-all duration-150',
        'hover:border-[var(--accent-base)]/20 hover:bg-[var(--surface-2)]',
        'focus-visible:border-[var(--accent-base)]/40 focus-visible:bg-[var(--surface-2)]',
      )}
    >
      <span
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-[18px] leading-none"
        style={{ background: `${template.accent}1a` }}
      >
        {template.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="home-ui-font block truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
          {template.name}
        </span>
        <span className="home-ui-font block truncate text-[14px] text-[var(--text-secondary)]">
          {template.description}
        </span>
      </span>
      {template.badge && (
        <span
          className="home-ui-font shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${template.accent}20`, color: template.accent }}
        >
          {template.badge}
        </span>
      )}
      <CaretRightSmall
        size={14}
        className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--text-secondary)]"
      />
    </button>
  )
}
