import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'
import { useAuth } from '../../context/AuthContext'
import logoSvg from '../../assets/icon.svg'
import styles from './ProfilePage.module.css'
import CharactersTab from './tabs/CharactersTab'
import PromptsTab from './tabs/PromptsTab'
import BehaviorTab from './tabs/BehaviorTab'
import VoiceTab from './tabs/VoiceTab'
import AppearanceTab from './tabs/AppearanceTab'

type TabId = 'characters' | 'prompts' | 'behavior' | 'voice' | 'appearance'

interface NavItem {
  id: TabId
  label: string
  icon: string
}

const AI_TABS: NavItem[] = [
  { id: 'characters', label: 'Characters', icon: '🤖' },
  { id: 'prompts', label: 'Prompts', icon: '💬' },
  { id: 'behavior', label: 'Behavior', icon: '⚡' },
  { id: 'voice', label: 'Voice', icon: '🎙️' },
  { id: 'appearance', label: 'Appearance', icon: '✨' },
]

const TAB_META: Record<TabId, { title: string; subtitle: string }> = {
  characters: { title: 'Characters', subtitle: 'Create and manage your AI companions' },
  prompts: { title: 'Prompts', subtitle: 'Define how your AI thinks and responds' },
  behavior: { title: 'Behavior', subtitle: 'Fine-tune response timing, moderation and language' },
  voice: { title: 'Voice', subtitle: 'Choose a voice and configure TTS settings' },
  appearance: { title: 'Appearance', subtitle: 'Customize your AI\'s visual identity' },
}

const ProfilePage = () => {
  const navigate = useNavigate()
  const { keycloak } = useKeycloak()
  const { userEmail, user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('characters')

  const displayName = user?.userName ?? userEmail ?? 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const meta = TAB_META[activeTab]

  const handleLogout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin })
  }, [keycloak])

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button type="button" className={styles.logoRow} onClick={() => navigate('/')}>
            <img src={logoSvg} alt="Chimera" className={styles.logoIcon} />
            <span className={styles.logoText}>Chimera</span>
          </button>
          <div className={styles.userBlock}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userRole}>{user?.role ?? 'user'}</div>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionLabel}>AI Settings</div>
            {AI_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.navIcon}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/')}>
            <span className={styles.navIcon}>←</span>
            Back to home
          </button>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.navIcon}>⏻</span>
            Log out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{meta.title}</h1>
          <p className={styles.pageSubtitle}>{meta.subtitle}</p>
        </div>

        <div className={styles.panel}>
          {activeTab === 'characters' && <CharactersTab />}
          {activeTab === 'prompts' && <PromptsTab />}
          {activeTab === 'behavior' && <BehaviorTab />}
          {activeTab === 'voice' && <VoiceTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
