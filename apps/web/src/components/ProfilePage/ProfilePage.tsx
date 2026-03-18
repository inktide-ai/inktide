import { useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'
import { useAuth } from '../../context/AuthContext'
import logoSvg from '../../assets/icon.svg'
import { IconUser, IconMessage, IconBrain, IconMicrophone, IconPaint, IconIntegration } from './TabIcons'
import styles from './ProfilePage.module.css'
import type { AiCharacter } from './types'
import { createDefaultCharacter } from './types'
import PromptsTab from './tabs/PromptsTab'
import BehaviorTab from './tabs/BehaviorTab'
import VoiceTab from './tabs/VoiceTab'
import ModelTab from './tabs/ModelTab'
import IntegrationTab from './tabs/IntegrationTab'
import CreateCharacterForm from './CreateCharacterForm'
import IdentityCard from './IdentityCard'
import { getBannerAccent, getBannerGradient } from './bannerPresets'

type BotTabId = 'identity' | 'prompts' | 'behavior' | 'voice' | 'model' | 'integration'

const BOT_TABS: { id: BotTabId; label: string; icon: ReactNode }[] = [
  { id: 'identity', label: 'Identity', icon: <IconUser /> },
  { id: 'prompts', label: 'Prompts', icon: <IconMessage /> },
  { id: 'behavior', label: 'Behavior', icon: <IconBrain /> },
  { id: 'voice', label: 'Voice', icon: <IconMicrophone /> },
  { id: 'model', label: 'Model', icon: <IconPaint /> },
  { id: 'integration', label: 'Integration', icon: <IconIntegration /> },
]

const DEMO_CHARACTERS: AiCharacter[] = [
  {
    id: '1',
    name: 'Luna',
    bannerColorIndex: 0,
    slug: 'luna',
    personality: 'Friendly and witty AI companion who loves gaming culture and memes',
    keyPhrases: 'hey chat, poggers, gg',
    modelType: 'none',
    isActive: true,
    systemPrompt:
      'You are a friendly AI companion on a live stream. You interact with chat, react to events, and entertain viewers.',
    responseDelayMs: 1500,
    maxResponseLength: 400,
    autoModerate: true,
    language: 'en',
    typingSimulation: true,
    temperature: 0.7,
    maxTokens: 512,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
    memoryEnabled: true,
    maxMemories: 100,
    retentionDays: 30,
    importanceThreshold: 0.5,
    donkeyEnabled: false,
    idleTimeoutSeconds: 120,
    minIntervalSeconds: 60,
    mood: 'neutral',
    ttsEnabled: true,
    useCustomVoice: false,
    selectedVoiceId: '1',
    customVoiceFile: null,
    speed: 1.0,
    pitch: 1.0,
    stability: 0.5,
    similarityBoost: 0.75,
  },
]

const ProfilePage = () => {
  const navigate = useNavigate()
  const { keycloak } = useKeycloak()
  const { userEmail, user } = useAuth()
  const [characters, setCharacters] = useState<AiCharacter[]>(DEMO_CHARACTERS)
  const [selectedId, setSelectedId] = useState<string | null>('1')
  const [botTab, setBotTab] = useState<BotTabId>('identity')
  const [isCreating, setIsCreating] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const displayName = user?.userName ?? userEmail ?? 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const selected = characters.find((c) => c.id === selectedId)

  const updateCharacter = useCallback((id: string, patch: Partial<AiCharacter>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    )
  }, [])

  const addCharacter = useCallback((c: Omit<AiCharacter, 'id'>) => {
    const id = crypto.randomUUID()
    const slug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-')
    setCharacters((prev) => [...prev, { ...c, id, slug }])
    setSelectedId(id)
    setIsCreating(false)
  }, [])

  const removeCharacter = useCallback((id: string) => {
    setCharacters((prev) => {
      const next = prev.filter((c) => c.id !== id)
      setSelectedId((sid) => (id === sid ? (next[0]?.id ?? null) : sid))
      return next
    })
  }, [])

  const toggleActive = useCallback((id: string) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    )
  }, [])

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false)
    keycloak.logout({ redirectUri: window.location.origin })
  }, [keycloak])

  const startCreate = () => {
    setIsCreating(true)
    setSelectedId(null)
  }

  const cancelCreate = () => {
    setIsCreating(false)
    setSelectedId(characters[0]?.id ?? null)
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button type="button" className={styles.logoRow} onClick={() => navigate('/')}>
            <img src={logoSvg} alt="Chimera" className={styles.logoIcon} />
            <span className={styles.logoText}>Chimera</span>
          </button>
        </div>

        <button type="button" className={styles.newCharacterBtn} onClick={startCreate}>
          <span className={styles.newCharacterIcon}>+</span>
          New Character
        </button>

        <div className={styles.botListSection}>
          <div className={styles.botListLabel}>
            Bots — {characters.length}
          </div>
          <div className={styles.botList}>
            {characters.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.botRow} ${selectedId === c.id ? styles.botRowActive : ''}`}
                onClick={() => {
                  setSelectedId(c.id)
                  setIsCreating(false)
                }}
              >
                <div
                  className={styles.botAvatar}
                  style={{ background: getBannerGradient(c.bannerColorIndex ?? 0) }}
                >
                  {c.name.charAt(0)}
                  {c.isActive && <span className={styles.botStatus} />}
                </div>
                <div className={styles.botInfo}>
                  <div className={styles.botNameRow}>
                    <span className={styles.botName}>{c.name}</span>
                    <span
                      className={styles.botTag}
                      style={{
                        background: `${getBannerAccent(c.bannerColorIndex ?? 0)}26`,
                        color: getBannerAccent(c.bannerColorIndex ?? 0),
                      }}
                    >
                      BOT
                    </span>
                  </div>
                  <div className={styles.botSlug}>/{c.slug}</div>
                </div>
              </button>
            ))}
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
              <div className={styles.avatar}>{initial}</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{displayName}</div>
                <div className={styles.userRole}>{user?.role ?? 'user'}</div>
              </div>
              <span className={styles.userCaret}>▾</span>
            </button>
            {userMenuOpen && (
              <>
                <div
                  className={styles.userMenuBackdrop}
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden
                />
                <div className={styles.userMenu}>
                  <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                    <span className={styles.navIcon}>⏻</span>
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        {isCreating ? (
          <CreateCharacterForm
            onSave={addCharacter}
            onCancel={cancelCreate}
            defaultValues={createDefaultCharacter()}
          />
        ) : selected ? (
          <>
            <div className={styles.pageHeader}>
              <div className={styles.pageHeaderRow}>
                <div>
                  <h1 className={styles.pageTitle}>{selected.name}</h1>
                  <p className={styles.pageSubtitle}>/{selected.slug}</p>
                </div>
                <div className={styles.pageHeaderActions}>
                  <div
                    className={styles.statusDot}
                    style={{ background: selected.isActive ? '#22c55e' : 'var(--text-muted)' }}
                    title={selected.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>
            </div>

            <nav className={styles.botTabs}>
              {BOT_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.botTabItem} ${botTab === t.id ? styles.botTabItemActive : ''}`}
                  onClick={() => setBotTab(t.id)}
                >
                  <span className={styles.botTabIcon}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>

            <div className={styles.panel}>
              {botTab === 'identity' && (
                <IdentityCard
                  character={selected}
                  onUpdate={(p) => updateCharacter(selected.id, p)}
                />
              )}
              {botTab === 'prompts' && (
                <PromptsTab character={selected} onUpdate={(p) => updateCharacter(selected.id, p)} />
              )}
              {botTab === 'behavior' && (
                <BehaviorTab character={selected} onUpdate={(p) => updateCharacter(selected.id, p)} />
              )}
              {botTab === 'voice' && (
                <VoiceTab character={selected} onUpdate={(p) => updateCharacter(selected.id, p)} />
              )}
              {botTab === 'model' && (
                <ModelTab character={selected} onUpdate={(p) => updateCharacter(selected.id, p)} />
              )}
              {botTab === 'integration' && (
                <IntegrationTab character={selected} onUpdate={(p: Partial<AiCharacter>) => updateCharacter(selected.id, p)} />
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🤖</div>
            <div className={styles.emptyTitle}>Select a character</div>
            <p className={styles.emptyText}>
              Choose a bot from the sidebar or create a new one to configure its identity, prompts,
              behavior, voice and model.
            </p>
            <button type="button" className={styles.btnPrimary} onClick={startCreate}>
              + New Character
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProfilePage
