import classnames from 'classnames'
import GlitchText from '../GlitchText'
import { useRevealOnScroll } from '../../hooks'
import { CONTENT } from '../../constants'
import styles from './BenefitsSection.module.css'

const BenefitsSection = () => {
  const { ref, isVisible } = useRevealOnScroll()

  return (
    <section id="how" className={styles.section} ref={ref}>
      <div className={styles.container}>
        <GlitchText text={CONTENT.benefits.heading} tag="h2" className={styles.heading} />
        <ul className={styles.list}>
          {CONTENT.benefits.items.map((item, i) => (
            <li
              key={i}
              className={classnames(styles.item, { [styles.revealed]: isVisible })}
              style={{ transitionDelay: `${i * 0.18}s` }}
            >
              <span className={styles.check}>✓</span>
              <span>
                {item.text}{' '}
                <span className={styles.highlight}>{item.highlight}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default BenefitsSection
