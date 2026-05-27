'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import ObsTab from '@/features/character-editor/tabs/obs-tab'

export default function ObsPage() {
  const { selected } = useCharactersContext()
  if (!selected) return null
  return <ObsTab character={selected} cardId={selected.id} />
}
