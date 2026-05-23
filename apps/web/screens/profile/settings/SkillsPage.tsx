'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import SkillsTab from '../../../components/profile/tabs/skills-tab'

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
