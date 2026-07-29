'use client'
import * as RadixSlider from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface SliderProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** Fill color - defaults to var(--text-secondary) */
  fill?: string
  /** Track height in px - defaults to 3 */
  trackHeight?: number
  /** Thumb size in px - defaults to 12 */
  thumbSize?: number
  className?: string
}

export function Slider({
  value, onChange,
  min = 0, max = 1, step = 0.01,
  disabled,
  fill = 'var(--text-secondary)',
  trackHeight = 3,
  thumbSize = 12,
  className,
}: SliderProps) {
  return (
    <RadixSlider.Root
      className={cn(
        'relative flex items-center select-none touch-none w-full cursor-pointer',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    >
      <RadixSlider.Track
        className="relative grow rounded-full bg-[rgba(255,255,255,0.09)]"
        style={{ height: trackHeight }}
      >
        <RadixSlider.Range
          className="absolute rounded-full h-full transition-[width] duration-75"
          style={{ background: fill }}
        />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="block rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.45)] outline-none hover:scale-[1.2] transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-white/30"
        style={{ width: thumbSize, height: thumbSize }}
      />
    </RadixSlider.Root>
  )
}
