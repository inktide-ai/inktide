import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import PartnerLogos from '../PartnerLogos'
import logoSvg from '../../assets/app/icon.svg'
import {
  IconUser, IconSkills, IconBrain, IconMicrophone, IconPaint,
  IconIntegration, IconScene, IconMemory, IconBackup, IconObs, IconSearch,
} from '../ProfilePage/TabIcons'
import styles from './HeroChimera.module.css'

interface HeroChimeraProps {
  onSignUpClick: () => void
}

// MOCK_TABS is built inside HeroChimera via useMemo to support i18n

const HeroChimera = ({ onSignUpClick }: HeroChimeraProps) => {
  const { t } = useTranslation(['landing', 'profile', 'common'])

  const MOCK_TABS = useMemo(() => [
    { label: t('profile:tabs.profile.label'),    description: t('profile:tabs.profile.desc'),    icon: <IconUser />,        accent: '#ff5252' },
    { label: t('profile:tabs.skills.label'),     description: t('profile:tabs.skills.desc'),     icon: <IconSkills />,      accent: '#fbbf24' },
    { label: t('profile:tabs.avatars.label'),    description: t('profile:tabs.avatars.desc'),    icon: <IconPaint />,       accent: '#f472b6' },
    { label: t('profile:tabs.scene.label'),      description: t('profile:tabs.scene.desc'),      icon: <IconScene />,       accent: '#c4b5fd' },
    { label: t('profile:tabs.memory.label'),     description: t('profile:tabs.memory.desc'),     icon: <IconMemory />,      accent: '#38bdf8' },
    { label: t('profile:tabs.brain.label'),      description: t('profile:tabs.brain.desc'),      icon: <IconBrain />,       accent: '#34d399' },
    { label: t('profile:tabs.voice.label'),      description: t('profile:tabs.voice.desc'),      icon: <IconMicrophone />,  accent: '#f0abfc' },
    { label: t('profile:tabs.connection.label'), description: t('profile:tabs.connection.desc'), icon: <IconIntegration />, accent: '#818cf8' },
    { label: t('profile:tabs.obs.label'),        description: t('profile:tabs.obs.desc'),        icon: <IconObs />,         accent: '#e11d48' },
    { label: t('profile:tabs.backup.label'),     description: t('profile:tabs.backup.desc'),     icon: <IconBackup />,      accent: '#94a3b8' },
  ], [t])

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>

        {/* ── Left column ── */}
        <div className={styles.leftColumn}>
          <h1 className={styles.title}>
            <Trans
              i18nKey="hero.title"
              ns="landing"
              components={{ accent: <span className={styles.titleAccent} /> }}
            />
          </h1>
          <p className={styles.subtitle}>{t('hero.subtitle')}</p>
          <button type="button" className={styles.ctaButton} onClick={onSignUpClick}>
            {t('hero.ctaPrimary')}
          </button>
          <div className={styles.downloadBlock}>
            <p className={styles.downloadLabel}>{t('hero.downloadLabel')}</p>
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

        {/* ── Right column: app mockup ── */}
        <div className={styles.rightColumn}>
          <div className={styles.appMockup}>

            {/* macOS window chrome */}
            <div className={styles.mockupChrome}>
              <div className={styles.mockupControls}>
                <span /><span /><span />
              </div>
              <span className={styles.mockupChromeTitle}>Chimera</span>
            </div>

            {/* Scaled viewport — renders at 1200×700, displayed at 60% */}
            <div className={styles.mockupViewport}>
              <div className={styles.mockupLayout}>

                {/* Sidebar */}
                <aside className={styles.mSidebar}>
                  <div className={styles.mSidebarHeader}>
                    <div className={styles.mLogoRow}>
                      <img src={logoSvg} alt="" className={styles.mLogoIcon} aria-hidden />
                      <span className={styles.mLogoText}>Chimera</span>
                    </div>
                  </div>

                  <div className={styles.mCreateBtn}>
                    <span className={styles.mCreateBtnIcon}>+</span>
                    {t('hero.createNew')}
                  </div>

                  <nav className={styles.mSidebarNav}>
                    <div className={styles.mNavItem}>
                      <span className={styles.mNavIcon}><IconScene /></span>
                      {t('hero.sandbox')}
                    </div>
                  </nav>

                  <div className={styles.mSearch}>
                    <span className={styles.mSearchIcon}><IconSearch /></span>
                    <span className={styles.mSearchPlaceholder}>{t('hero.search')}</span>
                  </div>

                  <div className={styles.mBotSection}>
                    <div className={styles.mBotLabel}>{t('hero.projects')}</div>
                    <div className={`${styles.mBotRow} ${styles.mBotRowActive}`}>
                      <div className={styles.mBotAvatar}>
                        <div className={styles.mBotAvatarInner}>G</div>
                        <span className={styles.mBotStatus} aria-hidden />
                      </div>
                      <div className={styles.mBotInfo}>
                        <div className={styles.mBotNameRow}>
                          <span className={styles.mBotName}>Garry Dubua</span>
                          <span className={styles.mBotTag}>{t('common:badge.bot')}</span>
                        </div>
                        <div className={styles.mBotSlug}>/garry-dubua</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.mSidebarFooter}>
                    <div className={styles.mUserBlock}>
                      <div className={styles.mUserAvatar}>N</div>
                      <div className={styles.mUserInfo}>
                        <div className={styles.mUserName}>nikxprog</div>
                        <div className={styles.mUserSub}>.nikxprog</div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Main area */}
                <main className={styles.mMain}>
                  <div className={styles.mPageHeader}>
                    <div className={styles.mStatusBadge}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                        <circle cx="4" cy="4" r="3" fill="currentColor" />
                      </svg>
                      {t('common:badge.active')}
                    </div>
                  </div>

                  <div className={styles.mTabGrid}>
                    {MOCK_TABS.map(tab => (
                      <div
                        key={tab.label}
                        className={styles.mTabCard}
                        style={{ '--tab-accent': tab.accent } as React.CSSProperties}
                      >
                        <div className={styles.mTabIcon}>{tab.icon}</div>
                        <div className={styles.mTabBody}>
                          <div className={styles.mTabLabel}>{tab.label}</div>
                          <div className={styles.mTabDesc}>{tab.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </main>

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
