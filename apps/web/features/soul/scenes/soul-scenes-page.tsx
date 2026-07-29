'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCharactersContext } from '@/entities/character'
import { useCardScene } from '@/entities/soul'
import { deleteProjectScene, reorderProjectScene, type ProjectSceneResponse } from '@/features/projects/api/scenes'
import { PRESET_SCENES, NewSceneModal, getSceneDisplayTitle, BUILTIN_SCENE_TAGS } from '@/features/character-editor'
import type { PresetScene } from '@/features/character-editor'
import { getPillColors } from '@/features/character-editor/tabs/scene-tag-utils'
import { cn } from '@/lib/utils'
import { Slider as RadixSlider } from '@/shared/ui/slider'

type TabFilter = 'All' | 'Default' | 'Custom'

function Slider({ label, value, onChange, unit = '%' }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-body text-[var(--text-tertiary)]">{label}</span>
      <RadixSlider
        value={value} onChange={onChange}
        min={0} max={100} step={1}
        fill="var(--text-primary)" trackHeight={3} thumbSize={12}
        className="flex-1"
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

function SceneButton({ id, name, isActive, kindLabel, activeLabel, bgStyle, tagName, onDelete, deleting, onClick }: SceneButtonProps) {
  const { t } = useTranslation('scene')
  const pillColors = tagName ? getPillColors(tagName) : null
  const [confirming, setConfirming] = useState(false)

  return (
    <button
      key={id}
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border text-left transition-all',
        isActive
          ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-subtle)]/80',
      )}
    >
      <div className="aspect-[4/3] w-full" style={bgStyle} />

      {/* Trash icon - only for deletable scenes */}
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

      {/* Delete confirmation overlay */}
      {confirming && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 rounded-[inherit] bg-[rgba(6,4,12,0.92)] p-3 backdrop-blur-[3px] animate-[cardOverlayIn_0.14s_ease]"
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
    </button>
  )
}

type SortableSceneButtonProps = SceneButtonProps

