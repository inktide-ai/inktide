import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'outline' | 'secondary'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--accent-primary)] text-white',
  outline: 'border border-[var(--border)] text-[var(--text-muted)] bg-transparent',
  secondary: 'bg-[var(--bg-card)] text-[var(--text-muted)]',
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
