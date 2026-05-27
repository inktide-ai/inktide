'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import VoiceTab from '@/features/character-editor/tabs/voice-tab'

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
