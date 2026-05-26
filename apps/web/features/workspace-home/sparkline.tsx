interface SparklineProps {
  values: number[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({
  values,
  color = '#8B5CF6',
  width = 96,
  height = 28,
}: SparklineProps) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / (values.length - 1)

  const path = values
    .map((value, index) => {
      const x = index * step
      const y = height - ((value - min) / span) * height
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <path d={path} stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
