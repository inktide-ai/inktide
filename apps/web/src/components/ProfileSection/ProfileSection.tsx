import { useAuth } from '../../context/AuthContext'
import styles from './ProfileSection.module.css'

const ProfileSection = () => {
  const { isLoggedIn, userEmail, user, logout } = useAuth()
  const displayName = user?.userName ?? userEmail ?? '?'

  if (!isLoggedIn) return null

  return (
    <section id="profile" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <span className={styles.avatar}>
            {displayName.charAt(0).toUpperCase()}
          </span>
          <h2 className={styles.title}>Профиль</h2>
          <p className={styles.email}>{displayName}</p>
          <p className={styles.hint}>Вы успешно вошли в аккаунт Chimera</p>
          <button type="button" className={styles.logoutButton} onClick={logout}>
            Выйти
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProfileSection
