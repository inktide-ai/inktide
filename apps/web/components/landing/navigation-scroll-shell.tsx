'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'

export function NavigationScrollShell({ children }: { children: ReactNode }) {
  const hidden = useHideOnScroll()
  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-[1000] px-4 md:px-8 h-[60px]',
        'bg-[var(--nav-bg)] [backdrop-filter:blur(14px)] [-webkit-backdrop-filter:blur(14px)]',
        'border-b border-[var(--nav-border-color)]',
        'transition-transform duration-[350ms] ease-[ease]',
        hidden ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      {children}
    </nav>
  )
}
