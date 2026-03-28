import { CONTENT } from '../../constants'
import PartnerLogos from '../PartnerLogos'
import styles from './HeroChimera.module.css'

interface HeroChimeraProps {
  onSignUpClick: () => void
}

const HeroChimera = ({ onSignUpClick }: HeroChimeraProps) => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.leftColumn}>
          <h1 className={styles.title}>
            Create your <span className={styles.titleAccent}>AI companion</span> for streaming
          </h1>
          <p className={styles.subtitle}>{CONTENT.hero.subtitle}</p>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={onSignUpClick}
          >
            {CONTENT.hero.ctaPrimary}
          </button>
          <div className={styles.downloadBlock}>
            <p className={styles.downloadLabel}>{CONTENT.hero.downloadLabel}</p>
            <div className={styles.osIcons}>
              <a href="#" className={styles.osIcon} aria-label="Windows">
                <svg width="40" height="40" viewBox="0 0 42 43" fill="none">
                  <g opacity="0.75" clipPath="url(#clip0_windows)">
                    <path d="M38 0.851562H4C1.79086 0.851562 0 2.64242 0 4.85156V38.8516C0 41.0607 1.79086 42.8516 4 42.8516H38C40.2091 42.8516 42 41.0607 42 38.8516V4.85156C42 2.64242 40.2091 0.851562 38 0.851562Z" fill="#272F3A" />
                    <path d="M20.02 11.8816V21.0616C20.02 21.1716 20.11 21.2616 20.22 21.2616H32.81C32.92 21.2616 33.01 21.1716 33.01 21.0616V10.0416C33.01 9.98155 32.99 9.93155 32.94 9.89155C32.9 9.85155 32.84 9.84155 32.78 9.84155L20.19 11.6716C20.09 11.6816 20.02 11.7716 20.02 11.8616V11.8816Z" fill="#CCCCCC" />
                    <path d="M18.64 31.8815C18.64 31.8815 18.73 31.8615 18.77 31.8315C18.81 31.7915 18.84 31.7415 18.84 31.6815V22.6315C18.84 22.5215 18.75 22.4315 18.64 22.4315H9.2C9.15 22.4315 9.1 22.4515 9.06 22.4915C9.02 22.5315 9 22.5815 9 22.6315V30.3815C9 30.4815 9.07 30.5615 9.17 30.5715L18.61 31.8615C18.61 31.8615 18.63 31.8615 18.64 31.8615V31.8815Z" fill="#CCCCCC" />
                    <path d="M9.21 21.2616H18.64C18.75 21.2616 18.84 21.1716 18.84 21.0616V12.1016C18.84 12.0416 18.82 11.9916 18.77 11.9516C18.73 11.9116 18.67 11.9016 18.61 11.9016L9.17 13.1816C9.07 13.1916 9 13.2816 9 13.3816V21.0516C9 21.1616 9.1 21.2516 9.21 21.2516V21.2616Z" fill="#CCCCCC" />
                    <path d="M32.8 33.8515C32.8 33.8515 32.89 33.8315 32.93 33.8015C32.97 33.7615 33 33.7115 33 33.6515V22.6315C33 22.5815 32.98 22.5315 32.95 22.4915C32.91 22.4515 32.86 22.4315 32.81 22.4315H20.22C20.11 22.4315 20.02 22.5215 20.02 22.6315V31.8815C20.02 31.9815 20.09 32.0615 20.19 32.0715L32.78 33.8415C32.78 33.8415 32.8 33.8415 32.81 33.8415L32.8 33.8515Z" fill="#CCCCCC" />
                  </g>
                  <defs>
                    <clipPath id="clip0_windows">
                      <rect width="42" height="42" fill="#272F3A" transform="translate(0 0.851562)" />
                    </clipPath>
                  </defs>
                </svg>
              </a>
              <a href="#" className={styles.osIcon} aria-label="macOS">
                <svg width="40" height="40" viewBox="0 0 307 307" fill="none" opacity="0.75">
                  <rect width="307" height="307" rx="50" fill="#272F3A" />
                  <path d="M212.133 142.254C212.414 172.52 238.709 182.592 239 182.72C238.778 183.43 234.799 197.073 225.147 211.166C216.803 223.35 208.143 235.488 194.502 235.74C181.098 235.986 176.788 227.799 161.463 227.799C146.143 227.799 141.355 235.489 128.666 235.987C115.499 236.485 105.472 222.812 97.0591 210.673C79.8683 185.842 66.7309 140.508 84.371 109.906C93.1343 94.7092 108.795 85.0859 125.793 84.8391C138.723 84.5927 150.927 93.53 158.832 93.53C166.731 93.53 181.562 82.7821 197.153 84.3605C203.68 84.632 222.002 86.9947 233.767 104.199C232.819 104.786 211.905 116.95 212.133 142.254ZM186.941 67.933C193.932 59.4789 198.637 47.71 197.353 36C187.277 36.4046 175.092 42.7085 167.865 51.158C161.387 58.6404 155.715 70.6164 157.245 82.0946C168.477 82.9628 179.95 76.3925 186.941 67.933Z" fill="#CCCCCC" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.appMockup}>
            <div className={styles.mockupHeader}>
              <div className={styles.mockupControls}>
                <span />
                <span />
                <span />
              </div>
              <span className={styles.mockupTitle}>Chimera — AI Setup</span>
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.mockupSidebar}>
                <div className={styles.mockupItem}>Characters</div>
                <div className={styles.mockupItem}>Prompts</div>
                <div className={styles.mockupItemActive}>Behavior</div>
                <div className={styles.mockupItem}>Voice</div>
                <div className={styles.mockupItem}>Appearance</div>
              </div>
              <div className={styles.mockupMain}>
                <div className={styles.mockupField}>
                  <span className={styles.mockupLabel}>Donation reactions</span>
                  <div className={styles.mockupInput} />
                </div>
                <div className={styles.mockupField}>
                  <span className={styles.mockupLabel}>Communication tone</span>
                  <div className={styles.mockupInput} />
                </div>
                <div className={styles.mockupHint}>
                  <span className={styles.mockupPointer}>👆</span>
                  Customize AI parameters to match your style
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.logosWrapper}>
        <PartnerLogos />
      </div>
    </section>
  )
}

export default HeroChimera
