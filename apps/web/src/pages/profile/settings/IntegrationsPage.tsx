import { useCharactersContext } from '../../../context/CharactersContext'
import IntegrationTab from '../../../components/ProfilePage/tabs/IntegrationTab'

export default function IntegrationsPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <IntegrationTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
    />
  )
}
