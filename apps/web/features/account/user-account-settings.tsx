'use client'
import { createContext, useContext, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/context/AuthContext'
import ProfilePanel from './panels/profile-panel'
import SecurityPanel from './panels/security-panel'
import SessionsPanel from './panels/sessions-panel'
import AppearancePanel from './panels/appearance-panel'
import ConnectionsPanel from './panels/connections-panel'

export type PageId = 'profile' | 'security' | 'sessions' | 'appearance' | 'conn'

interface NavItem {
  id: PageId
  label: string
  section: string
  title: string
  sub: string
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  {
    id: 'profile',
    section: 'Account',
    label: 'Account',
    title: 'Account',
    sub: 'Manage your personal information and account details',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    id: 'security',
    section: 'Account',
    label: 'Security',
    title: 'Security',
    sub: 'Manage your password and two-factor authentication',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    id: 'sessions',
    section: 'Account',
    label: 'Sessions',
    title: 'Sessions',
    sub: 'Manage your active sessions across devices',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    id: 'appearance',
    section: 'Workspace',
    label: 'Appearance',
    title: 'Appearance',
    sub: 'Customize how the interface looks to you',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
  {
    id: 'conn',
    section: 'Workspace',
    label: 'Connections',
    title: 'Connections',
    sub: 'Manage your connected accounts and integrations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
]

const NAV_SECTIONS = NAV.reduce<{ section: string; items: NavItem[] }[]>((acc, item) => {
  const last = acc[acc.length - 1]
  if (last && last.section === item.section) {
    last.items.push(item)
  } else {
    acc.push({ section: item.section, items: [item] })
  }
  return acc
}, [])

interface AccountNavContextValue {
  activePage: PageId
  setActivePage: (page: PageId) => void
  closeModal: () => void
}

const AccountNavContext = createContext<AccountNavContextValue | null>(null)

export function useAccountNav(): AccountNavContextValue {
  const ctx = useContext(AccountNavContext)
  if (!ctx) throw new Error('useAccountNav must be used within UserAccountSettings')
  return ctx
}

interface UserAccountSettingsProps {
  initialPage?: PageId
  onClose?: () => void
}

export default function UserAccountSettings({ initialPage, onClose }: UserAccountSettingsProps = {}) {
  const { user } = useAuth()

  const [activePage, setActivePage] = useState<PageId>(initialPage ?? 'profile')

  const currentNav = NAV.find((n) => n.id === activePage)!

  const initial = user?.userName?.replace(/^\./, '').charAt(0).toUpperCase() ?? 'U'
  const displayName = user?.nickname?.trim() || user?.userName || 'User'

  const navValue: AccountNavContextValue = {
    activePage,
    setActivePage,
    closeModal: () => onClose?.(),
  }

  return (
    <AccountNavContext.Provider value={navValue}>
      <Tabs.Root
        value={activePage}
        onValueChange={(v) => setActivePage(v as PageId)}
        orientation="vertical"
        className="flex h-full min-h-0 w-full flex-row gap-0 overflow-hidden bg-(--bg-settings)"
      >
        <div className="flex w-[210px] shrink-0 flex-col border-r border-[var(--border-divider)] bg-[var(--c-bacSec)] py-[14px]">
          <Tabs.List className="flex flex-col px-2 py-[2px] outline-none" aria-label="Settings sections">
            {NAV_SECTIONS.map((group, gi) => (
              <div key={group.section}>
                <div className={cn('px-2 pb-[2px] text-[14px] font-medium leading-[16px] text-[var(--text-tertiary)]', gi === 0 ? 'pt-1' : 'pt-3')}>
                  {group.section}
                </div>
                {group.items.map((item) =>
                  item.id === 'profile' ? (
                    <Tabs.Trigger
                      key={item.id}
                      value={item.id}
                      className={cn(
                        'flex h-[28px] w-full cursor-pointer select-none items-center gap-2 rounded-[6px] border-none bg-transparent px-[6px] py-[4px] text-left text-[14px] font-medium leading-[20px] transition-colors',
                        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--c-bacSec)]',
                        'data-[state=active]:bg-[var(--sidebar-active)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:hover:bg-[var(--sidebar-active)]',
                        'data-[state=inactive]:text-[var(--text-secondary)] data-[state=inactive]:hover:bg-[var(--sidebar-hover)] data-[state=inactive]:hover:text-[var(--text-primary)]',
                      )}
                    >
                      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center">
                        <div className="h-[22px] w-[22px] select-none rounded-full">
                          {user?.pictureUrl
                            ? <img src={user.pictureUrl} alt="" className="block h-full w-full rounded-full object-cover outline outline-1 -outline-offset-1 outline-[var(--border-divider)]" />
                            : <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#8456FF] to-[#EC4899] text-[10px] font-medium text-white">{initial}</div>}
                        </div>
                      </div>
                      <span className="truncate">{displayName}</span>
                    </Tabs.Trigger>
                  ) : (
                    <Tabs.Trigger
                      key={item.id}
                      value={item.id}
                      className={cn(
                        'flex h-[28px] w-full cursor-pointer select-none items-center gap-2 rounded-[6px] border-none bg-transparent px-[6px] py-[4px] text-left text-[14px] font-medium leading-[20px] transition-colors',
                        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--c-bacSec)]',
                        'data-[state=active]:bg-[var(--sidebar-active)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:hover:bg-[var(--sidebar-active)]',
                        'data-[state=inactive]:text-[var(--text-secondary)] data-[state=inactive]:hover:bg-[var(--sidebar-hover)] data-[state=inactive]:hover:text-[var(--text-primary)]',
                      )}
                    >
                      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center [&_svg]:h-[18px] [&_svg]:w-[18px]">{item.icon}</div>
                      {item.label}
                    </Tabs.Trigger>
                  ),
                )}
              </div>
            ))}
          </Tabs.List>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 px-[26px] pb-[14px] pt-[22px]">
            <div className="text-[26px] font-semibold tracking-[-0.01em] text-[var(--text-heading)]">{currentNav.title}</div>
            <div className="mt-[2px] text-[16px] text-[var(--text-tertiary)]">{currentNav.sub}</div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="min-h-0 min-w-0 flex-1">
              <Tabs.Content value="profile" className="mt-0 outline-none">
                <div className="flex flex-col px-[26px] pb-6">
                  <ProfilePanel />
                </div>
              </Tabs.Content>
              <Tabs.Content value="security" className="mt-0 outline-none">
                <div className="flex flex-col px-[26px] pb-6">
                  <SecurityPanel />
                </div>
              </Tabs.Content>
              <Tabs.Content value="sessions" className="mt-0 outline-none">
                <div className="flex flex-col px-[26px] pb-6">
                  <SessionsPanel />
                </div>
              </Tabs.Content>
              <Tabs.Content value="appearance" className="mt-0 outline-none">
                <div className="flex flex-col px-[26px] pb-6">
                  <AppearancePanel />
                </div>
              </Tabs.Content>
              <Tabs.Content value="conn" className="mt-0 outline-none">
                <div className="flex flex-col px-[26px] pb-6">
                  <ConnectionsPanel />
                </div>
              </Tabs.Content>
            </ScrollArea>
          </div>
        </div>
      </Tabs.Root>
    </AccountNavContext.Provider>
  )
}
