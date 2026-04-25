import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import PartnerLogos from '../PartnerLogos'
import DestinyUnderline from '../../assets/app/destiny-underline.svg?react'
import styles from './HeroInktide.module.css'

interface HeroInktideProps {
  onSignUpClick: () => void
}

const WindowsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 42 43" fill="none">
    <path d="M20.02 11.8816V21.0616c0 .11.09.2.2.2h12.59c.11 0 .2-.09.2-.2V10.0416c0-.06-.02-.11-.07-.15-.04-.04-.1-.05-.16-.05L20.19 11.6716c-.1.01-.17.1-.17.19v.02Z" fill="currentColor" fillOpacity="0.85"/>
    <path d="M18.64 31.8815c.09-.02.13-.04.17-.07.04-.04.07-.09.07-.15V22.6315c0-.11-.09-.2-.2-.2H9.2c-.05 0-.1.02-.14.06-.04.04-.06.09-.06.14v7.75c0 .1.07.18.17.19l9.44 1.29h.02Z" fill="currentColor" fillOpacity="0.85"/>
    <path d="M9.21 21.2616H18.64c.11 0 .2-.09.2-.2v-8.96c0-.06-.02-.11-.07-.15-.04-.04-.1-.05-.16-.05L9.17 13.1816c-.1.01-.17.1-.17.19v7.67c0 .11.1.2.21.2Z" fill="currentColor" fillOpacity="0.85"/>
    <path d="M32.8 33.8515c.09-.02.13-.04.17-.07.04-.04.07-.09.07-.15V22.6315c0-.05-.02-.1-.05-.14-.04-.04-.09-.06-.14-.06H20.22c-.11 0-.2.09-.2.2v9.25c0 .1.07.18.17.19l12.59 1.77h.02Z" fill="currentColor" fillOpacity="0.85"/>
  </svg>
)

const MacIcon = () => (
  <svg width="28" height="28" viewBox="0 0 307 307" fill="none">
    <path d="M212.133 142.254C212.414 172.52 238.709 182.592 239 182.72C238.778 183.43 234.799 197.073 225.147 211.166C216.803 223.35 208.143 235.488 194.502 235.74C181.098 235.986 176.788 227.799 161.463 227.799C146.143 227.799 141.355 235.489 128.666 235.987C115.499 236.485 105.472 222.812 97.0591 210.673C79.8683 185.842 66.7309 140.508 84.371 109.906C93.1343 94.7092 108.795 85.0859 125.793 84.8391C138.723 84.5927 150.927 93.53 158.832 93.53C166.731 93.53 181.562 82.7821 197.153 84.3605C203.68 84.632 222.002 86.9947 233.767 104.199C232.819 104.786 211.905 116.95 212.133 142.254ZM186.941 67.933C193.932 59.4789 198.637 47.71 197.353 36C187.277 36.4046 175.092 42.7085 167.865 51.158C161.387 58.6404 155.715 70.6164 157.245 82.0946C168.477 82.9628 179.95 76.3925 186.941 67.933Z" fill="currentColor" fillOpacity="0.7"/>
  </svg>
)

const HeroInktide = ({ onSignUpClick }: HeroInktideProps) => {
  const { t } = useTranslation('landing')

  const detectedOS = useMemo<'mac' | 'windows'>(() => {
    const ua = navigator.userAgent
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac/.test(ua)
      ? 'mac'
      : 'windows'
  }, [])

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>

        {/* ── Left column ── */}
        <div className={styles.leftColumn}>
          <h1 className={styles.title}>
            Write your{' '}
            <span className={styles.titleAccentWrapper}>
              <span className={styles.titleAccent}>destiny</span>
              <DestinyUnderline className={styles.destinyUnderline} aria-hidden />
            </span>
            {' '}in a couple of clicks
          </h1>
          <p className={styles.subtitle}>{t('hero.subtitle')}</p>
          <button type="button" className={styles.ctaButton} onClick={onSignUpClick}>
            Sign up for free
          </button>
          <div className={styles.downloadBlock}>
            <p className={styles.downloadLabel}>Download desktop app for</p>
            <div className={styles.osIcons}>
              {detectedOS === 'mac' ? (
                <>
                  <a href="#" className={classnames(styles.osIcon, styles.osIconActive)} aria-label="macOS">
                    <MacIcon />
                    <span>MacOS</span>
                  </a>
                  <a href="#" className={styles.osIcon} aria-label="Windows">
                    <WindowsIcon />
                    <span>Windows</span>
                  </a>
                </>
              ) : (
                <>
                  <a href="#" className={classnames(styles.osIcon, styles.osIconActive)} aria-label="Windows">
                    <WindowsIcon />
                    <span>Windows</span>
                  </a>
                  <a href="#" className={styles.osIcon} aria-label="macOS">
                    <MacIcon />
                    <span>MacOS</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: hero video ── */}
        <div className={styles.rightColumn}>
          <div className={styles.videoCard}>
            <video
              src="/videos/hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              className={styles.heroVideo}
            />
          </div>
        </div>

      </div>
      <div className={styles.logosWrapper}>
        <PartnerLogos />
      </div>
    </section>
  )
}

export default HeroInktide
