import { useEffect, useState } from 'react'
import styles from '../ProfilePage.module.css'
import AvatarRenderer from '../../AvatarRenderer/AvatarRenderer'
import { useCardModel } from '../../AvatarRenderer/hooks/useCardModel'
import { getCard } from '../../../api/soul'
import { useAudioStream } from '../../../hooks/useAudioStream'
import type { AiCharacter, ModelType } from '../types'

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

/** Fetch the first active channel ID linked to this card (used for audio stream subscription). */
function useCardChannelId(cardId: string | undefined): string | null {
  const [channelId, setChannelId] = useState<string | null>(null)

  useEffect(() => {
    if (!cardId) return
    let cancelled = false
    getCard(cardId)
      .then((card) => {
        if (cancelled) return
        const active = card.channels?.find((ch) => ch.is_active && ch.channel_id)
        setChannelId(active?.channel_id ?? null)
      })
      .catch(() => { /* non-critical — audio just won't play */ })
    return () => { cancelled = true }
  }, [cardId])

  return channelId
}

const SceneTab = ({ character, cardId }: SceneTabProps) => {
  const { model, loading, error } = useCardModel(cardId)
  const channelId = useCardChannelId(cardId)
  useAudioStream(channelId)

  const effectiveModelType = model
    ? inferModelType(model.content_type, model.original_file_name)
    : character.modelType

  return (
    <div className={styles.tabRoot}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Studio</div>
        <div className={styles.infoCard}>
          {/* Full studio canvas */}
          <div style={{ height: 560, borderRadius: 8, overflow: 'hidden', background: '#08080a', position: 'relative' }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', zIndex: 2 }}>
                Loading model…
              </div>
            )}
            {error && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e05c5c', fontSize: '0.85rem', zIndex: 2 }}>
                {error}
              </div>
            )}
            {!loading && !error && (
              <AvatarRenderer
                modelType={effectiveModelType}
                modelUrl={model?.public_url ?? null}
                background="#08080a"
              />
            )}
          </div>

          {/* Model info bar */}
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
            <div style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
                Background, lighting, and overlays — coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SceneTab
