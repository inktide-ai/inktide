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
import { useSession, signIn, signOut } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import type { IAvatarService } from '@/shared/types/IAvatarService'
import { writeStoredNickname, readStoredNickname } from '@/shared/lib/profileStorage'
import { queryKeys } from '@/shared/lib/query/keys'
import { configureApiAuth } from '@/api/client'


export interface UserInfo {
  userId: string
  userName: string
  role: string
  pictureUrl?: string | null
  nickname?: string | null
}

export interface AuthContextValue {
  isLoggedIn: boolean
  userEmail: string | null
  user: UserInfo | null
  isInitialized: boolean
  logout: () => void
  loginWithKeycloak: () => void
  registerWithKeycloak: () => void
  openAccountSettings: () => void
  refreshSession: () => Promise<void>
  setNickname: (value: string) => void
  setPictureUrl: (url: string | null) => void
}


const IGNORED_ROLES = new Set(['offline_access', 'uma_authorization'])

function computeRole(roles: string[]): string {
  const meaningful = roles.filter(r => !IGNORED_ROLES.has(r) && !r.startsWith('default-roles-'))
  return meaningful.includes('admin') ? 'admin' : meaningful[0] ?? 'user'
}

const KC_URL   = process.env.NEXT_PUBLIC_KEYCLOAK_URL   ?? 'http://localhost:8080'
const KC_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'chimera'


const AuthContext = createContext<AuthContextValue | null>(null)


interface AuthProviderProps {
  avatarService: IAvatarService
  children: ReactNode
}

export function AuthProvider({ avatarService, children }: AuthProviderProps) {
  const { data: session, status, update } = useSession()

  const isInitialized = status !== 'loading'
  const isLoggedIn    = status === 'authenticated'
  const userId        = session?.user?.userId

  const [pictureUrl, setPictureUrlState] = useState<string | null>(null)
  const [nickname, setNicknameState]     = useState<string | null>(null)

  // Nickname: prefer server value, fall back to localStorage
  useEffect(() => {
    if (session?.user?.nickname) {
      setNicknameState(session.user.nickname)
    } else if (userId) {
      const stored = readStoredNickname(userId)
      if (stored) setNicknameState(stored)
    }
  }, [session?.user?.nickname, userId])

  // Persist a JS-readable session hint so ProtectedRoute can render optimistically
  // on the next page load (next-auth session cookie is HTTP-only, not readable by JS).
  useEffect(() => {
    if (status === 'authenticated') {
      localStorage.setItem('inktide_session_hint', '1')
    } else if (status === 'unauthenticated') {
      localStorage.removeItem('inktide_session_hint')
    }
  }, [status])

  // Wire API client auth hooks
  useEffect(() => {
    configureApiAuth({
      getToken:          () => undefined,
      isAuthenticated:   () => isLoggedIn,
      refreshToken:      async () => { await update(); return true },
      onUnauthenticated: () => signOut({ callbackUrl: '/login' }),
    })
  }, [isLoggedIn, update])

  // Avatar
  const { data: fetchedAvatarUrl, refetch: refetchAvatar } = useQuery({
    queryKey: queryKeys.me.avatar(userId ?? ''),
    queryFn:  () => avatarService.getAvatarUrl(userId!),
    enabled:  !!userId,
    staleTime: 60_000,
  })
  useEffect(() => { if (fetchedAvatarUrl) setPictureUrlState(fetchedAvatarUrl) }, [fetchedAvatarUrl])


  const user = useMemo<UserInfo | null>(() => {
    if (!session?.user) return null
    return {
      userId:   session.user.userId,
      userName: session.user.name,
      role:     computeRole(session.user.roles ?? []),
      pictureUrl,
      nickname,
    }
  }, [session?.user, pictureUrl, nickname])


  const logout = useCallback(
    () => signOut({ callbackUrl: '/' }),
    [],
  )

  const loginWithKeycloak = useCallback(
    () => signIn('keycloak', { callbackUrl: '/home' }),
    [],
  )

  const registerWithKeycloak = useCallback(
    () => signIn('keycloak', { callbackUrl: '/home' }, { kc_action: 'register' }),
    [],
  )

  const openAccountSettings = useCallback(() => {
    window.open(`${KC_URL}/realms/${KC_REALM}/account/`, '_blank')
  }, [])

  const refreshSession = useCallback(async () => {
    await refetchAvatar()
  }, [refetchAvatar])

  const setPictureUrl = useCallback((url: string | null) => {
    setPictureUrlState(url)
  }, [])

  const setNickname = useCallback((value: string) => {
    if (!userId) return
    const trimmed = value.trim().slice(0, 32)
    writeStoredNickname(userId, trimmed || null)
    setNicknameState(trimmed || null)
  }, [userId])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      isInitialized,
      userEmail: session?.user?.email ?? null,
      user,
      logout,
      loginWithKeycloak,
      registerWithKeycloak,
      openAccountSettings,
      refreshSession,
      setNickname,
      setPictureUrl,
    }),
    [isLoggedIn, isInitialized, session?.user?.email, user,
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
