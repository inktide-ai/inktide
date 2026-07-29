'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { HOME_ROUTE } from '@/lib/routes'

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

export interface NavItem {
  label: string
  href: string
  active: boolean
}

interface NavigationActionsProps {
  navItems: NavItem[]
  isLoggedIn: boolean
  userName: string | null
  userPicture: string | null
}

export default function NavigationActions({
  navItems,
  isLoggedIn,
  userName,
  userPicture,
}: NavigationActionsProps) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme ?? 'dark'
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  const [mobileOpen, setMobileOpen] = useState(false)
  // next-themes: resolvedTheme is only known after mount. Render a stable
  // (server-matching) icon/label until mounted to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const themeLabel = mounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'
  const ThemeIcon = mounted && theme !== 'dark' ? MoonIcon : SunIcon
  const { t, i18n: i18nInstance } = useTranslation('landing')

  const currentLang = i18nInstance.language?.startsWith('ru') ? 'ru' : 'en'
  const switchLang = (lang: 'en' | 'ru') => {
    void i18nInstance.changeLanguage(lang)
    router.refresh()
  }

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const handleNavItem = useCallback((href: string) => {
    closeMobile()
    if (href.startsWith('#')) {
      const id = href.slice(1)
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push(href)
    }
  }, [closeMobile, router])

  const avatarInitial =
    (userName || '?')
      .replace(/^\./, '')
      .charAt(0)
      .toUpperCase() || '?'
  const profileName = userName || 'Profile'

  return (
    <>
      {/* Desktop right side */}
      <div className="hidden lg:flex items-center gap-[0.625rem] flex-shrink-0">
        <div className="flex items-center gap-0.5">
          {(['en', 'ru'] as const).map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => switchLang(lang)}
              className={cn(
                'px-2 py-1 text-[11px] font-bold uppercase rounded-md border-none cursor-pointer transition-[color,background] duration-[180ms]',
                currentLang === lang
                  ? 'bg-[var(--nav-item-hover-bg)] text-[var(--nav-item-active-color)]'
                  : 'bg-transparent text-[var(--nav-item-color)] opacity-40 hover:opacity-80',
              )}
            >
              {lang}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={themeLabel}
          className="flex items-center justify-center w-[34px] h-[34px] bg-transparent border-none rounded-lg text-[var(--nav-theme-btn-color)] cursor-pointer flex-shrink-0 transition-[color,background] duration-[180ms] hover:text-[var(--nav-theme-btn-hover)] hover:bg-[var(--nav-item-hover-bg)]"
        >
          <ThemeIcon />
        </button>

        {isLoggedIn ? (
          <>
            <button
              type="button"
              className="flex items-center gap-2 py-[0.4rem] px-[0.875rem] bg-white/[0.08] border border-white/10 rounded-lg text-[var(--nav-login-color)] font-[family-name:var(--font-ui)] text-sm font-medium cursor-pointer transition-[background] duration-[180ms] hover:bg-white/[0.13]"
              title={userName ?? undefined}
              onClick={() => router.push(HOME_ROUTE)}
            >
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-red)] text-xs font-bold text-white overflow-hidden flex-shrink-0"
                aria-hidden
              >
                {userPicture ? (
                  <img src={userPicture as string} alt="" className="w-full h-full object-cover block" />
                ) : (
                  avatarInitial
                )}
              </span>
              <span className="text-sm">{t('nav.profile')}</span>
            </button>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: '/' })}
              className="py-[0.45rem] px-[1.1rem] bg-transparent border border-[var(--nav-login-border)] rounded-lg text-[var(--nav-login-color)] font-[family-name:var(--font-ui)] text-sm font-medium cursor-pointer whitespace-nowrap transition-[border-color,color] duration-[180ms]"
            >
              {t('nav.logOut')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void signIn('keycloak', { callbackUrl: '/home' })}
              className="py-[0.45rem] px-[1.1rem] bg-transparent border border-[var(--nav-login-border)] rounded-lg text-[var(--nav-login-color)] font-[family-name:var(--font-ui)] text-sm font-medium cursor-pointer whitespace-nowrap transition-[border-color,background,color] duration-[180ms] hover:bg-[var(--nav-login-hover-bg)]"
            >
              {t('nav.logIn')}
            </button>
            <button
              type="button"
              onClick={() => void signIn('keycloak', { callbackUrl: '/home' })}
              className="py-[0.45rem] px-[1.1rem] bg-[var(--nav-signup-bg)] border-none rounded-lg text-[var(--nav-signup-color)] font-[family-name:var(--font-ui)] text-sm font-semibold cursor-pointer whitespace-nowrap transition-[background] duration-[180ms] hover:bg-[var(--nav-signup-hover-bg)]"
            >
              {t('nav.signUpFree')}
            </button>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        className="flex lg:hidden flex-col justify-center gap-[5px] w-9 h-9 p-[6px] bg-transparent border-none cursor-pointer"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={t('nav.toggleMenu')}
        aria-expanded={mobileOpen}
      >
        <span className={cn('block w-full h-0.5 bg-[var(--nav-login-color)] rounded-[1px] transition-[transform,opacity] duration-300', mobileOpen && 'translate-y-[7px] rotate-45')} />
        <span className={cn('block w-full h-0.5 bg-[var(--nav-login-color)] rounded-[1px] transition-[transform,opacity] duration-300', mobileOpen && 'opacity-0')} />
        <span className={cn('block w-full h-0.5 bg-[var(--nav-login-color)] rounded-[1px] transition-[transform,opacity] duration-300', mobileOpen && '-translate-y-[7px] -rotate-45')} />
      </button>

      {/* Mobile full-width dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop - closes menu on outside click */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 top-[60px] z-[999] bg-black/30 lg:hidden"
              onClick={closeMobile}
              aria-hidden
            />

            {/* Dropdown panel */}
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className={cn(
                'fixed top-[60px] left-0 right-0 z-[1001] lg:hidden',
                'bg-[var(--nav-bg)] [backdrop-filter:blur(14px)] [-webkit-backdrop-filter:blur(14px)]',
                'border-b border-[var(--nav-border-color)]',
              )}
            >
              {/* Nav links */}
              <div className="px-3 pt-2 pb-1">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNavItem(item.href)}
                    className={cn(
                      'w-full flex items-center py-3 px-3 rounded-xl text-left',
                      'font-[family-name:var(--font-ui)] text-[0.975rem] font-medium',
                      'transition-[background,color] duration-[150ms]',
                      item.active
                        ? 'text-[var(--nav-item-active-color)]'
                        : 'text-[var(--nav-item-color)] hover:bg-[var(--nav-item-hover-bg)] hover:text-[var(--nav-item-hover-color)]',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="mx-4 border-t border-[var(--nav-border-color)]" />

              {/* Auth buttons */}
              <div className="px-4 py-3 flex flex-col gap-2">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                      <span className="w-8 h-8 rounded-full bg-[var(--accent-red)] flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
                        {userPicture ? (
                          <img src={userPicture as string} alt="" className="w-full h-full object-cover block" />
                        ) : (
                          avatarInitial
                        )}
                      </span>
                      <span className="font-[family-name:var(--font-ui)] text-[0.9rem] font-semibold text-[var(--text-primary)]">
                        {profileName}
                      </span>
                    </div>
                    <a
                      href={HOME_ROUTE}
                      onClick={closeMobile}
                      className="w-full py-3 px-5 rounded-xl text-center no-underline font-[family-name:var(--font-ui)] text-[0.925rem] font-semibold cursor-pointer transition-[background] duration-[180ms] bg-[var(--landing-mobile-primary-btn-bg)] text-[var(--landing-mobile-primary-btn-text)] hover:bg-[var(--landing-mobile-primary-btn-hover-bg)]"
                    >
                      {t('nav.goToProfile')}
                    </a>
                    <button
                      type="button"
                      onClick={() => { closeMobile(); void signOut({ callbackUrl: '/' }) }}
                      className="w-full py-3 px-5 bg-transparent border border-[var(--nav-border-color)] rounded-xl text-[var(--nav-item-color)] font-[family-name:var(--font-ui)] text-[0.925rem] font-medium cursor-pointer transition-[border-color,color] duration-[180ms] hover:border-[var(--nav-item-hover-color)] hover:text-[var(--nav-item-hover-color)]"
                    >
                      {t('nav.logOut')}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { closeMobile(); void signIn('keycloak', { callbackUrl: '/home' }) }}
                      className="flex-1 py-3 px-5 bg-transparent border border-[var(--nav-border-color)] rounded-xl text-[var(--nav-item-color)] font-[family-name:var(--font-ui)] text-[0.925rem] font-medium cursor-pointer transition-[border-color,color] duration-[180ms] hover:border-[var(--nav-item-hover-color)] hover:text-[var(--nav-item-hover-color)]"
                    >
                      {t('nav.logIn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { closeMobile(); void signIn('keycloak', { callbackUrl: '/home' }) }}
                      className="flex-1 py-3 px-5 bg-[var(--nav-signup-bg)] border-none rounded-xl text-[var(--nav-signup-color)] font-[family-name:var(--font-ui)] text-[0.925rem] font-semibold cursor-pointer transition-[background] duration-[180ms] hover:bg-[var(--nav-signup-hover-bg)]"
                    >
                      {t('nav.signUpFree')}
                    </button>
                  </div>
                )}
              </div>

              {/* Footer row: lang switcher + theme toggle */}
              <div className="px-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {(['en', 'ru'] as const).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => switchLang(lang)}
                      className={cn(
                        'px-2 py-1 text-[11px] font-bold uppercase rounded-md border-none cursor-pointer transition-[color,background] duration-[180ms]',
                        currentLang === lang
                          ? 'bg-[var(--nav-item-hover-bg)] text-[var(--nav-item-active-color)]'
                          : 'bg-transparent text-[var(--nav-item-color)] opacity-40 hover:opacity-80',
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={themeLabel}
                  className="flex items-center justify-center w-8 h-8 bg-transparent border-none rounded-lg text-[var(--nav-theme-btn-color)] cursor-pointer transition-[color,background] duration-[180ms] hover:text-[var(--nav-theme-btn-hover)] hover:bg-[var(--nav-item-hover-bg)]"
                >
                  <ThemeIcon />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
