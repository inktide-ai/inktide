import { useRef } from 'react'
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
}

const ModelTab = ({ character, onUpdate }: ModelTabProps) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const meta = MODEL_TYPES.find((m) => m.value === character.modelType)!

  return (
    <div className={styles.tabRoot}>
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
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onUpdate({ modelFileName: file.name })
                  }}
                />
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => fileRef.current?.click()}
                  disabled={character.modelType === 'none'}
                >
                  Choose file
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelTab
