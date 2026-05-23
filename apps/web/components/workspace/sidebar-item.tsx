'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  href?: string
  icon: ReactNode
  label: string
  badge?: number
  active?: boolean
}

export function SidebarItem({ href = '#', icon, label, badge, active = false }: SidebarItemProps) {
  const itemClass = cn(
    'h-9 w-full rounded-lg px-3 flex items-center gap-2.5 text-[14px] font-medium transition-colors',
    active
      ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]',
  )

  const inner = (
    <>
      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
      {typeof badge === 'number' && (
        <span className="ml-auto min-w-5 rounded-full bg-[var(--surface-3)] px-1.5 text-center text-[14px] text-[var(--text-secondary)]">
          {badge}
        </span>
      )}
    </>
  )

  if (href === '#') {
    return (
      <button type="button" className={itemClass}>
        {inner}
      </button>
    )
  }

  return (
    <Link href={href} className={itemClass}>
      {inner}
    </Link>
  )
}
