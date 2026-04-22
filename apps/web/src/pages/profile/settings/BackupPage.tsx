import { useCharactersContext } from '../../../context/CharactersContext'
import BackupTab from '../../../components/ProfilePage/tabs/BackupTab'

export default function BackupPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <BackupTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
    />
  )
}
