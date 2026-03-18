import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen = (_props?: LoadingScreenProps) => (
  <div className={styles.container}>
    <div className={styles.loader} />
  </div>
)

export default LoadingScreen
