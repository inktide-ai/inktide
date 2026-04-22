import { useTranslation } from 'react-i18next'
import styles from '../ProfilePage.module.css'
import type { AiCharacter } from '../../../domain/character'

interface PromptsTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const PromptsTab = ({ character, onUpdate }: PromptsTabProps) => {
  const { t } = useTranslation('prompts')

  return (
    <div className={styles.tabRoot}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('section.systemPrompt')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.formGroup}>
              <label className={styles.labelBlock}>
                <span className={styles.label}>{t('coreInstructions.label')}</span>
                <div className={styles.labelHint}>{t('coreInstructions.hint')}</div>
                <textarea
                  id="prompts-system-prompt"
                  name="systemPrompt"
                  className={styles.textareaLarge}
                  value={character.systemPrompt}
                  onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
                  placeholder={t('coreInstructions.placeholder')}
                  rows={10}
                />
              </label>
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {t('coreInstructions.counter', { count: character.systemPrompt.length })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromptsTab
