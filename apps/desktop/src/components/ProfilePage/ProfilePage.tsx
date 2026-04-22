import { useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  getCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  getCatalogLlmModels,
  type AiCardListItem,
  type LlmModelResponse,
} from '../../api/soul'
import { deleteAccount } from '../../api/me'
import logoSvg from '../../assets/app/icon.svg'
import caretDownSvg from '../../assets/icons/caret-down.svg'
import { IconUser, IconSkills, IconBrain, IconMicrophone, IconPaint, IconIntegration, IconScene, IconMemory, IconBackup, IconWorkshop, IconSearch } from './TabIcons'
import styles from './ProfilePage.module.css'
import type { AiCharacter } from './types'
import {
  createDefaultCharacter,
  apiResponseToCharacter,
  characterToUpdateRequest,
  characterToCreateRequest,
} from './types'
import SkillsTab from './tabs/SkillsTab'
import SceneTab from './tabs/SceneTab'
import MemoryTab from './tabs/MemoryTab'
import BrainTab from './tabs/BrainTab'
import VoiceTab from './tabs/VoiceTab'
import ModelTab from './tabs/ModelTab'
import IntegrationTab from './tabs/IntegrationTab'
import BackupTab from './tabs/BackupTab'
import CreateCharacterForm from './CreateCharacterForm'
import IdentityCard from './IdentityCard'
import AccountAvatarPanel from './AccountAvatarPanel'
import { getBannerAccent, getBannerGradient } from './bannerPresets'

type BotTabId = 'profile' | 'skills' | 'avatars' | 'scene' | 'memory' | 'brain' | 'voice' | 'connection' | 'backup'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type MainWorkspace = 'studio' | 'account'

/** Sidebar: username on top (Keycloak preferred_username); if missing or equals email, use local part of email. */
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

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
      />
    </svg>
  )
}

// BOT_TABS is built inside the component via useMemo to support i18n

function renderTabContent(
  tab: BotTabId,
  character: AiCharacter,
  onUpdate: (p: Partial<AiCharacter>) => void,
  onDelete: () => void,
  onNavigateTab: (t: string) => void,
): ReactNode {
  const tabComponents: Record<BotTabId, ReactNode> = {
    profile: <IdentityCard character={character} onUpdate={onUpdate} onDelete={onDelete} onNavigateTab={onNavigateTab} />,
    skills: <SkillsTab character={character} onUpdate={onUpdate} />,
    avatars: <ModelTab character={character} onUpdate={onUpdate} />,
    scene: <SceneTab character={character} onUpdate={onUpdate} />,
    memory: <MemoryTab character={character} onUpdate={onUpdate} />,
    brain: <BrainTab character={character} onUpdate={onUpdate} />,
    voice: <VoiceTab character={character} onUpdate={onUpdate} />,
    connection: <IntegrationTab character={character} onUpdate={onUpdate} />,
    backup: <BackupTab character={character} onUpdate={onUpdate} />,
  }
  return tabComponents[tab] ?? null
}

const ProfilePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userEmail, user, isLoggedIn, logout, openAccountSettings } = useAuth()
  const { t } = useTranslation(['common', 'profile'])

  const BOT_TABS = useMemo((): { id: BotTabId; label: string; description: string; icon: ReactNode; accent: string }[] => [
    { id: 'profile',    label: t('profile:tabs.profile.label'),    description: t('profile:tabs.profile.desc'),    icon: <IconUser />,        accent: '#ff5252' },
    { id: 'skills',     label: t('profile:tabs.skills.label'),     description: t('profile:tabs.skills.desc'),     icon: <IconSkills />,      accent: '#fbbf24' },
    { id: 'avatars',    label: t('profile:tabs.avatars.label'),    description: t('profile:tabs.avatars.desc'),    icon: <IconPaint />,       accent: '#f472b6' },
    { id: 'scene',      label: t('profile:tabs.scene.label'),      description: t('profile:tabs.scene.desc'),      icon: <IconScene />,       accent: '#c4b5fd' },
    { id: 'memory',     label: t('profile:tabs.memory.label'),     description: t('profile:tabs.memory.desc'),     icon: <IconMemory />,      accent: '#38bdf8' },
    { id: 'brain',      label: t('profile:tabs.brain.label'),      description: t('profile:tabs.brain.desc'),      icon: <IconBrain />,       accent: '#34d399' },
    { id: 'voice',      label: t('profile:tabs.voice.label'),      description: t('profile:tabs.voice.desc'),      icon: <IconMicrophone />,  accent: '#f0abfc' },
    { id: 'connection', label: t('profile:tabs.connection.label'), description: t('profile:tabs.connection.desc'), icon: <IconIntegration />, accent: '#818cf8' },
    { id: 'backup',     label: t('profile:tabs.backup.label'),     description: t('profile:tabs.backup.desc'),     icon: <IconBackup />,      accent: '#94a3b8' },
  ], [t])

  const [cardList, setCardList] = useState<AiCardListItem[]>([])
  const [characters, setCharacters] = useState<Map<string, AiCharacter>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [botTab, setBotTab] = useState<BotTabId | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [accountDeleteError, setAccountDeleteError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [llmModels, setLlmModels] = useState<LlmModelResponse[]>([])
  const [mainWorkspace, setMainWorkspace] = useState<MainWorkspace>('studio')

  const snapshotRef = useRef<AiCharacter | null>(null)

  const sidebarHandle = getSidebarHandle(user?.userName, userEmail)
  const sidebarPrimaryTitle = user?.nickname?.trim() ? user.nickname.trim() : sidebarHandle
  const initial = sidebarPrimaryTitle.replace(/^\./, '').charAt(0).toUpperCase() || 'U'
  const selected = selectedId ? characters.get(selectedId) ?? null : null

  // ── Load card list on mount ──
  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [cards, models] = await Promise.all([getCards(), getCatalogLlmModels()])
        if (cancelled) return
        setCardList(cards)
        setLlmModels(models)
        if (cards.length > 0) {
          const first = cards[0]
          setSelectedId(first.id)
          // Load full card for every bot so sidebar colors (bannerColorIndex) match before any click.
          // Previously only the first card was loaded; others fell back to banner index 0.
          const results = await Promise.allSettled(cards.map((card) => getCard(card.id)))
          const next = new Map<string, AiCharacter>()
          for (let i = 0; i < cards.length; i++) {
            const r = results[i]
            if (r.status === 'fulfilled') {
              next.set(cards[i].id, apiResponseToCharacter(r.value))
            }
          }
          setCharacters(next)
          const firstChar = next.get(first.id)
          if (firstChar) snapshotRef.current = firstChar
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps -- initial fetch only on login

  // Return from character edit page: select card and reload full data
  useEffect(() => {
    const focus = (location.state as { focusCardId?: string } | null)?.focusCardId
    if (!focus || cardList.length === 0) return
    if (!cardList.some((c) => c.id === focus)) return
    let cancelled = false
    ;(async () => {
      setMainWorkspace('studio')
      setSelectedId(focus)
      setIsCreating(false)
      setIsDirty(false)
      setSaveStatus('idle')
      setSaveError(null)
      setBotTab(null)
      try {
        const response = await getCard(focus)
        if (cancelled) return
        const char = apiResponseToCharacter(response)
        setCharacters((prev) => new Map(prev).set(focus, char))
        snapshotRef.current = char
      } catch {
        /* ignore */
      }
      navigate(location.pathname, { replace: true, state: {} })
    })()
    return () => {
      cancelled = true
    }
  }, [cardList, location.state, location.pathname, navigate])

  // ── Load full card data ──
  const loadFullCard = useCallback(async (id: string) => {
    try {
      const response = await getCard(id)
      const char = apiResponseToCharacter(response)
      setCharacters((prev) => new Map(prev).set(id, char))
      snapshotRef.current = char
    } catch {
      // card might have been deleted
    }
  }, [])

  const selectCard = useCallback(async (id: string) => {
    setMainWorkspace('studio')
    setSelectedId(id)
    setIsCreating(false)
    setIsDirty(false)
    setSaveStatus('idle')
    setSaveError(null)
    if (!characters.has(id)) {
      await loadFullCard(id)
    } else {
      snapshotRef.current = characters.get(id)!
    }
  }, [characters, loadFullCard])

  // ── Update local state (mark dirty) ──
  const updateCharacter = useCallback((id: string, patch: Partial<AiCharacter>) => {
    const avatarOnly =
      Object.keys(patch).length === 1 && Object.prototype.hasOwnProperty.call(patch, 'avatarUrl')

    setCharacters((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const merged = { ...existing, ...patch }
      const next = new Map(prev)
      next.set(id, merged)
      if (patch.avatarUrl !== undefined) {
        snapshotRef.current = merged
      }
      return next
    })

    if (patch.avatarUrl !== undefined) {
      setCardList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, avatar_url: patch.avatarUrl ?? null } : c)),
      )
    }

    if (!avatarOnly) {
      setIsDirty(true)
      setSaveStatus('idle')
    }
  }, [])

  // ── Discard changes ──
  const discardChanges = useCallback(() => {
    if (selectedId && snapshotRef.current) {
      setCharacters((prev) => new Map(prev).set(selectedId, snapshotRef.current!))
    }
    setIsDirty(false)
    setSaveStatus('idle')
    setSaveError(null)
  }, [selectedId])

  // ── Save to backend ──
  const handleSave = useCallback(async () => {
    if (!selectedId || !selected) return
    setSaveStatus('saving')
    setSaveError(null)
    try {
      const response = await updateCard(selectedId, characterToUpdateRequest(selected))
      const updated = apiResponseToCharacter(response)
      setCharacters((prev) => new Map(prev).set(selectedId, updated))
      snapshotRef.current = updated
      setIsDirty(false)
      setSaveStatus('saved')
      setCardList((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, name: updated.name, slug: updated.slug, personality: updated.personality, is_active: updated.isActive }
            : c
        )
      )
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    }
  }, [selectedId, selected])

  // ── Create character ──
  const addCharacter = useCallback(async (c: Omit<AiCharacter, 'id'>) => {
    const defaultLlm = llmModels[0]?.id
    if (!defaultLlm) {
      setSaveError('No LLM models available. Please seed the catalog first.')
      setSaveStatus('error')
      return
    }
    setSaveStatus('saving')
    try {
      const response = await createCard(characterToCreateRequest(c, defaultLlm))
      const char = apiResponseToCharacter(response)
      setCharacters((prev) => new Map(prev).set(char.id, char))
      setCardList((prev) => [
        ...prev,
        {
          id: char.id,
          name: char.name,
          slug: char.slug,
          avatar_url: null,
          personality: char.personality,
          llm_model: null,
          is_active: char.isActive,
          updated_at: new Date().toISOString(),
        },
      ])
      snapshotRef.current = char
      setSelectedId(char.id)
      setIsCreating(false)
      setIsDirty(false)
      setSaveStatus('idle')
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Create failed')
    }
  }, [llmModels])

  // ── Delete character ──
  const removeCharacter = useCallback(async (id: string) => {
    try {
      await deleteCard(id)
      setCardList((prev) => prev.filter((c) => c.id !== id))
      setCharacters((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
      setSelectedId((sid) => {
        if (sid !== id) return sid
        const remaining = cardList.filter((c) => c.id !== id)
        return remaining[0]?.id ?? null
      })
      setIsDirty(false)
      setSaveStatus('idle')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Delete failed')
      setSaveStatus('error')
    }
  }, [cardList])

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false)
    logout()
  }, [logout])

  const handleOpenSettings = useCallback(() => {
    setUserMenuOpen(false)
    openAccountSettings()
  }, [openAccountSettings])

  const handleOpenProfile = useCallback(() => {
    setUserMenuOpen(false)
    setMainWorkspace('account')
  }, [])

  const handleDeleteAccountClick = useCallback(() => {
    setUserMenuOpen(false)
    setAccountDeleteError(null)
    setDeleteAccountModalOpen(true)
  }, [])

  const handleDeleteAccountConfirm = useCallback(async () => {
    setAccountDeleteError(null)
    setIsDeletingAccount(true)
    try {
      const result = await deleteAccount()
      setDeleteAccountModalOpen(false)
      if (result.warning) {
        console.warn('[account]', result.warning)
      }
      logout()
      navigate('/')
    } catch (e) {
      setAccountDeleteError(e instanceof Error ? e.message : 'Could not delete account')
    } finally {
      setIsDeletingAccount(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    if (!userMenuOpen && !deleteAccountModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        setDeleteAccountModalOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [userMenuOpen, deleteAccountModalOpen])

  const startCreate = () => {
    setMainWorkspace('studio')
    setIsCreating(true)
    setSelectedId(null)
    setIsDirty(false)
    setSaveStatus('idle')
  }

  const cancelCreate = () => {
    setMainWorkspace('studio')
    setIsCreating(false)
    setSelectedId(cardList[0]?.id ?? null)
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
          {t('common:sidebar.createNew')}
        </button>

        <nav className={styles.sidebarNav}>
          <button type="button" className={styles.sidebarNavItem}>
            <span className={styles.sidebarNavIcon}><IconWorkshop /></span>
            Workshop
          </button>
        </nav>

        <div className={styles.sidebarSearch}>
          <span className={styles.sidebarSearchIcon}><IconSearch /></span>
          <input type="text" id="sidebar-search" name="search" placeholder={t('common:sidebar.search')} className={styles.sidebarSearchInput} aria-label={t('common:sidebar.search')} autoComplete="off" />
        </div>

        <div className={styles.botListSection}>
          <div className={styles.botListLabel}>
            {t('common:sidebar.projects')}
          </div>
          <div className={styles.botList}>
            {cardList.map((c) => {
              const char = characters.get(c.id)
              const bannerIdx = char?.bannerColorIndex ?? 0
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.botRow} ${selectedId === c.id ? styles.botRowActive : ''}`}
                  onClick={() => selectCard(c.id)}
                >
                  <div className={styles.botAvatar}>
                    <div
                      className={styles.botAvatarInner}
                      style={c.avatar_url ? undefined : { background: getBannerGradient(bannerIdx) }}
                    >
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" className={styles.botAvatarImg} />
                      ) : (
                        c.name.charAt(0)
                      )}
                    </div>
                    {c.is_active && <span className={styles.botStatus} aria-hidden />}
                  </div>
                  <div className={styles.botInfo}>
                    <div className={styles.botNameRow}>
                      <span className={styles.botName}>{c.name}</span>
                      <span
                        className={styles.botTag}
                        style={{
                          background: `${getBannerAccent(bannerIdx)}26`,
                          color: getBannerAccent(bannerIdx),
                        }}
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
                {user?.pictureUrl ? (
                  <img src={user.pictureUrl} alt="" className={styles.avatarImg} />
                ) : (
                  initial
                )}
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
                <div className={styles.userMenu} role="menu" aria-label="Account menu">
                  <div className={styles.userMenuSectionLabel}>{t('common:sidebar.account')}</div>
                  <button
                    type="button"
                    className={styles.userMenuItem}
                    role="menuitem"
                    onClick={handleOpenProfile}
                  >
                    <span className={styles.userMenuItemIcon} aria-hidden>
                      <IconUser />
                    </span>
                    {t('common:sidebar.profile')}
                  </button>
                  <button
                    type="button"
                    className={styles.userMenuItem}
                    role="menuitem"
                    onClick={handleOpenSettings}
                  >
                    <span className={styles.userMenuItemIcon} aria-hidden>
                      <SettingsIcon />
                    </span>
                    {t('common:sidebar.settings')}
                  </button>
                  <button
                    type="button"
                    className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`}
                    role="menuitem"
                    onClick={handleDeleteAccountClick}
                  >
                    <span className={styles.userMenuItemIcon} aria-hidden>
                      <TrashIcon />
                    </span>
                    {t('common:sidebar.deleteAccount')}
                  </button>
                  <div className={styles.userMenuDivider} />
                  <button
                    type="button"
                    className={`${styles.userMenuItem} ${styles.userMenuItemLogout}`}
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <span className={styles.userMenuItemIcon} aria-hidden>
                      <LogoutIcon />
                    </span>
                    {t('common:sidebar.logOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        {loading && mainWorkspace !== 'account' ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <div className={styles.loadingText}>{t('common:emptyState.loadingCharacters')}</div>
          </div>
        ) : mainWorkspace === 'account' ? (
          <AccountAvatarPanel
            onBack={() => setMainWorkspace('studio')}
            projects={cardList}
            characters={characters}
            onSelectProject={(id) => {
              setMainWorkspace('studio')
              void selectCard(id)
            }}
          />
        ) : loadError ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚠</div>
            <div className={styles.emptyTitle}>{t('common:emptyState.failedToLoad')}</div>
            <p className={styles.emptyText}>{loadError}</p>
          </div>
        ) : isCreating ? (
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
                    title={selected.isActive ? t('common:badge.active') : t('common:badge.inactive')}
                  />
                </div>
              </div>
            </div>

            {saveStatus === 'error' && saveError && (
              <div className={styles.errorBanner}>⚠ {saveError}</div>
            )}

            {botTab === null ? (
              <div className={styles.tabCardsGrid}>
                {BOT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={styles.tabCard}
                    onClick={() => setBotTab(tab.id)}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
                      e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
                    }}
                    style={{ '--tab-accent': tab.accent } as React.CSSProperties}
                  >
                    <div className={styles.tabCardIcon}>{tab.icon}</div>
                    <div className={styles.tabCardBody}>
                      <div className={styles.tabCardLabel}>{tab.label}</div>
                      <div className={styles.tabCardDesc}>{tab.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.panel}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setBotTab(null)}
                >
                  {t('common:emptyState.backToSections')}
                </button>

                <h2 className={styles.sectionHeading}>
                  {BOT_TABS.find((tab) => tab.id === botTab)?.label}
                </h2>

                {renderTabContent(botTab, selected, (p) => updateCharacter(selected.id, p), () => removeCharacter(selected.id), (tab) => setBotTab(tab as BotTabId))}
              </div>
            )}

            {isDirty && (
              <div className={styles.saveBar}>
                <span className={`${styles.saveBarText} ${
                  saveStatus === 'error' ? styles.saveBarTextError :
                  saveStatus === 'saved' ? styles.saveBarTextSuccess : ''
                }`}>
                  {saveStatus === 'saving' ? t('common:saveBar.saving') :
                   saveStatus === 'saved' ? t('common:saveBar.saved') :
                   saveStatus === 'error' ? (saveError ?? t('common:saveBar.failed')) :
                   t('common:saveBar.unsaved')}
                </span>
                <button
                  type="button"
                  className={styles.btnDiscard}
                  onClick={discardChanges}
                  disabled={saveStatus === 'saving'}
                >
                  {t('common:saveBar.discard')}
                </button>
                <button
                  type="button"
                  className={styles.btnSave}
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? t('common:saveBar.saving') : t('common:saveBar.save')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🤖</div>
            <div className={styles.emptyTitle}>{t('common:emptyState.selectCharacter')}</div>
            <p className={styles.emptyText}>
              {t('common:emptyState.selectCharacterDesc')}
            </p>
            <button type="button" className={styles.btnPrimary} onClick={startCreate}>
              {t('common:emptyState.createNew')}
            </button>
          </div>
        )}
      </main>

      {deleteAccountModalOpen && (
        <div
          className={styles.accountModalOverlay}
          role="presentation"
          onClick={() => setDeleteAccountModalOpen(false)}
        >
          <div
            className={styles.accountModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-account-title" className={styles.accountModalTitle}>
              Delete account
            </h2>
            <p className={styles.accountModalText}>
              This removes your characters and related data from Chimera. If the server is configured
              for it, your login identity is removed from Keycloak as well.
            </p>
            {accountDeleteError && (
              <p className={styles.accountModalError} role="alert">
                {accountDeleteError}
              </p>
            )}
            <div className={styles.accountModalActions}>
              <button
                type="button"
                className={styles.accountModalBtnSecondary}
                onClick={() => { setDeleteAccountModalOpen(false); setAccountDeleteError(null) }}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.accountModalBtnDanger}
                onClick={() => void handleDeleteAccountConfirm()}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
