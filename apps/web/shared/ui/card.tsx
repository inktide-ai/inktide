import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type CardVariant = 'default' | 'elevated' | 'ghost' | 'inset'

const variantClasses: Record<CardVariant, string> = {
  default:  'rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]',
  elevated: 'rounded-2xl border border-[var(--border-default)] bg-[var(--bg-2)]',
  ghost:    'rounded-xl bg-[var(--surface-1)]',
  inset:    'rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]',
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </div>
  )
}
