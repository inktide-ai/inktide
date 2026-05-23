'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import MemoryTab from '../../../components/profile/tabs/memory-tab'

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
