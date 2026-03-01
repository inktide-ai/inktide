import { useMemo } from 'react'
import classnames from 'classnames'
import GlitchText from '../GlitchText'
import { useRevealOnScroll } from '../../hooks'
import { VIDEO_CONFIG, CONTENT } from '../../constants'
import { generateSectionStars, getYouTubeEmbedUrl } from '../../utils'
import styles from './VideoSection.module.css'

const VideoSection = () => {
  const stars = useMemo(() => generateSectionStars(), [])
  const videoUrl = useMemo(
    () => getYouTubeEmbedUrl(VIDEO_CONFIG.videoId, VIDEO_CONFIG),
    []
  )
  const { ref, isVisible } = useRevealOnScroll()

  return (
    <section id="demo" className={styles.section} ref={ref}>
      <div className={styles.starsContainer}>
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      <div className={styles.container}>
        <div className={styles.textColumn}>
          <div className={styles.accentLine} />
          <GlitchText id="how-it-works" text={CONTENT.demo.heading} tag="h2" className={styles.heading} />
          <p className={styles.description}>{CONTENT.demo.description}</p>
        </div>

        <div className={classnames(styles.videoColumn, { [styles.revealed]: isVisible })}>
          <div className={styles.videoWindow}>
            <div className={styles.windowHeader}>
              <div className={styles.windowControls}>
                <span className={styles.control} />
                <span className={styles.control} />
                <span className={styles.control} />
              </div>
              <div className={styles.windowTitle}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={styles.youtubeIcon}
                >
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                    fill="currentColor"
                  />
                </svg>
                <span>YouTube</span>
              </div>
              <div className={styles.windowActions}>
                <button className={styles.actionButton} aria-label="Настройки">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z" />
                  </svg>
                </button>
                <button className={styles.actionButton} aria-label="Закрыть">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.videoContent}>
              <div className={styles.videoWrapper}>
                <iframe
                  className={styles.videoIframe}
                  src={videoUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VideoSection
