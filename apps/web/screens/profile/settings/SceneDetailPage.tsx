'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCharactersContext } from '../../../context/CharactersContext'
import { useCardScene } from '../../../components/avatar/hooks/use-card-scene'
import { SceneSettings } from '../../../components/profile/tabs/scene-settings'

export default function SceneDetailPage() {
  const { sceneId } = useParams<{ sceneId: string }>()
  const router = useRouter()
  const { selected } = useCharactersContext()
  const [refresh, setRefresh] = useState(0)
  const { scenes } = useCardScene(selected?.id, refresh)

  if (!selected || !sceneId) return null

  const scene = scenes.find(s => s.id === sceneId) ?? null

  return (
    <SceneSettings
      character={selected}
      scene={scene}
      cardId={selected.id}
      onBack={() => router.push('/settings/scene')}
      onScenesChanged={() => setRefresh(k => k + 1)}
      onSceneReplaced={newId => router.replace(`/settings/scene/${newId}`)}
      onSceneDeleted={() => router.push('/settings/scene')}
    />
  )
}
