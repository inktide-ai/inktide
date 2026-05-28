'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { Bell, ChevronDown, List, Search, Upload } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { StatCard, ProjectCreationWizard, STAT_CARD_COLORS } from '@/features/workspace-home'
import { ProjectGridCardConnected } from './project-grid-card-connected'
import { ProjectListRowConnected } from './project-list-row-connected'
import { default as ImportProjectDialog } from './ImportProjectDialog'
import { listProjects, exportProject, reorderProject, type ProjectListItem } from './api'
import type { ProjectStatus } from './project-grid-card'
import { queryKeys } from '@/shared/lib/query/keys'
import { buildSpark } from '@/shared/lib/spark'
import { useCharactersContext } from '@/entities/character'

type FilterTab = 'all' | ProjectStatus

interface SortableProjectCardProps {
  project: ProjectListItem
  coverUrlFallback?: string | null
  onOpen: () => void
  onExport: () => void
}

function SortableProjectCard({ project, coverUrlFallback, onOpen, onExport }: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      <ProjectGridCardConnected
        project={project}
        coverUrlFallback={coverUrlFallback}
        onOpen={onOpen}
        onExport={onExport}
      />
    </div>
  )
}

function SortableProjectListRow({ project, coverUrlFallback, onOpen, onExport }: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      <ProjectListRowConnected
        project={project}
        coverUrlFallback={coverUrlFallback}
        onOpen={onOpen}
        onExport={onExport}
      />
    </div>
  )
}

