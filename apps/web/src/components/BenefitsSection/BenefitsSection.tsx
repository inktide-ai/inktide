import { useId, useMemo, useState } from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import GlitchText from '../GlitchText'
import { useRevealOnScroll } from '../../hooks'
import styles from './BenefitsSection.module.css'

const TAB_IDS = ['engagement', 'performance', 'integration', 'growth'] as const

const BenefitsSection = () => {
  const { ref, isVisible } = useRevealOnScroll()
  const [activeTab, setActiveTab] = useState(0)
  const gradientId = useId()
  const { t } = useTranslation('landing')

  const tabs = useMemo(() =>
    TAB_IDS.map((id) => ({
      id,
      label: t(`benefits.tabs.${id}.label`),
      description: t(`benefits.tabs.${id}.description`),
    })),
  [t])

  const active = tabs[activeTab]

  return (
    <section id="how" className={styles.section} ref={ref}>
      <div className={styles.container}>
        <div className={styles.header}>
          <GlitchText text={t('benefits.heading')} tag="h2" className={styles.heading} />
          <p className={styles.subheading}>{t('benefits.subheading')}</p>
        </div>
        <div
          className={classnames(styles.chartsBlock, { [styles.revealed]: isVisible })}
        >
          <nav className={styles.sidebar}>
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                className={classnames(styles.tab, { [styles.tabActive]: activeTab === i })}
                onClick={() => setActiveTab(i)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className={styles.content}>
            <div key={activeTab} className={styles.contentInner}>
              <h3 className={styles.contentHeading}>{active.label}</h3>
              <p className={styles.contentDescription}>{active.description}</p>
              <div className={styles.chart}>
                <div className={styles.chartBars}>
                {[65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 68, 82].map((h, i) => (
                  <div key={i} className={styles.chartBar} style={{ height: `${h}%` }}>
                    <span className={styles.barSegment} />
                    <span className={styles.barSegmentAlt} />
                  </div>
                ))}
                </div>
                <div className={styles.chartLines}>
                <svg className={styles.lineChart} viewBox="0 0 400 120" preserveAspectRatio="none">
                  <path
                    d="M0,80 Q50,70 100,50 T200,50 T300,35 T400,20"
                    fill="none"
                    stroke={`url(#${gradientId}-1)`}
                    strokeWidth="2"
                  />
                  <path
                    d="M0,80 Q50,75 100,65 T200,60 T300,55 T400,45"
                    fill="none"
                    stroke={`url(#${gradientId}-2)`}
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id={`${gradientId}-1`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4DABF7" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                    <linearGradient id={`${gradientId}-2`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                  </defs>
                </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BenefitsSection
