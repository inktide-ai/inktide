import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PROVIDER_DEFS } from '../../../constants/providerDefs'
import { getCredentials, type CredentialResponse } from '../../../api/soul'
import { profileSettingsPath } from '../../../constants/settingsRoutes'
import styles from '../../../components/ProfilePage/ProfilePage.module.css'

const PROVIDER_ICONS: Record<string, string> = {
  ollama:    '🦙',
  anthropic: '◆',
  deepseek:  '⚡',
}

export default function ProvidersPage() {
  const { t } = useTranslation(['providers'])
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState<CredentialResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCredentials()
      .then(setCredentials)
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false))
  }, [])

  const hasKey = (providerId: string) =>
    credentials.find((c) => c.providerId === providerId)?.hasKey ?? false

  return (
    <div className={styles.tabRoot}>
      <div className={styles.pgHeaderCard}>
        <div className={styles.pgHeaderTitle}>{t('providers:page.title')}</div>
        <div className={styles.pgHeaderDesc}>{t('providers:page.desc')}</div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <div className={styles.pgGrid}>
          {PROVIDER_DEFS.map((def) => {
            const connected = !def.requiresKey || hasKey(def.id)
            return (
              <div
                key={def.id}
                className={styles.pgCard}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`${profileSettingsPath('providers')}/${def.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    navigate(`${profileSettingsPath('providers')}/${def.id}`)
                }}
              >
                <div className={styles.pgGhostIcon}>{PROVIDER_ICONS[def.id] ?? '🔌'}</div>
                <div className={styles.pgName}>{def.name}</div>
                <div className={styles.pgDesc}>{def.description}</div>
                <div className={styles.pgFooter}>
                  <span className={connected ? styles.statusDotActive : styles.statusDotInactive} />
                  <span className={styles.pgStatusLabel}>
                    {connected
                      ? t('providers:status.connected')
                      : t('providers:status.notConnected')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
