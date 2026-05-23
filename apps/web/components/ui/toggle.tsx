'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange?: (next: boolean) => void
  disabled?: boolean
  ariaLabel?: string
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, disabled, ariaLabel, size = 'md' }: ToggleProps) {
  const dims = size === 'sm'
    ? { root: 'h-[17px] w-[30px]', thumb: 'h-[13px] w-[13px]', thumbOn: 'data-[state=checked]:translate-x-[13px]' }
    : { root: 'h-[21px] w-[36px]', thumb: 'h-[15px] w-[15px]', thumbOn: 'data-[state=checked]:translate-x-[15px]' }

  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'relative shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--settings-card-bg)] disabled:cursor-not-allowed disabled:opacity-40',
        'data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-[var(--surface-2)]',
        dims.root,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block translate-x-0 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-150 will-change-transform',
          dims.thumb,
          dims.thumbOn,
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export default Toggle
