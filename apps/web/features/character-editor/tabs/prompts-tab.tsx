'use client'
import { useTranslation } from 'react-i18next'
import type { AiCharacter } from '@/shared/lib/character'

const inputBase = 'w-full py-[0.625rem] px-[0.875rem] bg-[#1e1f22] border border-[#2d2f33] rounded-[6px] text-(--text-primary) font-[var(--font-ui)] text-sm outline-none transition-[border-color,background] duration-[120ms] ease focus:border-white/20 focus:bg-[#26282e] placeholder:text-[rgba(139,144,154,0.45)]'

interface PromptsTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const PromptsTab = ({ character, onUpdate }: PromptsTabProps) => {
  const { t } = useTranslation('prompts')

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className="flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0">
        <div className="text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2">{t('section.systemPrompt')}</div>
        <div className="py-2">
          <div className="mb-7">
            <label className="block cursor-text">
              <span className="block text-body font-semibold font-[var(--font-ui)] text-(--text-primary) mb-2">{t('coreInstructions.label')}</span>
              <div className="text-xs text-(--text-muted) mt-0.5 leading-[1.4]">{t('coreInstructions.hint')}</div>
              <textarea
                id="prompts-system-prompt"
                name="systemPrompt"
                className={`${inputBase} min-h-[200px] resize-y leading-relaxed font-mono text-xs`}
                value={character.systemPrompt}
                onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
                placeholder={t('coreInstructions.placeholder')}
                rows={10}
              />
            </label>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {t('coreInstructions.counter', { count: character.systemPrompt.length })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PromptsTab
