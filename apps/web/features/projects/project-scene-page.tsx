'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ImageIcon, Box, Search, X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProjectRuntimeContext } from './ProjectRuntimeContext'
import { PRESET_SCENES, getSceneDisplayTitle } from '@/features/character-editor'
import type { PresetScene } from '@/features/character-editor'
import { getPillColors } from '@/features/character-editor/tabs/scene-tag-utils'
import { CardSceneUploader } from '@/entities/soul/services/upload/CardSceneUploader'
import { executePresignedUpload } from '@/shared/services/upload/PresignedUploadService'
import { PageContent } from '@/shared/ui'

function inferModelLabel(fileName: string): string {
  if (fileName.endsWith('.vrm')) return 'VRM'
  if (fileName.endsWith('.glb')) return 'GLB'
  return 'Model'
}

function ExpandingSearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  return (
    <div
      className="relative flex items-center overflow-hidden rounded-lg border transition-[width,border-color,background] duration-300 ease-out"
      style={{
        width: open ? 200 : 32,
        borderColor: open ? 'var(--border-subtle)' : 'transparent',
        background: open ? 'var(--surface-1)' : 'transparent',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        aria-label="Search"
      >
        <Search size={14} />
      </button>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        style={{ opacity: open ? 1 : 0, transition: 'opacity 0.2s 0.1s' }}
        onKeyDown={e => {
          if (e.key === 'Escape') { onChange(''); setOpen(false) }
        }}
      />
      {open && (
        <button
          type="button"
          onClick={() => { onChange(''); setOpen(false) }}
          className="flex h-8 w-7 shrink-0 items-center justify-center text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
          aria-label="Close search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

export default function ProjectScenePage() {
  const { project, models, scenes, loading, setActiveModel, setActiveScene } = useProjectRuntimeContext()
  const [saving, setSaving] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [sceneSearch, setSceneSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const { t } = useTranslation('common')

  const importedPresetNames = new Set(scenes.map(s => getSceneDisplayTitle(s)))

  const sq = sceneSearch.toLowerCase()
  const filteredPresets = PRESET_SCENES.filter(
    p => !importedPresetNames.has(p.name) &&
      (!sq || p.name.toLowerCase().includes(sq) || p.tagName.toLowerCase().includes(sq)),
  )
  const filteredScenes = scenes.filter(
    s => !sq || getSceneDisplayTitle(s).toLowerCase().includes(sq),
  )

  const mq = modelSearch.toLowerCase()
  const filteredModels = models.filter(
    m => !mq || m.original_file_name.toLowerCase().includes(mq) || inferModelLabel(m.original_file_name).toLowerCase().includes(mq),
  )

  const selectModel = async (modelId: string | null) => {
    if (saving) return
    setSaving(true)
    try { await setActiveModel(modelId) }
    catch (err) { console.error('Failed to update model:', err) }
    finally { setSaving(false) }
  }

  const selectScene = async (sceneId: string | null) => {
    if (saving) return
    setSaving(true)
    try { await setActiveScene(sceneId) }
    catch (err) { console.error('Failed to update scene:', err) }
    finally { setSaving(false) }
  }

  async function importPreset(preset: PresetScene) {
    if (!project || importingId || !preset.imagePath) return

    // Defence in depth: if already imported, just activate the existing scene
    const existing = scenes.find(s => getSceneDisplayTitle(s) === preset.name)
    if (existing) {
      await selectScene(existing.id)
      return
    }

    setImportingId(preset.id)
    try {
      const res = await fetch(preset.imagePath)
      const blob = await res.blob()
      const file = new File([blob], `${preset.name}.jpg`, { type: blob.type || 'image/jpeg' })
      const uploader = new CardSceneUploader(project.id)
      const scene = await executePresignedUpload(uploader, file)
      // setActiveScene -> onSettled -> invalidateAll -> scenes query refetches
      await setActiveScene(scene.id)
    } catch (err) {
      console.error('Preset import failed:', err)
    } finally {
      setImportingId(null)
    }
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
        {t('projectDetail.bindSoulFirst')}
      </div>
    )
  }

  const noSceneResults = filteredPresets.length === 0 && filteredScenes.length === 0
  const noModelResults = filteredModels.length === 0

  return (
    <PageContent>
      <header className="mb-7 flex flex-col gap-2">
        <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">{t('projectDetail.scene')}</h2>
        <span className="text-body text-balance text-[var(--text-secondary)]">{t('projectDetail.sceneSubtitle')}</span>
      </header>

      {/* 3D Model picker */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Box size={15} className="text-[var(--text-secondary)]" />
          <h2 className="text-body font-semibold text-[var(--text-primary)]">{t('projectDetail.model3d')}</h2>
          {project.active_model_id && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
              {t('projectDetail.active')}
            </span>
          )}
          <div className="ml-auto">
            <ExpandingSearchBar value={modelSearch} onChange={setModelSearch} placeholder="Search models…" />
          </div>
        </div>

        {models.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-tertiary)]">
            {t('projectDetail.noModelsUploaded')}
          </div>
        ) : noModelResults ? (
          <div className="flex h-[80px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-tertiary)]">
            No models match your search
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredModels.map(model => {
              const active = project.active_model_id === model.id
              const typeLabel = inferModelLabel(model.original_file_name)
              return (
                <button
                  key={model.id}
                  type="button"
                  disabled={saving}
                  onClick={() => selectModel(active ? null : model.id)}
                  className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                    active
                      ? 'border-[var(--accent-primary)] bg-[var(--sidebar-active)]'
                      : 'border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] hover:border-[var(--accent-primary)] hover:bg-[var(--surface-1)]'
                  }`}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)]">
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                    <Box size={18} className="text-[var(--text-secondary)]" />
                  </div>
                  <div className="min-w-0 w-full pr-6">
                    <p className="truncate text-body font-medium text-[var(--text-primary)]">
                      {model.original_file_name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded border border-[var(--border-subtle)] px-1.5 py-px text-[10px] text-[var(--text-tertiary)]">
                        {typeLabel}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {(model.size_bytes / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Scene / background picker */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon size={15} className="text-[var(--text-secondary)]" />
          <h2 className="text-body font-semibold text-[var(--text-primary)]">{t('projectDetail.background')}</h2>
          {project.active_scene_id && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
              {t('projectDetail.active')}
            </span>
          )}
          <div className="ml-auto">
            <ExpandingSearchBar value={sceneSearch} onChange={setSceneSearch} placeholder="Search scenes…" />
          </div>
        </div>

        {noSceneResults ? (
          <div className="flex h-[80px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-tertiary)]">
            No scenes match your search
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {/* Preset scenes - click to copy to MinIO and activate */}
            {filteredPresets.map(preset => {
              const importing = importingId === preset.id
              const pillColors = getPillColors(preset.tagName)
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!!importingId || saving}
                  onClick={() => importPreset(preset)}
                  className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] text-left transition-all hover:border-[var(--accent-primary)] disabled:opacity-60"
                >
                  {importing && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <Loader2 size={20} className="animate-spin text-white" />
                    </div>
                  )}
                  <div className="relative h-[90px] w-full overflow-hidden bg-[var(--surface-2)]">
                    {preset.imagePath && (
                      <img
                        src={preset.imagePath}
                        alt={preset.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                  </div>
                  <div className="bg-[var(--surface-1)] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-body font-medium text-[var(--text-primary)]">{preset.name}</p>
                      <span
                        className="shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: pillColors.text, background: pillColors.bg, borderColor: pillColors.border }}
                      >
                        {preset.tagName}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Custom (user-uploaded) scenes */}
            {filteredScenes.map(scene => {
              const active = project.active_scene_id === scene.id
              return (
                <button
                  key={scene.id}
                  type="button"
                  disabled={saving}
                  onClick={() => selectScene(active ? null : scene.id)}
                  className={`relative overflow-hidden rounded-xl border transition-all ${
                    active
                      ? 'border-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
                  }`}
                >
                  {active && (
                    <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)]">
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                  <div className="relative h-[90px] w-full bg-[var(--surface-2)]">
                    {scene.public_url ? (
                      <img
                        src={scene.public_url}
                        alt={getSceneDisplayTitle(scene)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon size={24} className="text-[var(--text-tertiary)]" />
                      </div>
                    )}
                  </div>
                  <div className="bg-[var(--surface-1)] px-3 py-2">
                    <p className="truncate text-body font-medium text-[var(--text-primary)]">
                      {getSceneDisplayTitle(scene)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </PageContent>
  )
}
