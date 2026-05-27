import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const cardVariants = cva('', {
  variants: {
    variant: {
      default:  'rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]',
      elevated: 'rounded-2xl border border-[var(--border-default)] bg-[var(--bg-2)]',
      ghost:    'rounded-xl bg-[var(--surface-1)]',
      inset:    'rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ variant, className, children, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export { cardVariants }
