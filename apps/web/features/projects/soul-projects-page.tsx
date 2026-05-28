'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { ChevronDown, LayoutGrid, List, Search, Upload } from 'lucide-react'
import { StatCard, STAT_CARD_COLORS } from '@/features/workspace-home'
import { ProjectGridCardConnected } from '@/features/projects'
import { type ProjectStatus } from '@/features/projects'
import { ProjectCreationWizard } from '@/features/workspace-home'
import { listProjects, importProjectFile, type ProjectListItem } from '@/features/projects'
import { buildSpark } from '@/lib/spark'
import { exportProject } from '@/features/soul'
import { useCharactersContext } from '@/entities/character'

type FilterTab = 'all' | ProjectStatus

export default function SoulProjectsPage() {
  const { id: soulId } = useParams<{ id: string }>()
  const router = useRouter()
  const importRef = useRef<HTMLInputElement>(null)
  const { selected, cardList } = useCharactersContext()

  const [projects, setProjects]     = useState<ProjectListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<FilterTab>('all')
  const [search, setSearch]         = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [importing, setImporting]   = useState(false)

  useEffect(() => {
    if (!soulId) return
    setLoading(true)
    listProjects(soulId)
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [soulId])

  const filtered = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const activeCount = projects.filter(p => p.status === 'active').length

  const soulCard = cardList.find(c => c.id === soulId)
  const soulName = selected?.name ?? soulCard?.name ?? ''
  const soulAvatarUrl = soulCard?.avatar_url ?? null

  async function handleExport(project: ProjectListItem) {
    if (!project.active_soul_id) return
    try {
      const blob = await exportProject(project.active_soul_id)
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

  async function handleImport(file: File) {
    if (importing) return
    setImporting(true)
    try {
      const text   = await file.text()
      const data   = JSON.parse(text)
      const result = await importProjectFile(data)
      router.push(`/projects/${result.project_id}`)
    } catch (err) {
      console.error('Import failed:', err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {showWizard && (
          <ProjectCreationWizard
            onClose={() => setShowWizard(false)}
            onCreated={id => router.push(`/projects/${id}`)}
            defaultSoulId={soulId}
            defaultSoulName={soulName}
            souls={cardList}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[var(--bg-0)] px-6 py-5 font-[Inter,sans-serif]">
        <input
          ref={importRef}
          type="file"
          accept=".inkt,application/json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
            e.target.value = ''
          }}
        />

        <div className="mx-auto max-w-[1300px]">
          <header className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Projects{soulName ? ` · ${soulName}` : ''}
              </h1>
              <p className="mt-1 text-body text-[var(--text-secondary)]">
                Projects linked to this soul
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
              </div>

              <button
                type="button"
                title="Import .inkt"
                onClick={() => importRef.current?.click()}
                disabled={importing}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
              >
                <Upload size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="flex h-10 items-center gap-1 rounded-xl bg-[var(--accent-primary)] px-3 text-body font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                + New Project
                <ChevronDown size={14} />
              </button>
            </div>
          </header>

          <section className="mb-4 grid grid-cols-4 gap-3">
            <StatCard label="Total Projects"  value={String(projects.length)} accentColor={STAT_CARD_COLORS.violet} spark={buildSpark(projects.map(p => p.updated_at))} />
            <StatCard label="Active Projects" value={String(activeCount)}     accentColor={STAT_CARD_COLORS.green}  spark={buildSpark(projects.filter(p => p.status === 'active').map(p => p.updated_at))} />
            <StatCard label="API Calls (24h)" value="—" accentColor={STAT_CARD_COLORS.indigo} />
            <StatCard label="Compute Usage"   value="—" accentColor={STAT_CARD_COLORS.amber} />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Your Projects</h2>
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
              <div className="flex items-center gap-2">
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--sidebar-active)] text-[var(--accent-hover)]">
                  <LayoutGrid size={14} />
                </button>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]">
                  <List size={14} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-[230px] animate-pulse rounded-2xl bg-[hsla(var(--bg-1),_1)]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-tertiary)]">
                {search ? 'No projects match your search' : 'No projects for this soul yet — click "+ New Project" to get started'}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filtered.map(project => (
                  <ProjectGridCardConnected
                    key={project.id}
                    project={project}
                    coverUrlFallback={soulAvatarUrl ?? undefined}
                    onOpen={() => router.push(`/souls/${soulId}/projects/${project.id}`)}
                    onExport={() => handleExport(project)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
