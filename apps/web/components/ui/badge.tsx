import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

export type BadgeVariant = 'default' | 'active' | 'paused' | 'archived' | 'accent' | 'info' | 'warn' | 'danger'

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-[var(--surface-2)] text-[var(--text-secondary)]',
  active:   'bg-[#16332A] text-[#4ADE80]',
  paused:   'bg-[#332A16] text-[#F59E0B]',
  archived: 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
  accent:   'bg-[var(--accent-soft)] text-[var(--accent-primary)]',
  info:     'bg-[var(--info-bg)] text-[var(--info-text)]',
  warn:     'bg-[var(--warn-bg)] text-[var(--warn-text)]',
  danger:   'bg-[var(--danger-bg)] text-[var(--danger-text)]',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn('rounded px-2 py-0.5 text-[14px] font-medium', variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}
