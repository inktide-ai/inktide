'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SoulListItemProps {
  id: string
  name: string
  isActive: boolean
  href: string
  selected: boolean
  avatarUrl?: string | null
}

export function SoulListItem({ id, name, href, selected, avatarUrl }: SoulListItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg px-2.5 transition-colors',
        selected
          ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]',
      )}
    >
      <div className="h-7 w-7 overflow-hidden rounded-md bg-gradient-to-br from-[#8456FF] to-[#EC4899] text-[14px] font-semibold text-white grid place-items-center shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{name}</p>
      <span className="hidden">{id}</span>
    </Link>
  )
}
