'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectRuntimeContext } from '@/features/projects'
import { deleteProjectScene, reorderProjectScene, type ProjectSceneResponse } from '@/features/projects/api/scenes'
import { PRESET_SCENES, getSceneDisplayTitle, BUILTIN_SCENE_TAGS } from '@/features/character-editor'
import type { PresetScene } from '@/features/character-editor'
import { NewSceneModal } from '@/features/character-editor/tabs/new-scene-modal'
import { getPillColors } from '@/features/character-editor/tabs/scene-tag-utils'
import { CardSceneUploader } from '@/entities/soul/services/upload/CardSceneUploader'
import { executePresignedUpload } from '@/shared/services/upload/PresignedUploadService'
import { cn } from '@/lib/utils'

type TabFilter = 'All' | 'Default' | 'Custom'


function Slider({ label, value, onChange, unit = '%' }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-body text-[var(--text-tertiary)]">{label}</span>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-[var(--accent-primary)] cursor-pointer"
      />
      <span className="w-10 text-right text-body text-[var(--text-secondary)]">{value}{unit}</span>
    </div>
  )
}

interface SceneButtonProps {
  id: string
  name: string
  isActive: boolean
  kindLabel: string
  activeLabel: string
  bgStyle: React.CSSProperties
  tagName?: string
  onDelete?: () => void
  deleting?: boolean
  onClick: () => void
}

