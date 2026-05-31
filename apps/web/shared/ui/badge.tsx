import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'rounded px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default:  'bg-[var(--surface-2)] text-[var(--text-secondary)]',
        active:   'bg-[var(--active-bg)] text-[var(--active-text)]',
        paused:   'bg-[var(--warn-bg)] text-[var(--warn-text)]',
        archived: 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
        accent:   'bg-[var(--accent-soft)] text-[var(--accent-primary)]',
        info:     'bg-[var(--info-bg)] text-[var(--info-text)]',
        warn:     'bg-[var(--warn-bg)] text-[var(--warn-text)]',
        danger:   'bg-[var(--danger-bg)] text-[var(--danger-text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

export { badgeVariants }
