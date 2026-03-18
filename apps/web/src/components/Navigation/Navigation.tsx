import { useState, useCallback } from 'react'
import classnames from 'classnames'
import styles from './Navigation.module.css'
import { NAVIGATION_ITEMS, CONTENT } from '../../constants'
import { useAuth } from '../../context/AuthContext'
import { useHideOnScroll } from '../../hooks'
import logoSvg from '../../assets/icon.svg'

interface NavigationProps {
  onLoginClick?: () => void
  onRegisterClick?: () => void
  onGoToLanding?: (hash?: string) => void
  onGoToApp?: () => void
}

const Navigation = (props: NavigationProps) => {
  const { isLoggedIn, userEmail, loginWithKeycloak, registerWithKeycloak, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const onLoginClick = props.onLoginClick ?? loginWithKeycloak
  const onRegisterClick = props.onRegisterClick ?? registerWithKeycloak

  const hidden = useHideOnScroll()

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const handleNavItem = useCallback(
    (href: string) => {
      closeMobile()
      props.onGoToLanding?.(href)
    },
    [closeMobile, props.onGoToLanding],
  )

  return (
    <>
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
                  <span className={styles.profileText}>Profile</span>
                </button>
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={logout}
                >
                  Log out
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

          <button
            type="button"
            className={styles.burger}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={classnames(styles.burgerLine, { [styles.burgerOpen]: mobileOpen })} />
            <span className={classnames(styles.burgerLine, { [styles.burgerOpen]: mobileOpen })} />
            <span className={classnames(styles.burgerLine, { [styles.burgerOpen]: mobileOpen })} />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={closeMobile} aria-hidden />
      )}
      <div className={classnames(styles.mobileDrawer, { [styles.mobileDrawerOpen]: mobileOpen })}>
        <div className={styles.mobileMenu}>
          {NAVIGATION_ITEMS.map((item) =>
            props.onGoToLanding ? (
              <button
                key={item.href}
                type="button"
                className={styles.mobileMenuItem}
                onClick={() => handleNavItem(item.href)}
              >
                {item.label}
              </button>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className={styles.mobileMenuItem}
                onClick={closeMobile}
              >
                {item.label}
              </a>
            )
          )}
        </div>
        <div className={styles.mobileAuth}>
          {isLoggedIn ? (
            <>
              <button
                type="button"
                className={styles.mobileAuthButton}
                onClick={() => { closeMobile(); props.onGoToApp?.() }}
              >
                Profile
              </button>
              <button
                type="button"
                className={styles.mobileAuthButtonOutline}
                onClick={() => { closeMobile(); logout() }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.mobileAuthButtonOutline}
                onClick={() => { closeMobile(); onLoginClick() }}
              >
                {CONTENT.hero.logIn}
              </button>
              <button
                type="button"
                className={styles.mobileAuthButton}
                onClick={() => { closeMobile(); onRegisterClick() }}
              >
                {CONTENT.hero.signUpFree}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Navigation
