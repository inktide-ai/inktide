'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { cn } from '@/lib/utils'

interface SoulTabBarProps {
  soulId: string
}

const TABS = [
  { key: 'overview',     label: 'Overview',     href: (id: string) => `/souls/${id}` },
  { key: 'deployments',  label: 'Deployments',  href: (id: string) => `/souls/${id}/brain` },
] as const


const activeCls = cn(
  'inline-flex items-center rounded-md border px-3 py-1.5',
  'text-body font-semibold whitespace-nowrap transition-colors outline-none',
  'border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-primary)]',
)

const inactiveCls = cn(
  'inline-flex items-center rounded-md px-3 py-1.5',
  'text-body font-medium whitespace-nowrap transition-colors outline-none',
  'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
)

const disabledCls = cn(
  'inline-flex items-center rounded-md px-3 py-1.5',
  'text-body font-medium whitespace-nowrap',
  'cursor-not-allowed opacity-40 text-[var(--text-secondary)]',
)


function tabValueFromPath(pathname: string | null, soulId: string): string {
  if (!pathname) return 'overview'
  const base = `/souls/${soulId}`
  if (pathname === base || pathname === `${base}/`) return 'overview'
  return 'deployments'
}


export function SoulTabBar({ soulId }: SoulTabBarProps) {
  const pathname  = usePathname()
  const tabValue  = tabValueFromPath(pathname, soulId)

  return (
    <Tabs value={tabValue} className="w-full">
      <TabsList
        className={cn(
          'flex items-center gap-1 overflow-x-auto',
          'border-b border-[var(--border-divider)] bg-[var(--surface-topbar)]',
          'px-5 py-3 outline-none',
          // hide scrollbar across browsers
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
        aria-label="Soul sections"
      >
        {TABS.map((tab) => {
          const href          = tab.href(soulId)
          const isPlaceholder = href === '#'
          const isActive      = tabValue === tab.key

          if (isPlaceholder) {
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                disabled
                className={disabledCls}
              >
                {tab.label}
              </TabsTrigger>
            )
          }

          return (
            <TabsTrigger key={tab.key} value={tab.key} asChild>
              <Link
                href={href}
                scroll={false}
                className={isActive ? activeCls : inactiveCls}
              >
                {tab.label}
              </Link>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
