import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AiCardSceneResponse } from '../../../api/soul'
import { patchCardSceneTag } from '../../../api/soul'
import { getEffectiveTagLabel, getSceneDisplayTitle, getTagDisplayStyleWithColor } from './sceneTagUtils'
import styles from './SceneTab.module.css'

interface SceneCardProps {
  scene: AiCardSceneResponse
  /** When set, tag badge opens a menu to PATCH the scene tag. */
  cardId?: string
  tagOptions: string[]
  tagColorMap?: Map<string, string>
  isActive: boolean
  onSelect: () => void
  onConfigure: () => void
  onDelete: () => void
  deleting: boolean
  onScenesChanged: () => void
  animationDelay?: number
}

export function SceneCard({
  scene,
  cardId,
  tagOptions,
  tagColorMap,
  isActive,
  onSelect,
  onConfigure,
  onDelete,
  deleting,
  onScenesChanged,
  animationDelay = 0,
}: SceneCardProps) {
  const { t } = useTranslation('scene')
  const [confirming, setConfirming] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [tagSaving, setTagSaving] = useState(false)
  const [tagError, setTagError] = useState<string | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)

  const displayLabel = getEffectiveTagLabel(scene)
  const tagStyle = getTagDisplayStyleWithColor(displayLabel, tagColorMap?.get(displayLabel))
  const displayTitle = getSceneDisplayTitle(scene)
  const sizeLabel = `${(scene.size_bytes / 1_048_576).toFixed(1)} MB`
  const nameTitle = `${scene.original_file_name} · ${sizeLabel} · ${scene.content_type}`
  const sceneDescription = scene.description?.trim() ?? ''

  const cardStyle: React.CSSProperties = isActive
    ? { borderColor: tagStyle.activeBorder, background: tagStyle.activeBg }
    : hovered
      ? { borderColor: tagStyle.border }
      : {}

  useEffect(() => {
    if (!tagMenuOpen) return
    function onDocDown(e: MouseEvent) {
      if (anchorRef.current?.contains(e.target as Node)) return
      setTagMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [tagMenuOpen])

  function handleCardClick() {
    if (confirming) return
    onSelect()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && !confirming) {
      e.preventDefault()
      onSelect()
    }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirming(true)
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirming(false)
  }

  function handleConfirmDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirming(false)
    onDelete()
  }

  function handleConfigureClick(e: React.MouseEvent) {
    e.stopPropagation()
    onConfigure()
  }

  async function pickTag(next: string | null) {
    if (!cardId) return
    const normalizedNext = next?.trim() ? next.trim() : null
    const currentExplicit = scene.tag?.trim() ? scene.tag.trim() : null
    if (normalizedNext === currentExplicit) {
      setTagMenuOpen(false)
      return
    }
    setTagMenuOpen(false)
    setTagSaving(true)
    setTagError(null)
    try {
      await patchCardSceneTag(cardId, scene.id, { tag: normalizedNext })
      onScenesChanged()
    } catch (err) {
      setTagError(err instanceof Error ? err.message : t('card.tagError'))
    } finally {
      setTagSaving(false)
    }
  }

  function handleTagButtonClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!cardId || tagSaving) return
    setTagMenuOpen(o => !o)
  }

  return (
    <div
      className={`${styles.pgCard} ${isActive ? styles.pgCardActive : ''}`}
      style={{ animationDelay: `${animationDelay}ms`, ...cardStyle }}
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={isActive}
    >
      <div className={styles.pgThumb}>
        {scene.public_url ? (
          <div
            className={styles.pgThumbImg}
            style={{ backgroundImage: `url(${scene.public_url})` }}
          />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: '#07050f' }} />
            <div className={styles.tb} style={{ width: 110, height: 110, top: -25, left: '5%', background: 'rgba(139,92,246,.28)' }} />
            <div className={styles.tb} style={{ width: 80, height: 80, bottom: -15, right: '5%', background: 'rgba(34,211,238,.18)' }} />
            <div className={styles.tb} style={{ width: 60, height: 60, top: 5, right: '22%', background: 'rgba(236,72,153,.13)' }} />
          </>
        )}

        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 36, zIndex: 2,
            background: `linear-gradient(transparent, var(--bg-card, #13151a))`,
            pointerEvents: 'none',
          }}
        />

        <div className={styles.tChar}>
          <div
            className={styles.tCharBody}
            style={{ background: 'linear-gradient(180deg, rgba(139,92,246,.12), rgba(139,92,246,.03))' }}
          />
        </div>

        <button
          className={styles.cardDeleteBtn}
          title={t('card.delete')}
          aria-label={t('card.delete')}
          onClick={handleDeleteClick}
          disabled={deleting}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path
              d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3.5 3.5l.5 7h5l.5-7"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={styles.pgBody}>
        <div className={styles.pgMeta}>
          <div className={styles.pgName} title={nameTitle}>{displayTitle}</div>
          <div className={styles.tagMenuAnchor} ref={anchorRef}>
            {cardId ? (
              <>
                <button
                  type="button"
                  className={styles.pgTag}
                  style={{ color: tagStyle.text, background: tagStyle.bg, border: `1px solid ${tagStyle.border}` }}
                  onClick={handleTagButtonClick}
                  disabled={tagSaving}
                  aria-expanded={tagMenuOpen}
                  aria-haspopup="listbox"
                  aria-label={t('card.tagChangeAria', { tag: displayLabel })}
                >
                  {displayLabel}
                </button>
                {tagMenuOpen && (
                  <div className={styles.tagMenu} role="listbox">
                    <button
                      type="button"
                      className={styles.tagMenuItemMuted}
                      onClick={e => { e.stopPropagation(); void pickTag(null) }}
                    >
                      {t('card.tagAuto')}
                    </button>
                    {tagOptions.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={styles.tagMenuItem}
                        onClick={e => { e.stopPropagation(); void pickTag(opt) }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <span
                className={styles.pgTag}
                style={{ color: tagStyle.text, background: tagStyle.bg, border: `1px solid ${tagStyle.border}` }}
              >
                {displayLabel}
              </span>
            )}
          </div>
        </div>
        {tagError && <div className={styles.cardTagError}>{tagError}</div>}
        {sceneDescription ? (
          <div className={styles.pgDesc}>{sceneDescription}</div>
        ) : null}
        <div className={styles.pgFooter}>
          <div className={`${styles.pgRadio} ${isActive ? styles.pgRadioActive : ''}`} />
          <button
            className={styles.pgConfigure}
            onClick={handleConfigureClick}
            tabIndex={-1}
          >
            {t('card.configure')}
            <span className={styles.pgConfigureArrow}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {confirming && (
        <div className={styles.cardOverlay} onClick={handleCancel}>
          <div className={styles.cardOverlayName}>{displayTitle}</div>
          <div className={styles.cardOverlayDesc}>
            {t('card.deleteConfirm')}<br />{t('card.deleteDesc')}.
          </div>
          <div className={styles.cardOverlayActions}>
            <button className={styles.cardOverlayCancel} onClick={handleCancel}>
              {t('card.cancel')}
            </button>
            <button
              className={styles.cardOverlayDelete}
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? '…' : t('card.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
