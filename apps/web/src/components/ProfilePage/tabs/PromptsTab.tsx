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
            <label className={styles.labelBlock}>
              <span className={styles.label}>Core instructions</span>
              <div className={styles.labelHint}>Define the AI's personality, behavior, and context. Sent at the start of every conversation.</div>
              <textarea
                id="prompts-system-prompt"
                name="systemPrompt"
                className={styles.textareaLarge}
                value={character.systemPrompt}
                onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
                placeholder="e.g. You are a friendly AI companion. Keep responses concise and engaging."
                rows={10}
              />
            </label>
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
