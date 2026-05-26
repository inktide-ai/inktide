'use client'

import { useTranslation } from 'react-i18next'
import type { AiCharacter } from '@/shared/lib/character'
import SliderWithTicks from '@/shared/ui/slider-with-ticks'
import { infoContent, sliderHeader, sliderValue, labelHint, labelInBlock } from '../lib/panel-styles'

export interface PanelProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

export function LlmParametersPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation(['behavior'])
  const llm = character.llm
  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  const sliders = [
    { key: 'temperature',      label: t('behavior:llm.temperature.label'),       hint: t('behavior:llm.temperature.hint'),       val: llm.temperature,      disp: llm.temperature.toFixed(2),      min: 0,  max: 2,    step: 0.05, fmt: (v: number) => v.toFixed(1), tc: 5, cb: (v: number) => patch({ temperature: v }) },
    { key: 'maxTokens',        label: t('behavior:llm.maxTokens.label'),         hint: t('behavior:llm.maxTokens.hint'),         val: llm.maxTokens,        disp: String(llm.maxTokens),           min: 64, max: 4096, step: 64,   fmt: (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v)), tc: 5, cb: (v: number) => patch({ maxTokens: v }) },
    { key: 'topP',             label: t('behavior:llm.topP.label'),              hint: t('behavior:llm.topP.hint'),              val: llm.topP,             disp: llm.topP.toFixed(2),             min: 0,  max: 1,    step: 0.05, fmt: (v: number) => v.toFixed(1), tc: 5, cb: (v: number) => patch({ topP: v }) },
    { key: 'frequencyPenalty', label: t('behavior:llm.frequencyPenalty.label'),  hint: t('behavior:llm.frequencyPenalty.hint'),  val: llm.frequencyPenalty, disp: llm.frequencyPenalty.toFixed(2), min: 0,  max: 2,    step: 0.05, fmt: (v: number) => v.toFixed(1), tc: 5, cb: (v: number) => patch({ frequencyPenalty: v }) },
    { key: 'presencePenalty',  label: t('behavior:llm.presencePenalty.label'),   hint: t('behavior:llm.presencePenalty.hint'),   val: llm.presencePenalty, disp: llm.presencePenalty.toFixed(2),   min: 0,  max: 2,    step: 0.05, fmt: (v: number) => v.toFixed(1), tc: 5, cb: (v: number) => patch({ presencePenalty: v }) },
  ]

  return (
    <div className={infoContent}>
      {sliders.map(({ key, label: lbl, hint, val, disp, min, max, step, fmt, tc, cb }) => (
        <div key={key} className="mb-7">
          <div className={sliderHeader}>
            <div className="min-w-0 flex-1">
              <label className={labelInBlock}>{lbl}</label>
              <div className={labelHint}>{hint}</div>
            </div>
            <span className={sliderValue}>{disp}</span>
          </div>
          <SliderWithTicks min={min} max={max} step={step} value={val} onChange={cb} formatValue={fmt} tickCount={tc} />
        </div>
      ))}
    </div>
  )
}
