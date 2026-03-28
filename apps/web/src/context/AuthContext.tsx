import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import Keycloak, { type KeycloakTokenParsed } from 'keycloak-js'
import { getMe } from '../api/me'
import { readStoredNickname, writeStoredNickname } from '../utils/profileStorage'

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

const IGNORED_ROLES = new Set(['offline_access', 'uma_authorization'])

function userFromToken(parsed: KeycloakTokenParsed | undefined): UserInfo | null {
  if (!parsed?.sub) return null
  const userName = (parsed.preferred_username as string) ?? parsed.sub
  const rawRoles = (parsed.realm_access as { roles?: string[] })?.roles ?? []
  const meaningful = rawRoles.filter(
    (r) => !IGNORED_ROLES.has(r) && !r.startsWith('default-roles-'),
  )
  const role = meaningful.includes('admin') ? 'admin' : meaningful[0] ?? 'user'
  const pic = parsed.picture as string | undefined
  const pictureUrl = pic?.trim() ? pic : null
  return { userId: parsed.sub, userName, role, pictureUrl }
}

function nicknameFromToken(parsed: KeycloakTokenParsed): string | null {
  const raw = (parsed as Record<string, unknown>).nickname
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t ? t.slice(0, 32) : null
}

function loadUserInfo(parsed: KeycloakTokenParsed): UserInfo | null {
  const base = userFromToken(parsed)
  if (!base || !parsed.sub) return null
  const stored = readStoredNickname(parsed.sub)
  const fromToken = nicknameFromToken(parsed)
  const nickname = stored ?? fromToken ?? null
  return { ...base, nickname }
}

function stateFromKeycloak(kc: Keycloak): AuthState {
  if (kc.authenticated && kc.tokenParsed) {
    const user = loadUserInfo(kc.tokenParsed)
    const email = (kc.tokenParsed.email as string) ?? user?.userName ?? null
    return { isLoggedIn: true, userEmail: email, user, isInitialized: true }
  }
  return { isLoggedIn: false, userEmail: null, user: null, isInitialized: true }
}

const LOGGED_OUT: AuthState = { isLoggedIn: false, userEmail: null, user: null, isInitialized: true }

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ keycloak, children }: { keycloak: Keycloak; children: ReactNode }) {
  // Keycloak is already initialized when this provider mounts — read current state immediately.
  const [state, setState] = useState<AuthState>(() => stateFromKeycloak(keycloak))

  // Subscribe to future Keycloak auth events.
  useEffect(() => {
    const sync = () => setState(stateFromKeycloak(keycloak))
    const clear = () => setState(LOGGED_OUT)

    keycloak.onAuthSuccess = sync
    keycloak.onAuthRefreshSuccess = sync
    keycloak.onAuthLogout = clear
    keycloak.onAuthError = clear
    keycloak.onAuthRefreshError = clear
  }, [keycloak])

  // Fetch avatar from /api/me once authenticated.
  useEffect(() => {
    if (!state.isLoggedIn || !state.user) return
    let cancelled = false
    ;(async () => {
      try {
        const me = await getMe()
        if (cancelled) return
        setState((s) => {
          if (!s.user) return s
          return { ...s, user: { ...s.user, pictureUrl: me.pictureUrl ?? s.user.pictureUrl ?? null } }
        })
      } catch {
        /* avatar is optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [state.isLoggedIn, state.user?.userId])

  const logout = useCallback(() => {
    setState(LOGGED_OUT)
    if (keycloak.authenticated) {
      keycloak.logout({ redirectUri: window.location.origin })
    }
  }, [keycloak])

  const loginWithKeycloak = useCallback(() => {
    keycloak.login({ redirectUri: `${window.location.origin}/profile` })
  }, [keycloak])

  const registerWithKeycloak = useCallback(() => {
    keycloak.login({ action: 'register', redirectUri: `${window.location.origin}/profile` })
  }, [keycloak])

  const openAccountSettings = useCallback(() => {
    void keycloak.accountManagement()
  }, [keycloak])

  const refreshSession = useCallback(async () => {
    if (!keycloak.authenticated || !keycloak.tokenParsed) return
    try {
      await keycloak.updateToken(60)
    } catch {
      /* stale token may still allow getMe */
    }
    const parsed = keycloak.tokenParsed
    if (!parsed) return
    const merged = loadUserInfo(parsed)
    const email = (parsed.email as string) ?? merged?.userName ?? null
    let pictureUrl = merged?.pictureUrl ?? null
    try {
      const me = await getMe()
      pictureUrl = me.pictureUrl ?? pictureUrl
    } catch {
      /* keep token picture */
    }
    setState({
      isLoggedIn: true,
      userEmail: email,
      user: merged ? { ...merged, pictureUrl } : null,
      isInitialized: true,
    })
  }, [keycloak])

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
