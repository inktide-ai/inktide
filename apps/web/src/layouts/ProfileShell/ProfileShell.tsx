import { useState, useCallback, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, useMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LogoMark from '../../assets/app/icon_without_white.svg?react'
import caretDownSvg from '../../assets/icons/caret-down.svg'
import {
  IconUser, IconScene, IconSettings, IconLogout, IconSearch,
} from '../../components/ProfilePage/TabIcons'
import { useCharactersContext } from '../../context/CharactersContext'
import { getBannerAccent, getBannerGradient } from '../../components/ProfilePage/bannerPresets'
import CreateCharacterForm from '../../components/ProfilePage/CreateCharacterForm'
import { createDefaultCharacter } from '../../domain/character'
import { HOME_ROUTE, TAB_TO_ROUTE, profileSettingsPath } from '../../constants/settingsRoutes'
import styles from '../../components/ProfilePage/ProfilePage.module.css'

function getSidebarHandle(rawUserName: string | undefined, email: string | null): string {
  const em = email?.trim().toLowerCase() ?? ''
  const un = rawUserName?.trim() ?? ''
  if (un) {
    if (un.includes('@')) {
      const local = un.split('@')[0]?.trim() ?? un
      return local.startsWith('.') ? local : `.${local}`
    }
    if (em && un.toLowerCase() === em) {
      const local = email!.split('@')[0]?.trim() ?? un
      return local.startsWith('.') ? local : `.${local}`
    }
    return un.startsWith('.') ? un : `.${un}`
  }
  const local = email?.split('@')[0]?.trim()
  if (local) return local.startsWith('.') ? local : `.${local}`
  return 'User'
}

function truncateSidebarText(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 3)}...`
}

export default function ProfileShell() {
  const { t } = useTranslation(['common', 'profile'])
  const navigate = useNavigate()
  const location = useLocation()
  const { userEmail, user, logout } = useAuth()
  const isScene = !!useMatch({ path: HOME_ROUTE, end: true })

  const {
    cardList, characters, selected,
    selectCard, reloadCard, addCharacter,
  } = useCharactersContext()

  const [isCreating, setIsCreating] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [exiting, setExiting] = useState(false)

  const sidebarHandle = getSidebarHandle(user?.userName, userEmail)
  const sidebarPrimaryTitle = user?.nickname?.trim() ? user.nickname.trim() : sidebarHandle
  const initial = sidebarPrimaryTitle.replace(/^\./, '').charAt(0).toUpperCase() || 'U'

  useEffect(() => {
    const state = location.state as { focusCardId?: string; returnTab?: string } | null
    const focus = state?.focusCardId
    if (!focus || !cardList.some((c) => c.id === focus)) return
    const returnTab = state?.returnTab ?? null
    let cancelled = false
    ;(async () => {
      setIsCreating(false)
      if (!cancelled) await reloadCard(focus)
      const dest =
        returnTab && TAB_TO_ROUTE[returnTab]
          ? profileSettingsPath(TAB_TO_ROUTE[returnTab])
          : HOME_ROUTE
      navigate(dest, { replace: true, state: {} })
    })()
    return () => { cancelled = true }
  }, [cardList, location.state, navigate, reloadCard])

  useEffect(() => {
    if (!userMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [userMenuOpen])

  const handleSelectCard = useCallback(async (id: string) => {
    setIsCreating(false)
    await selectCard(id)
  }, [selectCard])

  const handleLogout = useCallback(() => { setUserMenuOpen(false); logout() }, [logout])
  const handleOpenSettings = useCallback(() => {
    setUserMenuOpen(false)
    setExiting(true)
    setTimeout(() => navigate(profileSettingsPath('me/account')), 200)
  }, [navigate])
  const handleOpenProfile = useCallback(() => { setUserMenuOpen(false); navigate(profileSettingsPath('me')) }, [navigate])

  return (
    <div className={`${styles.layout} ${exiting ? styles.layoutExiting : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button type="button" className={styles.logoRow} onClick={() => navigate('/')} aria-label="inktide">
            <LogoMark className={styles.logoIcon} aria-hidden />
          </button>
        </div>

        <button type="button" className={styles.newCharacterBtn} onClick={() => setIsCreating(true)}>
          <span className={styles.newCharacterIcon}>+</span>
          {t('common:sidebar.createNew')}
        </button>

        <nav className={styles.sidebarNav}>
          <NavLink
            to={HOME_ROUTE}
            end
            className={({ isActive }) =>
              `${styles.sidebarNavItem} ${isActive ? styles.sidebarNavItemActive : ''}`
            }
          >
            <span className={styles.sidebarNavIcon}><IconScene /></span>
            {t('common:sidebar.sandbox')}
          </NavLink>
        </nav>

        <div className={styles.sidebarSearch}>
          <span className={styles.sidebarSearchIcon}><IconSearch /></span>
          <input
            type="text"
            id="sidebar-search"
            name="search"
            placeholder={t('common:sidebar.search')}
            className={styles.sidebarSearchInput}
            aria-label={t('common:sidebar.search')}
            autoComplete="off"
          />
        </div>

        <div className={styles.botListSection}>
          <div className={styles.botListLabel}>{t('common:sidebar.projects')}</div>
          <div className={styles.botList}>
            {cardList.map((c) => {
              const char = characters.get(c.id)
              const bannerIdx = char?.appearance.bannerColorIndex ?? 0
              const accentColor = char?.appearance.bannerCustomColor ?? getBannerAccent(bannerIdx)
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.botRow} ${selected?.id === c.id ? styles.botRowActive : ''}`}
                  onClick={() => void handleSelectCard(c.id)}
                >
                  <div className={styles.botAvatar}>
                    <div
                      className={styles.botAvatarInner}
                      style={c.avatar_url ? undefined : { background: getBannerGradient(bannerIdx) }}
                    >
                      {c.avatar_url
                        ? <img src={c.avatar_url} alt="" className={styles.botAvatarImg} />
                        : c.name.charAt(0)}
                    </div>
                    {c.is_active && <span className={styles.botStatus} aria-hidden />}
                  </div>
                  <div className={styles.botInfo}>
                    <div className={styles.botNameRow}>
                      <span className={styles.botName}>{c.name}</span>
                      <span
                        className={styles.botTag}
                        style={{ background: `${accentColor}26`, color: accentColor }}
                      >
                        {t('common:badge.bot')}
                      </span>
                    </div>
                    <div className={styles.botSlug}>/{c.slug}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userBlockWrapper}>
            <button
              type="button"
              className={styles.userBlock}
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className={styles.avatar}>
                {user?.pictureUrl
                  ? <img src={user.pictureUrl} alt="" className={styles.avatarImg} />
                  : initial}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userSidebarPrimary} title={sidebarPrimaryTitle}>
                  {truncateSidebarText(sidebarPrimaryTitle, 22)}
                </div>
                {userEmail ? (
                  <div className={styles.userMetaSlot}>
                    <div className={styles.userMetaTrack}>
                      <span className={styles.userMetaLine} title={userEmail}>
                        {truncateSidebarText(userEmail, 26)}
                      </span>
                      <span className={styles.userMetaLine} title={sidebarHandle}>
                        {truncateSidebarText(sidebarHandle, 26)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.userSidebarSecondary} title={sidebarHandle}>
                    {truncateSidebarText(sidebarHandle, 26)}
                  </div>
                )}
              </div>
              <img src={caretDownSvg} alt="" className={styles.userCaret} aria-hidden />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className={styles.userMenuBackdrop}
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden
                />
                <div className={styles.userMenu} role="menu" aria-label={t('common:sidebar.accountMenuAria')}>
                  <div className={styles.userMenuHeader}>
                    <div className={styles.userMenuAvatar}>
                      {user?.pictureUrl
                        ? <img src={user.pictureUrl} alt="" className={styles.avatarImg} />
                        : initial}
                    </div>
                    <div className={styles.userMenuHeaderInfo}>
                      <div className={styles.userMenuName}>{truncateSidebarText(sidebarPrimaryTitle, 20)}</div>
                      <div className={styles.userMenuEmail}>{truncateSidebarText(userEmail ?? sidebarHandle, 24)}</div>
                    </div>
                  </div>
                  <button type="button" className={styles.userMenuItem} role="menuitem" onClick={handleOpenProfile}>
                    <span className={styles.userMenuItemIcon} aria-hidden><IconUser /></span>
                    {t('common:sidebar.profile')}
                  </button>
                  <button type="button" className={styles.userMenuItem} role="menuitem" onClick={handleOpenSettings}>
                    <span className={styles.userMenuItemIcon} aria-hidden><IconSettings /></span>
                    {t('common:sidebar.settings')}
                  </button>
                  <div className={styles.userMenuDivider} />
                  <a
                    href="https://docs.inktide.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.userMenuItem}
                    role="menuitem"
                  >
                    <span className={styles.userMenuItemIcon} aria-hidden>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </span>
                    Help
                    <span className={styles.userMenuItemChevron} aria-hidden>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </span>
                  </a>
                  <button
                    type="button"
                    className={styles.userMenuItem}
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <span className={styles.userMenuItemIcon} aria-hidden><IconLogout /></span>
                    {t('common:sidebar.logOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className={`${styles.main} ${isScene && !isCreating ? styles.mainScene : ''}`}>
        {isCreating ? (
          <CreateCharacterForm
            onSave={(c) => { void addCharacter(c); setIsCreating(false) }}
            onCancel={() => setIsCreating(false)}
            defaultValues={createDefaultCharacter()}
          />
        ) : (
          <Outlet />
        )}
      </main>

    </div>
  )
}
