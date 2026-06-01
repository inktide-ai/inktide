'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Check, Copy, Download, LayoutTemplate, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getProject, updateProject, deleteProject, exportProject } from './api'
import { SoulBindingPicker } from './soul-binding-picker'
import type { Project, ProjectActiveSoul } from './api'
import { PROJECTS_ROUTE } from '@/lib/routes'
import { TemplateEditorModal } from '@/features/templates'
import { useTemplateStore } from '@/shared/lib/templates/useTemplateStore'

function SaveButton({ saving, disabled, onClick }: { saving: boolean; disabled?: boolean; onClick: () => void }) {
  const { t } = useTranslation('common')
  return (
    <button
      type="button"
      disabled={saving || disabled}
      onClick={onClick}
      className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]/80 disabled:opacity-40"
    >
      {saving ? t('projectDetail.saving') : t('projectDetail.save')}
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
        <p className="mt-0.5 text-body text-[var(--text-secondary)]">{description}</p>
      </div>

      <div className="px-5 pb-5">{children}</div>

      {(footerLeft !== undefined || footerRight !== undefined) && (
        <>
          <div className="border-t border-[var(--border-subtle)]" />
          <div className="flex items-center justify-between bg-[var(--surface-1)]/40 px-5 py-3">
            <span className="text-body text-[var(--text-tertiary)]">{footerLeft}</span>
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
  const { t }     = useTranslation('common')

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
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false)
  const [savedTemplate, setSavedTemplate] = useState(false)
  const templateStore = useTemplateStore()

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
      router.push(PROJECTS_ROUTE)
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-body text-[var(--text-secondary)]">{t('projectDetail.loading')}</div>
  }

  if (!project) {
    return <div className="p-8 text-body text-[var(--text-secondary)]">{t('projectDetail.projectNotFound')}</div>
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <div className="flex gap-12">

        <div className="flex-1 space-y-4" id="general">

          {/* Project Name */}
          <SettingsCard
            title={t('projectDetail.projectName')}
            description={t('projectDetail.projectNameDesc')}
            footerLeft={t('projectDetail.learnMoreProjectNames')}
            footerRight={
              <SaveButton saving={savingName} disabled={!name.trim()} onClick={saveName} />
            }
          >
            <div className="flex overflow-hidden rounded-lg border border-[var(--border-subtle)] focus-within:border-[var(--accent-primary)] transition-colors">
              <span className="shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-body text-[var(--text-tertiary)]">
                inktide.ai/p/
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={80}
                className="flex-1 bg-transparent px-3 py-2 text-body text-[var(--text-primary)] outline-none"
              />
            </div>
          </SettingsCard>

          {/* Project ID */}
          <SettingsCard
            title={t('projectDetail.projectId')}
            description={t('projectDetail.projectIdDesc')}
            footerLeft={t('projectDetail.projectIdFooter')}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
                <span className="font-mono text-body text-[var(--text-secondary)]">{project.id}</span>
              </div>
              <button
                type="button"
                onClick={copyId}
                title={t('projectDetail.copyId')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </SettingsCard>

          {/* Description */}
          <SettingsCard
            title={t('projectDetail.description')}
            description={t('projectDetail.descriptionDesc')}
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
              placeholder={t('projectDetail.descriptionPlaceholderLong')}
              className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2.5 text-body text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
          </SettingsCard>

          {/* Linked Soul */}
          <SettingsCard
            title={t('projectDetail.linkedSoul')}
            description={t('projectDetail.linkedSoulDesc')}
            footerLeft={t('projectDetail.linkedSoulFooter')}
          >
            <SoulBindingPicker
              projectId={id}
              activeSoul={activeSoul}
              onChanged={setActiveSoul}
            />
          </SettingsCard>

          {/* Status */}
          <SettingsCard
            title={t('projectDetail.status')}
            description={t('projectDetail.statusDesc')}
            footerLeft={t('projectDetail.statusFooter')}
            footerRight={
              <SaveButton saving={savingStatus} onClick={saveStatus} />
            }
          >
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'active' | 'paused' | 'archived')}
              className="w-48 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-body text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="active">{t('projectDetail.statusActive')}</option>
              <option value="paused">{t('projectDetail.statusPaused')}</option>
              <option value="archived">{t('projectDetail.statusArchived')}</option>
            </select>
          </SettingsCard>

          {/* Save as Template */}
          <SettingsCard
            title={t('templates.saveAsTemplateTitle')}
            description={t('templates.saveAsTemplateDesc')}
          >
            <button
              type="button"
              onClick={() => setShowSaveAsTemplate(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              <LayoutTemplate size={14} />
              {savedTemplate ? '✓ Saved' : t('templates.saveAsTemplateButton')}
            </button>
          </SettingsCard>

          {/* Export */}
          <SettingsCard
            title={t('projectDetail.exportProject')}
            description={t('projectDetail.exportProjectDesc')}
            footerLeft={t('projectDetail.exportFooter')}
            footerRight={
              <button
                type="button"
                disabled={exporting}
                onClick={handleExport}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]/80 disabled:opacity-40"
              >
                <Download size={12} />
                {exporting ? t('projectDetail.exporting') : t('projectDetail.exportInkt')}
              </button>
            }
          >
            <p className="text-body text-[var(--text-tertiary)]">
              {t('projectDetail.exportBody')}
            </p>
          </SettingsCard>

          {/* Danger Zone */}
          <SettingsCard
            id="danger"
            title={t('projectDetail.deleteProject')}
            description={t('projectDetail.deleteProjectDesc')}
            danger
            footerLeft={t('projectDetail.deleteFooter')}
            footerRight={
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-red-800/50 px-3 text-body text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-40"
              >
                <Trash2 size={12} />
                {deleting ? t('projectDetail.deleting') : t('projectDetail.deleteProject')}
              </button>
            }
          >
            <p className="text-body text-[var(--text-tertiary)]">
              {t('projectDetail.deleteBody')}
            </p>
          </SettingsCard>

        </div>
      </div>

      <AnimatePresence>
        {showSaveAsTemplate && project && (
          <TemplateEditorModal
            mode="create"
            initialData={{
              id: '',
              name: project.name,
              emoji: '🤖',
              tagline: 'Custom',
              description: project.description ?? '',
              longDescription: project.description ?? '',
              accentColor: '#7c3aed',
              defaultName: project.name,
              systemPrompt: project.system_prompt ?? '',
              category: 'utility',
              platforms: ['any'],
              features: [],
              nextSteps: [],
              isSystem: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            onClose={() => setShowSaveAsTemplate(false)}
            onSave={async data => {
              await templateStore.create(data)
              setShowSaveAsTemplate(false)
              setSavedTemplate(true)
              setTimeout(() => setSavedTemplate(false), 3000)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
