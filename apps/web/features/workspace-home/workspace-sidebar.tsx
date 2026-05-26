'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useBilling } from '@/entities/billing/context/BillingContext'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { listProjects, type ProjectListItem as ProjectItem } from '@/entities/project/api'
import { ProPlanCard } from '@/features/workspace-home/pro-plan-card'
// fsd:cross-feature-ok — sidebar composes account settings modal
import AccountSettingsModal from '@/features/account/account-settings-modal'
import InviteMembersModal from '@/components/organization/invite-members-modal'
import type { PageId } from '@/features/account/user-account-settings'
import { SidebarAccountMenu } from '@/shared/ui/sidebar-account-menu'
import { SidebarItem } from '@/features/workspace-home/sidebar-item'
import { getBannerGradient } from '@/shared/ui/banner-presets'
import Link from 'next/link'
import { Box, Gem } from 'lucide-react'
import {
  Agent,
  CaretDownSmall,
  CaretRightSmall,
  Home,
  Grid as ProjectsIcon,
  Team,
} from '@/components/icons'


function SidebarCollapsibleSection({
  sectionId,
  title,
  open,
  onToggle,
  headerTrailing,
  headerAlternate,
  children,
}: {
  sectionId: string
  title: string
  open: boolean
  onToggle: () => void
  headerTrailing?: ReactNode
  headerAlternate?: ReactNode | null
  children: ReactNode
}) {
  const panelId = `sidebar-panel-${sectionId}`
  const headingId = `sidebar-heading-${sectionId}`

  return (
    <div className="mt-2">
      {headerAlternate ?? (
        <div className="mb-1 flex h-6 items-center gap-1 px-1">
          <button
            id={headingId}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
            className="group flex min-w-0 flex-1 items-center rounded-md px-2 py-0.5 text-left outline-none transition-colors hover:bg-[var(--sidebar-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--c-bacSec)]"
          >
            <span className="inline-flex min-w-0 shrink items-center gap-1">
              <span className="truncate text-[.75rem] font-medium leading-none text-[var(--text-secondary)]">{title}</span>
              <CaretRightSmall
                size={16}
                               className={cn(
                  'shrink-0 text-[var(--text-tertiary)] opacity-0 transition-[opacity,transform] duration-150 ease-out group-hover:opacity-100',
                  open && 'rotate-90',
                )}
                aria-hidden
              />
            </span>
            <span className="min-w-0 flex-1" aria-hidden />
          </button>
          {open ? headerTrailing : null}
        </div>
      )}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerAlternate ? undefined : headingId}
        aria-label={headerAlternate ? title : undefined}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div
          className={cn('min-h-0 overflow-hidden', !open && 'pointer-events-none')}
          aria-hidden={!open}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function WorkspaceSidebar() {
  const pathname = usePathname()
  const { userEmail, user } = useAuth()
  const { plan, periodEnd, openPortal } = useBilling()
  const { cardList, selected } = useCharactersContext()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountModalPage, setAccountModalPage] = useState<PageId>('profile')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [mainOpen, setMainOpen] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState(true)

  const soulDetailMatch = pathname?.match(/^\/souls\/([^/]+)/)
  const isSoulDetailRoute = !!soulDetailMatch && soulDetailMatch[1] !== '(list)'
  const soulDetailId = isSoulDetailRoute ? soulDetailMatch![1] : null

  const isSoulsRoute = pathname === '/souls' || pathname?.startsWith('/souls/')
  const projectsHref = isSoulDetailRoute && soulDetailId
    ? `/souls/${soulDetailId}/projects`
    : '/projects'
  const isProjectsRoute =
    pathname === '/projects' ||
    pathname?.startsWith('/projects/') ||
    !!(isSoulDetailRoute && soulDetailId && pathname === `/souls/${soulDetailId}/projects`)

  const workspaceSwitcherTitle =
    userEmail ?? user?.nickname?.trim() ?? user?.userName ?? 'Account'
  const avatarInitial =
    (user?.nickname?.trim() || user?.userName || userEmail || '?')
      .replace(/^\./, '')
      .charAt(0)
      .toUpperCase() || '?'

  useEffect(() => {
    listProjects(selected?.id).then(setProjects).catch(console.error)
  }, [selected?.id])

  return (
    <aside className="home-ui-font flex h-screen min-h-0 w-[260px] flex-shrink-0 flex-col bg-[var(--c-bacSec)] px-3 py-3 shadow-[inset_calc(var(--direction)*-1px)_0_0_0_var(--c-borSec)]">
      <div className="relative mb-3 shrink-0 rounded-xl p-1.5">
        <SidebarAccountMenu
          open={accountMenuOpen}
          onClose={() => setAccountMenuOpen(false)}
          panel="workspace"
          onOpenProfile={() => {
            setAccountModalPage('profile')
            setAccountModalOpen(true)
          }}
          onOpenSettings={() => {
            setAccountModalPage('security')
            setAccountModalOpen(true)
          }}
        />
        <button
          type="button"
          onClick={() => setAccountMenuOpen(o => !o)}
          aria-label="Account"
          aria-expanded={accountMenuOpen}
          aria-haspopup="true"
          className="flex w-full min-w-0 items-center gap-2 rounded-lg border-none bg-transparent p-1 text-left transition-colors hover:bg-[var(--surface-2)]"
        >
          <div
            className="flex flex-shrink-0 items-center justify-center overflow-hidden font-bold text-[10px] text-white"
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #e05252, #8B5CF6)',
            }}
          >
            {user?.pictureUrl ? (
              <img src={user.pictureUrl} alt="" className="block h-full w-full object-cover" />
            ) : (
              avatarInitial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-snug text-[var(--text-primary)]">
              {workspaceSwitcherTitle}
            </p>
            <p className="truncate text-[14px] leading-tight text-[var(--text-secondary)]">
              {plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </p>
          </div>
          <CaretDownSmall
            size={16}
                       className={cn('flex-shrink-0 text-[var(--text-secondary)] transition-transform duration-200', accountMenuOpen && 'rotate-180')}
          />
        </button>
      </div>

      <div className="shrink-0 space-y-0.5">
        <SidebarItem href="/home" icon={<Home size={16} viewBox="0 0 24 24" />} label="Dashboard" active={pathname === '/home'} />
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarCollapsibleSection
          sectionId="workspace"
          title="Workspace"
          open={mainOpen}
          onToggle={() => setMainOpen(o => !o)}
        >
          <div className="space-y-0.5">
            {isSoulDetailRoute && soulDetailId ? (
              <Link
                href={`/souls/${soulDetailId}`}
                className={cn(
                  'h-9 w-full rounded-lg px-3 flex items-center gap-2.5 text-[14px] font-medium transition-colors',
                  pathname === `/souls/${soulDetailId}`
                    ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]',
                )}
              >
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center overflow-hidden rounded-[3px]">
                  {selected?.appearance?.avatarUrl ? (
                    <img src={selected.appearance.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: getBannerGradient(selected?.appearance?.bannerColorIndex ?? 0) }}
                    >
                      {selected?.name?.charAt(0) ?? '?'}
                    </span>
                  )}
                </span>
                <span className="truncate">Overview</span>
              </Link>
            ) : (
              <SidebarItem href="/souls" icon={<Agent size={16} viewBox="0 0 24 24" />} label="Souls" badge={cardList.length || undefined} active={isSoulsRoute} />
            )}
            <SidebarItem href={projectsHref} icon={<ProjectsIcon size={16} viewBox="0 0 24 24" />} label="Projects" badge={projects.length || undefined} active={isProjectsRoute} />
            <SidebarItem href="/edit/sandbox" icon={<Box size={16} />} label="Sandboxes" active={pathname?.startsWith('/edit/sandbox')} />
          </div>
        </SidebarCollapsibleSection>
      </div>

      <div className="shrink-0">
        <SidebarCollapsibleSection
          sectionId="advanced"
          title="Support"
          open={advancedOpen}
          onToggle={() => setAdvancedOpen(o => !o)}
        >
          <div className="space-y-0.5">
            <SidebarItem
              href="https://github.com/inktide-ai/inktide"
              icon={<img src="/icons/menu-github.svg" alt="" aria-hidden style={{ filter: 'var(--menu-icon-filter)', width: 14, height: 14 }} />}
              label="GitHub"
            />
            <SidebarItem
              href="https://discord.gg/inktide"
              icon={<img src="/icons/menu-discord.svg" alt="" aria-hidden style={{ filter: 'var(--menu-icon-filter)', width: 14, height: 14 }} />}
              label="Чат в Discord"
            />
          </div>
        </SidebarCollapsibleSection>
      </div>

      <div className="shrink-0 space-y-3 pt-2">
        {plan === 'pro' ? (
          <button type="button" onClick={() => void openPortal()} className="w-full text-left">
            <ProPlanCard
              renewalLabel={periodEnd ? `Renewal: ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Pro Plan'}
              charactersUsed={12}
              charactersMax={20}
              storageUsedGb={7.2}
              storageMaxGb={10}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { window.location.href = '/pricing' }}
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
              <Gem size={18} className="text-[var(--accent-primary)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Free Plan</p>
              <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-secondary)]">Upgrade to unlock more features</p>
            </div>
          </button>
        )}
        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[14px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          <Team size={16} viewBox="0 0 24 24" />
          Invite members
        </button>
      </div>
      <AccountSettingsModal
        open={accountModalOpen}
        initialPage={accountModalPage}
        onClose={() => setAccountModalOpen(false)}
      />
      <InviteMembersModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </aside>
  )
}
