import { Slider } from './slider'

interface SliderWithTicksProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  tickCount?: number
  disabled?: boolean
}

const SliderWithTicks = ({
  min, max, step, value, onChange,
  formatValue = (v) => String(v),
  tickCount = 6,
  disabled = false,
}: SliderWithTicksProps) => {
  const range = max - min
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    if (tickCount === 1) return max
    const t = (i / (tickCount - 1)) * range + min
    const rounded = Math.round(t / step) * step
    return Math.min(Math.max(rounded, min), max)
  })
  const uniqueTicks = [...new Set(ticks)].sort((a, b) => a - b)

  return (
    <div className="pt-6 relative">
      {/* Tick labels */}
      <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none">
        {uniqueTicks.map((tickVal, i) => (
          <div
            key={i}
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-1"
            style={{ left: `${uniqueTicks.length === 1 ? 100 : (i / (uniqueTicks.length - 1)) * 100}%` }}
          >
            <span className="text-[0.625rem] font-medium text-(--text-muted) font-[var(--font-ui)]">
              {formatValue(tickVal)}
            </span>
            <span className="w-px h-[6px] bg-white/25 shrink-0" />
          </div>
        ))}
      </div>

      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        fill="var(--accent-red)"
        trackHeight={4}
        thumbSize={14}
      />
    </div>
  )
}

export default SliderWithTicks
