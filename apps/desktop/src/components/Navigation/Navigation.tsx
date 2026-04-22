import { useState, useCallback } from 'react'
import classnames from 'classnames'
import styles from './Navigation.module.css'
import { NAVIGATION_ITEMS, CONTENT } from '../../constants'
import { useAuth } from '../../context/AuthContext'
import { useHideOnScroll } from '../../hooks'
import logoSvg from '../../assets/app/icon.svg'

interface NavigationProps {
  onLoginClick?: () => void
  onRegisterClick?: () => void
  onGoToLanding?: (hash?: string) => void
  onGoToApp?: () => void
}

const Navigation = (props: NavigationProps) => {
  const {
    onLoginClick: onLoginProp,
    onRegisterClick: onRegisterProp,
    onGoToLanding,
    onGoToApp,
  } = props
  const { isLoggedIn, userEmail, user, loginWithKeycloak, registerWithKeycloak, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const onLoginClick = onLoginProp ?? loginWithKeycloak
  const onRegisterClick = onRegisterProp ?? registerWithKeycloak

  const hidden = useHideOnScroll()

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const handleNavItem = useCallback(
    (href: string) => {
      closeMobile()
      onGoToLanding?.(href)
    },
    [closeMobile, onGoToLanding],
  )

  return (
    <>
      <nav className={classnames(styles.navbar, { [styles.hidden]: hidden })}>
        <div className={styles.navbarContent}>
          {onGoToLanding ? (
            <button
              type="button"
              className={styles.logoButton}
              onClick={() => onGoToLanding?.()}
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
              onGoToLanding ? (
                <button
                  key={item.href}
                  type="button"
                  className={styles.menuItem}
                  onClick={() => onGoToLanding?.(item.href)}
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
            {onGoToLanding ? (
              <button
                type="button"
                className={styles.navLink}
                onClick={() => onGoToLanding?.('#demo')}
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
                  onClick={onGoToApp}
                >
                  <span className={styles.profileIcon} aria-hidden>
                    {user?.pictureUrl ? (
                      <img src={user.pictureUrl} alt="" className={styles.profileIconImg} />
                    ) : (
                      (user?.nickname?.trim() || user?.userName || userEmail || '?')
                        .replace(/^\./, '')
                        .charAt(0)
                        .toUpperCase() || '?'
                    )}
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
        {/* Header */}
        <div className={styles.mobileDrawerHeader}>
          <a href="#" className={styles.mobileDrawerLogo} onClick={closeMobile}>
            <img src={logoSvg} alt="Chimera" className={styles.mobileDrawerLogoIcon} />
            <span className={styles.mobileDrawerLogoText}>Chimera</span>
          </a>
          <button
            type="button"
            className={styles.mobileDrawerClose}
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 14 14" aria-hidden>
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div className={styles.mobileMenu}>
          <span className={styles.mobileMenuLabel}>Navigation</span>
          {NAVIGATION_ITEMS.map((item) =>
            onGoToLanding ? (
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

        {/* Auth */}
        <div className={styles.mobileAuth}>
          {isLoggedIn ? (
            <>
              <div className={styles.mobileProfileBlock}>
                <span className={styles.mobileProfileAvatar}>
                  {user?.pictureUrl ? (
                    <img src={user.pictureUrl} alt="" />
                  ) : (
                    (user?.nickname?.trim() || user?.userName || userEmail || '?')
                      .replace(/^\./, '')
                      .charAt(0)
                      .toUpperCase() || '?'
                  )}
                </span>
                <span className={styles.mobileProfileName}>
                  {user?.nickname?.trim() || user?.userName || userEmail || 'Profile'}
                </span>
              </div>
              <button
                type="button"
                className={styles.mobileAuthButton}
                onClick={() => { closeMobile(); onGoToApp?.() }}
              >
                Go to Profile
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
                className={styles.mobileAuthButton}
                onClick={() => { closeMobile(); onRegisterClick() }}
              >
                {CONTENT.hero.signUpFree}
              </button>
              <button
                type="button"
                className={styles.mobileAuthButtonOutline}
                onClick={() => { closeMobile(); onLoginClick() }}
              >
                {CONTENT.hero.logIn}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.mobileDrawerFooter}>
          <span className={styles.mobileDrawerVersion}>CHIMERA © 2026</span>
        </div>
      </div>
    </>
  )
}

export default Navigation
