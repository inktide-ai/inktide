import styles from './LoadingScreen.module.css'

const LoadingScreen = () => (
  <div className={styles.container}>
    <div className={styles.dots}>
      <span />
      <span />
      <span />
    </div>
    <p className={styles.text}>Loading...</p>
  </div>
)

export default LoadingScreen
