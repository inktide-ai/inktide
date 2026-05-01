'use client'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AiCardSceneResponse, CustomSceneTagDto } from '../../../api/soul'
import { deleteCardScene, listCustomSceneTags } from '../../../api/soul'
import { SceneCard } from './SceneCard'
import { PRESET_SCENES } from './PresetSceneCard'
import { NewSceneModal } from './NewSceneModal'
import { NewTagModal } from './NewTagModal'
import {
  BUILTIN_SCENE_TAGS,
  SCENE_FILTER_ALL,
  getCustomTagsColorMap,
  getEffectiveTagLabel,
  getPillColors,
  getSceneDisplayTitle,
  mergeSceneTagPickOptions,
} from './sceneTagUtils'
import styles from './SceneTab.module.css'

interface SceneGridProps {
  scenes: AiCardSceneResponse[]
  loading: boolean
  activeSceneId: string | null
  cardId?: string
  onSelect: (id: string) => void
  onConfigure: (id: string) => void
  onActiveChanged: (id: string | null) => void
  onScenesChanged: () => void
}

const BASE_PILLS: string[] = [SCENE_FILTER_ALL, ...BUILTIN_SCENE_TAGS]

function mergeExtraCustomPills(custom: CustomSceneTagDto[]): string[] {
  const builtinLower = new Set(BUILTIN_SCENE_TAGS.map(t => t.toLowerCase()))
  return custom
    .map(c => c.label.trim())
    .filter(t => t.length > 0 && !builtinLower.has(t.toLowerCase()))
}

export function SceneGrid({
  scenes,
  loading,
  activeSceneId,
  cardId,
  onSelect,
  onConfigure,
  onActiveChanged,
  onScenesChanged,
}: SceneGridProps) {
  const { t } = useTranslation('scene')
  const [showModal, setShowModal] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(SCENE_FILTER_ALL)
  const [customTags, setCustomTags] = useState<CustomSceneTagDto[]>([])

  const q = search.trim().toLowerCase()

  const tagPickOptions = useMemo(() => mergeSceneTagPickOptions(customTags), [customTags])
  const tagColorMap = useMemo(() => getCustomTagsColorMap(customTags), [customTags])

  useEffect(() => {
    if (!cardId) {
      setCustomTags([])
      return
    }
    listCustomSceneTags(cardId)
      .then(setCustomTags)
      .catch(() => setCustomTags([]))
  }, [cardId, scenes])

  const extraPills = useMemo(() => mergeExtraCustomPills(customTags), [customTags])
  const filterPills = useMemo(() => [...BASE_PILLS, ...extraPills], [extraPills])

  const filteredScenes = scenes.filter(s => {
    if (q) {
      const hay = `${getSceneDisplayTitle(s)} ${s.original_file_name} ${s.description ?? ''}`.toLowerCase()
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

  function handleCreated(scene: AiCardSceneResponse) {
    setShowModal(false)
    onScenesChanged()
    onActiveChanged(scene.id)
  }

  function handleNewTagCreated(label: string) {
    setShowTagModal(false)
    setActiveTag(label)
    onScenesChanged()
  }

  async function handleDelete(sceneId: string) {
    if (!cardId) return
    setDeletingId(sceneId)
    setDeleteError(null)
    try {
      await deleteCardScene(cardId, sceneId)
      if (activeSceneId === sceneId) onActiveChanged(null)
      onScenesChanged()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('grid.errorDelete'))
    } finally {
      setDeletingId(null)
    }
  }

  const emptyForTagOnly = !q && activeTag !== SCENE_FILTER_ALL && totalVisible === 0

  return (
    <div>
      <div className={styles.pgHeader}>
        <div>
          <div className={styles.pgTitle}>{t('grid.title')}</div>
          <div className={styles.pgSub}>{t('grid.subtitle')}</div>
        </div>
        <button
          className={styles.pgAddBtn}
          onClick={() => setShowModal(true)}
          disabled={!cardId}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {t('grid.newScene')}
        </button>
      </div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5l2.8 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder={t('grid.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.pillsRow}>
        {filterPills.map(tag => {
          const isActive = activeTag === tag
          const colors = getPillColors(tag, tagColorMap.get(tag))
          return (
            <button
              key={tag}
              type="button"
              className={styles.pill}
              style={isActive ? {
                color: colors.text,
                background: colors.bg,
                borderColor: colors.border,
              } : undefined}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          )
        })}
        <button
          type="button"
          className={styles.pillAdd}
          onClick={() => setShowTagModal(true)}
          disabled={!cardId}
          aria-label={t('grid.addTagAria')}
          title={t('grid.addTagAria')}
        >
          +
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingText}>{t('loading')}</div>
      ) : (
        <div className={styles.pgGrid}>
          {filteredScenes.map((scene, i) => (
            <SceneCard
              key={scene.id}
              cardId={cardId}
              scene={scene}
              tagOptions={tagPickOptions}
              tagColorMap={tagColorMap}
              isActive={scene.id === activeSceneId}
              onSelect={() => onSelect(scene.id)}
              onConfigure={() => onConfigure(scene.id)}
              onDelete={() => handleDelete(scene.id)}
              deleting={deletingId === scene.id}
              onScenesChanged={onScenesChanged}
              animationDelay={i * 45}
            />
          ))}


          {totalVisible === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle cx="9.5" cy="9.5" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16 16l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.emptyStateTitle}>
                {emptyForTagOnly
                  ? t('grid.emptyTag')
                  : q
                    ? t('grid.emptySearch')
                    : t('grid.empty')}
              </div>
              <div className={styles.emptyStateSub}>
                {emptyForTagOnly
                  ? t('grid.emptyTagHint')
                  : q
                    ? t('grid.emptySearchHint')
                    : t('grid.emptyHint')}
              </div>
            </div>
          )}
        </div>
      )}

      {deleteError && (
        <div className={styles.uploadError}>{deleteError}</div>
      )}

      {showModal && cardId && (
        <NewSceneModal
          cardId={cardId}
          tagOptions={tagPickOptions}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {showTagModal && cardId && (
        <NewTagModal
          cardId={cardId}
          onClose={() => setShowTagModal(false)}
          onCreated={handleNewTagCreated}
        />
      )}
    </div>
  )
}
