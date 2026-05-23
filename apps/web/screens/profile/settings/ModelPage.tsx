'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import ModelTab from '../../../components/profile/tabs/model-tab'

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
