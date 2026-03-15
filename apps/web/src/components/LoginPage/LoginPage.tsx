import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../api/auth'
import { getMe } from '../../api/me'
import { STORAGE_KEYS } from '../../api/types'
import { useAuth } from '../../context/AuthContext'
import logoSvg from '../../assets/icon.svg'
import styles from './LoginPage.module.css'

const GoogleIcon = () => (
  <svg className={styles.socialIcon} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const TwitchIcon = () => (
  <svg className={styles.socialIcon} width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path fill="#9147FF" d="M4.78 1.333L2.4 3.714v8.572h2.857v2.38l2.381-2.38h1.905L13.829 8V1.333H4.78z" />
    <path fill="#fff" d="M10.971 9.429l1.905-1.905V2.286h-7.62v7.143h1.906v1.904L9.066 9.43h1.905z" />
    <path fill="#9147FF" d="M8.114 4.19h.953v2.858h-.953V4.19zm3.334 0v2.858h-.953V4.19h.953z" />
  </svg>
)

const LoginPage = () => {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const trimmed = email.trim()
    const isEmail = trimmed.includes('@')

    try {
      const res = await login(
        isEmail ? { email: trimmed, password } : { username: trimmed, password }
      )
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.accessToken)
      if (res.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.refreshToken)
      }
      const user = await getMe().catch(() => undefined)
      authLogin(trimmed, user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const base = import.meta.env.VITE_API_URL ?? ''
    const returnUrl = `${window.location.origin}/auth/callback`
    window.location.href = `${base}/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`
  }

  const handleTwitchLogin = () => {
    const base = import.meta.env.VITE_API_URL ?? ''
    const returnUrl = `${window.location.origin}/auth/callback`
    window.location.href = `${base}/api/auth/twitch?returnUrl=${encodeURIComponent(returnUrl)}`
  }

  return (
    <div className={styles.page}>
      <div className={styles.logo}>
        <Link to="/">
          <img src={logoSvg} alt="Chimera" />
        </Link>
      </div>

      <div className={styles.panel}>
        <h1 className={styles.title}>Sign in to Chimera</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>
              Email
            </label>
            <input
              id="login-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="example@mail.com"
              autoComplete="username"
              autoFocus
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.row}>
            <label className={styles.checkboxWrap}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>Remember me</span>
            </label>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.signInButton}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className={styles.separator}>
          <span className={styles.separatorLine} />
          <span className={styles.separatorText}>or</span>
          <span className={styles.separatorLine} />
        </div>

        <div className={styles.socialButtons}>
          <button
            type="button"
            className={styles.socialButton}
            onClick={handleGoogleLogin}
          >
            <GoogleIcon />
            Sign in with Google
          </button>
          <button
            type="button"
            className={styles.socialButton}
            onClick={handleTwitchLogin}
          >
            <TwitchIcon />
            Sign in with Twitch
          </button>
        </div>

        <div className={styles.registerBlock}>
          <p className={styles.registerText}>Don't have an account?</p>
          <Link to="/register" className={styles.registerLink}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
