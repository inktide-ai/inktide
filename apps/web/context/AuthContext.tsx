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
import { useQuery } from '@tanstack/react-query'
import Keycloak from 'keycloak-js'
import type { IAuthTokenParser } from '@/types/IAuthTokenParser'
import type { ILocaleSync } from '@/types/ILocaleSync'
import type { IAvatarService } from '@/types/IAvatarService'
import { writeStoredNickname } from '../utils/profileStorage'
import { HOME_ROUTE } from '@/lib/routes'
import { queryKeys } from '@/lib/query/keys'

// ── Domain types ──────────────────────────────────────────────────────────────

export interface UserInfo {
  userId: string
  userName: string
  role: string
  pictureUrl?: string | null
  nickname?: string | null
}

/**
 * Auth state holds only identity data derived from the JWT.
 * pictureUrl lives in a separate state so JWT refreshes never wipe it.
 */
interface AuthState {
  isLoggedIn: boolean
  userEmail: string | null
  user: Omit<UserInfo, 'pictureUrl'> | null
  isInitialized: boolean
}

interface AuthContextValue {
  isLoggedIn: boolean
  userEmail: string | null
  user: UserInfo | null       // auth state + pictureUrl merged
  isInitialized: boolean
  logout: () => void
  loginWithKeycloak: () => void
  registerWithKeycloak: () => void
  openAccountSettings: () => void
  refreshSession: () => Promise<void>
  setNickname: (value: string) => void
  setPictureUrl: (url: string | null) => void
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

  // pictureUrl is fully independent of auth state — never reset by token refreshes
  const [pictureUrl, setPictureUrlState] = useState<string | null>(null)

  const { data: fetchedAvatarUrl, refetch: refetchAvatar } = useQuery({
    queryKey: queryKeys.me.avatar(state.user?.userId ?? ''),
    queryFn: () => avatarService.getAvatarUrl(state.user!.userId),
    enabled: !!state.user?.userId,
    staleTime: 60_000,
  })

  // Sync fetched avatar into local state (kept separate so JWT refreshes never wipe it)
  useEffect(() => {
    if (fetchedAvatarUrl) setPictureUrlState(fetchedAvatarUrl)
  }, [fetchedAvatarUrl])

  // ── Keycloak event handlers ───────────────────────────────────────────────

  useEffect(() => {
    // sync: only updates auth identity data, never touches pictureUrl
    const sync = () => setState(buildState(keycloak, tokenParser))

    const clear = () => {
      setState(LOGGED_OUT)
      setPictureUrlState(null)
    }

    keycloak.onReady              = () => setState((s) => ({ ...s, isInitialized: true }))
    keycloak.onAuthSuccess        = sync
    keycloak.onAuthRefreshSuccess = sync
    keycloak.onAuthLogout         = clear
    keycloak.onAuthError          = clear
    keycloak.onAuthRefreshError   = clear

    return () => {
      keycloak.onReady              = undefined
      keycloak.onAuthSuccess        = undefined
      keycloak.onAuthRefreshSuccess = undefined
      keycloak.onAuthLogout         = undefined
      keycloak.onAuthError          = undefined
      keycloak.onAuthRefreshError   = undefined
      keycloak.onTokenExpired       = undefined
    }
  }, [keycloak, tokenParser])

  // ── Locale sync ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!state.isLoggedIn) return
    localeSync.sync(keycloak.tokenParsed?.locale as string | undefined)
  }, [state.isLoggedIn, keycloak.tokenParsed?.locale, localeSync])

  // ── Merged user (auth + avatar) ───────────────────────────────────────────

  const user = useMemo<UserInfo | null>(
    () => (state.user ? { ...state.user, pictureUrl } : null),
    [state.user, pictureUrl],
  )

  // ── Auth actions ──────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    setState(LOGGED_OUT)
    setPictureUrlState(null)
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
    if (!keycloak.authenticated) return
    try { await keycloak.updateToken(60) } catch { /* stale is fine */ }
    await refetchAvatar()
  }, [keycloak, refetchAvatar])

  const setPictureUrl = useCallback((url: string | null) => {
    setPictureUrlState(url)
  }, [])

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
      isLoggedIn: state.isLoggedIn,
      userEmail: state.userEmail,
      isInitialized: state.isInitialized,
      user,
      logout,
      loginWithKeycloak,
      registerWithKeycloak,
      openAccountSettings,
      refreshSession,
      setNickname,
      setPictureUrl,
    }),
    [state.isLoggedIn, state.userEmail, state.isInitialized, user,
     logout, loginWithKeycloak, registerWithKeycloak, openAccountSettings,
     refreshSession, setNickname, setPictureUrl],
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
  // pictureUrl intentionally excluded — lives in separate state
  const { pictureUrl: _ignored, ...baseWithoutPicture } = base
  return {
    isLoggedIn: true,
    userEmail: email,
    user: { ...baseWithoutPicture, nickname },
    isInitialized: true,
  }
}
