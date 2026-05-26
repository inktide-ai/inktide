'use client'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import ChannelTab from '@/features/character-editor/tabs/channel-tab'

export default function ChannelsPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <ChannelTab
      character={selected}
      onUpdate={(patch) => updateCharacter(selected.id, patch)}
    />
  )
}
