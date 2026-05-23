import { cn } from '@/lib/utils'

interface SidebarMenuItemProps {
  icon?: React.ReactNode
  label: string
  shortcut?: string
  variant?: 'default' | 'danger'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function SidebarMenuItem({
  icon, label, shortcut, variant = 'default', onClick, disabled, className,
}: SidebarMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-[7px] rounded-lg text-[0.8125rem] font-medium',
        'bg-transparent border-none cursor-pointer text-left transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'default' && 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
        variant === 'danger' && 'text-[rgba(255,160,160,0.9)] hover:bg-red-500/10 hover:text-[#ffc9c9]',
        className,
      )}
    >
      {icon && (
        <span className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4 [&>img]:w-[18px] [&>img]:h-[18px]">
          {icon}
        </span>
      )}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="pl-3 text-[14px] flex-shrink-0 text-[var(--text-tertiary)]">{shortcut}</span>
      )}
    </button>
  )
}
