import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AiCardSceneResponse } from '../../../api/soul'
import { listCustomSceneTags, putCardSceneMetadata, deleteCardScene } from '../../../api/soul'
import { CardSceneUploader } from '../../../services/upload/CardSceneUploader'
import { executePresignedUpload } from '../../../services/upload/PresignedUploadService'
import type { AiCharacter, ModelType } from '../../../domain/character'
import AvatarRenderer from '../../AvatarRenderer/AvatarRenderer'
import { useCardModel } from '../../AvatarRenderer/hooks/useCardModel'
import { useSceneRendererSettings } from '../../../hooks/useSceneRendererSettings'
import { BUILTIN_SCENE_TAGS, getSceneDisplayTitle, mergeSceneTagPickOptions } from './sceneTagUtils'
import SceneRendererPanel from './SceneRendererPanel'
import styles from './SceneTab.module.css'

function inferModelType(contentType: string, fileName: string): ModelType {
  if (fileName.endsWith('.vrm')) return 'vrm'
  if (contentType === 'model/gltf-binary' || fileName.endsWith('.glb')) return 'glb'
  return 'glb'
}

const TAG_AUTO_VALUE = '__auto__'
const MAX_DISPLAY = 200
const MAX_DESC = 2000

interface SceneSettingsProps {
  character: AiCharacter
  scene: AiCardSceneResponse | null
  cardId?: string
  onBack: () => void
  onScenesChanged: () => void
  /** After replacing this scene's file, navigate settings to the new row id. */
  onSceneReplaced?: (newSceneId: string) => void
  onSceneDeleted: () => void
}

const ALLOWED_TYPES = 'image/jpeg,image/png,image/webp'
const MAX_MB = 50

