import classnames from 'classnames'
import { useRevealOnScroll } from '../../hooks'
import { useAuth } from '../../context/AuthContext'
import { CONTENT } from '../../constants'
import styles from './CTASection.module.css'

const CTASection = () => {
  const { ref, isVisible } = useRevealOnScroll()
  const { registerWithKeycloak } = useAuth()

  return (
    <section id="pricing" className={styles.section} ref={ref}>
      <div className={styles.glow} />
      <div className={classnames(styles.container, { [styles.revealed]: isVisible })}>
        <span className={styles.badge}>{CONTENT.cta.badge}</span>
        <h2 className={styles.heading}>{CONTENT.cta.heading}</h2>
        <p className={styles.description}>{CONTENT.cta.description}</p>
        <button type="button" className={styles.ctaButton} onClick={registerWithKeycloak}>
          {CONTENT.cta.button}
        </button>
      </div>
    </section>
  )
}

export default CTASection
