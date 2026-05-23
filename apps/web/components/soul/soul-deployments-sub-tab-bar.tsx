'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

interface SoulDeploymentsSubTabBarProps {
  soulId: string
}

const SUB_TABS = [
  { key: 'brain',    label: 'Brain',    href: (id: string) => `/souls/${id}/brain` },
  { key: 'behavior', label: 'Behavior', href: (id: string) => `/souls/${id}/behavior` },
  { key: 'avatars',  label: 'Avatars',  href: (id: string) => `/souls/${id}/avatars` },
  { key: 'emotion',  label: 'Emotion',  href: (id: string) => `/souls/${id}/emotion` },
  { key: 'voice',    label: 'Voice',    href: (id: string) => `/souls/${id}/voice` },
  { key: 'scenes',   label: 'Scenes',   href: (id: string) => `/souls/${id}/scenes` },
] as const

const activeCls = cn(
  'inline-flex items-center rounded-md border px-3 py-1',
  'text-[14px] font-semibold whitespace-nowrap transition-colors outline-none',
  'border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-primary)]',
)

const inactiveCls = cn(
  'inline-flex items-center rounded-md px-3 py-1',
  'text-[14px] font-medium whitespace-nowrap transition-colors outline-none',
  'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
)

function subTabValueFromPath(pathname: string | null, soulId: string): string {
  if (!pathname) return 'brain'
  const base = `/souls/${soulId}`
  if (pathname.startsWith(`${base}/brain`))    return 'brain'
  if (pathname.startsWith(`${base}/behavior`)) return 'behavior'
  if (pathname.startsWith(`${base}/avatars`))  return 'avatars'
  if (pathname.startsWith(`${base}/emotion`))  return 'emotion'
  if (pathname.startsWith(`${base}/voice`))    return 'voice'
  if (pathname.startsWith(`${base}/scenes`))   return 'scenes'
  return 'brain'
}

export function SoulDeploymentsSubTabBar({ soulId }: SoulDeploymentsSubTabBarProps) {
  const pathname = usePathname()
  const tabValue = subTabValueFromPath(pathname, soulId)

  return (
    <Tabs.Root value={tabValue} className="w-full">
      <Tabs.List
        className={cn(
          'flex items-center gap-0.5 overflow-x-auto',
          'border-b border-[var(--border-divider)] bg-[var(--surface-0)]',
          'px-5 py-2 outline-none',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
        aria-label="Deployment sections"
      >
        {SUB_TABS.map((tab) => {
          const isActive = tabValue === tab.key
          return (
            <Tabs.Trigger key={tab.key} value={tab.key} asChild>
              <Link
                href={tab.href(soulId)}
                scroll={false}
                className={isActive ? activeCls : inactiveCls}
              >
                {tab.label}
              </Link>
            </Tabs.Trigger>
          )
        })}
      </Tabs.List>
    </Tabs.Root>
  )
}
