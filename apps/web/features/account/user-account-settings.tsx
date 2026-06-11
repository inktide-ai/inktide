'use client'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { createContext, useContext, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { useAuth } from '@/shared/services/auth'
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

function buildNav(t: (key: string) => string): NavItem[] {
  return [
    {
      id: 'profile',
      section: t('nav.account'),
      label: t('nav.account'),
      title: t('nav.account'),
      sub: t('nav.accountDesc'),
      icon: null,
    },
    {
      id: 'security',
      section: t('nav.account'),
      label: t('nav.security'),
      title: t('nav.security'),
      sub: t('nav.securityDesc'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
    },
    {
      id: 'sessions',
      section: t('nav.account'),
      label: t('nav.sessions'),
      title: t('nav.sessions'),
      sub: t('nav.sessionsDesc'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
      ),
    },
    {
      id: 'appearance',
      section: t('nav.workspace'),
      label: t('nav.preferences'),
      title: t('nav.preferences'),
      sub: t('nav.preferencesDesc'),
      icon: <SlidersHorizontal size={18} strokeWidth={1.8} />,
    },
    {
      id: 'conn',
      section: t('nav.workspace'),
      label: t('nav.connections'),
      title: t('nav.connections'),
      sub: t('nav.connectionsDesc'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ),
    },
  ]
}

const TAB_CLS = cn(
  'flex h-[28px] w-full cursor-pointer select-none items-center gap-2',
  'rounded-[6px] border-none bg-transparent px-[6px] py-[4px]',
  'text-left text-[14px] font-medium leading-[20px] transition-colors',
  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--c-bacSec)]',
  'data-[state=active]:bg-[var(--sidebar-active)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:hover:bg-[var(--sidebar-active)]',
  'data-[state=inactive]:text-[var(--text-secondary)] data-[state=inactive]:hover:bg-[var(--sidebar-hover)] data-[state=inactive]:hover:text-[var(--text-primary)]',
)

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
  const { t } = useTranslation('account')
  const { user } = useAuth()
  const [activePage, setActivePage] = useState<PageId>(initialPage ?? 'profile')

  const NAV = buildNav(t)
  const NAV_SECTIONS = NAV.reduce<{ section: string; items: NavItem[] }[]>((acc, item) => {
    const last = acc[acc.length - 1]
    if (last && last.section === item.section) last.items.push(item)
    else acc.push({ section: item.section, items: [item] })
    return acc
  }, [])

  const initial = user?.userName?.replace(/^\./, '').charAt(0).toUpperCase() ?? 'U'
  const displayName = user?.nickname?.trim() || user?.userName || 'User'

  const navValue: AccountNavContextValue = {
    activePage,
    setActivePage,
    closeModal: () => onClose?.(),
  }

  return (
    <AccountNavContext.Provider value={navValue}>
      <Tabs
        value={activePage}
        onValueChange={(v) => setActivePage(v as PageId)}
        orientation="vertical"
        className="flex h-full min-h-0 w-full flex-row gap-0 overflow-hidden bg-(--bg-settings)"
      >
        <div className="flex w-[240px] shrink-0 flex-col border-r border-[var(--border-divider)] bg-[var(--c-bacSec)] overflow-y-auto">
          <TabsList className="flex flex-col gap-3 px-2 py-2 outline-none" aria-label="Settings sections">
            {NAV_SECTIONS.map((group) => (
              <div key={group.section} className="flex flex-col gap-0.5">
                {/* Group label — 12px/500/tertiary, 6px padding — matches Notion */}
                <div className="px-2 py-[6px] overflow-hidden text-ellipsis text-[12px] font-medium leading-[16px] text-[var(--text-tertiary)]">
                  {group.section}
                </div>

                {group.items.map((item) =>
                  item.id === 'profile' ? (
                    <TabsTrigger key={item.id} value={item.id} className={TAB_CLS}>
                      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center">
                        <div className="h-[22px] w-[22px] select-none rounded-full overflow-hidden">
                          {user?.pictureUrl
                            ? <img src={user.pictureUrl} alt="" className="block h-full w-full rounded-full object-cover outline outline-1 -outline-offset-1 outline-[var(--border-divider)]" />
                            : <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#8456FF] to-[#EC4899] text-2xs font-medium text-white">{initial}</div>}
                        </div>
                      </div>
                      <span className="truncate">{displayName}</span>
                    </TabsTrigger>
                  ) : (
                    <TabsTrigger key={item.id} value={item.id} className={TAB_CLS}>
                      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center">{item.icon}</div>
                      {item.label}
                    </TabsTrigger>
                  ),
                )}
              </div>
            ))}
          </TabsList>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-primary)]">
          <ScrollArea className="min-h-0 min-w-0 flex-1">
            {NAV.map((nav) => (
              <TabsContent key={nav.id} value={nav.id} className="mt-0 outline-none">
                {/* Notion-style: padding responsive, title inside scroll, max-width 800px */}
                <div className="flex justify-center items-start px-[clamp(18px,5vw,60px)] py-9">
                  <div className="flex flex-col gap-9 w-full max-w-[800px]">
                    <header>
                      <div className="text-[26px] font-semibold leading-[32px] tracking-[-0.01em] text-[var(--text-heading)]">
                        {nav.title}
                      </div>
                      <div className="mt-[2px] text-[16px] leading-[24px] text-[var(--text-tertiary)]">
                        {nav.sub}
                      </div>
                    </header>
                    <section>
                      {nav.id === 'profile'    && <ProfilePanel />}
                      {nav.id === 'security'   && <SecurityPanel />}
                      {nav.id === 'sessions'   && <SessionsPanel />}
                      {nav.id === 'appearance' && <AppearancePanel />}
                      {nav.id === 'conn'       && <ConnectionsPanel />}
                    </section>
                  </div>
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </div>
      </Tabs>
    </AccountNavContext.Provider>
  )
}
