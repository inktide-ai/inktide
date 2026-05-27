'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import MemoryTab from '@/features/character-editor/tabs/memory-tab'

export default function MemoryPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <MemoryTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
    />
  )
}
