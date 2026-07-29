import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-lg px-3 text-body',
        'bg-[var(--input-bg)] border border-[var(--input-border)]',
        'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
        'outline-none focus:border-[var(--input-border-focus)]',
        'transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
