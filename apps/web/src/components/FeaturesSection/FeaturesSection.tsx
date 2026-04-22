import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import GlitchText from '../GlitchText'
import { useRevealOnScroll } from '../../hooks'
import ArrowIcon from '../../assets/app/arrow.svg'
import styles from './FeaturesSection.module.css'

const FEATURE_ICONS = ['⚡', '✨', '🔌']
const FEATURE_IDS = ['prompts', 'appearance', 'api'] as const

const FeaturesSection = () => {
  const { ref, isVisible } = useRevealOnScroll()
  const { t } = useTranslation('landing')

  return (
    <section id="features" className={styles.section} ref={ref}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <div className={styles.header}>
          <GlitchText text={t('features.heading')} tag="h2" className={styles.heading} />
          <p className={styles.subheading}>{t('features.subheading')}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.supportButton}>
              {t('features.supportButton')}
            </button>
            <span className={styles.actionsSeparator}>{t('features.and')}</span>
            <button type="button" className={styles.tryButton}>
              <span>{t('features.tryButton')}</span>
              <img src={ArrowIcon} alt="" className={styles.tryArrow} aria-hidden />
            </button>
          </div>
        </div>
        <div className={styles.grid}>
          {FEATURE_IDS.map((id, i) => (
            <div
              key={id}
              className={classnames(styles.card, { [styles.revealed]: isVisible })}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <span className={styles.icon}>{FEATURE_ICONS[i]}</span>
              <h3 className={styles.cardTitle}>{t(`features.items.${id}.title`)}</h3>
              <p className={styles.cardDesc}>{t(`features.items.${id}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
