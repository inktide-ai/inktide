'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from '@/shared/ui/dropdown-menu'
import { listProjects, type ProjectListItem } from '@/entities/project/api'
import { cn } from '@/lib/utils'
import { useOptionalCharactersContext } from '@/entities/character/context/CharactersContext'
import { projectPath, PROJECTS_ROUTE } from '@/lib/routes'

const panelClass = cn(
  'z-[3000] w-[280px] overflow-hidden rounded-md border border-[var(--border-default)]',
  'bg-[var(--menu-panel-bg)] text-body text-[var(--text-primary)] shadow-md',
)

const rowClass = cn(
  'flex cursor-default select-none items-center gap-2.5 rounded-[6px] px-2 py-1.5 outline-none',
  'text-[var(--text-secondary)] data-[highlighted]:bg-[var(--surface-1)] data-[highlighted]:text-[var(--text-primary)]',
)

const STATUS_DOT_BG: Record<string, string> = {
  active:   'var(--stat-accent-success)',
  paused:   'var(--stat-accent-warn)',
  archived: 'var(--text-tertiary)',
}

function ProjectInitial({ project }: { project: ProjectListItem }) {
  if (project.active_soul?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={project.active_soul.avatar_url}
        alt=""
        className="h-6 w-6 shrink-0 rounded-[4px] object-cover"
      />
    )
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-[var(--surface-2)] text-2xs font-bold uppercase text-[var(--text-secondary)]">
      {project.name[0]}
    </span>
  )
}

export function ScopeSwitcher() {
  const router = useRouter()
  const chars  = useOptionalCharactersContext()
  const [open, setOpen]           = useState(false)
  const [projects, setProjects]   = useState<ProjectListItem[]>([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && projects.length === 0) {
      setLoading(true)
      listProjects()
        .then(setProjects)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
    if (!next) setSearch('')
  }

  const filtered = search
    ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg bg-[var(--bg-0)] px-2.5 py-1 text-body font-medium text-[var(--text-primary)] outline-none transition-colors hover:bg-[var(--surface-1)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        >
          <span className="max-w-[160px] truncate">All Projects</span>
          {/* double-chevron ⇅ */}
          <svg height="16" viewBox="0 0 16 16" width="16" aria-hidden className="shrink-0 text-[var(--text-secondary)]" style={{ color: 'currentColor' }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M8.7071 2.39644C8.31658 2.00592 7.68341 2.00592 7.29289 2.39644L4.46966 5.21966L3.93933 5.74999L4.99999 6.81065L5.53032 6.28032L7.99999 3.81065L10.4697 6.28032L11 6.81065L12.0607 5.74999L11.5303 5.21966L8.7071 2.39644ZM5.53032 9.71966L4.99999 9.18933L3.93933 10.25L4.46966 10.7803L7.29289 13.6035C7.68341 13.9941 8.31658 13.9941 8.7071 13.6035L11.5303 10.7803L12.0607 10.25L11 9.18933L10.4697 9.71966L7.99999 12.1893L5.53032 9.71966Z" fill="currentColor" />
          </svg>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent className={panelClass} align="start" sideOffset={6}>
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-2.5 py-2">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Find Project…"
              className="flex-1 bg-transparent text-body text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
            <kbd className="rounded border border-[var(--border-default)] px-1.5 py-0.5 text-2xs text-[var(--text-tertiary)]">
              Esc
            </kbd>
          </div>

          {/* Project list */}
          <div className="max-h-[260px] overflow-y-auto p-1">
            {loading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className="h-6 w-6 animate-pulse rounded-[4px] bg-[var(--surface-2)]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
                  </div>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-[var(--text-tertiary)]">
                {search ? 'No projects match' : 'No projects yet'}
              </p>
            ) : (
              filtered.map(p => (
                <DropdownMenuItem
                  key={p.id}
                  className={rowClass}
                  onSelect={() => {
                    chars?.clearSelection()
                    // TODO(H21): CharactersProvider should be project-scoped; app-level placement is the root cause.
                    router.push(projectPath(p.id))
                  }}
                >
                  <ProjectInitial project={p} />
                  <span className="flex-1 truncate text-body">{p.name}</span>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: STATUS_DOT_BG[p.status] ?? 'var(--text-tertiary)' }}
                  />
                </DropdownMenuItem>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-default)] p-1">
            <DropdownMenuItem
              className={cn(rowClass, 'gap-2 text-[var(--text-secondary)]')}
              onSelect={() => router.push(PROJECTS_ROUTE)}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-dashed border-[var(--border-default)] text-body leading-none">
                +
              </span>
              <span className="text-body">Create Project</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}
