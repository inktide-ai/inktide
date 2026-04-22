import { useMemo, useState, useCallback } from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import styles from './Navigation.module.css'
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
  const { isLoggedIn, userEmail, user, loginWithKeycloak, registerWithKeycloak, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useTranslation('landing')

  const NAVIGATION_ITEMS = useMemo(() => [
    { label: t('nav.product'),    href: '#features',     withCaret: true },
    { label: t('nav.solutions'),  href: '#how',          withCaret: true },
    { label: t('nav.howItWorks'), href: '#how-it-works', withCaret: true },
  ], [t])

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
                {t('nav.docs')}
              </button>
            ) : (
              <a href="#demo" className={styles.navLink}>
                {t('nav.docs')}
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
                    {user?.pictureUrl ? (
                      <img src={user.pictureUrl} alt="" className={styles.profileIconImg} />
                    ) : (
                      (user?.nickname?.trim() || user?.userName || userEmail || '?')
                        .replace(/^\./, '')
                        .charAt(0)
                        .toUpperCase() || '?'
                    )}
                  </span>
                  <span className={styles.profileText}>{t('nav.profile')}</span>
                </button>
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={logout}
                >
                  {t('nav.logOut')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.loginButton}
                  onClick={onLoginClick}
                >
                  {t('nav.logIn')}
                </button>
                <button
                  type="button"
                  className={styles.signupButton}
                  onClick={onRegisterClick}
                >
                  {t('nav.signUpFree')}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles.burger}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t('nav.toggleMenu')}
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
            aria-label={t('nav.closeMenu')}
          >
            <svg viewBox="0 0 14 14" aria-hidden>
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div className={styles.mobileMenu}>
          <span className={styles.mobileMenuLabel}>{t('nav.navigation')}</span>
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
                onClick={() => { closeMobile(); props.onGoToApp?.() }}
              >
                {t('nav.goToProfile')}
              </button>
              <button
                type="button"
                className={styles.mobileAuthButtonOutline}
                onClick={() => { closeMobile(); logout() }}
              >
                {t('nav.logOut')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.mobileAuthButton}
                onClick={() => { closeMobile(); onRegisterClick() }}
              >
                {t('nav.signUpFree')}
              </button>
              <button
                type="button"
                className={styles.mobileAuthButtonOutline}
                onClick={() => { closeMobile(); onLoginClick() }}
              >
                {t('nav.logIn')}
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
