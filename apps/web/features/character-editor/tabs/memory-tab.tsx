'use client'
import { useTranslation } from 'react-i18next'
import SliderWithTicks from '@/shared/ui/slider-with-ticks'
import type { AiCharacter } from '@/shared/lib/character'

const section = 'flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'
const sliderHeader = 'flex justify-between items-start gap-4 mb-3'
const sliderValue = 'text-[0.6875rem] font-semibold font-mono text-(--accent-red-bright) bg-[linear-gradient(135deg,rgba(237,62,62,0.15),rgba(237,62,62,0.08))] py-0.5 px-[0.375rem] rounded-[0.25rem] border border-[rgba(237,62,62,0.2)] shrink-0'
const labelInBlock = 'block text-[0.9375rem] font-bold text-(--text-primary) mb-1'
const labelHint = 'text-[0.75rem] text-(--text-muted) mt-0.5 leading-[1.4]'
const toggleRow = 'flex items-center justify-between py-2 mb-12 last:mb-0'

interface MemoryTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const MemoryTab = ({ character, onUpdate }: MemoryTabProps) => {
  const { t } = useTranslation('behavior')

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className={section}>
        <div className="text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2">{t('section.memory')}</div>
        <div className="py-2">
          <div className={toggleRow}>
            <div>
              <div className="text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary)">{t('memory.enable.label')}</div>
              <div className={labelHint}>{t('memory.enable.hint')}</div>
            </div>
            <label className="toggle-control">
              <input type="checkbox" checked={character.memory.enabled} onChange={(e) => onUpdate({ memory: { ...character.memory, enabled: e.target.checked } })} />
              <span className="toggle-track" />
            </label>
          </div>
          <div className={!character.memory.enabled ? 'opacity-45 pointer-events-none transition-opacity duration-200 ease' : undefined}>
            {[
              { label: t('memory.maxMemories.label'), hint: t('memory.maxMemories.hint'), value: character.memory.maxMemories, display: String(character.memory.maxMemories), min: 10, max: 500, step: 10, format: (v: number) => String(v), tickCount: 5, onChange: (v: number) => onUpdate({ memory: { ...character.memory, maxMemories: v } }) },
              { label: t('memory.retentionDays.label'), hint: t('memory.retentionDays.hint'), value: character.memory.retentionDays, display: `${character.memory.retentionDays}d`, min: 1, max: 365, step: 1, format: (v: number) => `${v}d`, tickCount: 6, onChange: (v: number) => onUpdate({ memory: { ...character.memory, retentionDays: v } }) },
              { label: t('memory.importanceThreshold.label'), hint: t('memory.importanceThreshold.hint'), value: character.memory.importanceThreshold, display: character.memory.importanceThreshold.toFixed(2), min: 0, max: 1, step: 0.05, format: (v: number) => v.toFixed(1), tickCount: 5, onChange: (v: number) => onUpdate({ memory: { ...character.memory, importanceThreshold: v } }) },
            ].map(({ label, hint, value, display, min, max, step, format, tickCount, onChange }) => (
              <div key={label} className="mb-7">
                <div className={sliderHeader}>
                  <div className="min-w-0 flex-1">
                    <label className={labelInBlock}>{label}</label>
                    <div className={labelHint}>{hint}</div>
                  </div>
                  <span className={sliderValue}>{display}</span>
                </div>
                <SliderWithTicks min={min} max={max} step={step} value={value} onChange={onChange} formatValue={format} tickCount={tickCount} disabled={!character.memory.enabled} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemoryTab
