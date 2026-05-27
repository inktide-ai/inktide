'use client'

import { useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Moon } from '@/shared/ui/icons'
import { SidebarMenuItem } from '@/shared/ui/sidebar-menu-item'

function MenuIcon({ src }: { src: string }) {
  return (
    <img
      src={src}
      className="h-[18px] w-[18px]"
      alt=""
      aria-hidden
      style={{ filter: 'var(--menu-icon-filter)' }}
    />
  )
}

export type SidebarAccountMenuPanel = 'profile' | 'workspace'

export interface SidebarAccountMenuProps {
  open: boolean
  onClose: () => void
  /** `profile` matches legacy profile-shell insets; `workspace` is full width under the switcher. */
  panel: SidebarAccountMenuPanel
  /** Open account modal on Profile tab (same modal as settings). */
  onOpenProfile?: () => void
  /** Open account modal on security tab. */
  onOpenSettings?: () => void
}

export function SidebarAccountMenu({ open, onClose, panel, onOpenProfile, onOpenSettings }: SidebarAccountMenuProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()

  const handleOpenProfile = useCallback(() => {
    onClose()
    onOpenProfile?.()
  }, [onClose, onOpenProfile])

  const handleOpenSettings = useCallback(() => {
    onClose()
    onOpenSettings?.()
  }, [onClose, onOpenSettings])

  const handleLogout = useCallback(() => {
    onClose()
    logout()
    router.push('/')
  }, [onClose, logout, router])

  if (!open) return null

  const panelPositionClass =
    panel === 'workspace'
      ? 'left-0 right-0'
      : 'left-3 right-3'

  const isLight = resolvedTheme === 'light'

  return (
    <>
      <div className="fixed inset-0 z-[98]" onClick={onClose} aria-hidden />
      <div
        className={`absolute top-full z-[99] mt-1.5 overflow-hidden rounded-2xl ${panelPositionClass}`}
        style={{
          background: 'var(--menu-panel-bg)',
          boxShadow: 'var(--menu-panel-shadow)',
          animation: 'sidebarMenuIn 0.16s cubic-bezier(0.2,0.9,0.2,1)',
        }}
        role="menu"
        aria-label="Account menu"
      >
        <div className="flex flex-col gap-0.5 px-1.5 pb-1.5">
          <SidebarMenuItem icon={<MenuIcon src="/icons/menu-open.svg" />} label="Открыть" shortcut="Cmd + O" />
          <SidebarMenuItem icon={<MenuIcon src="/icons/menu-save.svg" />} label="Сохранить" shortcut="Cmd + \\" />
          <SidebarMenuItem icon={<MenuIcon src="/icons/menu-clear.svg" />} label="Очистить данные" />
        </div>

        <div className="mx-3 my-0.5 h-px bg-[var(--menu-divider)]" />

        <div className="flex flex-col gap-0.5 px-1.5 py-1.5">
          <SidebarMenuItem
            icon={<MenuIcon src="/icons/menu-profile.svg" />}
            label="Профиль"
            onClick={handleOpenProfile}
          />
          <SidebarMenuItem
            icon={<MenuIcon src="/icons/menu-settings.svg" />}
            label="Настройки"
            shortcut="Cmd + ,"
            onClick={handleOpenSettings}
          />
          <SidebarMenuItem
            icon={<MenuIcon src="/icons/menu-logout.svg" />}
            label="Выйти"
            onClick={handleLogout}
          />
        </div>

        <div className="mx-3 my-0.5 h-px bg-[var(--menu-divider)]" />

        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">Тема</span>
          <div
            className="flex items-center gap-0.5 rounded-lg p-[3px]"
            style={{ background: 'var(--menu-segment-track)' }}
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-all"
              style={{
                background: isLight ? 'var(--menu-segment-active)' : 'transparent',
                color: isLight ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
              aria-label="Светлая тема"
              aria-pressed={isLight}
            >
              <Sun size={14} />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-all"
              style={{
                background: !isLight ? 'var(--menu-segment-active)' : 'transparent',
                color: !isLight ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
              aria-label="Тёмная тема"
              aria-pressed={!isLight}
            >
              <Moon size={14} />
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes sidebarMenuIn{from{opacity:0;transform:translateY(-6px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </>
  )
}
