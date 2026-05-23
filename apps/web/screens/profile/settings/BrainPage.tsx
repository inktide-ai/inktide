'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import BrainTab from '../../../components/profile/tabs/brain-tab'

export default function BrainPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <BrainTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
    />
  )
}
