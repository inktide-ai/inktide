'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import SceneTab from '../../../components/profile/tabs/scene-tab'

export default function ScenePage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <SceneTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
      cardId={selected.id}
    />
  )
}
