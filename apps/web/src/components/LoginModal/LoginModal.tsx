import { useState, FormEvent, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { login } from '../../api/auth'
import { getMe } from '../../api/me'
import { STORAGE_KEYS } from '../../api/types'
import styles from '../../styles/modal.module.css'

interface LoginModalProps {
  onClose: () => void
  onSuccess?: (email: string, user?: { userId: string; userName: string; role: string }) => void
}

const LoginModal = ({ onClose, onSuccess }: LoginModalProps) => {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const trimmed = emailOrUsername.trim()
    const isEmail = trimmed.includes('@')

    try {
      const res = await login(
        isEmail
          ? { email: trimmed, password }
          : { username: trimmed, password }
      )
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.accessToken)
      if (res.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.refreshToken)
      }
      const user = await getMe().catch(() => undefined)
      onSuccess?.(trimmed, user)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2 id="login-title" className={styles.title}>
          Вход
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>
              Email или логин
            </label>
            <input
              id="login-email"
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className={styles.input}
              placeholder="example@mail.com или username"
              autoComplete="username"
              autoFocus
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>
              Пароль
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

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default LoginModal
