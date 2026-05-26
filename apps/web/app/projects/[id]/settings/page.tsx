'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, Copy, Download, Trash2 } from 'lucide-react'
import {
  getProject,
  updateProject,
  deleteProject,
  exportProject,
  type Project,
  type ProjectActiveSoul,
} from '@/features/projects/api/projects'
import { SoulBindingPicker } from '@/features/projects/soul-binding-picker'

function SaveButton({ saving, disabled, onClick }: { saving: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={saving || disabled}
      onClick={onClick}
      className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]/80 disabled:opacity-40"
    >
      {saving ? 'Saving…' : 'Save'}
    </button>
  )
}

interface CardProps {
  id?: string
  title: string
  description: string
  children: React.ReactNode
  footerLeft?: React.ReactNode
  footerRight?: React.ReactNode
  danger?: boolean
}

function SettingsCard({ id, title, description, children, footerLeft, footerRight, danger }: CardProps) {
  return (
    <div
      id={id}
      className={`overflow-hidden rounded-xl border ${danger ? 'border-red-500/20' : 'border-[var(--border-subtle)]'}`}
    >
      <div className="px-5 pb-4 pt-5">
        <h2 className={`text-[15px] font-semibold ${danger ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
          {title}
        </h2>
        <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">{description}</p>
      </div>

      <div className="px-5 pb-5">{children}</div>

      {(footerLeft !== undefined || footerRight !== undefined) && (
        <>
          <div className="border-t border-[var(--border-subtle)]" />
          <div className="flex items-center justify-between bg-[var(--surface-1)]/40 px-5 py-3">
            <span className="text-[14px] text-[var(--text-tertiary)]">{footerLeft}</span>
            <div>{footerRight}</div>
          </div>
        </>
      )}
    </div>
  )
}

export default function ProjectSettingsPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()

  const [project, setProject]       = useState<Project | null>(null)
  const [loading, setLoading]       = useState(true)

  const [name, setName]             = useState('')
  const [savingName, setSavingName] = useState(false)

  const [description, setDescription] = useState('')
  const [savingDesc, setSavingDesc]   = useState(false)

  const [status, setStatus]           = useState<'active' | 'paused' | 'archived'>('active')
  const [savingStatus, setSavingStatus] = useState(false)

  const [activeSoul, setActiveSoul] = useState<ProjectActiveSoul | null>(null)
  const [copied, setCopied]         = useState(false)
  const [exporting, setExporting]   = useState(false)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => {
    getProject(id)
      .then(p => {
        setProject(p)
        setName(p.name)
        setDescription(p.description ?? '')
        setStatus(p.status)
        setActiveSoul(p.active_soul)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function saveName() {
    if (!project || savingName || !name.trim()) return
    setSavingName(true)
    try {
      const updated = await updateProject(id, { name: name.trim(), description: description || null })
      setProject(updated)
    } catch (err) { console.error(err) }
    finally { setSavingName(false) }
  }

  async function saveDescription() {
    if (!project || savingDesc) return
    setSavingDesc(true)
    try {
      const updated = await updateProject(id, { name, description: description || null })
      setProject(updated)
    } catch (err) { console.error(err) }
    finally { setSavingDesc(false) }
  }

  async function saveStatus() {
    if (!project || savingStatus) return
    setSavingStatus(true)
    try {
      const updated = await updateProject(id, { name, status })
      setProject(updated)
    } catch (err) { console.error(err) }
    finally { setSavingStatus(false) }
  }

  function copyId() {
    if (!project) return
    navigator.clipboard.writeText(project.id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  async function handleExport() {
    if (!project || exporting) return
    setExporting(true)
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
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (!project || deleting) return
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteProject(id)
      router.push('/projects')
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-[14px] text-[var(--text-secondary)]">Loading…</div>
  }

  if (!project) {
    return <div className="p-8 text-[14px] text-[var(--text-secondary)]">Project not found</div>
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <div className="flex gap-12">

        <div className="flex-1 space-y-4" id="general">

          {/* Project Name */}
          <SettingsCard
            title="Project Name"
            description="Used to identify your project on the Dashboard and in URLs."
            footerLeft="Learn more about project names"
            footerRight={
              <SaveButton saving={savingName} disabled={!name.trim()} onClick={saveName} />
            }
          >
            <div className="flex overflow-hidden rounded-lg border border-[var(--border-subtle)] focus-within:border-[var(--accent-primary)] transition-colors">
              <span className="shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-[14px] text-[var(--text-tertiary)]">
                inktide.ai/p/
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={80}
                className="flex-1 bg-transparent px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none"
              />
            </div>
          </SettingsCard>

          {/* Project ID */}
          <SettingsCard
            title="Project ID"
            description="Used when interacting with the Inktide API."
            footerLeft="Used when calling the API"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
                <span className="font-mono text-[14px] text-[var(--text-secondary)]">{project.id}</span>
              </div>
              <button
                type="button"
                onClick={copyId}
                title="Copy ID"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </SettingsCard>

          {/* Description */}
          <SettingsCard
            title="Description"
            description="A short description of what this project does."
            footerLeft={
              <span className="ml-auto text-right">{description.length}/300</span>
            }
            footerRight={
              <SaveButton saving={savingDesc} onClick={saveDescription} />
            }
          >
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="What is this project for?"
              className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
          </SettingsCard>

          {/* Linked Soul */}
          <SettingsCard
            title="Linked Soul"
            description="The AI soul that powers this project."
            footerLeft="Changes are saved immediately"
          >
            <SoulBindingPicker
              projectId={id}
              activeSoul={activeSoul}
              onChanged={setActiveSoul}
            />
          </SettingsCard>

          {/* Status */}
          <SettingsCard
            title="Status"
            description="Control the operational state of this project."
            footerLeft="Pausing a project stops all active pipelines"
            footerRight={
              <SaveButton saving={savingStatus} onClick={saveStatus} />
            }
          >
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'active' | 'paused' | 'archived')}
              className="w-48 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </SettingsCard>

          {/* Export */}
          <SettingsCard
            title="Export Project"
            description="Download this project as a .inkt file. The archive includes the project config, soul settings, and graph — but never secrets or tokens."
            footerLeft="Connectors must be reconnected after import"
            footerRight={
              <button
                type="button"
                disabled={exporting}
                onClick={handleExport}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]/80 disabled:opacity-40"
              >
                <Download size={12} />
                {exporting ? 'Exporting…' : 'Export .inkt'}
              </button>
            }
          >
            <p className="text-[14px] text-[var(--text-tertiary)]">
              Share this project with another account or keep it as a backup. The recipient can
              import it via the Projects page.
            </p>
          </SettingsCard>

          {/* Danger Zone */}
          <SettingsCard
            id="danger"
            title="Delete Project"
            description="Permanently delete this project and all associated data. This action cannot be undone."
            danger
            footerLeft="This will delete all pipelines, settings, and history"
            footerRight={
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-red-800/50 px-3 text-[14px] text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-40"
              >
                <Trash2 size={12} />
                {deleting ? 'Deleting…' : 'Delete Project'}
              </button>
            }
          >
            <p className="text-[14px] text-[var(--text-tertiary)]">
              Once you delete a project, there is no going back. All pipelines, channels, and
              configuration will be permanently removed.
            </p>
          </SettingsCard>

        </div>
      </div>
    </div>
  )
}
