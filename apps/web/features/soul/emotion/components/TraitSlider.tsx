import { Slider } from '@/shared/ui/slider'

interface TraitSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
  lowLabel?: string
  highLabel?: string
}

export default function TraitSlider({ label, value, onChange, hint, lowLabel, highLabel }: TraitSliderProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--text-primary)]">{label}</span>
        <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums">{pct}</span>
      </div>
      {hint && <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-[1.4]">{hint}</p>}
      <Slider
        value={value} onChange={onChange}
        min={0} max={1} step={0.01}
        fill="var(--text-primary)"
        trackHeight={2}
        thumbSize={10}
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[var(--text-tertiary)]">{lowLabel}</span>
          <span className="text-[10px] text-[var(--text-tertiary)]">{highLabel}</span>
        </div>
      )}
    </div>
  )
}
