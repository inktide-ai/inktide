'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import VoiceTab from '../../../components/ProfilePage/tabs/VoiceTab'

export default function VoicePage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <VoiceTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
    />
  )
}
