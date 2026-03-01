import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
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
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
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
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) {
      setState((s) => ({ ...s, isInitialized: true }))
      return
    }

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
  }, [logout])

  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL)
      if (!token) {
        setState((s) => ({ ...s, isLoggedIn: false, userEmail: null, user: null }))
      } else if (!state.user && state.isInitialized) {
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
  }, [logout, state.user, state.isInitialized])

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

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout]
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
