import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { deleteAccount } from '../../api/me'
import logoSvg from '../../assets/icon.svg'
import caretDownSvg from '../../assets/icons/caret-down.svg'
import {
  IconUser, IconSkills, IconBrain, IconMicrophone, IconPaint,
  IconIntegration, IconScene, IconMemory, IconBackup, IconWorkshop,
  IconSearch, IconObs, IconSettings, IconTrash, IconLogout,
} from './TabIcons'
import styles from './ProfilePage.module.css'
import type { AiCharacter } from '../../domain/character'
import { createDefaultCharacter } from '../../domain/character'
import { useCharacters } from '../../hooks/useCharacters'
import SkillsTab from './tabs/SkillsTab'
import SceneTab from './tabs/SceneTab'
import MemoryTab from './tabs/MemoryTab'
import BrainTab from './tabs/BrainTab'
import VoiceTab from './tabs/VoiceTab'
import ModelTab from './tabs/ModelTab'
import IntegrationTab from './tabs/IntegrationTab'
import BackupTab from './tabs/BackupTab'
import ObsTab from './tabs/ObsTab'
import SceneFullscreen from './tabs/SceneFullscreen'
import CreateCharacterForm from './CreateCharacterForm'
import IdentityCard from './IdentityCard'
import AccountAvatarPanel from './AccountAvatarPanel'
import DeleteAccountModal from './DeleteAccountModal'
import { getBannerAccent, getBannerGradient } from './bannerPresets'

type BotTabId = 'profile' | 'skills' | 'avatars' | 'scene' | 'memory' | 'brain' | 'voice' | 'connection' | 'backup' | 'obs'
type MainWorkspace = 'studio' | 'account' | 'scene'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Tab registry ──────────────────────────────────────────────────────────────

const BOT_TABS: { id: BotTabId; label: string; description: string; icon: ReactNode; accent: string }[] = [
  { id: 'profile',     label: 'Profile',     description: 'Identity, info, connections & account settings',        icon: <IconUser />,        accent: '#ff5252' },
  { id: 'skills',      label: 'Skills',      description: 'Thought process, vision, games & abilities',            icon: <IconSkills />,      accent: '#fbbf24' },
  { id: 'avatars',     label: 'Avatars',     description: 'Live2D, VRM, GLB avatar configuration',                 icon: <IconPaint />,       accent: '#f472b6' },
  { id: 'scene',       label: 'Scene',       description: 'Configure the environment where your character lives',  icon: <IconScene />,       accent: '#c4b5fd' },
  { id: 'memory',      label: 'Memory',      description: 'Storage and organization of memories',                  icon: <IconMemory />,      accent: '#38bdf8' },
  { id: 'brain',       label: 'Brain',       description: 'LLM models & generation parameters',                    icon: <IconBrain />,       accent: '#34d399' },
  { id: 'voice',       label: 'Voice',       description: 'TTS engine, voice selection & tuning',                  icon: <IconMicrophone />,  accent: '#f0abfc' },
  { id: 'connection',  label: 'Connection',  description: 'Configure WebSocket server & third-party integrations', icon: <IconIntegration />, accent: '#818cf8' },
  { id: 'obs',         label: 'OBS',         description: 'Generate a Browser Source URL for OBS Studio',         icon: <IconObs />,         accent: '#e11d48' },
  { id: 'backup',      label: 'Backup',      description: 'Export & restore character configuration',              icon: <IconBackup />,      accent: '#94a3b8' },
]