export default function ProjectsListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedId, cardList } = useCharactersContext()

  const [filter, setFilter]       = useState<FilterTab>('all')
  const [search, setSearch]       = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid')

  const activeSoul = selectedId ? cardList.find(c => c.id === selectedId) ?? null : null

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.projects.all(undefined),
    queryFn: () => listProjects(undefined),
  })

  const filtered = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const isDndEnabled = filter === 'all' && search === '' && !loading

  const totalCount  = projects.length
  const activeCount = projects.filter(p => p.status === 'active').length

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const current = queryClient.getQueryData<ProjectListItem[]>(queryKeys.projects.all(undefined)) ?? []
    const oldIdx = current.findIndex(p => p.id === active.id)
    const newIdx = current.findIndex(p => p.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(current, oldIdx, newIdx)
    queryClient.setQueryData(queryKeys.projects.all(undefined), reordered)

    const neighborIdx = reordered.findIndex(p => p.id === active.id)
    const previousId = reordered[neighborIdx - 1]?.id ?? null
    const nextId     = reordered[neighborIdx + 1]?.id ?? null

    void reorderProject(active.id as string, { previous_id: previousId, next_id: nextId })
      .catch(() => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(undefined) }))
  }

  async function handleExport(project: ProjectListItem) {
    try {
      const blob = await exportProject(project.id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.inkt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const listContainer = 'rounded-2xl overflow-hidden border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]'

  const projectList = loading ? (
    <div className={listContainer}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse bg-[hsla(var(--bg-1),_1)]" />
      ))}
    </div>
  ) : filtered.length === 0 ? (
    <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-tertiary)]">
      {search ? 'No projects match your search' : 'No projects yet — click "+ New Project" to get started'}
    </div>
  ) : isDndEnabled ? (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={filtered.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className={listContainer}>
          {filtered.map(project => (
            <SortableProjectListRow
              key={project.id}
              project={project}
              coverUrlFallback={activeSoul?.avatar_url ?? project.active_soul?.avatar_url ?? undefined}
              onOpen={() => router.push(`/projects/${project.id}`)}
              onExport={() => handleExport(project)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  ) : (
    <div className={listContainer}>
      {filtered.map(project => (
        <ProjectListRowConnected
          key={project.id}
          project={project}
          coverUrlFallback={activeSoul?.avatar_url ?? project.active_soul?.avatar_url ?? undefined}
          onOpen={() => router.push(`/projects/${project.id}`)}
          onExport={() => handleExport(project)}
        />
      ))}
    </div>
  )

  const projectGrid = loading ? (
    <div className="grid grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[230px] animate-pulse rounded-2xl bg-[hsla(var(--bg-1),_1)]" />
      ))}
    </div>
  ) : filtered.length === 0 ? (
    <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-tertiary)]">
      {search ? 'No projects match your search' : 'No projects yet — click "+ New Project" to get started'}
    </div>
  ) : isDndEnabled ? (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={filtered.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-4 gap-3">
          {filtered.map(project => (
            <SortableProjectCard
              key={project.id}
              project={project}
              coverUrlFallback={activeSoul?.avatar_url ?? project.active_soul?.avatar_url ?? undefined}
              onOpen={() => router.push(`/projects/${project.id}`)}
              onExport={() => handleExport(project)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  ) : (
    <div className="grid grid-cols-4 gap-3">
      {filtered.map(project => (
        <ProjectGridCardConnected
          key={project.id}
          project={project}
          coverUrlFallback={activeSoul?.avatar_url ?? project.active_soul?.avatar_url ?? undefined}
          onOpen={() => router.push(`/projects/${project.id}`)}
          onExport={() => handleExport(project)}
        />
      ))}
    </div>
  )

  return (
    <>
    <ImportProjectDialog
      open={importDialogOpen}
      onClose={() => setImportDialogOpen(false)}
      onImported={id => { setImportDialogOpen(false); router.push(`/projects/${id}`) }}
    />
    <AnimatePresence>
      {showWizard && (
        <ProjectCreationWizard
          onClose={() => setShowWizard(false)}
          onCreated={id => router.push(`/projects/${id}`)}
          defaultSoulId={activeSoul?.id}
          defaultSoulName={activeSoul?.name}
          souls={cardList}
        />
      )}
    </AnimatePresence>
    <div className="min-h-screen bg-[var(--bg-0)] px-6 py-5 font-[Inter,sans-serif]">

      <div className="mx-auto max-w-[1300px]">
        <header className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[36px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Projects</h1>
            <p className="mt-1 text-body text-[var(--text-secondary)]">
              Organize and manage your AI projects and pipelines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-[240px] items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3">
              <Search size={15} className="text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent text-body text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
              <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-2xs text-[var(--text-secondary)]">⌘K</span>
            </div>

            <button
              type="button"
              title="Import .inkt"
              onClick={() => setImportDialogOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              <Upload size={15} />
            </button>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              <Bell size={15} />
            </button>

            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="flex h-10 items-center gap-1 rounded-xl bg-[var(--accent-primary)] px-3 text-body font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              + New Project
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-4 gap-3">
          <StatCard label="Total Projects"  value={String(totalCount)}  accentColor={STAT_CARD_COLORS.violet} spark={buildSpark(projects.map(p => p.updated_at))} />
          <StatCard label="Active Projects" value={String(activeCount)} accentColor={STAT_CARD_COLORS.green}  spark={buildSpark(projects.filter(p => p.status === 'active').map(p => p.updated_at))} />
          <StatCard label="API Calls (24h)" value="—" accentColor={STAT_CARD_COLORS.indigo} />
          <StatCard label="Compute Usage"   value="—" accentColor={STAT_CARD_COLORS.amber} />
        </section>

        <section className="mb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-[30px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Your Projects</h2>
              <div className="flex items-center gap-2">
                {(['all', 'active', 'paused', 'archived'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    className={`h-8 rounded-lg px-3 text-body capitalize transition-colors ${
                      filter === tab
                        ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              title={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
              onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--sidebar-active)] text-[var(--accent-hover)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <List size={14} />
            </button>
          </div>

          {viewMode === 'list' ? projectList : projectGrid}
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)]">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <h3 className="font-serif text-[30px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Recent Activity</h3>
            <button type="button" className="text-body font-medium text-[var(--accent-hover)] hover:text-[var(--accent-primary)]">
              View All Activity
            </button>
          </div>
          <div className="px-4 py-6 text-center text-body text-[var(--text-tertiary)]">
            Activity feed coming soon
          </div>
        </section>
      </div>
    </div>
    </>
  )
}
