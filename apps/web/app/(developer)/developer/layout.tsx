'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code2 } from 'lucide-react'

const DOC_LINKS = [
  { href: '/developer',              label: 'Overview' },
  { href: '/developer/architecture', label: 'Architecture' },
  { href: '/developer/quickstart',   label: 'Quick Start' },
  { href: '/developer/routes',       label: 'Frontend Routes' },
  { href: '/developer/api',          label: 'REST API' },
  { href: '/developer/frontend',     label: 'Frontend Arch' },
  { href: '/developer/oauth',        label: 'OAuth 2.0' },
  { href: '/developer/webhooks',     label: 'Webhooks' },
  { href: '/developer/services',     label: 'Services' },
]

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

// [method, description]
const API_ENDPOINTS: [Method, string][] = [
  ['GET',    'Current user profile'],
  ['GET',    'List your souls'],
  ['POST',   'Create a soul'],
  ['GET',    'Get soul details'],
  ['PUT',    'Update soul config'],
  ['DELETE', 'Delete soul'],
  ['GET',    'List projects'],
  ['POST',   'Create a project'],
  ['GET',    'Get project details'],
  ['PUT',    'Update project'],
  ['DELETE', 'Delete project'],
  ['POST',   'Synthesize speech'],
  ['GET',    'List OAuth apps'],
  ['POST',   'Register OAuth app'],
  ['GET',    'Get app credentials'],
  ['PUT',    'Update app settings'],
  ['DELETE', 'Delete app'],
  ['POST',   'Rotate client secret'],
  ['GET',    'List organizations'],
  ['POST',   'Send org invite'],
]

const METHOD_STYLES: Record<Method, string> = {
  GET:    'bg-blue-500/15 text-blue-400',
  POST:   'bg-emerald-500/15 text-emerald-400',
  PUT:    'bg-amber-500/15 text-amber-400',
  DELETE: 'bg-red-500/15 text-red-400',
}

export default function DeveloperPortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/developer/apps') return pathname.startsWith('/developer/apps')
    if (href === '/developer') return pathname === '/developer'
    return pathname === href
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-0)]">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-[var(--border-subtle)] flex flex-col p-4 gap-1 h-full overflow-y-auto">
        <div className="flex items-center gap-3 px-2 py-4 mb-2">
          <Link href="/home" className="opacity-80 hover:opacity-100 transition-opacity">
            <img src="/logo/icon_without.svg" width={28} height={28} alt="Go to home" />
          </Link>
          <span className="text-[17px] font-semibold text-[var(--text-primary)]">Developer Portal</span>
        </div>

        {/* Docs section */}
        <p className="px-2 py-1 text-[15px] font-semibold text-[var(--text-primary)]">
          Docs
        </p>
        {DOC_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-[15px] transition-colors ${
              isActive(href)
                ? 'bg-[var(--sidebar-active)] font-medium text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </Link>
        ))}

        {/* Apps section */}
        <p className="mt-4 px-2 py-1 text-[15px] font-semibold text-[var(--text-primary)]">
          Apps
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
          My Applications
        </Link>
        {/* API Reference section */}
        <p className="mt-4 px-2 py-1 text-[15px] font-semibold text-[var(--text-primary)]">
          API Reference
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
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