function SortableSceneButton(props: SortableSceneButtonProps) {
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

export default function SoulScenesPage() {
  const { t } = useTranslation('scene')
  const { selected } = useCharactersContext()
  const cardId = selected?.id
  const [refresh, setRefresh] = useState(0)
  const { scenes, loading, projectId } = useCardScene(cardId, refresh)

  const [localCustomScenes, setLocalCustomScenes] = useState<ProjectSceneResponse[]>([])
  useEffect(() => { setLocalCustomScenes(scenes) }, [scenes])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabFilter>('All')
  const [brightness, setBrightness] = useState(72)
  const [blur, setBlur] = useState(10)
  const [colorFilter, setColorFilter] = useState('none')
  const [showModal, setShowModal] = useState(false)

  const COLOR_FILTERS: { id: string; label: string; color: string }[] = [
    { id: 'none',        label: t('soulPage.colorNone'),        color: 'transparent' },
    { id: 'purpleDream', label: t('soulPage.colorPurpleDream'), color: 'rgba(139,92,246,0.25)' },
    { id: 'nightBlue',   label: t('soulPage.colorNightBlue'),   color: 'rgba(59,130,246,0.25)'  },
    { id: 'warmSunset',  label: t('soulPage.colorWarmSunset'),  color: 'rgba(251,146,60,0.22)'  },
    { id: 'mintCool',    label: t('soulPage.colorMintCool'),    color: 'rgba(34,211,238,0.20)'  },
  ]

  const FILTER_TABS: Array<{ id: TabFilter; label: string }> = [
    { id: 'All',     label: t('soulPage.filterAll') },
    { id: 'Default', label: t('soulPage.filterDefault') },
    { id: 'Custom',  label: t('soulPage.filterCustom') },
  ]

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const filterColor = COLOR_FILTERS.find(f => f.id === colorFilter)?.color ?? 'transparent'

  const allItems: Array<{ kind: 'preset'; data: PresetScene } | { kind: 'custom'; data: ProjectSceneResponse }> = [
    ...PRESET_SCENES.map(p => ({ kind: 'preset' as const, data: p })),
    ...localCustomScenes.map(s => ({ kind: 'custom' as const, data: s })),
  ]

  const filteredPresets = allItems.filter(item => {
    if (item.kind !== 'preset') return false
    if (tab === 'Custom') return false
    return true
  }) as Array<{ kind: 'preset'; data: PresetScene }>

  const filteredCustom = allItems.filter(item => {
    if (item.kind !== 'custom') return false
    if (tab === 'Default') return false
    return true
  }) as Array<{ kind: 'custom'; data: ProjectSceneResponse }>

  const resolvedActiveId = activeSceneId ?? (allItems[0]?.kind === 'preset' ? allItems[0].data.id : (localCustomScenes[0]?.id ?? null))
  const activeItem = allItems.find(i => i.data.id === resolvedActiveId) ?? allItems[0] ?? null

  const previewBg: React.CSSProperties = activeItem
    ? activeItem.kind === 'preset'
      ? activeItem.data.imagePath
        ? { backgroundImage: `url(${activeItem.data.imagePath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: activeItem.data.charGradient }
      : { backgroundImage: `url(${activeItem.data.public_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  const activeLabel = activeItem
    ? activeItem.kind === 'preset' ? activeItem.data.name : getSceneDisplayTitle(activeItem.data)
    : t('soulPage.noSceneSelected')

  async function handleDeleteCustom(sceneId: string) {
    if (!projectId) return
    setDeletingId(sceneId)
    try {
      await deleteProjectScene(projectId, sceneId)
      setLocalCustomScenes(prev => prev.filter(s => s.id !== sceneId))
      if (resolvedActiveId === sceneId) setActiveSceneId(null)
    } catch { /* silently restore — button exits deleting state */ }
    finally { setDeletingId(null) }
  }

  function handleSceneDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !projectId) return

    const oldIdx = localCustomScenes.findIndex(s => s.id === active.id)
    const newIdx = localCustomScenes.findIndex(s => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(localCustomScenes, oldIdx, newIdx)
    setLocalCustomScenes(reordered)

    const neighborIdx = reordered.findIndex(s => s.id === active.id)
    const previousId = reordered[neighborIdx - 1]?.id ?? null
    const nextId     = reordered[neighborIdx + 1]?.id ?? null

    void reorderProjectScene(projectId, active.id as string, { previous_id: previousId, next_id: nextId })
      .catch(() => setLocalCustomScenes(scenes))
  }

  if (!selected) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">{t('loading')}</div>
  }

  return (
    <div className="flex h-full overflow-hidden">

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-5 min-w-0">

        {/* Preview card */}
        <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-2xl border border-[var(--border-subtle)]" style={previewBg}>
          {/* CSS filter layer (brightness + blur) */}
          <div className="absolute inset-0" style={{ filter: `brightness(${brightness / 100}) blur(${blur / 10}px)`, ...previewBg }} />
          {/* Color overlay */}
          {filterColor !== 'transparent' && (
            <div className="absolute inset-0" style={{ background: filterColor, mixBlendMode: 'color' }} />
          )}
          {/* Active Scene badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="text-xs font-medium text-white">{t('soulPage.activeBadge')}</span>
            <span className="text-xs text-white/60">{activeLabel}</span>
          </div>
          {/* Live Preview badge */}
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-sm">
            <span className="text-xs font-medium text-white/80">{t('soulPage.livePreview')}</span>
          </div>
          {/* Placeholder when no scene */}
          {!activeItem && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-body text-[var(--text-tertiary)]">{t('soulPage.noSceneSelected')}</p>
            </div>
          )}
        </div>

        {/* Scene Controls */}
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
        {/* Header */}
        <div className="shrink-0 px-4 py-4">
          <p className="text-body font-semibold text-[var(--text-primary)]">{t('soulPage.allScenes')}</p>
          <p className="mt-0.5 text-body text-[var(--text-tertiary)]">{t('soulPage.allScenesDesc')}</p>
        </div>

        {/* Filter tabs */}
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

        {/* Scene grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="py-6 text-center text-body text-[var(--text-tertiary)]">{t('loading')}</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSceneDragEnd}>
              <div className="grid grid-cols-2 gap-2">
                {/* Preset scenes - not sortable */}
                {filteredPresets.map(item => (
                  <SceneButton
                    key={item.data.id}
                    id={item.data.id}
                    name={item.data.name}
                    isActive={item.data.id === resolvedActiveId}
                    kindLabel={t('soulPage.kindDefault')}
                    activeLabel={t('card.active')}
                    tagName={item.data.tagName}
                    bgStyle={
                      item.data.imagePath
                        ? { backgroundImage: `url(${item.data.imagePath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: item.data.charGradient }
                    }
                    onClick={() => setActiveSceneId(item.data.id)}
                  />
                ))}

                {/* Custom scenes - sortable */}
                <SortableContext items={filteredCustom.map(i => i.data.id)} strategy={rectSortingStrategy}>
                  {filteredCustom.map(item => (
                    <SortableSceneButton
                      key={item.data.id}
                      id={item.data.id}
                      name={getSceneDisplayTitle(item.data)}
                      isActive={item.data.id === resolvedActiveId}
                      kindLabel={t('soulPage.kindCustom')}
                      activeLabel={t('card.active')}
                      bgStyle={{ backgroundImage: `url(${item.data.public_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      onDelete={() => handleDeleteCustom(item.data.id)}
                      deleting={deletingId === item.data.id}
                      onClick={() => setActiveSceneId(item.data.id)}
                    />
                  ))}
                </SortableContext>

                {/* Upload card */}
                <button
                  type="button"
                  disabled={!projectId}
                  onClick={() => setShowModal(true)}
                  className="group flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]/30 transition-colors hover:border-[var(--accent-primary)]/50 hover:bg-[var(--surface-1)]/60 disabled:opacity-40"
                >
                  <Plus size={16} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
                  <p className="text-xs font-medium text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]">{t('soulPage.uploadScene')}</p>
                  <p className="text-2xs text-[var(--text-tertiary)]/60">{t('soulPage.uploadSceneSubtitle')}</p>
                </button>
              </div>
            </DndContext>
          )}
        </div>
      </div>

      {showModal && projectId && (
        <NewSceneModal
          projectId={projectId}
          tagOptions={[...BUILTIN_SCENE_TAGS]}
          onClose={() => setShowModal(false)}
          onCreated={(scene) => { setLocalCustomScenes(prev => [...prev, scene]); setShowModal(false); setRefresh(k => k + 1) }}
        />
      )}
    </div>
  )
}
