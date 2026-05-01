import styles from './ProfilePage.module.css'

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
  min,
  max,
  step,
  value,
  onChange,
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
  const percent = range === 0 ? 0 : ((value - min) / range) * 100

  return (
    <div className={styles.sliderWithTicks}>
      <div className={styles.sliderTicks}>
        {uniqueTicks.map((tickVal, i) => (
          <div
            key={i}
            className={styles.sliderTick}
            style={{ left: `${uniqueTicks.length === 1 ? 100 : (i / (uniqueTicks.length - 1)) * 100}%` }}
          >
            <span className={styles.sliderTickLabel}>{formatValue(tickVal)}</span>
            <span className={styles.sliderTickMark} />
          </div>
        ))}
      </div>
      <div className={styles.sliderTrackWrap} style={{ '--fill-percent': `${percent}%` } as React.CSSProperties}>
        <div className={styles.sliderTrack} />
        <div className={styles.sliderTrackFilled} />
        <input
          type="range"
          className={styles.sliderInput}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export default SliderWithTicks
