'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { BrainTab } from '@/features/brain' // fsd:cross-feature-ok — character-editor orchestrates brain config

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
