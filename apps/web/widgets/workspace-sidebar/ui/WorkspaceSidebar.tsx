'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LayoutGroup } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/shared/services/auth'
import { useBilling } from '@/entities/billing/context/BillingContext'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { listProjects } from '@/entities/project/api'
import { queryKeys } from '@/shared/lib/query/keys'
import { fetchStorageUsage } from '@/api/storage'
import { PLAN_LIMITS } from '@/shared/lib/plan-limits'
import { ProPlanCard } from '@/features/workspace-home/pro-plan-card'
// fsd:cross-feature-ok - widget layer composes across features
import AccountSettingsModal from '@/features/account/account-settings-modal'
import InviteMembersModal from '@/features/organization/invite-members-modal'
import { ImportProjectDialog } from '@/features/projects'
import { SaveProjectMenu } from '@/features/projects/save-project-menu'
import { useProjectExport } from '@/features/projects/hooks/useProjectExport'
import type { PageId } from '@/features/account/user-account-settings'
import { SidebarAccountMenu } from '@/shared/ui/sidebar-account-menu'
import { SidebarItem } from '@/features/workspace-home/sidebar-item'
import { useShortcut } from '@/shared/lib/keyboard'
import { getBannerGradient } from '@/shared/ui/banner-presets'
import Link from 'next/link'
import { Box, Code2, Gem, LayoutTemplate, Menu, Store, X } from 'lucide-react'
import { DEVELOPER_ROUTE, MARKETPLACE_ROUTE, TEMPLATES_ROUTE } from '@/lib/routes'
import {
  Agent,
  CaretDownSmall,
  CaretRightSmall,
  Home,
  Grid as ProjectsIcon,
  Team,
} from '@/shared/ui/icons'


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
  const { t } = useTranslation('common')
  const pathname = usePathname()
  const router = useRouter()
  const { userEmail, user } = useAuth()
  const { plan, periodEnd, openPortal } = useBilling()
  const { cardList, selected } = useCharactersContext()
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects.all(selected?.id),
    queryFn: () => listProjects(selected?.id),
  })
  const { data: storageUsage } = useQuery({
    queryKey: queryKeys.me.storage,
    queryFn: fetchStorageUsage,
    staleTime: 5 * 60 * 1000,
  })
  const storageUsedGb = storageUsage?.usedGb ?? 0
  const storageMaxGb  = storageUsage?.maxGb  ?? (plan === 'pro' ? 10 : plan === 'starter' ? 5 : 1)
  const soulLimit     = PLAN_LIMITS[plan]?.maxSoulCards ?? Infinity
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountModalPage, setAccountModalPage] = useState<PageId>('profile')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [savePickerOpen, setSavePickerOpen] = useState(false)
  const [mainOpen, setMainOpen]       = useState(true)
  const [toolsOpen, setToolsOpen]     = useState(true)
  const [apiOpen, setApiOpen]         = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(true)
  // Mobile off-canvas drawer (>=lg the sidebar is a static column, so this is inert there).
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close the drawer on navigation.
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Close on Escape + lock background scroll while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [drawerOpen])

  const { exportAndDownload } = useProjectExport()

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

  const projectPageMatch = pathname?.match(/^\/projects\/([^/]+)/)
  const activeProjectId = projectPageMatch?.[1] ?? null

  const workspaceSwitcherTitle =
    userEmail ?? user?.nickname?.trim() ?? user?.userName ?? t('sidebar.workspace')
  const avatarInitial =
    (user?.nickname?.trim() || user?.userName || userEmail || '?')
      .replace(/^\./, '')
      .charAt(0)
      .toUpperCase() || '?'

  function handleOpen() {
    setImportDialogOpen(true)
  }

  async function handleSave() {
    if (activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId)
      await exportAndDownload(activeProjectId, project?.name ?? activeProjectId)
    } else {
      setSavePickerOpen(true)
    }
  }

  // Cmd, - open Settings
  useShortcut('$mod+,', () => {
    setAccountModalPage('security')
    setAccountModalOpen(true)
  })

  // Cmd. - open Profile
  useShortcut('$mod+.', () => {
    setAccountModalPage('profile')
    setAccountModalOpen(true)
  })

  return (
    <>
      {/* Mobile-only hamburger - opens the off-canvas drawer (hidden >=lg). */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={t('sidebar.workspace')}
        aria-expanded={drawerOpen}
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--surface-2)] lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Backdrop behind the drawer (mobile only). */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

    <aside
      className={cn(
        'home-ui-font flex h-screen min-h-0 flex-shrink-0 flex-col bg-[var(--c-bacSec)] px-3 py-3',
        // Mobile: off-canvas drawer that slides in from the left.
        'fixed inset-y-0 left-0 z-50 w-[280px] -translate-x-full shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none',
        drawerOpen && 'translate-x-0',
        // >=lg: static column, original inset-border styling, no transform.
        'lg:static lg:z-auto lg:w-[260px] lg:translate-x-0 lg:shadow-[inset_calc(var(--direction)*-1px)_0_0_0_var(--c-borSec)] lg:transition-none',
      )}
    >
      {/* Mobile-only close button. */}
      <button
        type="button"
        onClick={() => setDrawerOpen(false)}
        aria-label="Close menu"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] lg:hidden"
      >
        <X size={18} />
      </button>
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
          onOpen={handleOpen}
          onSave={handleSave}
        />
        {savePickerOpen && (
          <SaveProjectMenu
            open={savePickerOpen}
            onClose={() => setSavePickerOpen(false)}
            projects={projects}
            panel="workspace"
          />
        )}
        <button
          type="button"
          onClick={() => setAccountMenuOpen(o => !o)}
          aria-label={t('sidebar.workspace')}
          aria-expanded={accountMenuOpen}
          aria-haspopup="true"
          className="flex w-full min-w-0 items-center gap-2 rounded-lg border-none bg-transparent p-1 text-left transition-colors hover:bg-[var(--surface-2)]"
        >
          <div
            className="flex flex-shrink-0 items-center justify-center overflow-hidden font-bold text-2xs text-white"
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
            <p className="truncate text-body font-semibold leading-snug text-[var(--text-primary)]">
              {workspaceSwitcherTitle}
            </p>
            <p className="truncate text-body leading-tight text-[var(--text-secondary)]">
              {plan === 'pro' ? t('sidebar.proPlan') : t('sidebar.freePlan')}
            </p>
          </div>
          <CaretDownSmall
            size={16}
                       className={cn('flex-shrink-0 text-[var(--text-secondary)] transition-transform duration-200', accountMenuOpen && 'rotate-180')}
          />
        </button>
      </div>

      <LayoutGroup id="workspace-sidebar">
        <div className="shrink-0 space-y-0.5">
          <SidebarItem href="/home" icon={<Home size={16} viewBox="0 0 24 24" />} label={t('home.title')} active={pathname === '/home'} layoutId="sidebar-pill" />
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarCollapsibleSection
            sectionId="workspace"
            title={t('sidebar.workspace')}
            open={mainOpen}
            onToggle={() => setMainOpen(o => !o)}
          >
            <div className="space-y-0.5">
              {isSoulDetailRoute && soulDetailId ? (
                <Link
                  href={`/souls/${soulDetailId}`}
                  className={cn(
                    'h-9 w-full rounded-lg px-3 flex items-center gap-2.5 text-body font-medium transition-colors',
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
                  <span className="truncate">{t('sidebar.overview')}</span>
                </Link>
              ) : (
                <SidebarItem href="/souls" icon={<Agent size={16} viewBox="0 0 24 24" />} label={t('sidebar.souls')} badge={cardList.length || undefined} active={isSoulsRoute} layoutId="sidebar-pill" />
              )}
              <SidebarItem href={projectsHref} icon={<ProjectsIcon size={16} viewBox="0 0 24 24" />} label={t('sidebar.projects')} badge={projects.length || undefined} active={isProjectsRoute} layoutId="sidebar-pill" />
              <SidebarItem href={TEMPLATES_ROUTE} icon={<LayoutTemplate size={16} />} label={t('templates.title')} active={pathname?.startsWith('/templates')} layoutId="sidebar-pill" />
            </div>
          </SidebarCollapsibleSection>

          <SidebarCollapsibleSection
            sectionId="tools"
            title={t('sidebar.tools')}
            open={toolsOpen}
            onToggle={() => setToolsOpen(o => !o)}
          >
            <div className="space-y-0.5">
              <SidebarItem href="/edit/sandbox" icon={<Box size={16} />} label={t('sidebar.sandboxes')} active={pathname?.startsWith('/edit/sandbox')} layoutId="sidebar-pill" />
              <SidebarItem href={MARKETPLACE_ROUTE} icon={<Store size={16} />} label={t('sidebar.marketplace')} active={pathname?.startsWith('/marketplace')} layoutId="sidebar-pill" />
            </div>
          </SidebarCollapsibleSection>

          <SidebarCollapsibleSection
            sectionId="api"
            title={t('sidebar.api')}
            open={apiOpen}
            onToggle={() => setApiOpen(o => !o)}
          >
            <div className="space-y-0.5">
              <SidebarItem href={DEVELOPER_ROUTE} icon={<Code2 size={16} />} label={t('sidebar.developer')} active={pathname?.startsWith('/developer')} layoutId="sidebar-pill" />
            </div>
          </SidebarCollapsibleSection>

        </div>
      </LayoutGroup>

      <div className="shrink-0">
        <SidebarCollapsibleSection
          sectionId="advanced"
          title={t('sidebar.support')}
          open={advancedOpen}
          onToggle={() => setAdvancedOpen(o => !o)}
        >
          <div className="space-y-0.5">
            <SidebarItem
              href="https://github.com/inktide-ai/inktide"
              icon={<img src="/icons/menu-github.svg" alt="" aria-hidden style={{ filter: 'var(--menu-icon-filter)', width: 14, height: 14 }} />}
              label={t('sidebar.github')}
            />
            <SidebarItem
              href="https://discord.gg/inktide"
              icon={<img src="/icons/menu-discord.svg" alt="" aria-hidden style={{ filter: 'var(--menu-icon-filter)', width: 14, height: 14 }} />}
              label={t('sidebar.discordChat')}
            />
          </div>
        </SidebarCollapsibleSection>
      </div>

      <div className="shrink-0 space-y-3 pt-2">
        {plan === 'pro' ? (
          <button type="button" onClick={() => void openPortal()} className="w-full text-left">
            <ProPlanCard
              renewalLabel={periodEnd ? `Renewal: ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : t('sidebar.proPlan')}
              charactersUsed={cardList.length}
              charactersMax={soulLimit}
              storageUsedGb={storageUsedGb}
              storageMaxGb={storageMaxGb}
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
              <p className="text-body font-semibold text-[var(--text-primary)]">{t('sidebar.freePlan')}</p>
              <p className="mt-0.5 text-xs leading-snug text-[var(--text-secondary)]">{t('sidebar.upgradeText')}</p>
            </div>
          </button>
        )}
        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-body font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          <Team size={16} viewBox="0 0 24 24" />
          {t('sidebar.inviteMembers')}
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
      <ImportProjectDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImported={id => { setImportDialogOpen(false); router.push(`/projects/${id}`) }}
      />
    </aside>
    </>
  )
}
