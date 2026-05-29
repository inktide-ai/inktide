'use client'
import { cn } from '@/lib/utils'

interface ToggleRowProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function ToggleRow({ label, hint, checked, onChange, disabled, className }: ToggleRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-2', className)}>
      <div className="min-w-0 flex-1 pr-4">
        <div className="text-body font-semibold text-[var(--text-primary)] font-[var(--font-ui)]">
          {label}
        </div>
        {hint && (
          <div className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">{hint}</div>
        )}
      </div>
      <label className="relative block w-10 h-[22px] cursor-pointer flex-shrink-0 select-none">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
          className="absolute opacity-0 w-0 h-0 peer"
        />
        <span className={cn(
          'absolute inset-0 rounded-full transition-colors duration-150',
          checked ? 'bg-[var(--accent-red)]' : 'bg-[var(--bg-card)]',
          disabled && 'opacity-50 cursor-not-allowed',
        )} />
        <span className={cn(
          'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-[left] duration-150',
          checked ? 'left-[21px]' : 'left-[3px]',
        )} />
      </label>
    </div>
  )
}
