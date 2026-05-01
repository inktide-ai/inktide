'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type AiCardSceneResponse } from '../../../api/soul'
import { CardSceneUploader } from '../../../services/upload/CardSceneUploader'
import { executePresignedUpload } from '../../../services/upload/PresignedUploadService'
import styles from './SceneTab.module.css'

const MAX_MB = 50
const ALLOWED_TYPES = 'image/jpeg,image/png,image/webp'
interface NewSceneModalProps {
  cardId: string
  tagOptions: string[]
  onClose: () => void
  onCreated: (scene: AiCardSceneResponse) => void
}

export function NewSceneModal({ cardId, tagOptions, onClose, onCreated }: NewSceneModalProps) {
  const { t } = useTranslation('scene')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCreate = name.trim().length > 0 && file !== null && !uploading

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Revoke preview URL on unmount
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(t('settings.errorTooLarge', { max: MAX_MB }))
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleCreate() {
    if (!file || !name.trim()) return
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.match(/\.[^.]+$/)?.[0] ?? '.jpg'
      const renamedFile = new File([file], `${name.trim()}${ext}`, { type: file.type })
      const scene = await executePresignedUpload(
        new CardSceneUploader(cardId, selectedTag ?? null),
        renamedFile,
      )
      onCreated(scene)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorUpload'))
      setUploading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalBox}>

        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{t('modal.title')}</span>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.modalBody}>

          {/* Name */}
          <div>
            <div className={styles.modalFieldLabel}>{t('modal.nameLabel')}</div>
            <input
              className={styles.modalTextInput}
              placeholder={t('modal.namePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value.slice(0, 40))}
              maxLength={40}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <div className={styles.modalCharCount}>{name.length}/40</div>
          </div>

          {/* Image */}
          <div>
            <div className={styles.modalFieldLabel}>{t('modal.imageLabel')}</div>
            {preview ? (
              <div className={styles.modalPreview}>
                <img src={preview} alt="" className={styles.modalPreviewImg} />
                <button
                  className={styles.modalPreviewChange}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('modal.change')}
                </button>
              </div>
            ) : (
              <div
                className={styles.modalUploadZone}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
              >
                <div className={styles.modalUploadIcon}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2v8M5 5l3-3 3 3M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className={styles.modalUploadTitle}>{t('modal.uploadTitle')}</div>
                <div className={styles.modalUploadSub}>{t('modal.uploadSub')}</div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {/* Tag */}
          <div>
            <div className={styles.modalFieldLabel}>{t('modal.tagLabel')}</div>
            <div className={styles.modalTagsWrap}>
              {tagOptions.map(tag => (
                <button
                  key={tag}
                  className={`${styles.modalTag} ${selectedTag === tag ? styles.modalTagSelected : ''}`}
                  onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className={styles.modalFieldLabel}>
              {t('modal.descLabel')}
              <span className={styles.modalOptional}>{t('modal.optional')}</span>
            </div>
            <textarea
              className={styles.modalDescInput}
              placeholder={t('modal.descPlaceholder')}
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 120))}
              maxLength={120}
            />
            <div className={styles.modalCharCount}>{description.length}/120</div>
          </div>

          {error && <div className={styles.settingsError}>{error}</div>}
        </div>

        {/* ── Footer ── */}
        <div className={styles.modalFooter}>
          <button className={styles.modalBtnCancel} onClick={onClose} disabled={uploading}>
            {t('modal.cancel')}
          </button>
          <button className={styles.modalBtnCreate} disabled={!canCreate} onClick={handleCreate}>
            {uploading ? t('modal.creating') : t('modal.create')}
          </button>
        </div>

      </div>
    </div>
  )
}
