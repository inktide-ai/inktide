import styles from '../ProfilePage.module.css'
import type { AiCharacter } from '../types'

interface PromptsTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const PromptsTab = ({ character, onUpdate }: PromptsTabProps) => (
  <div className={styles.tabRoot}>
    <div className={styles.section}>
      <div className={styles.sectionTitle}>System Prompt</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Core instructions</label>
            <div className={styles.labelHint}>Define the AI's personality, behavior, and context. Sent at the start of every conversation.</div>
            <textarea
              className={styles.textareaLarge}
              value={character.systemPrompt}
              onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
              placeholder="You are a friendly AI companion on a live stream. You interact with chat, react to events, and entertain viewers."
              rows={10}
            />
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {character.systemPrompt.length} characters · Sent at the start of every conversation
          </p>
        </div>
      </div>
    </div>
  </div>
)

export default PromptsTab
