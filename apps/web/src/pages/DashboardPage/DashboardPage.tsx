import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '../../context/CharactersContext'
import SceneFullscreen from '../../components/ProfilePage/tabs/SceneFullscreen'
import { PROFILE_SETTINGS_BASE } from '../../constants/settingsRoutes'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const { selected, loading } = useCharactersContext()

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <div className={styles.loadingText}>{t('emptyState.loadingCharacters')}</div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎬</div>
        <div className={styles.emptyTitle}>{t('emptyState.noCharacterSelected')}</div>
        <p className={styles.emptyText}>{t('emptyState.noCharacterSelectedDesc')}</p>
      </div>
    )
  }

  return (
    <SceneFullscreen
      character={selected}
      cardId={selected.id}
      onOpenSettings={() => navigate(PROFILE_SETTINGS_BASE)}
    />
  )
}
