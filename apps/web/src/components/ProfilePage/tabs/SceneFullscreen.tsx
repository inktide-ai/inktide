import AvatarRenderer from '../../AvatarRenderer/AvatarRenderer'
import { useCardModel } from '../../AvatarRenderer/hooks/useCardModel'
import { useCardScene } from '../../AvatarRenderer/hooks/useCardScene'
import { useAudioStream } from '../../../hooks/useAudioStream'
import { useCardChannelId } from '../../../hooks/useCardChannelId'
import { useLipSync } from '../../../hooks/useLipSync'
import { useAuth } from '../../../context/AuthContext'
import type { AiCharacter, ModelType } from '../../../domain/character'
import brainMenuSvg from '../../../assets/icons/brain-menu.svg'
import SceneChat from './SceneChat'
import styles from './SceneFullscreen.module.css'

interface SceneFullscreenProps {
  character: AiCharacter
  cardId: string
  onOpenSettings?: () => void
}

interface SceneAction {
  id: string
  icon: string
  label: string
  onClick: () => void
}

function inferModelType(contentType: string, fileName: string): ModelType {
  if (fileName.endsWith('.vrm')) return 'vrm'
  if (contentType === 'model/gltf-binary' || fileName.endsWith('.glb')) return 'glb'
  return 'glb'
}

const SceneFullscreen = ({ character, cardId, onOpenSettings }: SceneFullscreenProps) => {
  const { user } = useAuth()
  const { model, loading, error } = useCardModel(cardId)
  const { scene } = useCardScene(cardId)
  const channelId = useCardChannelId(cardId)
  const lipSync = useLipSync()

  useAudioStream(channelId, { lipSync })

  const effectiveModelType = model
    ? inferModelType(model.content_type, model.original_file_name)
    : character.appearance.modelType

  const background = scene?.public_url ?? '#08080a'

  const actions: SceneAction[] = [
    {
      id: 'brain',
      icon: brainMenuSvg,
      label: 'Brain',
      onClick: () => onOpenSettings?.(),
    },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#08080a' }}>
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
          background={background}
          getMouthWeights={lipSync.getMouthWeights}
        />
      )}

      {user && (
        <SceneChat cardId={cardId} userId={user.userId} lipSync={lipSync} />
      )}

      <div className={styles.sceneToolbar}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={styles.sceneToolbarBtn}
            aria-label={action.label}
            onClick={action.onClick}
          >
            <img src={action.icon} alt="" className={styles.sceneToolbarIcon} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  )
}

export default SceneFullscreen
