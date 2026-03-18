import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useKeycloak } from '@react-keycloak/web'
import type { KeycloakTokenParsed } from 'keycloak-js'
import { getMe } from '../api/me'
import { STORAGE_KEYS } from '../api/types'

export interface UserInfo {
  userId: string
  userName: string
  role: string
}

interface AuthState {
  isLoggedIn: boolean
  userEmail: string | null
  user: UserInfo | null
  isInitialized: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, user?: UserInfo) => void
  logout: () => void
  loginWithKeycloak: () => void
  registerWithKeycloak: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function userFromTokenParsed(parsed: KeycloakTokenParsed | undefined): UserInfo | null {
  if (!parsed || typeof parsed.sub !== 'string') return null
  const userName = (parsed.preferred_username as string) ?? parsed.sub
  const roles = (parsed.realm_access as { roles?: string[] })?.roles ?? []
  const role = roles.includes('admin') ? 'admin' : roles[0] ?? 'user'
  return {
    userId: parsed.sub,
    userName,
    role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { keycloak, initialized: keycloakInitialized } = useKeycloak()
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    userEmail: null,
    user: null,
    isInitialized: false,
  })

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    setState({ isLoggedIn: false, userEmail: null, user: null, isInitialized: true })
    if (keycloak?.authenticated) {
      keycloak.logout({ redirectUri: window.location.origin })
    }
  }, [keycloak])

  const login = useCallback((email: string, user?: UserInfo) => {
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email)
    setState((s) => ({
      ...s,
      isLoggedIn: true,
      userEmail: email,
      user: user ?? s.user,
      isInitialized: true,
    }))
  }, [])

  const loginWithKeycloak = useCallback(() => {
    keycloak?.login({ redirectUri: `${window.location.origin}/profile` })
  }, [keycloak])

  const registerWithKeycloak = useCallback(() => {
    keycloak?.login({ action: 'register', redirectUri: `${window.location.origin}/profile` })
  }, [keycloak])

  useEffect(() => {
    if (!keycloakInitialized) return

    if (keycloak.authenticated && keycloak.token) {
      const user = userFromTokenParsed(keycloak.tokenParsed)
      const email = (keycloak.tokenParsed?.email as string) ?? user?.userName ?? null
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, keycloak.token)
      if (keycloak.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, keycloak.refreshToken)
      }
      if (email) {
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email)
      }
      setState({
        isLoggedIn: true,
        userEmail: email,
        user,
        isInitialized: true,
      })
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      setState((s) => ({
        ...s,
        isLoggedIn: false,
        userEmail: null,
        user: null,
        isInitialized: true,
      }))
    }
  }, [keycloakInitialized, keycloak.authenticated, keycloak.token, keycloak.tokenParsed, keycloak.refreshToken])

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token || keycloakInitialized) return

    getMe()
      .then((user) => {
        const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) ?? user.userName
        setState({
          isLoggedIn: true,
          userEmail: email,
          user,
          isInitialized: true,
        })
      })
      .catch(() => {
        logout()
      })
  }, [keycloakInitialized, logout])

  const stateRef = useRef(state)
  stateRef.current = state

  const keycloakAuthRef = useRef(keycloak?.authenticated)
  keycloakAuthRef.current = keycloak?.authenticated

  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL)
      if (!token) {
        setState((s) => ({ ...s, isLoggedIn: false, userEmail: null, user: null }))
      } else if (!stateRef.current.user && stateRef.current.isInitialized && !keycloakAuthRef.current) {
        getMe()
          .then((user) => {
            setState((s) => ({
              ...s,
              isLoggedIn: true,
              userEmail: email ?? user.userName,
              user,
            }))
          })
          .catch(logout)
      }
    }
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      loginWithKeycloak,
      registerWithKeycloak,
    }),
    [state, login, logout, loginWithKeycloak, registerWithKeycloak]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
