import { useNavigate } from 'react-router-dom'
import { useCharactersContext } from '../../../context/CharactersContext'
import AccountAvatarPanel from '../../../components/ProfilePage/AccountAvatarPanel'

export default function AccountPage() {
  const navigate = useNavigate()
  const { cardList, characters, selectCard } = useCharactersContext()

  return (
    <AccountAvatarPanel
      onBack={() => navigate('/profile')}
      projects={cardList}
      characters={characters}
      onSelectProject={(id) => { void selectCard(id); navigate('/profile') }}
    />
  )
}
