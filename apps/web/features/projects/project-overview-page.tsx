'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Box, Check, ChevronRight, Copy, Cpu, FlaskConical,
  ImageIcon, Layers, Monitor, Pause, Pencil, Play, Radio,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { queryKeys } from '@/shared/lib/query/keys'
import { SOULS_ROUTE } from '@/lib/routes'
import { inferModelType } from '@/shared/lib/utils/model-type'
import { buildObsSceneUrl } from '@/shared/lib/utils/obs-url'
import { useProjectRuntimeContext } from './ProjectRuntimeContext'
import { SoulBindingPicker } from './soul-binding-picker'
import type { ProjectActiveSoul } from './api'
import {
  SectionCard, NoSoulPlaceholder, ProjectMetaRow, ProjectStatusBadge,
} from './ui/project-overview-primitives'

export function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const base = `/projects/${id}`
  const { t } = useTranslation('common')

  const {
    project,
    soul,
    activeModel,
    activeScene,
    activeChannels,
    previewUrl,
    loading,
    updateProjectMeta,
    toggleStatus,
  } = useProjectRuntimeContext()

  // ── Edit form state ───────────────────────────────────────────────────────
  const [editing, setEditing]         = useState(false)
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)
  const [toggling, setToggling]       = useState(false)
  const [copied, setCopied]           = useState(false)
  const [soulPickerOpen, setSoulPickerOpen] = useState(false)

  useEffect(() => {
    if (project && !editing) {
      setName(project.name)
      setDescription(project.description ?? '')
    }
  }, [project, editing])

  // ── Mutations ─────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!project || saving) return
    setSaving(true)
    try {
      await updateProjectMeta({ name, description: description || null })
      setEditing(false)
    } catch (err) {
      console.error('Update failed:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePause() {
    if (!project || toggling) return
    setToggling(true)
    try {
      await toggleStatus()
    } catch (err) {
      console.error('Status toggle failed:', err)
    } finally {
      setToggling(false)
    }
  }

  function handleSoulChanged(_soul: ProjectActiveSoul | null) {
    qc.invalidateQueries({ queryKey: queryKeys.projects.detail(id) })
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const obsUrl = useMemo(() => {
    if (!activeModel || !activeChannels.length || typeof window === 'undefined') return null
    return buildObsSceneUrl(window.location.origin, {
      channelId: activeChannels[0].channel_id!,
      modelUrl:  activeModel.public_url,
      modelType: inferModelType(activeModel.original_file_name),
      sceneUrl:  activeScene?.public_url,
    })
  }, [activeModel, activeChannels, activeScene])

  function copyObsUrl() {
    if (!obsUrl) return
    navigator.clipboard.writeText(obsUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-body text-[var(--text-tertiary)]">
        {t('projectDetail.projectNotFound')}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8">

      {/* ── Header ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3 py-2 text-[22px] font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              />
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('projectDetail.descriptionPlaceholder')}
                rows={2}
                className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3 py-2 text-body text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] placeholder:text-[var(--text-tertiary)]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving || !name.trim()}
                  onClick={handleSave}
                  className="h-8 rounded-lg bg-[var(--accent-primary)] px-4 text-body font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {saving ? t('projectDetail.saving') : t('projectDetail.save')}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setName(project.name); setDescription(project.description ?? '') }}
                  className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-4 text-body text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                >
                  {t('projectDetail.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{project.name}</h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              {project.description && (
                <p className="mt-1 text-body text-[var(--text-secondary)]">{project.description}</p>
              )}
            </>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3 text-body text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              <Pencil size={13} /> {t('projectDetail.edit')}
            </button>
            <button
              type="button"
              disabled={toggling || project.status === 'archived'}
              onClick={handleTogglePause}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3 text-body text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-40"
            >
              {project.status === 'paused'
                ? <><Play size={13} /> {t('projectDetail.resume')}</>
                : <><Pause size={13} /> {t('projectDetail.pause')}</>
              }
            </button>
            <button
              type="button"
              onClick={() => router.push(`${base}/character`)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-4 text-body font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              <Cpu size={13} /> {t('projectDetail.openCharacter')}
            </button>
          </div>
        )}
      </div>

      {/* ── Sandbox — full-width scene preview ── */}
      <section className="mb-6 overflow-hidden rounded-xl border border-[var(--border-card)]">
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title="Scene preview"
              className="h-full w-full border-0 pointer-events-none"
            />
          ) : activeScene?.public_url ? (
            <img
              src={activeScene.public_url}
              alt="Scene background"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[var(--surface-2)] to-[var(--bg-deeper,var(--bg-0))]">
              <div className="flex flex-col items-center gap-2 text-[var(--text-tertiary)]">
                <ImageIcon size={36} strokeWidth={1.25} />
                <span className="text-body">{t('projectDetail.noSceneConfigured')}</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {activeModel && (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-sm">
              <Box size={12} className="text-white/60" />
              <span className="text-body font-medium text-white/90">
                {inferModelType(activeModel.original_file_name).toUpperCase()} · {activeModel.original_file_name}
              </span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <FlaskConical size={14} className="text-white/70" />
                <span className="text-body font-semibold text-white">{t('projectDetail.sandbox')}</span>
              </div>
              <p className="mt-0.5 text-body text-white/60">
                {t('projectDetail.sandboxDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`${base}/sandbox`)}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-4 text-body font-medium text-white backdrop-blur-sm hover:bg-white/20"
            >
              <FlaskConical size={13} /> {t('projectDetail.openSandbox')}
            </button>
          </div>
        </div>
      </section>

      {/* ── 2-col grid: Character + Scene ── */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">

        <SectionCard icon={Cpu} title={t('projectDetail.character')} href={`${base}/character`}>
          {!soul ? <NoSoulPlaceholder /> : (
            <div className="-my-2.5">
              <ProjectMetaRow label={t('projectDetail.soul')} value={soul.name} />
              {soul.llm_model && (
                <ProjectMetaRow
                  label={t('projectDetail.model')}
                  value={`${soul.llm_model.provider} · ${soul.llm_model.display_name}`}
                />
              )}
              {soul.personality && (
                <ProjectMetaRow
                  label={t('projectDetail.personality')}
                  value={<span className="line-clamp-2">{soul.personality}</span>}
                />
              )}
              {soul.system_prompt && (
                <ProjectMetaRow
                  label={t('projectDetail.systemPrompt')}
                  value={
                    <span className="line-clamp-2 text-[var(--text-secondary)]">
                      {soul.system_prompt}
                    </span>
                  }
                />
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Layers} title={t('projectDetail.scene')} href={`${base}/scene`}>
          {!soul ? <NoSoulPlaceholder /> : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--surface-2)]">
                  <Box size={15} className="text-[var(--text-secondary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium text-[var(--text-primary)]">
                    {activeModel?.original_file_name ?? t('projectDetail.noModelSelected')}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">{t('projectDetail.model3d')}</p>
                </div>
                {activeModel && (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs text-emerald-400">
                    {t('projectDetail.active')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--surface-2)]">
                  {activeScene?.public_url
                    ? <img src={activeScene.public_url} alt="" className="h-full w-full object-cover" />
                    : <ImageIcon size={15} className="text-[var(--text-secondary)]" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium text-[var(--text-primary)]">
                    {activeScene?.display_name ?? activeScene?.original_file_name ?? t('projectDetail.noBackgroundSelected')}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">{t('projectDetail.background')}</p>
                </div>
                {activeScene && (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs text-emerald-400">
                    {t('projectDetail.active')}
                  </span>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── 2-col grid: Channels + Soul ── */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">

        <SectionCard icon={Radio} title={t('projectDetail.channels')} href={`${base}/channels`}>
          {!soul ? <NoSoulPlaceholder /> : activeChannels.length === 0 ? (
            <p className="text-body text-[var(--text-tertiary)]">{t('projectDetail.noActiveChannels')}</p>
          ) : (
            <div className="space-y-2">
              {activeChannels.slice(0, 4).map(ch => (
                <div key={ch.id} className="flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] px-3 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span className="text-body font-medium capitalize text-[var(--text-primary)]">{ch.platform}</span>
                  <span className="truncate text-body text-[var(--text-secondary)]">· {ch.channel_name}</span>
                </div>
              ))}
              {activeChannels.length > 4 && (
                <p className="text-xs text-[var(--text-tertiary)]">{t('projectDetail.moreChannels', { count: activeChannels.length - 4 })}</p>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Cpu} title={t('projectDetail.soul')} href="/souls">
          {!project.active_soul ? (
            <div className="space-y-4">
              <div>
                <p className="text-body font-medium text-[var(--text-primary)]">{t('projectDetail.selectSoul')}</p>
                <p className="mt-1 text-body text-[var(--text-secondary)]">
                  {t('projectDetail.selectSoulDesc')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--surface-2)]" />
                <button
                  type="button"
                  onClick={() => setSoulPickerOpen(true)}
                  className="h-8 rounded-lg border border-[var(--border-subtle)] bg-transparent px-3 text-body text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                >
                  {t('projectDetail.select')}
                </button>
                <Link
                  href={SOULS_ROUTE}
                  className="flex h-8 items-center rounded-lg bg-white px-3 text-body font-medium text-black hover:bg-[#f2f2f2]"
                >
                  {t('projectDetail.browseSouls')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {project.active_soul.avatar_url ? (
                <img src={project.active_soul.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-body font-medium text-[var(--text-secondary)]">
                  {project.active_soul.name[0].toUpperCase()}
                </div>
              )}
              <span className="text-body font-medium text-[var(--text-primary)]">{project.active_soul.name}</span>
              <button
                type="button"
                onClick={() => setSoulPickerOpen(true)}
                className="ml-auto h-8 rounded-lg border border-[var(--border-subtle)] bg-transparent px-3 text-body text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
              >
                {t('projectDetail.change')}
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── OBS (full width) ── */}
      <section className="mb-6 overflow-hidden rounded-xl border border-[var(--border-card)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2 text-body font-medium text-[var(--text-primary)]">
            <Monitor size={14} className="text-[var(--text-tertiary)]" />
            {t('projectDetail.obs')}
          </div>
          <Link
            href={`${base}/obs`}
            className="flex items-center gap-0.5 text-body text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            {t('projectDetail.view')} <ChevronRight size={12} />
          </Link>
        </div>
        <div className="bg-[var(--bg-0)] px-5 py-4">
          {!soul ? <NoSoulPlaceholder /> : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 shrink-0 rounded-full ${
                  obsUrl
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                    : 'bg-[var(--text-tertiary)]/40'
                }`} />
                <div>
                  <p className="text-body font-medium text-[var(--text-primary)]">
                    {obsUrl ? t('projectDetail.obsReady') : t('projectDetail.obsNotConfigured')}
                  </p>
                  <p className="text-body text-[var(--text-secondary)]">
                    {obsUrl
                      ? t('projectDetail.obsReadyDesc')
                      : t('projectDetail.obsNotConfiguredDesc')
                    }
                  </p>
                </div>
              </div>
              {obsUrl ? (
                <div className="flex shrink-0 items-center gap-2">
                  <code className="max-w-[300px] truncate rounded-lg border border-[var(--border-subtle)] bg-black/30 px-3 py-1.5 font-mono text-xs text-cyan-300/90">
                    {obsUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyObsUrl}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-body font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? t('projectDetail.copied') : t('projectDetail.copy')}
                  </button>
                </div>
              ) : (
                <Link
                  href={`${base}/obs`}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-body text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                >
                  {t('projectDetail.obsConfigure')} <ChevronRight size={12} />
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <SoulBindingPicker
        projectId={id}
        activeSoul={project.active_soul}
        onChanged={handleSoulChanged}
        open={soulPickerOpen}
        onOpenChange={setSoulPickerOpen}
      />

    </div>
  )
}
