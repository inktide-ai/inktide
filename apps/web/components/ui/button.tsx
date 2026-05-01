import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'link'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-bright)] shadow-sm',
  outline:
    'border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-white/5',
  ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-white/5',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  link: 'bg-transparent text-[var(--accent-primary)] underline-offset-4 hover:underline p-0 h-auto',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
