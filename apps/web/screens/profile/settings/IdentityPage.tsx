'use client'
import { useRouter } from 'next/navigation'
import { useCharactersContext } from '../../../context/CharactersContext'
import IdentityCard from '../../../components/ProfilePage/IdentityCard'
import { profileSettingsPath, TAB_TO_ROUTE } from '@/lib/routes'

export default function IdentityPage() {
  const router = useRouter()
  const { selected, updateCharacter, removeCharacter } = useCharactersContext()
  if (!selected) return null

  return (
    <IdentityCard
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
      onDelete={() => void removeCharacter(selected.id)}
      onNavigateTab={(tab) => {
        const route = TAB_TO_ROUTE[tab]
        if (route) router.push(profileSettingsPath(route))
      }}
    />
  )
}
