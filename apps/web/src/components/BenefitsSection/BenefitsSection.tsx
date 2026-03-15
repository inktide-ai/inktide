import { useState } from 'react'
import classnames from 'classnames'
import GlitchText from '../GlitchText'
import { useRevealOnScroll } from '../../hooks'
import { CONTENT } from '../../constants'
import styles from './BenefitsSection.module.css'

const BenefitsSection = () => {
  const { ref, isVisible } = useRevealOnScroll()
  const [activeTab, setActiveTab] = useState(0)
  const { heading, subheading, tabs } = CONTENT.benefits
  const active = tabs[activeTab]

  return (
    <section id="how" className={styles.section} ref={ref}>
      <div className={styles.container}>
        <div className={styles.header}>
          <GlitchText text={heading} tag="h2" className={styles.heading} />
          <p className={styles.subheading}>{subheading}</p>
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
                    stroke="url(#lineGrad1)"
                    strokeWidth="2"
                  />
                  <path
                    d="M0,80 Q50,75 100,65 T200,60 T300,55 T400,45"
                    fill="none"
                    stroke="url(#lineGrad2)"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="lineGrad1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4DABF7" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                    <linearGradient id="lineGrad2" x1="0" y1="0" x2="1" y2="0">
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
