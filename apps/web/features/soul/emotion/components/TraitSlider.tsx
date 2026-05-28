import { cn } from '@/lib/utils'

interface TraitSliderProps {
  label: string
  hint?: string
  lowLabel?: string
  highLabel?: string
  value: number
  onChange: (v: number) => void
}

export default function TraitSlider({ label, hint, lowLabel, highLabel, value, onChange }: TraitSliderProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="py-0.5">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-body font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-xs font-mono tabular-nums text-[var(--text-tertiary)]">{pct}%</span>
      </div>
      {hint && <p className="text-xs text-[var(--text-tertiary)] mb-2 leading-[1.4]">{hint}</p>}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          'w-full cursor-pointer appearance-none rounded-full outline-none',
          '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.45)]',
          '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100',
          '[&::-webkit-slider-thumb]:hover:scale-[1.2]',
          '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3',
          '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white',
          '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.45)]',
        )}
        style={{
          height: '3px',
          background: `linear-gradient(to right, var(--accent-primary) ${pct}%, rgba(255,255,255,0.09) ${pct}%)`,
        }}
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between mt-1">
          <span className="text-2xs text-[var(--text-tertiary)]">{lowLabel}</span>
          <span className="text-2xs text-[var(--text-tertiary)]">{highLabel}</span>
        </div>
      )}
    </div>
  )
}
