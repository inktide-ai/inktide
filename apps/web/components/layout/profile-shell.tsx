'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { IconSearch } from '@/features/character-editor/tab-icons'
import { Home } from '@/components/icons'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { getBannerAccent } from '@/shared/ui/banner-presets'
import CreateCharacterForm from '@/features/character-editor/create-character-form'
import { createDefaultCharacter } from '@/shared/lib/character'
import { HOME_ROUTE } from '@/lib/routes'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { SidebarNavItem } from '@/shared/ui/sidebar-nav-item'
import AccountSettingsModal from '@/features/account/account-settings-modal'
import type { PageId } from '@/features/account/user-account-settings'
import { SidebarAccountMenu } from '@/shared/ui/sidebar-account-menu'
import { SidebarProjectItem } from '@/shared/ui/sidebar-project-item'
function getSidebarHandle(rawUserName: string | undefined, email: string | null): string {
  const em = email?.trim().toLowerCase() ?? ''
  const un = rawUserName?.trim() ?? ''
  if (un) {
    if (un.includes('@')) {
      const local = un.split('@')[0]?.trim() ?? un
      return local.startsWith('.') ? local : `.${local}`
    }
    if (em && un.toLowerCase() === em) {
      const local = email!.split('@')[0]?.trim() ?? un
      return local.startsWith('.') ? local : `.${local}`
    }
    return un.startsWith('.') ? un : `.${un}`
  }
  const local = email?.split('@')[0]?.trim()
  if (local) return local.startsWith('.') ? local : `.${local}`
  return 'User'
}

interface ProfileShellProps {
  children: ReactNode
}

