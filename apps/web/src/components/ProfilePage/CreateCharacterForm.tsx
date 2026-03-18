import { useRef, useState } from 'react'
import styles from './ProfilePage.module.css'
import type { AiCharacter, ModelType } from './types'

const MODEL_TYPES: { value: ModelType; label: string; ext: string }[] = [
  { value: 'live2d', label: 'Live2D', ext: '.zip, .json' },
  { value: 'vrm', label: 'VRM', ext: '.vrm' },
  { value: 'glb', label: 'GLB / glTF', ext: '.glb, .gltf' },
  { value: 'none', label: 'No model', ext: '' },
]

const ACCEPT_MAP: Record<ModelType, string> = {
  live2d: '.zip,.json',
  vrm: '.vrm',
  glb: '.glb,.gltf',
  none: '',
}

interface CreateCharacterFormProps {
  onSave: (c: Omit<AiCharacter, 'id'>) => void
  onCancel: () => void
  defaultValues: Omit<AiCharacter, 'id'>
}

const CreateCharacterForm = ({ onSave, onCancel, defaultValues }: CreateCharacterFormProps) => {
  const [draft, setDraft] = useState(defaultValues)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    if (!draft.name.trim()) return
    const slug = draft.slug || draft.name.toLowerCase().replace(/\s+/g, '-')
    onSave({ ...draft, slug })
  }

  return (
    <div className={styles.card} style={{ maxWidth: 560 }}>
      <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem' }}>
        New Character
      </h2>

      <div className={styles.formGroup}>
        <label className={styles.label}>Name</label>
        <input
          className={styles.input}
          placeholder="e.g. Luna, Nyx, Spark..."
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Slug</label>
        <input
          className={styles.input}
          placeholder="url-safe-name"
          value={draft.slug}
          onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Personality</label>
        <textarea
          className={styles.textarea}
          placeholder="Describe your AI's personality..."
          value={draft.personality}
          onChange={(e) => setDraft((d) => ({ ...d, personality: e.target.value }))}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Key Phrases</label>
        <input
          className={styles.input}
          placeholder="hey chat, poggers, gg"
          value={draft.keyPhrases}
          onChange={(e) => setDraft((d) => ({ ...d, keyPhrases: e.target.value }))}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Model Type</label>
        <div className={styles.modelTypeGrid}>
          {MODEL_TYPES.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`${styles.modelTypeCard} ${draft.modelType === m.value ? styles.modelTypeCardSelected : ''}`}
              onClick={() => setDraft((d) => ({ ...d, modelType: m.value, modelFileName: undefined }))}
            >
              <span className={styles.modelTypeLabel}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      {draft.modelType !== 'none' && (
        <div className={styles.formGroup}>
          <label className={styles.label}>Upload Model</label>
          <div className={styles.modelUploadRow}>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_MAP[draft.modelType]}
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setDraft((d) => ({ ...d, modelFileName: f.name }))
              }}
            />
            <button type="button" className={styles.btnGhost} onClick={() => fileRef.current?.click()}>
              Choose file
            </button>
            <span className={styles.modelFileName}>
              {draft.modelFileName ?? 'No file selected'}
            </span>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button type="button" className={styles.btnPrimary} onClick={handleSave}>
          Create Character
        </button>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default CreateCharacterForm
