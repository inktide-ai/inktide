'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import IdentityCard from '@/features/character-editor/identity-card'

export default function IdentityPage() {
  const { selected, updateCharacter, removeCharacter } = useCharactersContext()
  if (!selected) return null

  return (
    <IdentityCard
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
      onDelete={() => void removeCharacter(selected.id)}
      onNavigateTab={() => {}}
    />
  )
}
