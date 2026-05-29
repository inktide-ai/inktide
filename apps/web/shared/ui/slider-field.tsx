'use client'
import { cn } from '@/lib/utils'
import SliderWithTicks from '@/shared/ui/slider-with-ticks'

interface SliderFieldProps {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step?: number
  format?: (v: number) => string
  onChange: (v: number) => void
  tickCount?: number
  disabled?: boolean
  className?: string
}

export function SliderField({
  label, hint, value, min, max, step = 1,
  format = v => String(v), onChange, tickCount = 5,
  disabled, className,
}: SliderFieldProps) {
  return (
    <div className={cn('mb-7', disabled && 'opacity-50 pointer-events-none', className)}>
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-body-md font-bold text-[var(--text-primary)] mb-1">{label}</div>
          {hint && (
            <div className="text-caption text-[var(--text-muted)] leading-snug opacity-85">{hint}</div>
          )}
        </div>
        <span className="text-caption font-semibold font-mono text-[var(--accent-red-bright)] bg-[rgba(237,62,62,0.12)] px-1.5 py-0.5 rounded border border-[rgba(237,62,62,0.2)] flex-shrink-0 tracking-wide">
          {format(value)}
        </span>
      </div>
      <SliderWithTicks
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        formatValue={format}
        tickCount={tickCount}
      />
    </div>
  )
}
