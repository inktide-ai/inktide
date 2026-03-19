import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen = ({ message }: LoadingScreenProps) => (
  <div className={styles.container}>
    <div className={styles.loader} />
    {message && <p className={styles.message}>{message}</p>}
  </div>
)

export default LoadingScreen
