import { useRef, useState } from 'react'
import { uploadCardModelFile } from '../../../api/soul'
import AvatarRenderer from '../../AvatarRenderer/AvatarRenderer'
import { useCardModel } from '../../AvatarRenderer/hooks/useCardModel'
import styles from '../ProfilePage.module.css'
import type { AiCharacter, ModelType } from '../types'

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
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadHint, setUploadHint] = useState<string | null>(null)
  // Refresh key — bump after upload so useCardModel re-fetches
  const [refreshKey, setRefreshKey] = useState(0)
  const { model, loading: modelLoading } = useCardModel(cardId, refreshKey)
  const meta = MODEL_TYPES.find((m) => m.value === character.modelType)!

  return (
    <div className={styles.tabRoot}>
      {/* Preview panel */}
      {character.modelType !== 'none' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Preview</div>
          <div className={styles.infoCard}>
            <div style={{ height: 380, borderRadius: 8, overflow: 'hidden', background: '#0d0d0f' }}>
              {modelLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Loading…
                </div>
              ) : (
                <AvatarRenderer
                  modelType={character.modelType}
                  modelUrl={model?.public_url ?? null}
                  background="#0d0d0f"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Model</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Model type</label>
              <div className={styles.labelHint}>Visual representation for your AI character</div>
              <div className={styles.modelTypeGrid}>
                {MODEL_TYPES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`${styles.modelTypeCard} ${character.modelType === m.value ? styles.modelTypeCardSelected : ''}`}
                    onClick={() => onUpdate({ modelType: m.value, modelFileName: undefined })}
                  >
                    <span className={styles.modelTypeLabel}>{m.label}</span>
                    <span className={styles.modelTypeHint}>{m.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`${styles.formGroup}${character.modelType === 'none' ? ` ${styles.inactiveBlock}` : ''}`}>
              <label className={styles.label}>Upload model</label>
              <div className={styles.labelHint}>Upload your 3D or Live2D model file</div>
              <div className={styles.modelUploadRow}>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT_MAP[character.modelType]}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    onUpdate({ modelFileName: file.name })
                    setUploadHint(null)
                    if (!cardId) {
                      setUploadHint('Save the character first — then uploads go to your project storage.')
                      return
                    }
                    setUploadBusy(true)
                    try {
                      await uploadCardModelFile(cardId, file)
                      setUploadHint('Uploaded — preview updated.')
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
                  disabled={character.modelType === 'none' || uploadBusy}
                >
                  {uploadBusy ? 'Uploading…' : 'Choose file'}
                </button>
                <span className={styles.modelFileName}>
                  {character.modelFileName ?? (
                    <span style={{ color: 'var(--text-muted)' }}>
                      No file — accepts {character.modelType !== 'none' ? meta.ext : '.zip, .vrm, .glb'}
                    </span>
                  )}
                </span>
                {character.modelFileName && (
                  <button
                    type="button"
                    className={styles.modelClearBtn}
                    onClick={() => onUpdate({ modelFileName: undefined })}
                  >
                    Remove
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