export default function ProfileShell({ children }: ProfileShellProps) {
  const { t } = useTranslation(['common', 'profile'])
  const router = useRouter()
  const pathname = usePathname()
  const { userEmail, user } = useAuth()
  const isHome = pathname === HOME_ROUTE

  const { cardList, characters, selected, selectCard, addCharacter } = useCharactersContext()

  const [isCreating, setIsCreating]     = useState(false)
  const [search, setSearch]             = useState('')
  const [searchOpen, setSearchOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountModalPage, setAccountModalPage] = useState<PageId>('profile')

  const sidebarHandle = getSidebarHandle(user?.userName, userEmail)
  const sidebarPrimaryTitle = user?.nickname?.trim() ? user.nickname.trim() : sidebarHandle
  const initial = sidebarPrimaryTitle.replace(/^\./, '').charAt(0).toUpperCase() || 'U'

  const handleSelectCard = useCallback(async (id: string) => {
    await selectCard(id)
    router.push(HOME_ROUTE)
  }, [selectCard, router])

  const filteredCards = cardList.filter(c =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-deeper)]">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="flex w-72 flex-shrink-0 flex-col bg-[var(--c-bacSec)] shadow-[inset_calc(var(--direction)*-1px)_0_0_0_var(--c-borSec)]">

        {/* ── User header ──────────────────────────────────────────────── */}
        <div className="relative">
          <SidebarAccountMenu
            open={userMenuOpen}
            onClose={() => setUserMenuOpen(false)}
            panel="profile"
            onOpenProfile={() => {
              setAccountModalPage('profile')
              setAccountModalOpen(true)
            }}
            onOpenSettings={() => {
              setAccountModalPage('security')
              setAccountModalOpen(true)
            }}
          />

          <div className="flex items-center justify-between px-3 py-2.5">
            <button
              type="button"
              onClick={() => setUserMenuOpen(o => !o)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer min-w-0 group"
            >
              {/* Avatar 20×20 */}
              <div
                className="flex items-center justify-center font-bold text-[9px] text-white flex-shrink-0 overflow-hidden"
                style={{ width: 22, height: 22, borderRadius: 4, background: 'linear-gradient(135deg, #e05252, #8B5CF6)' }}
              >
                {user?.pictureUrl
                  ? <img src={user.pictureUrl} alt="" className="w-full h-full object-cover block" />
                  : initial}
              </div>
              {/* Email + slide-up status */}
              <div className="flex min-w-0 flex-1 flex-col items-start overflow-hidden">
                <span className="w-full truncate text-[14px] font-semibold leading-snug text-[var(--text-primary)]">
                  {userEmail ?? sidebarPrimaryTitle}
                </span>
                <div className="h-[12px] w-full overflow-hidden">
                  <div className="flex flex-col transition-transform duration-200 ease-out group-hover:-translate-y-[12px]">
                    <span className="block h-[12px] truncate text-left text-[10px] leading-[12px] text-[var(--text-secondary)]">
                      Free Plan
                    </span>
                    <span className="block h-[12px] truncate text-left text-[10px] leading-[12px] text-[var(--text-secondary)]">
                      {sidebarHandle}
                    </span>
                  </div>
                </div>
              </div>
              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden
                className={cn('flex-shrink-0 text-[var(--text-primary)] transition-transform duration-200', userMenuOpen && 'rotate-180')}
              >
                <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Panel toggle */}
            <button type="button" aria-label="Toggle panel"
              className="flex items-center justify-center bg-transparent border-none p-0 cursor-pointer flex-shrink-0"
            >
              <img
                src="/icons/panel-toggle.svg"
                className="h-[20px] w-[20px] invert dark:invert-0 opacity-80"
                alt=""
                aria-hidden
              />
            </button>
          </div>
        </div>

        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <nav className="px-2 pt-1 flex flex-col gap-0.5">
          <SidebarNavItem href={HOME_ROUTE} active={isHome && !isCreating} icon={<Home size={16} />} label={t('common:sidebar.sandbox')} />
        </nav>

        {/* ── Projects ─────────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[var(--border-subtle)] pb-1 pt-2">
          {/* Header row — toggles between label and search input */}
          <div className="px-2 pb-1.5">
            {searchOpen ? (
              <div className="flex h-[30px] items-center gap-1.5">
                {/* Search box — ends BEFORE the × */}
                <div className="flex h-full flex-1 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-0 box-border">
                  <span className="flex flex-shrink-0 text-[var(--text-tertiary)] [&>svg]:h-[14px] [&>svg]:w-[14px]">
                    <IconSearch />
                  </span>
                  <input
                    type="text" autoFocus
                    placeholder="Find..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && (setSearchOpen(false), setSearch(''))}
                    className="min-w-0 flex-1 border-none bg-transparent text-[0.8125rem] text-[var(--text-primary)] caret-[var(--accent-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
                {/* × OUTSIDE the search box border */}
                <button type="button" onClick={() => { setSearchOpen(false); setSearch('') }}
                  className="flex h-[30px] w-[30px] flex-shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <svg width="14" height="14" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 py-1">
                <span className="font-[family-name:var(--font-ui)] text-[0.8125rem] font-medium text-[var(--text-tertiary)]">
                  {t('common:sidebar.projects')}
                </span>
                <button type="button" aria-label="Search"
                  onClick={() => setSearchOpen(true)}
                  className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-[var(--text-tertiary)] opacity-70 hover:opacity-100"
                >
                  <span className="[&>svg]:w-[16px] [&>svg]:h-[16px]"><IconSearch /></span>
                </button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 px-2">
            <div className="flex flex-col gap-0.5 pb-3">
              {filteredCards.map((c) => {
                const char = characters.get(c.id)
                const bannerIdx = char?.appearance.bannerColorIndex ?? 0
                const accentColor = char?.appearance.bannerCustomColor ?? getBannerAccent(bannerIdx)
                return (
                  <SidebarProjectItem
                    key={c.id}
                    name={c.name}
                    slug={c.slug}
                    avatarUrl={c.avatar_url}
                    accentColor={accentColor}
                    bannerIdx={bannerIdx}
                    isSelected={selected?.id === c.id}
                    isActive={c.is_active}
                    onClick={() => void handleSelectCard(c.id)}
                  />
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ── New soul ─────────────────────────────────────────────────── */}
        <div className="px-2 py-3">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] text-[0.8125rem] font-medium text-[var(--text-secondary)] outline-none transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:border-[var(--accent-primary)] active:bg-[var(--accent-soft)]"
          >
            <span className="-mt-0.5 text-base font-light leading-none">+</span>
            {t('common:sidebar.createNew')}
          </button>
        </div>

      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden bg-[var(--bg-deeper)]">
        {isCreating ? (
          <CreateCharacterForm
            onSave={(c) => { void addCharacter(c); setIsCreating(false) }}
            onCancel={() => setIsCreating(false)}
            defaultValues={createDefaultCharacter()}
          />
        ) : (
          children
        )}
      </main>

      <AccountSettingsModal
        open={accountModalOpen}
        initialPage={accountModalPage}
        onClose={() => setAccountModalOpen(false)}
      />
    </div>
  )
}
