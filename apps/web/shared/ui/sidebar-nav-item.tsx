import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SidebarNavItemProps {
  href: string
  active?: boolean
  icon: React.ReactNode
  label: string
  className?: string
}

export function SidebarNavItem({ href, active, icon, label, className }: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
          : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)]',
        className,
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </Link>
  )
}
