'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectSceneResponse } from '@/features/projects/api/scenes'
import { deleteProjectScene } from '@/features/projects/api/scenes'
import { SceneCard } from './scene-card'
import { PRESET_SCENES } from './preset-scene-card'
import { NewSceneModal } from './new-scene-modal'
import {
  BUILTIN_SCENE_TAGS,
  SCENE_FILTER_ALL,
  getPillColors,
  getEffectiveTagLabel,
  getSceneDisplayTitle,
} from './scene-tag-utils'

const pgGrid = 'grid grid-cols-[repeat(auto-fill,minmax(188px,1fr))] gap-[0.875rem]'

interface SceneGridProps {
  scenes: ProjectSceneResponse[]
  loading: boolean
  activeSceneId: string | null
  projectId?: string
  onSelect: (id: string) => void
  onConfigure: (id: string) => void
  onActiveChanged: (id: string | null) => void
  onScenesChanged: () => void
}

const BASE_PILLS: string[] = [SCENE_FILTER_ALL, ...BUILTIN_SCENE_TAGS]

export function SceneGrid({ scenes, loading, activeSceneId, projectId, onSelect, onConfigure, onActiveChanged, onScenesChanged }: SceneGridProps) {
  const { t } = useTranslation('scene')
  const [showModal, setShowModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(SCENE_FILTER_ALL)

  const q = search.trim().toLowerCase()

  const filteredScenes = scenes.filter(s => {
    if (q) {
      const hay = `${getSceneDisplayTitle(s)} ${s.original_name} ${s.description ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (activeTag !== SCENE_FILTER_ALL && getEffectiveTagLabel(s) !== activeTag) return false
    return true
  })

  const filteredPresets = PRESET_SCENES.filter(p => {
    if (q && !p.name.toLowerCase().includes(q)) return false
    if (activeTag !== SCENE_FILTER_ALL && p.tagName !== activeTag) return false
    return true
  })

  const totalVisible = filteredScenes.length + filteredPresets.length
  const emptyForTagOnly = !q && activeTag !== SCENE_FILTER_ALL && totalVisible === 0

  function handleCreated(scene: ProjectSceneResponse) {
    setShowModal(false)
    onScenesChanged()
    onActiveChanged(scene.id)
  }

  async function handleDelete(sceneId: string) {
    if (!projectId) return
    setDeletingId(sceneId)
    setDeleteError(null)
    try {
      await deleteProjectScene(projectId, sceneId)
      if (activeSceneId === sceneId) onActiveChanged(null)
      onScenesChanged()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('grid.errorDelete'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-[1.375rem] gap-4">
        <div>
          <div className="text-[1.1875rem] font-bold tracking-[-0.02em] text-(--text-primary)">{t('grid.title')}</div>
          <div className="text-xs text-(--text-muted) mt-1">{t('grid.subtitle')}</div>
        </div>
        <button
          className="inline-flex items-center gap-[6px] py-2 px-4 shrink-0 text-sm font-semibold text-(--text-secondary) bg-white/[0.05] border border-white/10 rounded-[0.625rem] cursor-pointer font-[inherit] transition-[background,color,border-color] duration-150 whitespace-nowrap hover:bg-white/[0.09] hover:border-white/[0.18] hover:text-(--text-primary) disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setShowModal(true)}
          disabled={!projectId}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {t('grid.newScene')}
        </button>
      </div>

      {/* Search */}
      <div className="relative flex items-center mb-3">
        <span className="absolute left-4 text-white/20 pointer-events-none flex items-center transition-[color] duration-150 [.searchWrap:focus-within_&]:text-white/40">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5l2.8 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <input
          className="w-full py-[0.6875rem] pr-4 pl-10 bg-white/[0.03] border border-white/[0.06] rounded-[0.625rem] text-(--text-primary) font-[inherit] text-body outline-none transition-[background,border-color] duration-150 placeholder:text-white/20 focus:bg-white/[0.05] focus:border-white/10"
          type="text"
          placeholder={t('grid.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-[6px] overflow-x-auto [scrollbar-width:none] mb-[0.875rem] pb-[2px] [-webkit-scrollbar:hidden]">
        {BASE_PILLS.map(tag => {
          const isActive = activeTag === tag
          const colors = getPillColors(tag)
          return (
            <button
              key={tag}
              type="button"
              className="shrink-0 text-xs font-medium text-(--text-muted) bg-white/[0.04] border border-white/[0.09] rounded-full py-[5px] px-[14px] cursor-pointer font-[inherit] transition-[color,background,border-color] duration-150 whitespace-nowrap hover:text-(--text-secondary) hover:border-white/[0.16] hover:bg-white/[0.07]"
              style={isActive ? { color: colors.text, background: colors.bg, borderColor: colors.border } : undefined}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-(--text-muted) text-[0.85rem] py-8">{t('loading')}</div>
      ) : (
        <div className={pgGrid}>
          {filteredScenes.map((scene, i) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isActive={scene.id === activeSceneId}
              onSelect={() => onSelect(scene.id)}
              onConfigure={() => onConfigure(scene.id)}
              onDelete={() => handleDelete(scene.id)}
              deleting={deletingId === scene.id}
              animationDelay={i * 45}
            />
          ))}

          {totalVisible === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-[10px] py-16 px-4 text-center animate-[cardIn_0.2s_ease_forwards]">
              <div className="w-12 h-12 rounded-[14px] bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-(--text-muted) mb-[2px]">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle cx="9.5" cy="9.5" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16 16l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-body-md font-semibold text-(--text-secondary)">
                {emptyForTagOnly ? t('grid.emptyTag') : q ? t('grid.emptySearch') : t('grid.empty')}
              </div>
              <div className="text-sm text-(--text-muted)">
                {emptyForTagOnly ? t('grid.emptyTagHint') : q ? t('grid.emptySearchHint') : t('grid.emptyHint')}
              </div>
            </div>
          )}
        </div>
      )}

      {deleteError && <div className="mt-3 text-xs text-[var(--color-error-mid)]">{deleteError}</div>}

      {showModal && projectId && (
        <NewSceneModal projectId={projectId} tagOptions={[...BUILTIN_SCENE_TAGS]} onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