export function SceneSettings({
  character,
  scene,
  cardId,
  onBack,
  onScenesChanged,
  onSceneReplaced,
  onSceneDeleted,
}: SceneSettingsProps) {
  const { t } = useTranslation('scene')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { model, loading: modelLoading, error: modelError } = useCardModel(cardId)
  const effectiveModelType = model
    ? inferModelType(model.content_type, model.original_file_name)
    : character.appearance.modelType
  const hasAvatarModel = Boolean(model?.public_url)
  const [modelVisible, setModelVisible] = useState(true)
  const [rendererPanelOpen, setRendererPanelOpen] = useState(false)
  const { settings, setSettings, resetSettings } = useSceneRendererSettings(cardId ?? '')
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tagPickOptions, setTagPickOptions] = useState<string[]>([...BUILTIN_SCENE_TAGS])
  const [metaDisplayName, setMetaDisplayName] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaTag, setMetaTag] = useState<string>(TAG_AUTO_VALUE)
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)

  const pageHeading = scene ? getSceneDisplayTitle(scene) : t('settings.untitled')

  const sizeLabel = scene
    ? `${scene.original_file_name} · ${(scene.size_bytes / 1_048_576).toFixed(1)} MB`
    : ''

  useEffect(() => {
    if (!cardId) {
      setTagPickOptions([...BUILTIN_SCENE_TAGS])
      return
    }
    listCustomSceneTags(cardId)
      .then(c => setTagPickOptions(mergeSceneTagPickOptions(c)))
      .catch(() => setTagPickOptions([...BUILTIN_SCENE_TAGS]))
  }, [cardId])

  useEffect(() => {
    if (!scene) {
      setMetaDisplayName('')
      setMetaDescription('')
      setMetaTag(TAG_AUTO_VALUE)
      return
    }
    setMetaDisplayName(scene.display_name?.trim() ?? '')
    setMetaDescription(scene.description?.trim() ?? '')
    setMetaTag(scene.tag?.trim() ? scene.tag.trim() : TAG_AUTO_VALUE)
  }, [scene?.id, scene?.display_name, scene?.description, scene?.tag])

  async function handleSaveMeta() {
    if (!scene || !cardId) return
    setMetaSaving(true)
    setMetaError(null)
    try {
      await putCardSceneMetadata(cardId, scene.id, {
        display_name: metaDisplayName.trim() ? metaDisplayName.trim() : null,
        description: metaDescription.trim() ? metaDescription.trim() : null,
        tag: metaTag === TAG_AUTO_VALUE ? null : metaTag.trim() || null,
      })
      onScenesChanged()
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : t('settings.errorMetaSave'))
    } finally {
      setMetaSaving(false)
    }
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !cardId || !scene) return
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(t('settings.errorTooLarge', { max: MAX_MB }))
      return
    }
    const previousId = scene.id
    setUploading(true)
    setError(null)
    try {
      const created = await executePresignedUpload(new CardSceneUploader(cardId), file)
      try {
        await deleteCardScene(cardId, previousId)
      } catch (delErr) {
        setError(delErr instanceof Error ? delErr.message : t('settings.errorDelete'))
        onScenesChanged()
        return
      }
      onSceneReplaced?.(created.id)
      onScenesChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorUpload'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleUploadNew(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !cardId) return
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(t('settings.errorTooLarge', { max: MAX_MB }))
      return
    }
    setUploading(true)
    setError(null)
    try {
      await executePresignedUpload(new CardSceneUploader(cardId), file)
      onScenesChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorUpload'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!scene || !cardId) return
    setRemoving(true)
    setError(null)
    try {
      await deleteCardScene(cardId, scene.id)
      onScenesChanged()
      onSceneDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorDelete'))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={styles.settingsPage}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('settings.back')}
      </button>

      <div className={styles.pageTitle}>{t('settings.titlePrefix')} {pageHeading}</div>
      <div className={styles.pageSub}>{t('settings.subtitle')}</div>

      <div
        className={`${styles.sceneBanner} ${!scene?.public_url ? styles.sceneBannerEmpty : ''}`}
      >
        {scene?.public_url ? (
          <img
            src={scene.public_url}
            alt=""
            className={styles.sceneBannerImg}
            decoding="async"
          />
        ) : (
          <div className={styles.sceneBannerPlaceholder} aria-hidden />
        )}

        {!scene?.public_url && (
          <>
            <div
              className={styles.tBlob}
              style={{ width: 180, height: 180, top: -30, left: '18%', background: 'rgba(139,92,246,.24)' }}
            />
            <div
              className={styles.tBlob}
              style={{ width: 130, height: 130, bottom: -20, right: '12%', background: 'rgba(34,211,238,.16)' }}
            />
            <div
              className={styles.tBlob}
              style={{ width: 90, height: 90, top: 20, right: 20, background: 'rgba(236,72,153,.12)' }}
            />
          </>
        )}

        {cardId && hasAvatarModel && !modelLoading && !modelError && (
          <div className={styles.sceneBannerAvatarLayer}>
            <AvatarRenderer
              className={styles.sceneBannerAvatarFill}
              modelType={effectiveModelType}
              modelUrl={model?.public_url ?? null}
              background="transparent"
              modelVisible={modelVisible}
              rendererSettings={settings}
            />
          </div>
        )}

        {cardId && modelLoading && (
          <div className={styles.sceneBannerModelLoading} aria-busy="true">
            <div className={styles.sceneBannerModelSpinner} />
          </div>
        )}

        {cardId && modelError && (
          <div className={styles.sceneBannerModelError}>{t('settings.modelPreviewError')}</div>
        )}

        <button
          type="button"
          className={`${styles.charRendererBtn} ${rendererPanelOpen ? styles.charRendererBtnActive : ''}`}
          title="Настройки рендера"
          aria-label="Настройки рендера"
          aria-pressed={rendererPanelOpen}
          onClick={() => setRendererPanelOpen(v => !v)}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          type="button"
          className={`${styles.charToggleBtn} ${hasAvatarModel && modelVisible ? '' : styles.charToggleBtnOff}`}
          title={hasAvatarModel ? t('toolbar.toggleModel') : t('settings.previewNeedsModel')}
          aria-label={hasAvatarModel ? t('toolbar.toggleModel') : t('settings.previewNeedsModel')}
          aria-pressed={hasAvatarModel ? !modelVisible : undefined}
          disabled={!hasAvatarModel || !!modelLoading || !!modelError}
          onClick={() => hasAvatarModel && setModelVisible(v => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        {rendererPanelOpen && (
          <SceneRendererPanel
            settings={settings}
            onSet={setSettings}
            onReset={resetSettings}
          />
        )}
      </div>

      <div className={styles.sectionHdr}>
        <span className={styles.sectionLbl}>{t('settings.envSection')}</span>
        <div className={styles.sectionLine} />
      </div>

      {scene ? (
        <div className={styles.envCard}>
          <div className={styles.envThumb}>
            <div
              className={styles.envThumbImg}
              style={scene.public_url ? { backgroundImage: `url(${scene.public_url})` } : undefined}
            />
          </div>
          <div className={styles.envInfo}>
            <div className={styles.envTitle}>{t('settings.bgTitle')}</div>
            <div className={styles.envSub}>{sizeLabel}</div>
          </div>
          <div className={styles.envActions}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing || !cardId}
            >
              {uploading ? t('settings.replacing') : t('settings.replace')}
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={handleDelete}
              disabled={removing || uploading || !cardId}
            >
              {removing ? t('settings.removing') : t('settings.delete')}
            </button>
          </div>
        </div>
      ) : (
        <div
          className={styles.uploadPlaceholder}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
        >
          <div className={styles.uploadPlaceholderIcon}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 7v8M7 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.uploadPlaceholderText}>
            {uploading ? t('settings.uploading') : t('settings.noImage')}
          </div>
          <div className={styles.uploadPlaceholderHint}>{t('settings.noImageHint')}</div>
        </div>
      )}

      {error && <div className={styles.settingsError}>{error}</div>}

      {scene && cardId && (
        <>
          <div className={`${styles.sectionHdr} ${styles.sectionGap}`}>
            <span className={styles.sectionLbl}>{t('settings.metaSection')}</span>
            <div className={styles.sectionLine} />
          </div>

          <div className={styles.settingsMeta}>
            <div>
              <div className={styles.modalFieldLabel}>{t('settings.metaName')}</div>
              <input
                className={styles.modalTextInput}
                value={metaDisplayName}
                onChange={e => setMetaDisplayName(e.target.value.slice(0, MAX_DISPLAY))}
                maxLength={MAX_DISPLAY}
                placeholder={t('settings.metaNamePlaceholder')}
              />
              <div className={styles.modalCharCount}>{metaDisplayName.length}/{MAX_DISPLAY}</div>
            </div>

            <div>
              <div className={styles.modalFieldLabel}>{t('settings.metaTag')}</div>
              <select
                className={styles.settingsSelect}
                value={metaTag}
                onChange={e => setMetaTag(e.target.value)}
              >
                <option value={TAG_AUTO_VALUE}>{t('settings.metaTagAuto')}</option>
                {tagPickOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <div className={styles.modalFieldLabel}>{t('settings.metaDesc')}</div>
              <textarea
                className={styles.modalDescInput}
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value.slice(0, MAX_DESC))}
                maxLength={MAX_DESC}
                placeholder={t('settings.metaDescPlaceholder')}
                rows={4}
              />
              <div className={styles.modalCharCount}>{metaDescription.length}/{MAX_DESC}</div>
            </div>

            {metaError && <div className={styles.settingsError}>{metaError}</div>}

            <div className={styles.settingsMetaActions}>
              <button
                type="button"
                className={styles.modalBtnCreate}
                onClick={() => void handleSaveMeta()}
                disabled={metaSaving}
              >
                {metaSaving ? t('settings.savingMeta') : t('settings.saveMeta')}
              </button>
            </div>
          </div>
        </>
      )}

      <div className={`${styles.sectionHdr} ${styles.sectionGap}`}>
        <span className={styles.sectionLbl}>{t('settings.additionalSection')}</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.comingSoon}>
        <div className={styles.csIcon}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
            <path d="M6.5 3.5v3l1.8 1.4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <span className={styles.csText}>{t('settings.comingSoon')}</span>
        <span className={styles.csBadge}>{t('settings.comingSoonBadge')}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES}
        style={{ display: 'none' }}
        onChange={scene ? handleReplace : handleUploadNew}
      />
    </div>
  )
}
