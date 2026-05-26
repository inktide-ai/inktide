'use client'
import { useRouter } from 'next/navigation'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import AccountAvatarPanel from '@/features/character-editor/account-avatar-panel'
import { HOME_ROUTE } from '@/lib/routes'

export default function AccountPage() {
  const router = useRouter()
  const { cardList, characters, selectCard } = useCharactersContext()

  return (
    <AccountAvatarPanel
      onBack={() => router.push(HOME_ROUTE)}
      projects={cardList}
      characters={characters}
      onSelectProject={(id) => { void selectCard(id); router.push(HOME_ROUTE) }}
    />
  )
}
