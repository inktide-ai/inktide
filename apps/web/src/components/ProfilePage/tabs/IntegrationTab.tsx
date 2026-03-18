import styles from '../ProfilePage.module.css'
import type { AiCharacter } from '../types'

interface IntegrationTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const IntegrationTab = ({ character, onUpdate: _onUpdate }: IntegrationTabProps) => (
  <div className={styles.tabRoot}>
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Integration</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Connect this character to external services, APIs, and platforms. Configure webhooks, OAuth providers,
            and third-party integrations. This section is under development.
          </p>
        </div>
      </div>
    </div>
  </div>
)

export default IntegrationTab
