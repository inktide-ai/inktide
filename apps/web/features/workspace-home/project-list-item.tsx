'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Projects as ProjectsIcon } from '@/components/icons'

interface ProjectListItemProps {
  title: string
  href: string
}

export function ProjectListItem({ title, href }: ProjectListItemProps) {
  const pathname = usePathname()
  const active   = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[14px] font-medium transition-colors',
        active
          ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]',
      )}
    >
      <ProjectsIcon size={13} />
      <span className="truncate">{title}</span>
    </Link>
  )
}
