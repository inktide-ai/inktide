'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import Keycloak from 'keycloak-js'
import type { IAuthTokenParser } from '@/types/IAuthTokenParser'
import type { ILocaleSync } from '@/types/ILocaleSync'
import type { IAvatarService } from '@/types/IAvatarService'
import { writeStoredNickname } from '../utils/profileStorage'
import { HOME_ROUTE } from '@/lib/routes'

// ── Domain types ──────────────────────────────────────────────────────────────

export interface UserInfo {
  userId: string
  userName: string
  role: string
  pictureUrl?: string | null
  nickname?: string | null
}

interface AuthState {
  isLoggedIn: boolean
  userEmail: string | null
  user: UserInfo | null
  isInitialized: boolean
}

interface AuthContextValue extends AuthState {
  logout: () => void
  loginWithKeycloak: () => void
  registerWithKeycloak: () => void
  openAccountSettings: () => void
  refreshSession: () => Promise<void>
  setNickname: (value: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const LOGGED_OUT: AuthState = { isLoggedIn: false, userEmail: null, user: null, isInitialized: true }

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  keycloak: Keycloak
  tokenParser: IAuthTokenParser
  localeSync: ILocaleSync
  avatarService: IAvatarService
  children: ReactNode
}

/**
 * SRP: только React-state + wiring событий Keycloak.
 * Делегирует:
 *   - парсинг токена        → IAuthTokenParser (KeycloakTokenParser)
 *   - синхронизацию локали  → ILocaleSync       (KeycloakLocaleSync)
 *   - получение аватара     → IAvatarService    (MeAvatarService)
 *
 * DIP: зависит от интерфейсов, не от конкретных классов.
 * main.tsx — composition root: передаёт реализации через props.
 */
export function AuthProvider({
  keycloak,
  tokenParser,
  localeSync,
  avatarService,
  children,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => ({
    ...buildState(keycloak, tokenParser),
    isInitialized: false,
  }))

  // ── Keycloak event handlers ───────────────────────────────────────────────

  useEffect(() => {
    const sync = () => setState(buildState(keycloak, tokenParser))
    const clear = () => setState(LOGGED_OUT)

    keycloak.onReady            = () => setState((s) => ({ ...s, isInitialized: true }))
    keycloak.onAuthSuccess      = sync
    keycloak.onAuthRefreshSuccess = sync
    keycloak.onAuthLogout       = clear
    keycloak.onAuthError        = clear
    keycloak.onAuthRefreshError = clear
  }, [keycloak, tokenParser])

  // ── Locale sync ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!state.isLoggedIn) return
    localeSync.sync(keycloak.tokenParsed?.locale as string | undefined)
  }, [state.isLoggedIn, keycloak.tokenParsed?.locale, localeSync])

  // ── Avatar fetch ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!state.isLoggedIn || !state.user) return
    let cancelled = false
    avatarService.getAvatarUrl(state.user.userId).then((url) => {
      if (cancelled || !url) return
      setState((s) => {
        if (!s.user) return s
        return { ...s, user: { ...s.user, pictureUrl: url } }
      })
    })
    return () => { cancelled = true }
  }, [state.isLoggedIn, state.user?.userId, avatarService])

  // ── Auth actions ──────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    setState(LOGGED_OUT)
    document.cookie = 'inktide_auth=; path=/; SameSite=Lax; max-age=0'
    if (keycloak.authenticated) {
      keycloak.logout({ redirectUri: window.location.origin })
    }
  }, [keycloak])

  const loginWithKeycloak = useCallback(() => {
    keycloak.login({ redirectUri: `${window.location.origin}${HOME_ROUTE}` })
  }, [keycloak])

  const registerWithKeycloak = useCallback(() => {
    keycloak.login({ action: 'register', redirectUri: `${window.location.origin}${HOME_ROUTE}` })
  }, [keycloak])

  const openAccountSettings = useCallback(() => {
    void keycloak.accountManagement()
  }, [keycloak])

  const refreshSession = useCallback(async () => {
    if (!keycloak.authenticated || !keycloak.tokenParsed) return
    try {
      await keycloak.updateToken(60)
    } catch {
      /* stale token may still allow avatar fetch */
    }
    const parsed = keycloak.tokenParsed
    if (!parsed) return
    const base = tokenParser.parse(parsed)
    if (!base) return
    const nickname = tokenParser.extractNickname(parsed, null)
    const email = (parsed.email as string) ?? base.userName
    let pictureUrl = base.pictureUrl ?? null
    const url = await avatarService.getAvatarUrl(base.userId)
    if (url) pictureUrl = url
    setState({
      isLoggedIn: true,
      userEmail: email,
      user: { ...base, nickname, pictureUrl },
      isInitialized: true,
    })
  }, [keycloak, tokenParser, avatarService])

  const setNickname = useCallback(
    (value: string) => {
      const sub = keycloak.tokenParsed?.sub
      if (!sub) return
      const trimmed = value.trim().slice(0, 32)
      writeStoredNickname(sub, trimmed || null)
      setState((s) => {
        if (!s.user) return s
        return { ...s, user: { ...s.user, nickname: trimmed || null } }
      })
    },
    [keycloak],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      logout,
      loginWithKeycloak,
      registerWithKeycloak,
      openAccountSettings,
      refreshSession,
      setNickname,
    }),
    [state, logout, loginWithKeycloak, registerWithKeycloak, openAccountSettings, refreshSession, setNickname],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildState(keycloak: Keycloak, tokenParser: IAuthTokenParser): AuthState {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return LOGGED_OUT
  }
  const parsed = keycloak.tokenParsed
  const base = tokenParser.parse(parsed)
  if (!base) return LOGGED_OUT
  const nickname = tokenParser.extractNickname(parsed, null)
  const email = (parsed.email as string) ?? base.userName ?? null
  return {
    isLoggedIn: true,
    userEmail: email,
    user: { ...base, nickname },
    isInitialized: true,
  }
}
