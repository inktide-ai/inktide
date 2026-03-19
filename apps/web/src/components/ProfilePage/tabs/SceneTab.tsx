import styles from '../ProfilePage.module.css'
import type { AiCharacter } from '../types'

interface SceneTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const SceneTab = ({ character: _character, onUpdate: _onUpdate }: SceneTabProps) => (
  <div className={styles.tabRoot}>
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Environment</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}>🏠</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Scene Configuration
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              Configure the environment where your character lives — backgrounds, overlays,
              interactive elements, and ambient effects. This section is coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default SceneTab
