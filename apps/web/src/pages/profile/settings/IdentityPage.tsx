import { useNavigate } from 'react-router-dom'
import { useCharactersContext } from '../../../context/CharactersContext'
import IdentityCard from '../../../components/ProfilePage/IdentityCard'
import { profileSettingsPath, TAB_TO_ROUTE } from '../../../constants/settingsRoutes'

export default function IdentityPage() {
  const navigate = useNavigate()
  const { selected, updateCharacter, removeCharacter } = useCharactersContext()
  if (!selected) return null

  return (
    <IdentityCard
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
      onDelete={() => void removeCharacter(selected.id)}
      onNavigateTab={(tab) => {
        const route = TAB_TO_ROUTE[tab]
        if (route) navigate(profileSettingsPath(route))
      }}
    />
  )
}
