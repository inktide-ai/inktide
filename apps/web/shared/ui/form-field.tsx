import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn('mb-7', className)}>
      <label className="block cursor-text">
        <span className="block text-[0.875rem] font-semibold text-[var(--text-primary)] mb-2 font-[var(--font-ui)]">
          {label}
        </span>
        {hint && (
          <span className="block text-xs text-[var(--text-muted)] mb-2 leading-snug opacity-85">
            {hint}
          </span>
        )}
        {children}
      </label>
    </div>
  )
}
