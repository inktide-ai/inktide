'use client'

import { useState, useCallback, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  IconSearch, IconUser, IconSettings, IconTrash, IconLogout,
} from '@/components/ProfilePage/TabIcons'
import { LayoutDashboard, GitBranch } from 'lucide-react'
import { useCharactersContext } from '@/context/CharactersContext'
import { getBannerAccent, getBannerGradient } from '@/components/ProfilePage/bannerPresets'
import CreateCharacterForm from '@/components/ProfilePage/CreateCharacterForm'
import { createDefaultCharacter } from '@/lib/character'
import { HOME_ROUTE, GRAPH_ROUTE, profileSettingsPath } from '@/lib/routes'
import { ScrollArea } from '@/components/ui/scroll-area'
import { deleteAccount } from '@/api/me'

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

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 3)}...`
}

interface ProfileShellProps {
  children: ReactNode
}

export default function ProfileShell({ children }: ProfileShellProps) {
  const { t } = useTranslation(['common', 'profile'])
  const router = useRouter()
  const pathname = usePathname()
  const { userEmail, user, logout } = useAuth()
  const isHome = pathname === HOME_ROUTE
  const isGraph = pathname === GRAPH_ROUTE

  const { cardList, characters, selected, selectCard, addCharacter } = useCharactersContext()

  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const sidebarHandle = getSidebarHandle(user?.userName, userEmail)
  const sidebarPrimaryTitle = user?.nickname?.trim() ? user.nickname.trim() : sidebarHandle
  const initial = sidebarPrimaryTitle.replace(/^\./, '').charAt(0).toUpperCase() || 'U'

  const handleSelectCard = useCallback(async (id: string) => {
    await selectCard(id)
    router.push(HOME_ROUTE)
  }, [selectCard, router])

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false)
    logout()
    router.push('/')
  }, [logout, router])

  const handleOpenProfile = useCallback(() => {
    setUserMenuOpen(false)
    router.push(profileSettingsPath('identity'))
  }, [router])

  const handleOpenSettings = useCallback(() => {
    setUserMenuOpen(false)
    router.push('/settings')
  }, [router])

  const handleDeleteAccount = useCallback(async () => {
    setUserMenuOpen(false)
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    setIsDeletingAccount(true)
    try {
      await deleteAccount()
      logout()
      router.push('/')
    } catch (e) {
      console.error(e)
    } finally {
      setIsDeletingAccount(false)
    }
  }, [logout, router])

  const filteredCards = cardList.filter(c =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-dark)]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[#3E3E3B] bg-[#1C1C1B]">

        {/* Header: logo + panel toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#3E3E3B]">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer"
          >
            <img src="/logo/icon_white.svg" className="h-5 w-auto object-contain" alt="Inktide" />
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden className="opacity-70 mt-0.5">
              <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="flex items-center justify-center bg-transparent border-none p-0 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Toggle panel"
          >
            <img src="/icons/panel-toggle.svg" className="w-[20px] h-[20px]" alt="" aria-hidden />
          </button>
        </div>

        {/* Create button */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[0.8125rem] font-medium text-[var(--text-muted)] bg-transparent border border-dashed border-[#3E3E3B] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span className="text-base font-light leading-none">+</span>
            {t('common:sidebar.createNew')}
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 pt-2 flex flex-col gap-0.5">
          <Link
            href={HOME_ROUTE}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-colors',
              isHome && !isCreating
                ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]',
            )}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" aria-hidden />
            {t('common:sidebar.sandbox')}
          </Link>
          <Link
            href={GRAPH_ROUTE}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-colors',
              isGraph
                ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]',
            )}
          >
            <GitBranch className="w-4 h-4 flex-shrink-0" aria-hidden />
            Graph builder
          </Link>
        </nav>

        {/* Search */}
        <div className="px-3 pt-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9E9E9C' }}>
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder={t('common:sidebar.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg placeholder:text-[#9E9E9C] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              style={{ background: '#2A2A28', border: '1px solid #3E3E3B', color: '#9E9E9C' }}
            />
          </div>
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-hidden flex flex-col pt-4 min-h-0">
          <div className="px-4 pb-2 font-medium" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#8C8C8A' }}>
            {t('common:sidebar.projects')}
          </div>
          <ScrollArea className="flex-1 px-3">
            <div className="flex flex-col gap-0.5 pb-3">
              {filteredCards.map((c) => {
                const char = characters.get(c.id)
                const bannerIdx = char?.appearance.bannerColorIndex ?? 0
                const accentColor = char?.appearance.bannerCustomColor ?? getBannerAccent(bannerIdx)
                const isSelected = selected?.id === c.id

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => void handleSelectCard(c.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors w-full',
                      isSelected
                        ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                        style={c.avatar_url ? undefined : { background: getBannerGradient(bannerIdx) }}
                      >
                        {c.avatar_url
                          ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                          : c.name.charAt(0)}
                      </div>
                      {c.is_active && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-[#1C1C1B]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-xs font-medium">{c.name}</span>
                        <span
                          className="flex-shrink-0 text-[10px] px-1.5 py-px rounded"
                          style={{ background: `${accentColor}20`, color: accentColor }}
                        >
                          bot
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] opacity-60 truncate">/{c.slug}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* User footer */}
        <div className="border-t border-[#3E3E3B] relative">
          {/* Dropdown — opens above footer */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-[98]"
                onClick={() => setUserMenuOpen(false)}
                aria-hidden
              />
              <div
                className="absolute bottom-full left-2 right-2 mb-2 z-[99] rounded-xl overflow-hidden border border-[#3E3E3B] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                style={{
                  background: '#1C1C1B',
                  animation: 'sidebarMenuIn 0.18s cubic-bezier(0.2,0.9,0.2,1)',
                }}
                role="menu"
                aria-label="Account menu"
              >
                <div className="p-1.5 flex flex-col">
                  <div className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] opacity-50 px-3 pt-2 pb-1.5">
                    Account
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleOpenProfile}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[0.8125rem] font-medium text-[var(--text-primary)] bg-transparent border-none cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors text-left"
                  >
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] [&>svg]:w-4 [&>svg]:h-4">
                      <IconUser />
                    </span>
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleOpenSettings}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[0.8125rem] font-medium text-[var(--text-primary)] bg-transparent border-none cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors text-left"
                  >
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] [&>svg]:w-4 [&>svg]:h-4">
                      <IconSettings />
                    </span>
                    Settings
                  </button>
                  <div className="h-px mx-2 my-1 bg-[#3E3E3B]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleDeleteAccount()}
                    disabled={isDeletingAccount}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[0.8125rem] font-medium text-[rgba(255,180,180,0.9)] bg-transparent border-none cursor-pointer hover:bg-[rgba(237,62,62,0.1)] hover:text-[#ffc9c9] transition-colors text-left disabled:opacity-50"
                  >
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[var(--accent-red)] [&>svg]:w-4 [&>svg]:h-4">
                      <IconTrash />
                    </span>
                    Delete account
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[0.8125rem] font-medium text-[var(--text-muted)] bg-transparent border-none cursor-pointer hover:bg-[rgba(237,62,62,0.08)] hover:text-[var(--accent-red)] transition-colors text-left [&:hover>span]:text-[var(--accent-red)]"
                  >
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] [&>svg]:w-4 [&>svg]:h-4 transition-colors">
                      <IconLogout />
                    </span>
                    Log out
                  </button>
                </div>
              </div>

              <style>{`
                @keyframes sidebarMenuIn {
                  from { opacity: 0; transform: translateY(6px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </>
          )}

          {/* User block */}
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--sidebar-hover)] transition-colors text-left cursor-pointer group"
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--accent-red, #ff5252), #8B5CF6)' }}
            >
              {user?.pictureUrl
                ? <img src={user.pictureUrl} alt="" className="w-full h-full object-cover block" />
                : initial}
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">
                {truncate(sidebarPrimaryTitle, 22)}
              </div>
              {userEmail ? (
                <div className="h-[16px] overflow-hidden mt-0.5">
                  <div className="flex flex-col transition-transform duration-200 ease-out group-hover:-translate-y-[16px]">
                    <span className="h-[16px] leading-[16px] text-[11px] text-[var(--text-muted)] opacity-60 truncate block" title={userEmail}>
                      {truncate(userEmail, 26)}
                    </span>
                    <span className="h-[16px] leading-[16px] text-[11px] text-[var(--text-muted)] opacity-60 truncate block" title={sidebarHandle}>
                      {truncate(sidebarHandle, 26)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[var(--text-muted)] opacity-60 truncate mt-0.5">{truncate(sidebarHandle, 26)}</div>
              )}
            </div>

            {/* Caret */}
            <img
              src="/icons/caret-down.svg"
              alt=""
              aria-hidden
              className={cn(
                'ml-auto w-[10px] h-[6px] opacity-40 flex-shrink-0 transition-transform duration-200',
                userMenuOpen && 'rotate-180',
              )}
            />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden bg-[#141414]">
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
    </div>
  )
}
