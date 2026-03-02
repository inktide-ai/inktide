import { useState, FormEvent, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { register } from '../../api/auth'
import { getMe } from '../../api/me'
import { STORAGE_KEYS } from '../../api/types'
import styles from '../../styles/modal.module.css'

interface RegisterModalProps {
  onClose: () => void
  onSuccess?: (email: string, user?: { userId: string; userName: string; role: string }) => void
}

const RegisterModal = ({ onClose, onSuccess }: RegisterModalProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
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

    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов')
      setLoading(false)
      return
    }

    try {
      const res = await register({
        email,
        password,
        displayName: displayName.trim() || undefined,
      })
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.accessToken)
      if (res.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.refreshToken)
      }
      const user = await getMe().catch(() => undefined)
      onSuccess?.(email.trim().toLowerCase(), user)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
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
        aria-labelledby="register-title"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2 id="register-title" className={styles.title}>
          Регистрация
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="register-email" className={styles.label}>
              Email
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="example@mail.com"
              autoComplete="email"
              autoFocus
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="register-displayName" className={styles.label}>
              Отображаемое имя
            </label>
            <input
              id="register-displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              placeholder="Как к вам обращаться (необязательно)"
              autoComplete="name"
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="register-password" className={styles.label}>
              Пароль
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Минимум 8 символов"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default RegisterModal