function renderTabContent(
  tab: BotTabId,
  character: AiCharacter,
  onUpdate: (p: Partial<AiCharacter>) => void,
  onDelete: () => void,
  cardId: string,
): ReactNode {
  const map: Record<BotTabId, ReactNode> = {
    profile:    <IdentityCard character={character} onUpdate={onUpdate} onDelete={onDelete} />,
    skills:     <SkillsTab character={character} onUpdate={onUpdate} />,
    avatars:    <ModelTab character={character} onUpdate={onUpdate} cardId={cardId} />,
    scene:      <SceneTab character={character} onUpdate={onUpdate} cardId={cardId} />,
    memory:     <MemoryTab character={character} onUpdate={onUpdate} />,
    brain:      <BrainTab character={character} onUpdate={onUpdate} />,
    voice:      <VoiceTab character={character} onUpdate={onUpdate} />,
    connection: <IntegrationTab character={character} onUpdate={onUpdate} />,
    obs:        <ObsTab character={character} cardId={cardId} />,
    backup:     <BackupTab character={character} onUpdate={onUpdate} />,
  }
  return map[tab] ?? null
}

// ── Component ─────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userEmail, user, logout, openAccountSettings } = useAuth()

  const {
    cardList, characters, selected,
    loading, loadError,
    isDirty, saveStatus, saveError,
    selectCard, reloadCard, updateCharacter, discardChanges, handleSave,
    addCharacter, removeCharacter,
  } = useCharacters()

  const [botTab, setBotTab] = useState<BotTabId | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [mainWorkspace, setMainWorkspace] = useState<MainWorkspace>('scene')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [accountDeleteError, setAccountDeleteError] = useState<string | null>(null)

  // ── Sidebar display helpers ──
  const sidebarHandle = getSidebarHandle(user?.userName, userEmail)
  const sidebarPrimaryTitle = user?.nickname?.trim() ? user.nickname.trim() : sidebarHandle
  const initial = sidebarPrimaryTitle.replace(/^\./, '').charAt(0).toUpperCase() || 'U'

  // ── Return from CharacterEditPage: reload the focused card ──
  useEffect(() => {
    const focus = (location.state as { focusCardId?: string } | null)?.focusCardId
    if (!focus || !cardList.some((c) => c.id === focus)) return
    let cancelled = false
    ;(async () => {
      setMainWorkspace('scene')
      setIsCreating(false)
      setBotTab(null)
      if (!cancelled) await reloadCard(focus)
      navigate(location.pathname, { replace: true, state: {} })
    })()
    return () => { cancelled = true }
  }, [cardList, location.state, location.pathname, navigate, reloadCard])

  // ── Keyboard: close menus on Escape ──
  useEffect(() => {
    if (!userMenuOpen && !deleteModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setUserMenuOpen(false); setDeleteModalOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [userMenuOpen, deleteModalOpen])

  // ── Card selection (also resets workspace from account view) ──
  const handleSelectCard = useCallback(async (id: string) => {
    setMainWorkspace((w) => w === 'account' ? 'scene' : w)
    setIsCreating(false)
    await selectCard(id)
  }, [selectCard])

  // ── Create flow ──
  const startCreate = () => {
    setMainWorkspace('studio')
    setIsCreating(true)
    setBotTab(null)
  }

  const cancelCreate = () => {
    setMainWorkspace('scene')
    setIsCreating(false)
  }

  // ── User menu actions ──
  const handleLogout = useCallback(() => { setUserMenuOpen(false); logout() }, [logout])
  const handleOpenSettings = useCallback(() => { setUserMenuOpen(false); openAccountSettings() }, [openAccountSettings])
  const handleOpenProfile = useCallback(() => { setUserMenuOpen(false); setMainWorkspace('account') }, [])
  const handleDeleteAccountClick = useCallback(() => {
    setUserMenuOpen(false); setAccountDeleteError(null); setDeleteModalOpen(true)
  }, [])
  const handleDeleteAccountConfirm = useCallback(async () => {
    setAccountDeleteError(null)
    setIsDeletingAccount(true)
    try {
      const result = await deleteAccount()
      setDeleteModalOpen(false)
      if (result.warning) console.warn('[account]', result.warning)
      logout()
      navigate('/')
    } catch (e) {
      setAccountDeleteError(e instanceof Error ? e.message : 'Could not delete account')
    } finally {
      setIsDeletingAccount(false)
    }
  }, [logout, navigate])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button type="button" className={styles.logoRow} onClick={() => navigate('/')}>
            <img src={logoSvg} alt="Chimera" className={styles.logoIcon} />
            <span className={styles.logoText}>Chimera</span>
          </button>
        </div>

        <button type="button" className={styles.newCharacterBtn} onClick={startCreate}>
          <span className={styles.newCharacterIcon}>+</span>
          Create new
        </button>

        <nav className={styles.sidebarNav}>
          <button
            type="button"
            className={`${styles.sidebarNavItem} ${mainWorkspace === 'scene' ? styles.sidebarNavItemActive : ''}`}
            onClick={() => setMainWorkspace('scene')}
          >
            <span className={styles.sidebarNavIcon}><IconScene /></span>
            Sandbox
          </button>
        </nav>

        <div className={styles.sidebarSearch}>
          <span className={styles.sidebarSearchIcon}><IconSearch /></span>
          <input type="text" id="sidebar-search" name="search" placeholder="Search" className={styles.sidebarSearchInput} aria-label="Search" autoComplete="off" />
        </div>

        <div className={styles.botListSection}>
          <div className={styles.botListLabel}>Projects</div>
          <div className={styles.botList}>
            {cardList.map((c) => {
              const bannerIdx = characters.get(c.id)?.appearance.bannerColorIndex ?? 0
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
                      {c.avatar_url ? <img src={c.avatar_url} alt="" className={styles.botAvatarImg} /> : c.name.charAt(0)}
                    </div>
                    {c.is_active && <span className={styles.botStatus} aria-hidden />}
                  </div>
                  <div className={styles.botInfo}>
                    <div className={styles.botNameRow}>
                      <span className={styles.botName}>{c.name}</span>
                      <span
                        className={styles.botTag}
                        style={{ background: `${getBannerAccent(bannerIdx)}26`, color: getBannerAccent(bannerIdx) }}
                      >
                        Bot
                      </span>
                    </div>
                    <div className={styles.botSlug}>/{c.slug}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── User block ── */}
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
                {user?.pictureUrl ? <img src={user.pictureUrl} alt="" className={styles.avatarImg} /> : initial}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userSidebarPrimary} title={sidebarPrimaryTitle}>
                  {truncateSidebarText(sidebarPrimaryTitle, 22)}
                </div>
                {userEmail ? (
                  <div className={styles.userMetaSlot}>
                    <div className={styles.userMetaTrack}>
                      <span className={styles.userMetaLine} title={userEmail}>{truncateSidebarText(userEmail, 26)}</span>
                      <span className={styles.userMetaLine} title={sidebarHandle}>{truncateSidebarText(sidebarHandle, 26)}</span>
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
                <div className={styles.userMenuBackdrop} onClick={() => setUserMenuOpen(false)} aria-hidden />
                <div className={styles.userMenu} role="menu" aria-label="Account menu">
                  <div className={styles.userMenuSectionLabel}>Account</div>
                  <button type="button" className={styles.userMenuItem} role="menuitem" onClick={handleOpenProfile}>
                    <span className={styles.userMenuItemIcon} aria-hidden><IconUser /></span>
                    Profile
                  </button>
                  <button type="button" className={styles.userMenuItem} role="menuitem" onClick={handleOpenSettings}>
                    <span className={styles.userMenuItemIcon} aria-hidden><IconSettings /></span>
                    Settings
                  </button>
                  <button type="button" className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`} role="menuitem" onClick={handleDeleteAccountClick}>
                    <span className={styles.userMenuItemIcon} aria-hidden><IconTrash /></span>
                    Delete account
                  </button>
                  <div className={styles.userMenuDivider} />
                  <button type="button" className={`${styles.userMenuItem} ${styles.userMenuItemLogout}`} role="menuitem" onClick={handleLogout}>
                    <span className={styles.userMenuItemIcon} aria-hidden><IconLogout /></span>
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className={`${styles.main} ${mainWorkspace === 'scene' ? styles.mainScene : ''}`}>
        {mainWorkspace === 'scene' ? (
          selected ? (
            <SceneFullscreen
              character={selected}
              cardId={selected.id}
              onOpenSettings={() => { setMainWorkspace('studio'); setBotTab(null) }}
            />
          ) : loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <div className={styles.loadingText}>Loading characters...</div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎬</div>
              <div className={styles.emptyTitle}>No character selected</div>
              <p className={styles.emptyText}>Select a character from the sidebar to view its scene.</p>
            </div>
          )
        ) : loading && mainWorkspace !== 'account' ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <div className={styles.loadingText}>Loading characters...</div>
          </div>
        ) : mainWorkspace === 'account' ? (
          <AccountAvatarPanel
            onBack={() => setMainWorkspace('scene')}
            projects={cardList}
            characters={characters}
            onSelectProject={(id) => { setMainWorkspace('scene'); void handleSelectCard(id) }}
          />
        ) : loadError ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚠</div>
            <div className={styles.emptyTitle}>Failed to load</div>
            <p className={styles.emptyText}>{loadError}</p>
          </div>
        ) : isCreating ? (
          <CreateCharacterForm
            onSave={(c) => void addCharacter(c)}
            onCancel={cancelCreate}
            defaultValues={createDefaultCharacter()}
          />
        ) : selected ? (
          <>
            <div className={styles.pageHeader}>
              <div className={styles.pageHeaderRow}>
                <div>
                  {botTab !== null && (
                    <button type="button" className={styles.backBtn} onClick={() => setBotTab(null)}>
                      <span className={styles.backBtnArrow} aria-hidden>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      Back to sections
                    </button>
                  )}
                </div>
                <div className={styles.pageHeaderActions}>
                  <span className={`${styles.statusBadge} ${selected.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                    {selected.isActive ? (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                        <circle cx="4" cy="4" r="3" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                        <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                    {selected.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {saveStatus === 'error' && saveError && (
              <div className={styles.errorBanner}>⚠ {saveError}</div>
            )}

            {botTab === null ? (
              <div className={styles.tabCardsGrid}>
                {BOT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={styles.tabCard}
                    onClick={() => setBotTab(t.id)}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
                      e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
                    }}
                    style={{ '--tab-accent': t.accent } as React.CSSProperties}
                  >
                    <div className={styles.tabCardIcon}>{t.icon}</div>
                    <div className={styles.tabCardBody}>
                      <div className={styles.tabCardLabel}>{t.label}</div>
                      <div className={styles.tabCardDesc}>{t.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.panel}>
                <h2 className={styles.sectionHeading}>
                  {BOT_TABS.find((t) => t.id === botTab)?.label}
                </h2>
                {renderTabContent(
                  botTab,
                  selected,
                  (p) => updateCharacter(selected.id, p),
                  () => void removeCharacter(selected.id),
                  selected.id,
                )}
              </div>
            )}

            {isDirty && (
              <div className={styles.saveBar}>
                <span className={`${styles.saveBarText} ${
                  saveStatus === 'error'  ? styles.saveBarTextError :
                  saveStatus === 'saved'  ? styles.saveBarTextSuccess : ''
                }`}>
                  {saveStatus === 'saving' ? 'Saving...' :
                   saveStatus === 'saved'  ? 'Changes saved' :
                   saveStatus === 'error'  ? (saveError ?? 'Save failed') :
                   'You have unsaved changes'}
                </span>
                <button type="button" className={styles.btnDiscard} onClick={discardChanges} disabled={saveStatus === 'saving'}>
                  Discard
                </button>
                <button type="button" className={styles.btnSave} onClick={() => void handleSave()} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
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
              + Create new
            </button>
          </div>
        )}
      </main>

      {/* ── Delete account modal ── */}
      {deleteModalOpen && (
        <DeleteAccountModal
          isDeleting={isDeletingAccount}
          error={accountDeleteError}
          onClose={() => { setDeleteModalOpen(false); setAccountDeleteError(null) }}
          onConfirm={() => void handleDeleteAccountConfirm()}
        />
      )}
    </div>
  )
}

export default ProfilePage
