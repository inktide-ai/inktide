import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../../api/me'
import { STORAGE_KEYS } from '../../api/types'
import { useAuth } from '../../context/AuthContext'

const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      setError('No tokens received')
      return
    }

    const params = new URLSearchParams(hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken) {
      setError('Missing access token')
      return
    }

    const applyTokens = async () => {
      try {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
        if (refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
        }
        const user = await getMe().catch(() => undefined)
        login(user?.userName ?? user?.userId ?? 'user', user)
        navigate('/', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete sign in')
      }
    }

    applyTokens()
  }, [login, navigate])

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
        <p>{error}</p>
        <a href="/login" style={{ color: 'var(--accent-red)' }}>
          Back to login
        </a>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
      <p>Completing sign in...</p>
    </div>
  )
}

export default AuthCallbackPage
