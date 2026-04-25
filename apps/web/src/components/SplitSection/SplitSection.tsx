import classnames from 'classnames'
import { useRevealOnScroll } from '../../hooks'
import styles from './SplitSection.module.css'

interface SplitSectionProps {
  heading: React.ReactNode
  description: string
  reverse?: boolean
  imageDark?: string
  imageLight?: string
  imageAlt?: string
}

const SplitSection = ({ heading, description, reverse = false, imageDark, imageLight, imageAlt = '' }: SplitSectionProps) => {
  const { ref: refLeft, isVisible: leftVisible } = useRevealOnScroll()
  const { ref: refRight, isVisible: rightVisible } = useRevealOnScroll()

  const placeholder = (
    <div
      ref={reverse ? refRight : refLeft}
      className={classnames(styles.placeholder, {
        [styles.revealed]: reverse ? rightVisible : leftVisible,
        [styles.slideRight]: reverse,
        [styles.hasImage]: !!imageDark,
      })}
    >
      {imageDark ? (
        <>
          <img src={imageDark} alt={imageAlt} className={styles.previewDark} />
          {imageLight && <img src={imageLight} alt={imageAlt} className={styles.previewLight} />}
        </>
      ) : (
        <span className={styles.placeholderLabel}>Screenshot / Demo</span>
      )}
    </div>
  )

  const content = (
    <div
      ref={reverse ? refLeft : refRight}
      className={classnames(styles.content, {
        [styles.revealed]: reverse ? leftVisible : rightVisible,
        [styles.slideLeft]: reverse,
      })}
    >
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.buttons}>
        <a href="/register" className={classnames(styles.button, styles.buttonPrimary)}>
          Get started →
        </a>
        <a href="#" className={classnames(styles.button, styles.buttonGhost)}>
          Learn more
        </a>
      </div>
    </div>
  )

  return (
    <section className={styles.section}>
      <div className={classnames(styles.container, { [styles.reversed]: reverse })}>
        {reverse ? <>{content}{placeholder}</> : <>{placeholder}{content}</>}
      </div>
    </section>
  )
}

export default SplitSection
