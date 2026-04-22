import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import GlitchText from '../GlitchText'
import { useRevealOnScroll } from '../../hooks'
import styles from './LearnSection.module.css'

const LearnSection = () => {
  const { ref, isVisible } = useRevealOnScroll()
  const { t } = useTranslation('landing')
  const bullets = t('learn.bullets', { returnObjects: true }) as string[]

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.container}>
        <div className={styles.header}>
          <GlitchText text={t('learn.heading')} tag="h2" className={styles.heading} />
          <p className={styles.subheading}>{t('learn.subheading')}</p>
        </div>
        <div
          className={classnames(styles.block, { [styles.revealed]: isVisible })}
        >
          <div className={styles.leftColumn}>
            <h3 className={styles.learnHeading}>{t('learn.sectionHeading')}</h3>
            <ul className={styles.bulletList}>
              {bullets.map((item, i) => (
                <li key={i} className={styles.bulletItem}>
                  {item}
                </li>
              ))}
            </ul>
            <button type="button" className={styles.ctaButton}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {t('learn.cta')}
            </button>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.stackedCards}>
              <div className={styles.cardBack}>
                <span className={styles.cardLabel}>{t('learn.cards.back.label')}</span>
                <p className={styles.cardTextMuted}>
                  {t('learn.cards.back.text')}
                </p>
              </div>
              <div className={styles.cardMiddle}>
                <span className={styles.cardLabel}>{t('learn.cards.middle.label')}</span>
                <p className={styles.cardTextMuted}>
                  {t('learn.cards.middle.text')}
                </p>
              </div>
              <div className={styles.cardFront}>
                <span className={styles.cardLabel}>{t('learn.cards.front.label')}</span>
                <h4 className={styles.cardTitle}>{t('learn.cards.front.title')}</h4>
                <p className={styles.cardText}>
                  {t('learn.cards.front.text')}
                </p>
                <p className={styles.cardHighlight}>
                  {t('learn.cards.front.highlight')}
                </p>
                <div className={styles.cardChart}>
                  <span className={styles.chartTitle}>{t('learn.cards.front.chartTitle')}</span>
                  <div className={styles.chartBars}>
                    {[
                      { label: 'Twitch', value: 85 },
                      { label: 'YouTube', value: 72 },
                      { label: 'Kick', value: 65 },
                      { label: 'TikTok', value: 58 },
                    ].map((item) => (
                      <div key={item.label} className={styles.chartRow}>
                        <span className={styles.chartLabel}>{item.label}</span>
                        <div className={styles.chartBarWrap}>
                          <div
                            className={styles.chartBarFill}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <span className={styles.chartValue}>{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.cardLogos}>
                  <span className={styles.logoText}>CHIMERA</span>
                  <span className={styles.logoDivider} />
                  <span className={styles.logoText}>AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LearnSection
