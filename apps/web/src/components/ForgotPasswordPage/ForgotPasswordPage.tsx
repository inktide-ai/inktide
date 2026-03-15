import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../api/auth'
import logoSvg from '../../assets/icon.svg'
import styles from './ForgotPasswordPage.module.css'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.logo}>
        <Link to="/">
          <img src={logoSvg} alt="Chimera" />
        </Link>
      </div>

      <div className={styles.panel}>
        <h1 className={styles.title}>Forgot password?</h1>
        <p className={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div className={styles.success}>
            Check your email. We've sent you a link to reset your password.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="forgot-email" className={styles.label}>
                Email
              </label>
              <input
                id="forgot-email"
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

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className={styles.backBlock}>
          <p className={styles.backText}>Remember your password?</p>
          <Link to="/login" className={styles.backLink}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
