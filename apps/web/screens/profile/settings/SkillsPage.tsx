'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import SkillsTab from '@/features/character-editor/tabs/skills-tab'

export default function SkillsPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <SkillsTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
    />
  )
}
