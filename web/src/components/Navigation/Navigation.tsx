import { useState } from 'react'
import classnames from 'classnames'
import styles from './Navigation.module.css'
import { NAVIGATION_ITEMS, CONTENT } from '../../constants'
import { useAuth } from '../../context/AuthContext'
import { useHideOnScroll } from '../../hooks'
import LoginModal from '../LoginModal'
import RegisterModal from '../RegisterModal'
import logoSvg from '../../assets/icon.svg'

interface NavigationProps {
  onLoginClick?: () => void
  onRegisterClick?: () => void
  showLogin?: boolean
  setShowLogin?: (v: boolean) => void
  showRegister?: boolean
  setShowRegister?: (v: boolean) => void
  onGoToLanding?: (hash?: string) => void
  onGoToApp?: () => void
}

const Navigation = (props: NavigationProps) => {
  const { isLoggedIn, userEmail, login, logout } = useAuth()
  const [internalLogin, setInternalLogin] = useState(false)
  const [internalRegister, setInternalRegister] = useState(false)

  const showLogin = props.showLogin ?? internalLogin
  const setShowLogin = props.setShowLogin ?? setInternalLogin
  const showRegister = props.showRegister ?? internalRegister
  const setShowRegister = props.setShowRegister ?? setInternalRegister

  const onLoginClick = props.onLoginClick ?? (() => setShowLogin(true))
  const onRegisterClick = props.onRegisterClick ?? (() => setShowRegister(true))

  const hidden = useHideOnScroll()

  const handleLoginSuccess = (email: string, user?: { userId: string; userName: string; role: string }) => {
    login(email, user)
    setShowLogin(false)
  }

  const handleRegisterSuccess = (email: string, user?: { userId: string; userName: string; role: string }) => {
    login(email, user)
    setShowRegister(false)
  }

  return (
    <nav className={classnames(styles.navbar, { [styles.hidden]: hidden })}>
      <div className={styles.navbarContent}>
        {props.onGoToLanding ? (
          <button
            type="button"
            className={styles.logoButton}
            onClick={() => props.onGoToLanding?.()}
          >
            <img src={logoSvg} alt="Chimera" className={styles.logoIcon} />
            <span className={styles.logoText}>Chimera</span>
          </button>
        ) : (
          <a href="#" className={styles.logo}>
            <img src={logoSvg} alt="Chimera" className={styles.logoIcon} />
            <span className={styles.logoText}>Chimera</span>
          </a>
        )}

        <div className={styles.menu}>
          {NAVIGATION_ITEMS.map((item) =>
            props.onGoToLanding ? (
              <button
                key={item.href}
                type="button"
                className={styles.menuItem}
                onClick={() => props.onGoToLanding?.(item.href)}
              >
                {item.label}
                {item.withCaret && <span className={styles.caret} />}
              </button>
            ) : (
              <a key={item.href} href={item.href} className={styles.menuItem}>
                {item.label}
                {item.withCaret && <span className={styles.caret} />}
              </a>
            )
          )}
        </div>

        <div className={styles.authPanel}>
          {props.onGoToLanding ? (
            <button
              type="button"
              className={styles.navLink}
              onClick={() => props.onGoToLanding?.('#demo')}
            >
              {CONTENT.hero.docs}
            </button>
          ) : (
            <a href="#demo" className={styles.navLink}>
              {CONTENT.hero.docs}
            </a>
          )}
          {isLoggedIn ? (
            <>
              <button
                type="button"
                className={styles.profileLink}
                title={userEmail ?? undefined}
                onClick={props.onGoToApp}
              >
                <span className={styles.profileIcon} aria-hidden>
                  {userEmail ? userEmail.charAt(0).toUpperCase() : '?'}
                </span>
                <span className={styles.profileText}>Профиль</span>
              </button>
              <button
                type="button"
                className={styles.logoutButton}
                onClick={logout}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.loginButton}
                onClick={onLoginClick}
              >
                {CONTENT.hero.logIn}
              </button>
              <button
                type="button"
                className={styles.signupButton}
                onClick={onRegisterClick}
              >
                {CONTENT.hero.signUpFree}
              </button>
            </>
          )}
        </div>
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}
    </nav>
  )
}

export default Navigation
