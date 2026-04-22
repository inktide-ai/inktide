import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCharactersContext } from '../../../context/CharactersContext'
import { useCardScene } from '../../../components/AvatarRenderer/hooks/useCardScene'
import { SceneSettings } from '../../../components/ProfilePage/tabs/SceneSettings'

export default function SceneDetailPage() {
  const { sceneId } = useParams<{ sceneId: string }>()
  const navigate = useNavigate()
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
      onBack={() => navigate('/profile/settings/scene')}
      onScenesChanged={() => setRefresh(k => k + 1)}
      onSceneReplaced={newId => navigate(`/profile/settings/scene/${newId}`, { replace: true })}
      onSceneDeleted={() => navigate('/profile/settings/scene')}
    />
  )
}
