'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import ObsTab from '../../../components/ProfilePage/tabs/ObsTab'

export default function ObsPage() {
  const { selected } = useCharactersContext()
  if (!selected) return null
  return <ObsTab character={selected} cardId={selected.id} />
}
