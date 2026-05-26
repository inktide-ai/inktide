'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus } from 'lucide-react'
import { listProjects, type ProjectListItem } from '@/features/projects/api/projects'
import { Badge, type BadgeVariant } from '@/shared/ui/badge'

type Filter = 'all' | 'active' | 'paused' | 'archived'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'active',   label: 'Active'   },
  { key: 'paused',   label: 'Paused'   },
  { key: 'archived', label: 'Archived' },
]

function updatedLabel(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 60)  return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs  < 24)  return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7)   return `${days}d ago`
    return `${Math.floor(days / 7)}w ago`
  } catch {
    return 'recently'
  }
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] p-4">
      <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--surface-2)]" />
      <div className="h-3 w-full animate-pulse rounded bg-[var(--surface-2)]" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--surface-2)]" />
      <div className="mt-auto flex items-center gap-2 pt-2">
        <div className="h-5 w-5 animate-pulse rounded-full bg-[var(--surface-2)]" />
        <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-2)]" />
      </div>
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: ProjectListItem; onClick: () => void }) {
  const badgeVariant: BadgeVariant = project.status === 'active' ? 'active' : project.status === 'paused' ? 'paused' : 'archived'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] p-4 text-left transition-all hover:border-[var(--accent-primary)] hover:bg-[var(--surface-1)] hover:shadow-[0_0_0_1px_var(--accent-primary)]"
    >
      {/* Name + badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] font-semibold leading-snug text-[var(--text-primary)] group-hover:text-white transition-colors line-clamp-1">
          {project.name}
        </p>
        <Badge variant={badgeVariant} className="shrink-0 capitalize">{project.status}</Badge>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
        {project.description || 'No description'}
      </p>

      {/* Soul row */}
      <div className="mt-auto flex items-center gap-2 pt-1">
        {project.active_soul?.avatar_url ? (
          <img
            src={project.active_soul.avatar_url}
            alt={project.active_soul.name}
            className="h-5 w-5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[9px] font-semibold uppercase text-[var(--text-tertiary)]">
            {project.active_soul ? project.active_soul.name[0] : '?'}
          </span>
        )}
        <span className="truncate text-[14px] text-[var(--text-secondary)]">
          {project.active_soul?.name ?? <span className="italic text-[var(--text-tertiary)]">No soul bound</span>}
        </span>
        <span className="ml-auto shrink-0 text-[12px] text-[var(--text-tertiary)]">
          {updatedLabel(project.updated_at)}
        </span>
      </div>
    </button>
  )
}

export default function ProjectPicker() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<Filter>('all')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="flex h-full flex-col items-center bg-[var(--bg-0)] px-6 py-12">
      <div className="w-full max-w-[860px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
            Select a project
          </h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Each project owns channels, memory and pipeline config.
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex items-center gap-3">
          {/* Search */}
          <div className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3">
            <Search size={14} className="shrink-0 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] p-1">
            {FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1 text-[14px] font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* New project */}
          <button
            type="button"
            onClick={() => router.push('/projects')}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus size={14} />
            New Project
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-[14px] text-[var(--text-tertiary)]">
            {search ? 'No projects match your search' : 'No projects yet — click "New Project" to create one'}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => router.push(`/edit/sandbox?projectId=${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
