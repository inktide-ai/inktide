'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import SceneTab from '@/features/character-editor/tabs/scene-tab'

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
