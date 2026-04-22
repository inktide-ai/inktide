import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useRevealOnScroll } from '../../hooks'
import { useAuth } from '../../context/AuthContext'
import styles from './CTASection.module.css'

const CTASection = () => {
  const { ref, isVisible } = useRevealOnScroll()
  const { registerWithKeycloak } = useAuth()
  const { t } = useTranslation('landing')

  return (
    <section id="pricing" className={styles.section} ref={ref}>
      <div className={styles.glow} />
      <div className={classnames(styles.container, { [styles.revealed]: isVisible })}>
        <span className={styles.badge}>{t('cta.badge')}</span>
        <h2 className={styles.heading}>{t('cta.heading')}</h2>
        <p className={styles.description}>{t('cta.description')}</p>
        <button type="button" className={styles.ctaButton} onClick={registerWithKeycloak}>
          {t('cta.button')}
        </button>
      </div>
    </section>
  )
}

export default CTASection
