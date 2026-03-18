import { useKeycloak } from '@react-keycloak/web'
import { useNavigate } from 'react-router-dom'
import styles from './ProfilePage.module.css'

const ProfilePage = () => {
  const { keycloak } = useKeycloak()
  const navigate = useNavigate()

  const handleLogout = () => {
    keycloak.logout()
  }

  return (
    <div className={styles.container}>
      <h1>Profile</h1>
      {keycloak.tokenParsed && (
        <p className={styles.email}>
          {(keycloak.tokenParsed as { email?: string }).email ??
            (keycloak.tokenParsed as { preferred_username?: string }).preferred_username}
        </p>
      )}
      <button type="button" onClick={handleLogout} className={styles.logout}>
        Log out
      </button>
      <button type="button" onClick={() => navigate('/')} className={styles.back}>
        Back to home
      </button>
    </div>
  )
}

export default ProfilePage
