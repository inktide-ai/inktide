'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCardScene } from '@/features/avatar/hooks/use-card-scene'
import { SceneGrid } from './scene-grid'
import type { AiCharacter } from '@/shared/lib/character'

interface SceneTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  cardId?: string
}

const SceneTab = ({ cardId }: SceneTabProps) => {
  const router = useRouter()
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
      onConfigure={id => router.push(`/settings/scene/${id}`)}
      onActiveChanged={id => setActiveSceneId(id)}
      onScenesChanged={() => setSceneRefresh(k => k + 1)}
    />
  )
}

export default SceneTab
