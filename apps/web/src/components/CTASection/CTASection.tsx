import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useRevealOnScroll } from '../../hooks'
import { useAuth } from '../../context/AuthContext'
import BadgeIcon from '../../assets/app/badge-icon.svg?react'
import Highlight from '../../assets/app/highlight.svg?react'
import styles from './CTASection.module.css'

const CTASection = () => {
  const { ref, isVisible } = useRevealOnScroll()
  const { registerWithKeycloak } = useAuth()
  const { t } = useTranslation('landing')

  return (
    <section id="pricing" className={styles.section} ref={ref}>
      <div className={styles.glow} />
      <div className={classnames(styles.container, { [styles.revealed]: isVisible })}>
        <button type="button" className={styles.badge}>
          {t('cta.badge')}
          <BadgeIcon className={styles.badgeHeart} aria-hidden />
        </button>
        <h2 className={styles.heading}>
          Boost d<span className={styles.highlightWrapper}>
            <Highlight className={styles.highlightBg} aria-hidden />
            <span className={styles.highlightText}>eveloper</span>
          </span>
          {' '}experience
        </h2>
        <p className={styles.description}>{t('cta.description')}</p>
        <button type="button" className={styles.ctaButton} onClick={registerWithKeycloak}>
          {t('cta.button')}
        </button>
      </div>
    </section>
  )
}

export default CTASection
