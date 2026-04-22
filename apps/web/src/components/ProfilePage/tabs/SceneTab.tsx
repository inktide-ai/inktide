import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCardScene } from '../../AvatarRenderer/hooks/useCardScene'
import { SceneGrid } from './SceneGrid'
import type { AiCharacter } from '../../../domain/character'

interface SceneTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  cardId?: string
}

const SceneTab = ({ cardId }: SceneTabProps) => {
  const navigate = useNavigate()
  const [sceneRefresh, setSceneRefresh] = useState(0)
  const { scenes, loading } = useCardScene(cardId, sceneRefresh)
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const activeScene = scenes.find(s => s.id === activeSceneId) ?? scenes[0] ?? null

  return (
    <SceneGrid
      scenes={scenes}
      loading={loading}
      activeSceneId={activeScene?.id ?? null}
      cardId={cardId}
      onSelect={id => setActiveSceneId(id)}
      onConfigure={id => navigate(id)}
      onActiveChanged={id => setActiveSceneId(id)}
      onScenesChanged={() => setSceneRefresh(k => k + 1)}
    />
  )
}

export default SceneTab
