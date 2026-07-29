'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Code2, Menu, X } from 'lucide-react'

const DOC_LINKS = [
  { href: '/developer',              labelKey: 'nav.overview' },
  { href: '/developer/architecture', labelKey: 'nav.architecture' },
  { href: '/developer/quickstart',   labelKey: 'nav.quickStart' },
  { href: '/developer/routes',       labelKey: 'nav.frontendRoutes' },
  { href: '/developer/api',          labelKey: 'nav.restApi' },
  { href: '/developer/realtime',     labelKey: 'nav.realtime' },
  { href: '/developer/frontend',     labelKey: 'nav.frontendArch' },
  { href: '/developer/oauth',        labelKey: 'nav.oauth' },
  { href: '/developer/webhooks',     labelKey: 'nav.webhooks' },
  { href: '/developer/services',     labelKey: 'nav.services' },
  { href: '/developer/changelog',    labelKey: 'nav.changelog' },
]

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// [method, description]
const API_ENDPOINTS: [Method, string][] = [
  ['GET',    'Current user (profile + roles)'],
  ['PATCH',  'Update avatar'],
  ['GET',    'List souls'],
  ['POST',   'Create soul'],
  ['GET',    'Get soul details'],
  ['PUT',    'Update soul'],
  ['DELETE', 'Delete soul'],
  ['GET',    'List projects'],
  ['POST',   'Create project'],
  ['GET',    'Get project'],
  ['PUT',    'Update project'],
  ['PATCH',  'Update scene config'],
  ['DELETE', 'Delete project'],
  ['GET',    'List channels'],
  ['POST',   'Add channel'],
  ['PATCH',  'Update channel'],
  ['DELETE', 'Remove channel'],
  ['POST',   'Synthesize speech'],
  ['GET',    'TTS providers'],
  ['GET',    'List OAuth apps'],
  ['POST',   'Register OAuth app'],
  ['POST',   'Rotate client secret'],
  ['GET',    'Webhook delivery logs'],
  ['POST',   'Test webhook'],
  ['GET',    'Organization invites'],
  ['POST',   'Send org invite'],
  ['GET',    'Marketplace connectors'],
  ['POST',   'Install connector'],
  ['POST',   'Get WS ticket'],
]

const METHOD_STYLES: Record<Method, string> = {
  GET:    'bg-blue-500/15 text-blue-400',
  POST:   'bg-emerald-500/15 text-emerald-400',
  PUT:    'bg-amber-500/15 text-amber-400',
  PATCH:  'bg-amber-500/15 text-amber-400',
  DELETE: 'bg-red-500/15 text-red-400',
}

export default function DeveloperPortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { t } = useTranslation('developer')
  // Mobile off-canvas drawer (>=lg the sidebar is a static column, so this is inert there).
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  function isActive(href: string): boolean {
    if (href === '/developer/apps') return pathname.startsWith('/developer/apps')
    if (href === '/developer') return pathname === '/developer'
    return pathname === href
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-0)]">
      {/* Backdrop behind the drawer (mobile only). */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar - static column >=lg, off-canvas drawer below. */}
      <aside
        className={`flex h-full shrink-0 flex-col gap-1 overflow-y-auto border-r border-[var(--border-subtle)] p-4 fixed inset-y-0 left-0 z-50 w-[280px] -translate-x-full bg-[var(--bg-0)] shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none lg:static lg:z-auto lg:w-72 lg:translate-x-0 lg:shadow-none lg:transition-none ${open ? 'translate-x-0' : ''}`}
      >
        {/* Mobile-only close button. */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('a11y.closeMenu')}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] lg:hidden"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 px-2 py-4 mb-2">
          <Link href="/home" className="opacity-80 hover:opacity-100 transition-opacity">
            <img src="/logo/icon_without.svg" width={28} height={28} alt={t('a11y.goHome')} />
          </Link>
          <span className="text-[17px] font-semibold text-[var(--text-primary)]">{t('title')}</span>
        </div>

        {/* Docs section */}
        <p className="px-2 py-1 text-[15px] font-semibold text-[var(--text-primary)]">
          {t('nav.docs')}
        </p>
        {DOC_LINKS.map(({ href, labelKey }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-[15px] transition-colors ${
              isActive(href)
                ? 'bg-[var(--sidebar-active)] font-medium text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t(labelKey)}
          </Link>
        ))}

        {/* Apps section */}
        <p className="mt-4 px-2 py-1 text-[15px] font-semibold text-[var(--text-primary)]">
          {t('nav.apps')}
        </p>
        <Link
          href="/developer/apps"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-[15px] transition-colors ${
            isActive('/developer/apps')
              ? 'bg-[var(--sidebar-active)] font-medium text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Code2 size={15} />
          {t('nav.myApplications')}
        </Link>
        {/* API Reference section */}
        <p className="mt-4 px-2 py-1 text-[15px] font-semibold text-[var(--text-primary)]">
          {t('nav.apiReference')}
        </p>
        <div>
          {API_ENDPOINTS.map(([method, desc], i) => (
            <Link
              key={i}
              href="/developer/api"
              className="flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors hover:bg-[var(--surface-1)]"
            >
              <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[12px] font-bold ${METHOD_STYLES[method]}`}>
                {method}
              </span>
              <span className="truncate text-[15px] text-[var(--text-secondary)]">{desc}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* Content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile-only top bar with the menu toggle. */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('a11y.openMenu')}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <Menu size={18} />
          </button>
          <span className="text-[15px] font-semibold text-[var(--text-primary)]">{t('title')}</span>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
