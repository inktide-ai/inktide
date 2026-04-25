import { useNavigate } from 'react-router-dom'
import { useCharactersContext } from '../../../context/CharactersContext'
import AccountAvatarPanel from '../../../components/ProfilePage/AccountAvatarPanel'
import { HOME_ROUTE } from '../../../constants/settingsRoutes'

export default function AccountPage() {
  const navigate = useNavigate()
  const { cardList, characters, selectCard } = useCharactersContext()

  return (
    <AccountAvatarPanel
      onBack={() => navigate(HOME_ROUTE)}
      projects={cardList}
      characters={characters}
      onSelectProject={(id) => { void selectCard(id); navigate(HOME_ROUTE) }}
    />
  )
}
