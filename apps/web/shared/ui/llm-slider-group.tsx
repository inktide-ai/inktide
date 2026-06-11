'use client'

import type { ReactNode } from 'react'
import type { CharacterLlm } from '@/shared/lib/character/types'

export interface SliderRenderProps {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}

export interface LlmSliderGroupProps {
  llm: CharacterLlm
  onPatch: (patch: Partial<CharacterLlm>) => void
  renderSlider: (props: SliderRenderProps) => ReactNode
  labels?: Partial<Record<'temperature' | 'maxTokens' | 'topP' | 'frequencyPenalty' | 'presencePenalty', { label: string; hint: string }>>
}

export const LLM_SLIDER_DEFS = [
  {
    key: 'temperature' as const,
    label: 'Temperature',
    hint: 'Higher values make output more random and creative',
    min: 0, max: 2, step: 0.05,
    format: (v: number) => v.toFixed(2),
  },
  {
    key: 'maxTokens' as const,
    label: 'Max tokens',
    hint: 'Maximum length of the generated response',
    min: 64, max: 4096, step: 64,
    format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v),
  },
  {
    key: 'topP' as const,
    label: 'Top P',
    hint: 'Nucleus sampling — controls diversity of output',
    min: 0, max: 1, step: 0.05,
    format: (v: number) => v.toFixed(2),
  },
  {
    key: 'frequencyPenalty' as const,
    label: 'Frequency penalty',
    hint: 'Reduces repetition of the same phrases',
    min: 0, max: 2, step: 0.05,
    format: (v: number) => v.toFixed(2),
  },
  {
    key: 'presencePenalty' as const,
    label: 'Presence penalty',
    hint: 'Encourages talking about new topics',
    min: 0, max: 2, step: 0.05,
    format: (v: number) => v.toFixed(2),
  },
] as const

export function LlmSliderGroup({ llm, onPatch, renderSlider, labels }: LlmSliderGroupProps) {
  return (
    <div className="flex flex-col gap-7">
      {LLM_SLIDER_DEFS.map((s) => {
        const value = llm[s.key]
        const label = labels?.[s.key]?.label ?? s.label
        const hint = labels?.[s.key]?.hint ?? s.hint

        return (
          <div key={s.key}>
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-[var(--text-primary)]">{label}</span>
                <span className="mt-0.5 block text-caption text-[var(--text-secondary)]">{hint}</span>
              </div>
              <span className="shrink-0 rounded-md bg-[var(--color-online)]/12 px-2 py-0.5 font-mono text-caption font-semibold text-[var(--color-online)]">
                {s.format(value)}
              </span>
            </div>
            {renderSlider({
              value,
              onChange: (v) => onPatch({ [s.key]: v }),
              min: s.min,
              max: s.max,
              step: s.step,
              format: s.format,
            })}
          </div>
        )
      })}
    </div>
  )
}
