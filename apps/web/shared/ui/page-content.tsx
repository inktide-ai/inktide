import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PageMotion } from './PageMotion'

interface PageContentProps {
  children: ReactNode
  className?: string
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <PageMotion className={cn('min-h-screen bg-[var(--bg-0)]', className)}>
      <div className="mx-auto max-w-[1300px] px-6 py-6">
        {children}
      </div>
    </PageMotion>
  )
}
