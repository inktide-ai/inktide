'use client'
import { useCharactersContext } from '../../../context/CharactersContext'
import ChannelTab from '../../../components/profile/tabs/channel-tab'

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