function SceneButton({ name, isActive, kindLabel, activeLabel, bgStyle, tagName, onDelete, deleting, onClick }: SceneButtonProps) {
  const { t } = useTranslation('scene')
  const pillColors = tagName ? getPillColors(tagName) : null
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-lg border text-left transition-all',
        isActive
          ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-subtle)]/80',
      )}
    >
      <div className="aspect-[4/3] w-full" style={bgStyle} />

      {onDelete && !confirming && (
        <button
          type="button"
          className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-transparent bg-black/40 text-white/50 opacity-0 backdrop-blur-sm transition-[opacity,background,color,border-color] duration-150 group-hover:opacity-100 hover:border-[rgba(248,113,113,0.35)] hover:bg-[rgba(248,113,113,0.18)] hover:text-[var(--color-error-mid)]"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setConfirming(true) }}
          aria-label="Delete scene"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      )}

      {confirming && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 rounded-[inherit] bg-[rgba(6,4,12,0.92)] p-3 backdrop-blur-[3px]"
          onClick={e => { e.stopPropagation(); setConfirming(false) }}
        >
          <p className="text-center text-xs font-bold leading-tight text-[var(--text-primary)] line-clamp-2">{name}</p>
          <p className="text-center text-[10px] text-[var(--text-muted)] leading-snug">{t('card.deleteDesc')}</p>
          <div className="mt-1 flex w-full gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="flex-1 rounded-lg border border-white/[0.14] bg-transparent py-1.5 text-[10px] font-semibold text-[var(--text-secondary)] transition-[background,color,border-color] duration-150 hover:border-white/25 hover:bg-white/[0.09] hover:text-[var(--text-primary)]"
              onClick={() => setConfirming(false)}
            >
              {t('card.cancel')}
            </button>
            <button
              type="button"
              disabled={deleting}
              className="flex-1 rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] py-1.5 text-[10px] font-semibold text-[var(--color-error-mid)] transition-[background,color,border-color] duration-150 hover:border-[rgba(248,113,113,0.45)] hover:bg-[rgba(248,113,113,0.16)] disabled:opacity-50"
              onClick={() => { onDelete?.(); setConfirming(false) }}
            >
              {deleting ? '…' : t('card.delete')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-[var(--surface-1)] px-2 py-1.5">
        <p className="truncate text-xs font-medium text-[var(--text-primary)]">{name}</p>
        <div className="mt-0.5 flex items-center gap-1">
          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-green-400" />}
          {isActive ? (
            <span className="text-2xs font-medium text-green-400">{activeLabel}</span>
          ) : pillColors ? (
            <span
              className="text-2xs font-semibold tracking-wide uppercase px-1.5 py-px rounded border"
              style={{ color: pillColors.text, background: pillColors.bg, borderColor: pillColors.border }}
            >
              {tagName}
            </span>
          ) : (
            <span className="text-2xs font-medium text-[var(--text-tertiary)]">{kindLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SortableSceneButton(props: SceneButtonProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id })
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
      <SceneButton {...props} />
    </div>
  )
}


export default function ProjectBackgroundPage() {
  const { t } = useTranslation('scene')
  const { project, scenes, setActiveScene, loading } = useProjectRuntimeContext()

  const [localScenes, setLocalScenes] = useState<ProjectSceneResponse[]>([])
  useEffect(() => { setLocalScenes(scenes) }, [scenes])

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<TabFilter>('All')
  const [brightness, setBrightness] = useState(72)
  const [blur, setBlur] = useState(10)
  const [colorFilter, setColorFilter] = useState('none')
  const [showModal, setShowModal] = useState(false)

  const COLOR_FILTERS = [
    { id: 'none',        label: t('soulPage.colorNone'),        color: 'transparent' },
    { id: 'purpleDream', label: t('soulPage.colorPurpleDream'), color: 'rgba(139,92,246,0.25)' },
    { id: 'nightBlue',   label: t('soulPage.colorNightBlue'),   color: 'rgba(59,130,246,0.25)' },
    { id: 'warmSunset',  label: t('soulPage.colorWarmSunset'),  color: 'rgba(251,146,60,0.22)' },
    { id: 'mintCool',    label: t('soulPage.colorMintCool'),    color: 'rgba(34,211,238,0.20)' },
  ]

  const FILTER_TABS: Array<{ id: TabFilter; label: string }> = [
    { id: 'All',     label: t('soulPage.filterAll') },
    { id: 'Default', label: t('soulPage.filterDefault') },
    { id: 'Custom',  label: t('soulPage.filterCustom') },
  ]

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const filterColor = COLOR_FILTERS.find(f => f.id === colorFilter)?.color ?? 'transparent'

  const activeSceneId = project?.active_scene_id ?? null
  const activeCustomScene = localScenes.find(s => s.id === activeSceneId) ?? null
  const activePreset = PRESET_SCENES.find(p =>
    !!localScenes.find(s => getSceneDisplayTitle(s) === p.name && s.id === activeSceneId),
  ) ?? null

  const previewBg: React.CSSProperties = activeCustomScene
    ? { backgroundImage: `url(${activeCustomScene.public_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : activePreset
      ? activePreset.imagePath
        ? { backgroundImage: `url(${activePreset.imagePath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: activePreset.charGradient }
      : {}

  const activeLabel = activeCustomScene
    ? getSceneDisplayTitle(activeCustomScene)
    : activePreset
      ? activePreset.name
      : t('soulPage.noSceneSelected')

  const filteredPresets = tab === 'Custom' ? [] : PRESET_SCENES
  const filteredCustom = tab === 'Default' ? [] : localScenes

  async function handleSelectCustom(sceneId: string) {
    if (saving) return
    setSaving(true)
    try { await setActiveScene(activeSceneId === sceneId ? null : sceneId) }
    catch (err) { console.error('Failed to activate scene:', err) }
    finally { setSaving(false) }
  }

  async function handleSelectPreset(preset: PresetScene) {
    if (!project || importingId || saving) return
    const existing = localScenes.find(s => getSceneDisplayTitle(s) === preset.name)
    if (existing) {
      if (saving) return
      setSaving(true)
      try { await setActiveScene(activeSceneId === existing.id ? null : existing.id) }
      catch (err) { console.error('Failed to activate preset:', err) }
      finally { setSaving(false) }
      return
    }
    if (!preset.imagePath) return
    setImportingId(preset.id)
    try {
      const res = await fetch(preset.imagePath)
      const blob = await res.blob()
      const file = new File([blob], `${preset.name}.jpg`, { type: blob.type || 'image/jpeg' })
      const scene = await executePresignedUpload(new CardSceneUploader(project.id), file)
      await setActiveScene(scene.id)
    } catch (err) {
      console.error('Preset import failed:', err)
    } finally {
      setImportingId(null)
    }
  }

  async function handleDeleteCustom(sceneId: string) {
    if (!project) return
    setDeletingId(sceneId)
    try {
      await deleteProjectScene(project.id, sceneId)
      setLocalScenes(prev => prev.filter(s => s.id !== sceneId))
      if (activeSceneId === sceneId) await setActiveScene(null)
    } catch (err) { console.error('Failed to delete scene:', err) }
    finally { setDeletingId(null) }
  }

  function handleSceneDragEnd(event: DragEndEvent) {
    if (!project) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = localScenes.findIndex(s => s.id === active.id)
    const newIdx = localScenes.findIndex(s => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = arrayMove(localScenes, oldIdx, newIdx)
    setLocalScenes(reordered)
    const neighborIdx = reordered.findIndex(s => s.id === active.id)
    void reorderProjectScene(project.id, active.id as string, {
      previous_id: reordered[neighborIdx - 1]?.id ?? null,
      next_id: reordered[neighborIdx + 1]?.id ?? null,
    }).catch(() => setLocalScenes(scenes))
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-5 min-w-0">
        <div
          className="relative min-h-[260px] flex-1 overflow-hidden rounded-2xl border border-[var(--border-subtle)]"
          style={previewBg}
        >
          <div className="absolute inset-0" style={{ filter: `brightness(${brightness / 100}) blur(${blur / 10}px)`, ...previewBg }} />
          {filterColor !== 'transparent' && (
            <div className="absolute inset-0" style={{ background: filterColor, mixBlendMode: 'color' }} />
          )}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="text-xs font-medium text-white">{t('soulPage.activeBadge')}</span>
            <span className="text-xs text-white/60">{activeLabel}</span>
          </div>
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-sm">
            <span className="text-xs font-medium text-white/80">{t('soulPage.livePreview')}</span>
          </div>
          {!activeCustomScene && !activePreset && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-body text-[var(--text-tertiary)]">{t('soulPage.noSceneSelected')}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/40">
          <div className="border-b border-[var(--border-subtle)] px-4 py-3">
            <p className="text-body font-semibold text-[var(--text-primary)]">{t('soulPage.controls.title')}</p>
            <p className="text-body text-[var(--text-tertiary)]">{t('soulPage.controls.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-4 py-4">
            <Slider label={t('soulPage.controls.brightness')} value={brightness} onChange={setBrightness} />
            <Slider label={t('soulPage.controls.blur')} value={blur} onChange={setBlur} />
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-body text-[var(--text-tertiary)]">{t('soulPage.controls.colorFilter')}</span>
              <select
                value={colorFilter}
                onChange={e => setColorFilter(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1.5 text-body text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              >
                {COLOR_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-[280px] shrink-0 flex-col overflow-hidden border-l border-[var(--border-subtle)]">
        <div className="shrink-0 px-4 py-4">
          <p className="text-body font-semibold text-[var(--text-primary)]">{t('soulPage.allScenes')}</p>
          <p className="mt-0.5 text-body text-[var(--text-tertiary)]">{t('soulPage.allScenesDesc')}</p>
        </div>

        <div className="shrink-0 flex gap-0.5 border-b border-[var(--border-subtle)] px-2 pb-2">
          {FILTER_TABS.map(filterTab => (
            <button
              key={filterTab.id}
              type="button"
              onClick={() => setTab(filterTab.id)}
              className={cn(
                'flex-1 h-7 rounded-md px-1 text-body font-medium transition-colors text-center',
                tab === filterTab.id
                  ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
            >
              {filterTab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSceneDragEnd}>
            <div className="grid grid-cols-2 gap-2">
              {filteredPresets.map(preset => {
                const imported = localScenes.find(s => getSceneDisplayTitle(s) === preset.name)
                const isActive = !!imported && imported.id === activeSceneId
                const isImporting = importingId === preset.id
                return (
                  <SceneButton
                    key={preset.id}
                    id={preset.id}
                    name={isImporting ? '…' : preset.name}
                    isActive={isActive}
                    kindLabel={t('soulPage.kindDefault')}
                    activeLabel={t('card.active')}
                    tagName={preset.tagName}
                    bgStyle={
                      preset.imagePath
                        ? { backgroundImage: `url(${preset.imagePath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: preset.charGradient }
                    }
                    onClick={() => handleSelectPreset(preset)}
                  />
                )
              })}

              <SortableContext items={filteredCustom.map(s => s.id)} strategy={rectSortingStrategy}>
                {filteredCustom.map(scene => (
                  <SortableSceneButton
                    key={scene.id}
                    id={scene.id}
                    name={getSceneDisplayTitle(scene)}
                    isActive={scene.id === activeSceneId}
                    kindLabel={t('soulPage.kindCustom')}
                    activeLabel={t('card.active')}
                    bgStyle={scene.public_url
                      ? { backgroundImage: `url(${scene.public_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: 'var(--surface-2)' }
                    }
                    onDelete={() => handleDeleteCustom(scene.id)}
                    deleting={deletingId === scene.id}
                    onClick={() => handleSelectCustom(scene.id)}
                  />
                ))}
              </SortableContext>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="group flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]/30 transition-colors hover:border-[var(--accent-primary)]/50 hover:bg-[var(--surface-1)]/60"
              >
                <Plus size={16} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
                <p className="text-xs font-medium text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]">{t('soulPage.uploadScene')}</p>
                <p className="text-2xs text-[var(--text-tertiary)]/60">{t('soulPage.uploadSceneSubtitle')}</p>
              </button>
            </div>
          </DndContext>
        </div>
      </div>

      {showModal && project && (
        <NewSceneModal
          projectId={project.id}
          tagOptions={[...BUILTIN_SCENE_TAGS]}
          onClose={() => setShowModal(false)}
          onCreated={(scene) => {
            setLocalScenes(prev => [...prev, scene])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
