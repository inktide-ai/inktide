'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import ModelTab from '@/features/character-editor/tabs/model-tab'

export default function ModelPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <ModelTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
      cardId={selected.id}
    />
  )
}
