import { useRef, useState } from 'react'
import styles from '../ProfilePage.module.css'
import AvatarRenderer from '../../AvatarRenderer/AvatarRenderer'
import { useCardModel } from '../../AvatarRenderer/hooks/useCardModel'
import { useCardScene } from '../../AvatarRenderer/hooks/useCardScene'
import { uploadCardSceneFile, deleteCardScene } from '../../../api/soul'
import type { AiCharacter, ModelType } from '../../../domain/character'

interface SceneTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  cardId?: string
}

function inferModelType(contentType: string, fileName: string): ModelType {
  if (fileName.endsWith('.vrm')) return 'vrm'
  if (contentType === 'model/gltf-binary' || fileName.endsWith('.glb')) return 'glb'
  return 'glb'
}

const ALLOWED_SCENE_TYPES = 'image/jpeg,image/png,image/webp'
const MAX_SCENE_MB = 50

const SceneTab = ({ cardId }: SceneTabProps) => {
  const { model, loading: modelLoading, error: modelError } = useCardModel(cardId)
  const [sceneRefresh, setSceneRefresh] = useState(0)
  const { scene, loading: sceneLoading } = useCardScene(cardId, sceneRefresh)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const effectiveModelType = model
    ? inferModelType(model.content_type, model.original_file_name)
    : 'glb'

  const background = scene?.public_url ?? '#08080a'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !cardId) return

    if (file.size > MAX_SCENE_MB * 1024 * 1024) {
      setUploadError(`File too large (max ${MAX_SCENE_MB} MB).`)
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      await uploadCardSceneFile(cardId, file)
      setSceneRefresh(k => k + 1)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemove() {
    if (!cardId || !scene) return
    setRemoving(true)
    setUploadError(null)
    try {
      await deleteCardScene(cardId, scene.id)
      setSceneRefresh(k => k + 1)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Remove failed.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={styles.tabRoot}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Studio</div>
        <div className={styles.infoCard}>
          <div style={{ height: 560, borderRadius: 8, overflow: 'hidden', background: '#08080a', position: 'relative' }}>
            {modelLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', zIndex: 2 }}>
                Loading model…
              </div>
            )}
            {modelError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e05c5c', fontSize: '0.85rem', zIndex: 2 }}>
                {modelError}
              </div>
            )}
            {!modelLoading && !modelError && (
              <AvatarRenderer
                modelType={effectiveModelType}
                modelUrl={model?.public_url ?? null}
                background={background}
              />
            )}
          </div>

          {model && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{model.original_file_name}</span>
              <span>{(model.size_bytes / 1_048_576).toFixed(1)} MB</span>
              <span>{model.content_type}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Environment</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div style={{ padding: '1rem' }}>

              {/* Background row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Thumbnail */}
                <div style={{
                  width: 80,
                  height: 52,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: scene ? `url(${scene.public_url}) center/cover` : '#08080a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {!scene && !sceneLoading && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>None</span>
                  )}
                </div>

                {/* Info + actions */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                    Background image
                  </div>
                  {scene ? (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {scene.original_file_name} · {(scene.size_bytes / 1_048_576).toFixed(1)} MB
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      .jpg, .png, .webp — max {MAX_SCENE_MB} MB
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !cardId}
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.78rem',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-primary)',
                      cursor: uploading || !cardId ? 'not-allowed' : 'pointer',
                      opacity: uploading || !cardId ? 0.5 : 1,
                      transition: 'background 0.15s',
                    }}
                  >
                    {uploading ? 'Uploading…' : scene ? 'Replace' : 'Upload'}
                  </button>

                  {scene && (
                    <button
                      onClick={handleRemove}
                      disabled={removing}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.78rem',
                        borderRadius: 6,
                        border: '1px solid rgba(224,92,92,0.3)',
                        background: 'rgba(224,92,92,0.08)',
                        color: '#e05c5c',
                        cursor: removing ? 'not-allowed' : 'pointer',
                        opacity: removing ? 0.5 : 1,
                        transition: 'background 0.15s',
                      }}
                    >
                      {removing ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>

              {uploadError && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#e05c5c' }}>
                  {uploadError}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_SCENE_TYPES}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {/* Lighting/overlay placeholders */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Lighting and overlays — coming soon.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SceneTab
