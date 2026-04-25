import LogoMark from '../../assets/app/icon_without_white.svg?react'
import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen = ({ message }: LoadingScreenProps) => (
  <div className={styles.container}>
    <div className={styles.scene}>
      <div className={styles.ripple} />
      <div className={styles.ripple} />
      <div className={styles.ripple} />
      <LogoMark className={styles.logo} aria-hidden />
    </div>
    {message && <p className={styles.message}>{message}</p>}
  </div>
)

export default LoadingScreen
