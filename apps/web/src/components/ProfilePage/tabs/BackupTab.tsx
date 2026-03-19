import styles from '../ProfilePage.module.css'
import type { AiCharacter } from '../types'

interface BackupTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const BackupTab = ({ character: _character, onUpdate: _onUpdate }: BackupTabProps) => (
  <div className={styles.tabRoot}>
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Backup & Restore</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}>💾</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Backup
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              Export your character configuration as a backup file, or restore from a previous backup.
              This section is coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default BackupTab
