'use client'
import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import ProfilePanel from './panels/ProfilePanel'
import SecurityPanel from './panels/SecurityPanel'
import SessionsPanel from './panels/SessionsPanel'
import AppearancePanel from './panels/AppearancePanel'
import NotificationsPanel from './panels/NotificationsPanel'
import ConnectionsPanel from './panels/ConnectionsPanel'
import styles from './UserAccountSettings.module.css'

// ── Nav config ────────────────────────────────────────────────────────────────

type PageId = 'profile' | 'security' | 'sessions' | 'appearance' | 'notif' | 'conn'

interface NavItem {
  id: PageId
  label: string
  section: string
  title: string
  sub: string
  anchors: string[]
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  {
    id: 'profile',
    section: 'Account',
    label: 'Personal info',
    title: 'Personal info',
    sub: 'Identity, profile and locale',
    anchors: ['Profile', 'Contact & locale'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    id: 'security',
    section: 'Account',
    label: 'Account security',
    title: 'Account security',
    sub: 'Passwords, 2FA and login methods',
    anchors: ['Password', 'Two-factor auth', 'Danger zone'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    id: 'sessions',
    section: 'Account',
    label: 'Sessions',
    title: 'Sessions',
    sub: 'Active devices and login history',
    anchors: ['Active sessions', 'Login history'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    id: 'appearance',
    section: 'Preferences',
    label: 'Appearance',
    title: 'Appearance',
    sub: 'Theme, colors and display preferences',
    anchors: ['Theme', 'Accent color', 'Font & density'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
  {
    id: 'notif',
    section: 'Preferences',
    label: 'Notifications',
    title: 'Notifications',
    sub: 'Email and Discord alert preferences',
    anchors: ['Email', 'Discord'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    id: 'conn',
    section: 'Integrations',
    label: 'Connections',
    title: 'Connections',
    sub: 'Linked accounts and API access',
    anchors: ['Connected accounts', 'API access'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
      </svg>
    ),
  },
]

// Group nav items by section
const SECTIONS = Array.from(new Set(NAV.map((n) => n.section)))

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserAccountSettings() {
  const router = useRouter()
  const { user, userEmail } = useAuth()

  const [activePage, setActivePage] = useState<PageId>('security')
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Panels register their save/cancel handlers via these refs
  const saveRef = useRef<(() => Promise<void>) | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const currentNav = NAV.find((n) => n.id === activePage)!

  const handleSave = useCallback(async () => {
    if (!saveRef.current) return
    setSaveError(null)
    setSaving(true)
    try {
      await saveRef.current()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [])

  const handleCancel = useCallback(() => {
    setSaveError(null)
    cancelRef.current?.()
  }, [])

  function switchPage(id: PageId) {
    if (isDirty) handleCancel()
    setActivePage(id)
    setSaveError(null)
  }

  const initial = user?.userName?.replace(/^\./, '').charAt(0).toUpperCase() ?? 'U'

  const panelProps = {
    onDirty: setIsDirty,
    saveRef,
    onCancelRef: cancelRef,
  }

  return (
    <div className={styles.shell}>
      {/* ── Left sidebar ── */}
      <div className={styles.sidebar}>
        <button
          type="button"
          className={styles.logoRow}
          onClick={() => router.push('/home')}
          title="Back to app"
        >
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className={styles.logoText}>Inktide</span>
        </button>

        {SECTIONS.map((section) => (
          <div key={section} className={styles.sidebarSection}>
            <div className={styles.sidebarSectionLabel}>{section}</div>
            {NAV.filter((n) => n.section === section).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.sidebarItem} ${activePage === item.id ? styles.sidebarItemActive : ''}`}
                onClick={() => switchPage(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        ))}

        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarUser}>
            <div className={styles.sidebarAvatar}>
              {user?.pictureUrl
                ? <img src={user.pictureUrl} alt="" className={styles.sidebarAvatarImg} />
                : initial}
            </div>
            <div>
              <div className={styles.sidebarUserName}>{user?.nickname ?? user?.userName ?? 'User'}</div>
              <div className={styles.sidebarUserEmail}>
                {userEmail ? userEmail.slice(0, 20) + (userEmail.length > 20 ? '…' : '') : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.topbarTitle}>{currentNav.title}</div>
            <div className={styles.topbarSub}>{currentNav.sub}</div>
          </div>
          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnSave}
              onClick={() => void handleSave()}
              disabled={!isDirty || saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.pageArea}>
            {saveError && <div className={styles.errorBanner}>{saveError}</div>}

            {activePage === 'profile'     && <ProfilePanel     {...panelProps} />}
            {activePage === 'security'    && <SecurityPanel    {...panelProps} />}
            {activePage === 'sessions'    && <SessionsPanel    {...panelProps} />}
            {activePage === 'appearance'  && <AppearancePanel  {...panelProps} />}
            {activePage === 'notif'       && <NotificationsPanel {...panelProps} />}
            {activePage === 'conn'        && <ConnectionsPanel {...panelProps} />}
          </div>

          {/* Anchor column */}
          <div className={styles.anchorCol}>
            <div className={styles.anchorLabel}>Jump to</div>
            {currentNav.anchors.map((anchor, i) => (
              <div
                key={anchor}
                className={`${styles.anchorItem} ${i === 0 ? styles.anchorItemActive : ''}`}
              >
                {anchor}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
