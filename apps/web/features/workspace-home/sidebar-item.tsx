'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  href?: string
  icon: ReactNode
  label: string
  badge?: number
  active?: boolean
  layoutId?: string
}

export function SidebarItem({ href = '#', icon, label, badge, active = false, layoutId }: SidebarItemProps) {
  const usePill = active && !!layoutId

  const itemClass = cn(
    'relative h-9 w-full rounded-lg px-3 flex items-center gap-2.5 text-body font-medium transition-colors',
    active
      ? ['text-[var(--text-primary)]', !usePill && 'bg-[var(--sidebar-active)]']
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]',
  )

  const inner = (
    <>
      {usePill && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg bg-[var(--sidebar-active)]"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative flex h-4 w-4 flex-shrink-0 items-center justify-center">{icon}</span>
      <span className="relative truncate">{label}</span>
      {typeof badge === 'number' && (
        <span className="relative ml-auto min-w-5 rounded-full bg-[var(--surface-3)] px-1.5 text-center text-body text-[var(--text-secondary)]">
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
