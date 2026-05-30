import type { ReactNode } from 'react'
import Link from 'next/link'
import { Code2, Webhook, Blocks } from 'lucide-react'

export default function DeveloperPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-0)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--border-subtle)] flex flex-col p-4 gap-1">
        <div className="flex items-center gap-2 px-2 py-3 mb-2">
          <Code2 size={18} className="text-[var(--text-secondary)]" />
          <span className="text-sm font-semibold text-[var(--text-heading)]">Developer Portal</span>
        </div>

        <SidebarLink href="/developer" icon={<Blocks size={15} />} label="Overview" />
        <SidebarLink href="/developer/apps" icon={<Code2 size={15} />} label="My Applications" />
        <SidebarLink href="/developer/apps/new" icon={<Webhook size={15} />} label="Create App" />
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function SidebarLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)] transition-colors"
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </Link>
  )
}
