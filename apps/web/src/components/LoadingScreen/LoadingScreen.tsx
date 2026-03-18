import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen = ({ message = 'Loading...' }: LoadingScreenProps) => (
  <div className={styles.container}>
    <div className={styles.dots}>
      <span />
      <span />
      <span />
    </div>
    <p className={styles.text}>{message}</p>
  </div>
)

export default LoadingScreen
