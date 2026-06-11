'use client'

import { useTranslation } from 'react-i18next'
import type { AiCharacter } from '@/shared/lib/character'
import { LlmSliderGroup } from '@/shared/ui/llm-slider-group'
import SliderWithTicks from '@/shared/ui/slider-with-ticks'
import { infoContent } from '../lib/panel-styles'

export interface PanelProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

export function LlmParametersPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation(['behavior'])
  const llm = character.llm
  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  return (
    <div className={infoContent}>
      <LlmSliderGroup
        llm={llm}
        onPatch={patch}
        labels={{
          temperature:      { label: t('behavior:llm.temperature.label'),      hint: t('behavior:llm.temperature.hint') },
          maxTokens:        { label: t('behavior:llm.maxTokens.label'),        hint: t('behavior:llm.maxTokens.hint') },
          topP:             { label: t('behavior:llm.topP.label'),             hint: t('behavior:llm.topP.hint') },
          frequencyPenalty: { label: t('behavior:llm.frequencyPenalty.label'), hint: t('behavior:llm.frequencyPenalty.hint') },
          presencePenalty:  { label: t('behavior:llm.presencePenalty.label'),  hint: t('behavior:llm.presencePenalty.hint') },
        }}
        renderSlider={({ value, onChange, min, max, step, format }) => (
          <SliderWithTicks
            min={min} max={max} step={step}
            value={value} onChange={onChange}
            formatValue={format}
            tickCount={5}
          />
        )}
      />
    </div>
  )
}
