import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

export function SectionCard({
  icon: Icon, title, href, children,
}: {
  icon: LucideIcon
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-card)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
        <div className="flex items-center gap-2 text-body font-medium text-[var(--text-primary)]">
          <Icon size={14} className="text-[var(--text-tertiary)]" />
          {title}
        </div>
        <Link
          href={href}
          className="flex items-center gap-0.5 text-body text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          View <ChevronRight size={12} />
        </Link>
      </div>
      <div className="bg-[var(--bg-0)] px-5 py-4">{children}</div>
    </div>
  )
}

export function NoSoulPlaceholder() {
  return (
    <p className="text-body text-[var(--text-tertiary)]">
      Bind a soul to this project to see details here.
    </p>
  )
}

export function ProjectMetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] py-2.5 last:border-0">
      <span className="shrink-0 text-body text-[var(--text-tertiary)]">{label}</span>
      <span className="text-right text-body font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:   { label: 'Active',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    paused:   { label: 'Paused',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    archived: { label: 'Archived', cls: 'bg-[var(--surface-1)] text-[var(--text-tertiary)] border-[var(--border-subtle)]' },
  }
  const { label, cls } = map[status] ?? map.active
  return (
    <span className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
