import classnames from 'classnames'
import GlitchText from '../GlitchText'
import { useRevealOnScroll } from '../../hooks'
import { CONTENT } from '../../constants'
import ArrowIcon from '../../assets/arrow.svg'
import styles from './FeaturesSection.module.css'

const FeaturesSection = () => {
  const { ref, isVisible } = useRevealOnScroll()

  return (
    <section id="features" className={styles.section} ref={ref}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <div className={styles.header}>
          <GlitchText text={CONTENT.features.heading} tag="h2" className={styles.heading} />
          <p className={styles.subheading}>{CONTENT.features.subheading}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.supportButton}>
              {CONTENT.features.supportButton}
            </button>
            <span className={styles.actionsSeparator}>and</span>
            <button type="button" className={styles.tryButton}>
              <span>{CONTENT.features.tryButton}</span>
              <img src={ArrowIcon} alt="" className={styles.tryArrow} aria-hidden />
            </button>
          </div>
        </div>
        <div className={styles.grid}>
          {CONTENT.features.items.map((item, i) => (
            <div
              key={item.title}
              className={classnames(styles.card, { [styles.revealed]: isVisible })}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <span className={styles.icon}>{item.icon}</span>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
