'use client'
import { motion } from 'framer-motion'
import { Atom, CaretRightSmall } from '@/shared/ui/icons'
import { SOUL_TEMPLATES, type SoulTemplate } from '@/shared/data/soul-templates'
import { cn } from '@/lib/utils'
import { TemplateSectionLabel, TemplateListItem } from './wizard-template-picker'

const screenVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 24 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d * -24 }),
}
const panelTransition = { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const }

interface Props {
  direction: 1 | -1
  onSelect: (template: SoulTemplate | null) => void
}

export function WizardTemplatesScreen({ direction, onSelect }: Props) {
  return (
    <motion.div
      key="templates"
      custom={direction}
      variants={screenVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={panelTransition}
      className="flex w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md"
      style={{ maxHeight: 'min(580px, calc(100vh - 80px))' }}
    >
      <div className="flex-shrink-0 px-6 pt-6 pb-4 text-center">
        <div
          className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--accent-base) 22%, transparent)',
            color: 'var(--accent-base)',
          }}
        >
          <Atom size={20} />
        </div>
        <h2 className="home-heading-font text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Create a new soul
        </h2>
        <p className="home-ui-font mt-1 text-body text-[var(--text-secondary)]">
          Pick a personality template or start from scratch.
        </p>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 no-scrollbar"
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            const buttons = e.currentTarget.querySelectorAll('button')
            const idx = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement)
            const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1
            const target = buttons[Math.max(0, Math.min(next, buttons.length - 1))]
            target?.focus()
            target?.scrollIntoView({ block: 'nearest' })
          }
        }}
      >
        <TemplateSectionLabel>My Own</TemplateSectionLabel>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--border-subtle)]',
            'px-3 py-2.5 text-left outline-none',
            'transition-all duration-150',
            'hover:border-[var(--accent-base)]/20 hover:bg-[var(--surface-2)]',
            'focus-visible:border-[var(--accent-base)]/40 focus-visible:bg-[var(--surface-2)]',
          )}
        >
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-2)] text-[var(--text-tertiary)]">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="home-ui-font block truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
              Custom Soul
            </span>
            <span className="home-ui-font block truncate text-body text-[var(--text-secondary)]">
              Start with a blank configuration
            </span>
          </span>
          <CaretRightSmall
            size={14}
            className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--text-secondary)]"
          />
        </button>

        {(() => {
          const categoryMap = new Map<string, SoulTemplate[]>()
          for (const t of SOUL_TEMPLATES) {
            const list = categoryMap.get(t.category) ?? []
            list.push(t)
            categoryMap.set(t.category, list)
          }
          return Array.from(categoryMap.entries()).map(([category, items]) => (
            <div key={category}>
              <TemplateSectionLabel>{category}</TemplateSectionLabel>
              {items.map(tmpl => (
                <TemplateListItem
                  key={tmpl.id}
                  template={tmpl}
                  onSelect={() => onSelect(tmpl)}
                />
              ))}
            </div>
          ))
        })()}
      </div>
    </motion.div>
  )
}
