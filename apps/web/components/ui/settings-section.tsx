import { cn } from '@/lib/utils'

interface SettingsSectionProps {
  title?: string
  children: React.ReactNode
  first?: boolean
  className?: string
}

export function SettingsSection({ title, children, first, className }: SettingsSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        !first && 'border-t border-[var(--border)] pt-4 mt-6',
        className,
      )}
    >
      {title && (
        <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight mb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
