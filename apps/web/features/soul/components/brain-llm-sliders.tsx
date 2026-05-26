'use client'

import type { CharacterLlm } from '@/shared/lib/character/types'

interface SliderDef {
  key: keyof CharacterLlm
  label: string
  hint: string
  min: number
  max: number
  step: number
  format: (v: number) => string
}

const SLIDERS: SliderDef[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    hint: 'Higher values make output more random and creative',
    min: 0, max: 2, step: 0.05,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'maxTokens',
    label: 'Max tokens',
    hint: 'Maximum length of the generated response',
    min: 64, max: 4096, step: 64,
    format: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)),
  },
  {
    key: 'topP',
    label: 'Top P',
    hint: 'Nucleus sampling — controls diversity of output',
    min: 0, max: 1, step: 0.05,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'frequencyPenalty',
    label: 'Frequency penalty',
    hint: 'Reduces repetition of the same phrases',
    min: 0, max: 2, step: 0.05,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'presencePenalty',
    label: 'Presence penalty',
    hint: 'Encourages talking about new topics',
    min: 0, max: 2, step: 0.05,
    format: (v) => v.toFixed(2),
  },
]

export interface BrainLlmSlidersProps {
  llm: CharacterLlm
  onPatch: (patch: Partial<CharacterLlm>) => void
}

export function BrainLlmSliders({ llm, onPatch }: BrainLlmSlidersProps) {
  return (
    <div className="flex flex-col gap-7">
      {SLIDERS.map((s) => {
        const value = llm[s.key] as number
        const pct = ((value - s.min) / (s.max - s.min)) * 100
        return (
          <div key={s.key}>
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <label className="block text-[0.875rem] font-semibold text-zinc-100">
                  {s.label}
                </label>
                <span className="mt-0.5 block text-[0.6875rem] text-zinc-500">
                  {s.hint}
                </span>
              </div>
              <span className="shrink-0 rounded-md bg-[rgba(34,197,94,0.12)] px-2 py-0.5 font-mono text-[0.6875rem] font-semibold text-[#22c55e]">
                {s.format(value)}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={value}
              onChange={(e) => onPatch({ [s.key]: Number(e.target.value) })}
              className="brain-slider w-full"
              style={{ '--slider-pct': `${pct}%` } as React.CSSProperties}
            />
          </div>
        )
      })}
    </div>
  )
}
