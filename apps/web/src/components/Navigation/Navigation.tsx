import { useState, useCallback } from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import styles from './Navigation.module.css'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useHideOnScroll } from '../../hooks'
import LogoMarkWhite from '../../assets/app/icon_main_white.svg?react'

interface NavigationProps {
  onLoginClick?: () => void
  onRegisterClick?: () => void
  onGoToLanding?: (hash?: string) => void
  onGoToApp?: () => void
}

const NAV_ITEMS = [
  { label: 'Docs',    href: '#',        active: true  },
  { label: 'API',     href: '#api',     active: false },
  { label: 'Pricing', href: '#pricing', active: false },
  { label: 'Blog',    href: '#blog',    active: false },
]

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const Navigation = (props: NavigationProps) => {
  const { isLoggedIn, userEmail, user, loginWithKeycloak, registerWithKeycloak, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useTranslation('landing')

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

  const LogoContent = <LogoMarkWhite className={styles.logoIcon} aria-hidden />

  return (
    <>
      <nav className={classnames(styles.navbar, { [styles.hidden]: hidden })}>
        <div className={styles.navbarContent}>

          <div className={styles.leftGroup}>
            {props.onGoToLanding ? (
              <button type="button" className={styles.logoButton} onClick={() => props.onGoToLanding?.()} aria-label="inktide">
                {LogoContent}
              </button>
            ) : (
              <a href="#" className={styles.logo} aria-label="inktide">
                {LogoContent}
              </a>
            )}

            <div className={styles.menu}>
              {NAV_ITEMS.map((item) =>
                props.onGoToLanding ? (
                  <button
                    key={item.href}
                    type="button"
                    className={classnames(styles.menuItem, { [styles.menuItemActive]: item.active })}
                    onClick={() => handleNavItem(item.href)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className={classnames(styles.menuItem, { [styles.menuItemActive]: item.active })}
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>
          </div>

          <div className={styles.authPanel}>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

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
                <button type="button" className={styles.logoutButton} onClick={logout}>
                  {t('nav.logOut')}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={styles.loginButton} onClick={onLoginClick}>
                  Log in
                </button>
                <button type="button" className={styles.signupButton} onClick={onRegisterClick}>
                  Sign up for free
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

      {mobileOpen && <div className={styles.mobileOverlay} onClick={closeMobile} aria-hidden />}

      <div className={classnames(styles.mobileDrawer, { [styles.mobileDrawerOpen]: mobileOpen })}>
        <div className={styles.mobileDrawerHeader}>
          <a href="#" className={styles.mobileDrawerLogo} onClick={closeMobile} aria-label="inktide">
            <LogoMarkWhite className={styles.mobileDrawerLogoIcon} aria-hidden />
            <span className={styles.mobileDrawerLogoText}>inktide</span>
          </a>
          <button type="button" className={styles.mobileDrawerClose} onClick={closeMobile} aria-label={t('nav.closeMenu')}>
            <svg viewBox="0 0 14 14" aria-hidden>
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        <div className={styles.mobileMenu}>
          <span className={styles.mobileMenuLabel}>{t('nav.navigation')}</span>
          {NAV_ITEMS.map((item) =>
            props.onGoToLanding ? (
              <button key={item.href} type="button" className={styles.mobileMenuItem} onClick={() => handleNavItem(item.href)}>
                {item.label}
              </button>
            ) : (
              <a key={item.href} href={item.href} className={styles.mobileMenuItem} onClick={closeMobile}>
                {item.label}
              </a>
            )
          )}
        </div>

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
              <button type="button" className={styles.mobileAuthButton} onClick={() => { closeMobile(); props.onGoToApp?.() }}>
                {t('nav.goToProfile')}
              </button>
              <button type="button" className={styles.mobileAuthButtonOutline} onClick={() => { closeMobile(); logout() }}>
                {t('nav.logOut')}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.mobileAuthButton} onClick={() => { closeMobile(); onRegisterClick() }}>
                Sign up for free
              </button>
              <button type="button" className={styles.mobileAuthButtonOutline} onClick={() => { closeMobile(); onLoginClick() }}>
                Log in
              </button>
            </>
          )}
        </div>

        <div className={styles.mobileDrawerFooter}>
          <span className={styles.mobileDrawerVersion}>INKTIDE © 2026</span>
        </div>
      </div>
    </>
  )
}

export default Navigation
