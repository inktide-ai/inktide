import { useState, useRef, useEffect } from 'react'
import GlitchText from '../GlitchText'
import { CONTENT } from '../../constants'
import styles from './VideoSection.module.css'

const VideoSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const imagePanelRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  const steps = CONTENT.demo.steps

  useEffect(() => {
    const panel = imagePanelRef.current
    const scrollEl = scrollRef.current
    if (!panel || !scrollEl) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      scrollEl.scrollTop += e.deltaY
    }
    panel.addEventListener('wheel', handleWheel, { passive: false })
    return () => panel.removeEventListener('wheel', handleWheel)
  }, [])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return

    const { scrollTop, scrollHeight, clientHeight } = el
    const maxScroll = scrollHeight - clientHeight

    if (maxScroll <= 0) {
      setActiveStep(0)
      return
    }

    if (scrollTop >= maxScroll - 1) {
      setActiveStep(steps.length - 1)
      return
    }

    const stepHeight = scrollHeight / steps.length
    const viewportCenter = scrollTop + clientHeight / 2
    const stepIndex = Math.min(
      Math.floor(viewportCenter / stepHeight),
      steps.length - 1
    )
    setActiveStep(Math.max(0, stepIndex))
  }

  const activeStepData = steps[activeStep]
  const activeImage = (activeStepData as { image?: string }).image

  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.sectionFrame}>
        <div
          ref={scrollRef}
          className={styles.scrollContainer}
          onScroll={handleScroll}
        >
          <div className={styles.scrollContent}>
            {steps.map((step, i) => (
              <div
                key={i}
                className={styles.step}
                data-active={activeStep === i}
              >
                <GlitchText
                  text={step.heading}
                  tag="h2"
                  className={styles.heading}
                />
                <p className={styles.description}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div ref={imagePanelRef} className={styles.imagePanel}>
          {activeImage ? (
            <img
              key={activeStep}
              src={activeImage}
              alt={activeStepData.heading}
              className={styles.stepImage}
            />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}
        </div>
      </div>
    </section>
  )
}

export default VideoSection
