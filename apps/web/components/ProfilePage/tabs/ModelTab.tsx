'use client'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CardModelUploader } from '../../../services/upload/CardModelUploader'
import { executePresignedUpload } from '../../../services/upload/PresignedUploadService'
import AvatarRenderer from '../../AvatarRenderer/AvatarRenderer'
import { useCardModel } from '../../AvatarRenderer/hooks/useCardModel'
import styles from '../ProfilePage.module.css'
import type { AiCharacter, ModelType } from '@/lib/character'

const MODEL_TYPES: { value: ModelType; label: string; ext: string; hint: string }[] = [
  { value: 'live2d', label: 'Live2D', ext: '.model3.json', hint: 'Cubism 4 model folder (zip)' },
  { value: 'vrm', label: 'VRM', ext: '.vrm', hint: 'VTuber avatar (glTF extension)' },
  { value: 'glb', label: 'GLB / glTF', ext: '.glb', hint: 'Universal 3D model' },
  { value: 'none', label: 'No model', ext: '', hint: 'Text-only AI, no visual model' },
]

const ACCEPT_MAP: Record<ModelType, string> = {
  live2d: '.zip,.json',
  vrm: '.vrm',
  glb: '.glb,.gltf',
  none: '',
}

interface ModelTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  cardId?: string
}

const ModelTab = ({ character, onUpdate, cardId }: ModelTabProps) => {
  const { t } = useTranslation('model')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadHint, setUploadHint] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { model, loading: modelLoading } = useCardModel(cardId, refreshKey)
  const meta = MODEL_TYPES.find((m) => m.value === character.appearance.modelType)!

  return (
    <div className={styles.tabRoot}>
      {character.appearance.modelType !== 'none' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>{t('section.preview')}</div>
          <div className={styles.infoCard}>
            <div style={{ height: 380, borderRadius: 8, overflow: 'hidden', background: '#0d0d0f' }}>
              {modelLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('loading')}
                </div>
              ) : (
                <AvatarRenderer
                  modelType={character.appearance.modelType}
                  modelUrl={model?.public_url ?? null}
                  background="#0d0d0f"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('section.model')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('type.label')}</label>
              <div className={styles.labelHint}>{t('type.hint')}</div>
              <div className={styles.modelTypeGrid}>
                {MODEL_TYPES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`${styles.modelTypeCard} ${character.appearance.modelType === m.value ? styles.modelTypeCardSelected : ''}`}
                    onClick={() => onUpdate({ appearance: { ...character.appearance, modelType: m.value, modelFileName: undefined } })}
                  >
                    <span className={styles.modelTypeLabel}>{m.label}</span>
                    <span className={styles.modelTypeHint}>{m.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`${styles.formGroup}${character.appearance.modelType === 'none' ? ` ${styles.inactiveBlock}` : ''}`}>
              <label className={styles.label}>{t('upload.label')}</label>
              <div className={styles.labelHint}>{t('upload.hint')}</div>
              <div className={styles.modelUploadRow}>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT_MAP[character.appearance.modelType]}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    onUpdate({ appearance: { ...character.appearance, modelFileName: file.name } })
                    setUploadHint(null)
                    if (!cardId) {
                      setUploadHint(t('upload.saveFirst'))
                      return
                    }
                    setUploadBusy(true)
                    try {
                      await executePresignedUpload(new CardModelUploader(cardId), file)
                      setUploadHint(t('upload.success'))
                      setRefreshKey((k) => k + 1)
                    } catch (err) {
                      setUploadHint(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setUploadBusy(false)
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => fileRef.current?.click()}
                  disabled={character.appearance.modelType === 'none' || uploadBusy}
                >
                  {uploadBusy ? t('upload.busy') : t('upload.choose')}
                </button>
                <span className={styles.modelFileName}>
                  {character.appearance.modelFileName ?? (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {t('upload.noFile', { ext: character.appearance.modelType !== 'none' ? meta.ext : '.zip, .vrm, .glb' })}
                    </span>
                  )}
                </span>
                {character.appearance.modelFileName && (
                  <button
                    type="button"
                    className={styles.modelClearBtn}
                    onClick={() => onUpdate({ appearance: { ...character.appearance, modelFileName: undefined } })}
                  >
                    {t('upload.remove')}
                  </button>
                )}
              </div>
              {uploadHint && (
                <div className={styles.labelHint} style={{ marginTop: 8 }}>
                  {uploadHint}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelTab
