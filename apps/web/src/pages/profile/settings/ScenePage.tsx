import { useCharactersContext } from '../../../context/CharactersContext'
import SceneTab from '../../../components/ProfilePage/tabs/SceneTab'

export default function ScenePage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <SceneTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
      cardId={selected.id}
    />
  )
}
