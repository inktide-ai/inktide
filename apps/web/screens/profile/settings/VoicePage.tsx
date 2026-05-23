'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import VoiceTab from '../../../components/profile/tabs/voice-tab'

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
