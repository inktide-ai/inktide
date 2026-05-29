'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCharactersContext } from '@/entities/character'
import { useCardScene, reorderScene, type AiCardSceneResponse } from '@/entities/soul'
import { PRESET_SCENES, NewSceneModal, getSceneDisplayTitle, BUILTIN_SCENE_TAGS } from '@/features/character-editor'
import type { PresetScene } from '@/features/character-editor'
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
  onClick: () => void
}

function SceneButton({ id, name, isActive, kindLabel, activeLabel, bgStyle, onClick }: SceneButtonProps) {
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
      <div className="bg-[var(--surface-1)] px-2 py-1.5">
        <p className="truncate text-xs font-medium text-[var(--text-primary)]">{name}</p>
        <div className="mt-0.5 flex items-center gap-1">
          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-green-400" />}
          <span className={cn(
            'text-2xs font-medium',
            isActive ? 'text-green-400' : 'text-[var(--text-tertiary)]',
          )}>
            {isActive ? activeLabel : kindLabel}
          </span>
        </div>
      </div>
    </button>
  )
}

interface SortableSceneButtonProps extends SceneButtonProps {}

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
  const { scenes, loading } = useCardScene(cardId, refresh)

  const [localCustomScenes, setLocalCustomScenes] = useState<AiCardSceneResponse[]>([])
  useEffect(() => { setLocalCustomScenes(scenes) }, [scenes])

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

  const allItems: Array<{ kind: 'preset'; data: PresetScene } | { kind: 'custom'; data: AiCardSceneResponse }> = [
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
  }) as Array<{ kind: 'custom'; data: AiCardSceneResponse }>

  const resolvedActiveId = activeSceneId ?? (allItems[0]?.kind === 'preset' ? allItems[0].data.id : (localCustomScenes[0]?.id ?? null))
  const activeItem = allItems.find(i => i.data.id === resolvedActiveId) ?? allItems[0] ?? null

  const previewBg: React.CSSProperties = activeItem
    ? activeItem.kind === 'preset'
      ? { background: activeItem.data.charGradient }
      : { backgroundImage: `url(${activeItem.data.public_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  const activeLabel = activeItem
    ? activeItem.kind === 'preset' ? activeItem.data.name : getSceneDisplayTitle(activeItem.data)
    : t('soulPage.noSceneSelected')

  function handleSceneDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !cardId) return

    const oldIdx = localCustomScenes.findIndex(s => s.id === active.id)
    const newIdx = localCustomScenes.findIndex(s => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(localCustomScenes, oldIdx, newIdx)
    setLocalCustomScenes(reordered)

    const neighborIdx = reordered.findIndex(s => s.id === active.id)
    const previousId = reordered[neighborIdx - 1]?.id ?? null
    const nextId     = reordered[neighborIdx + 1]?.id ?? null

    void reorderScene(cardId, active.id as string, { previous_id: previousId, next_id: nextId })
      .catch(() => setLocalCustomScenes(scenes))
  }

  if (!selected) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">{t('loading')}</div>
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left: preview + controls ── */}
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

      {/* ── Right: scene library ── */}
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
                {/* Preset scenes — not sortable */}
                {filteredPresets.map(item => (
                  <SceneButton
                    key={item.data.id}
                    id={item.data.id}
                    name={item.data.name}
                    isActive={item.data.id === resolvedActiveId}
                    kindLabel={t('soulPage.kindDefault')}
                    activeLabel={t('card.active')}
                    bgStyle={{ background: item.data.charGradient }}
                    onClick={() => setActiveSceneId(item.data.id)}
                  />
                ))}

                {/* Custom scenes — sortable */}
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
                      onClick={() => setActiveSceneId(item.data.id)}
                    />
                  ))}
                </SortableContext>

                {/* Upload card */}
                <button
                  type="button"
                  disabled={!cardId}
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

      {showModal && cardId && (
        <NewSceneModal
          cardId={cardId}
          tagOptions={[...BUILTIN_SCENE_TAGS]}
          onClose={() => setShowModal(false)}
          onCreated={(scene) => { setLocalCustomScenes(prev => [...prev, scene]); setShowModal(false); setRefresh(k => k + 1) }}
        />
      )}
    </div>
  )
}
