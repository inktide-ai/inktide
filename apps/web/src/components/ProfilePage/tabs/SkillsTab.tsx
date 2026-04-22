import { useTranslation } from 'react-i18next'
import styles from '../ProfilePage.module.css'
import CustomSelect from '../CustomSelect'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '../../../domain/character'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

interface SkillsTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const SkillsTab = ({ character, onUpdate }: SkillsTabProps) => {
  const { t } = useTranslation(['prompts', 'behavior'])

  const moodOptions = [
    { value: 'neutral', label: t('behavior:autoPilot.mood.neutral') },
    { value: 'happy', label: t('behavior:autoPilot.mood.happy') },
    { value: 'chill', label: t('behavior:autoPilot.mood.chill') },
    { value: 'hyped', label: t('behavior:autoPilot.mood.hyped') },
    { value: 'sarcastic', label: t('behavior:autoPilot.mood.sarcastic') },
  ]

  return (
    <div className={styles.tabRoot}>
      {/* ── System Prompt ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('prompts:section.systemPrompt')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.formGroup}>
              <label className={styles.labelBlock}>
                <span className={styles.label}>{t('prompts:coreInstructions.label')}</span>
                <div className={styles.labelHint}>{t('prompts:coreInstructions.hint')}</div>
                <textarea
                  id="skills-system-prompt"
                  name="systemPrompt"
                  className={styles.textareaLarge}
                  value={character.systemPrompt}
                  onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
                  placeholder={t('prompts:coreInstructions.placeholder')}
                  rows={10}
                />
              </label>
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {t('prompts:coreInstructions.counter', { count: character.systemPrompt.length })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Response Settings ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('behavior:section.response')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('behavior:response.delay.label')}</label>
                  <div className={styles.labelHint}>{t('behavior:response.delay.hint')}</div>
                </div>
                <span className={styles.sliderValue}>{character.behavior.responseDelayMs}ms</span>
              </div>
              <SliderWithTicks
                min={0} max={5000} step={100}
                value={character.behavior.responseDelayMs}
                onChange={(v) => onUpdate({ behavior: { ...character.behavior, responseDelayMs: v } })}
                formatValue={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                tickCount={6}
              />
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('behavior:response.maxLength.label')}</label>
                  <div className={styles.labelHint}>{t('behavior:response.maxLength.hint')}</div>
                </div>
                <span className={styles.sliderValue}>{character.behavior.maxResponseLength} chars</span>
              </div>
              <SliderWithTicks
                min={50} max={2000} step={50}
                value={character.behavior.maxResponseLength}
                onChange={(v) => onUpdate({ behavior: { ...character.behavior, maxResponseLength: v } })}
                formatValue={(v) => String(v)}
                tickCount={5}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('behavior:response.language.label')}</label>
              <div className={styles.labelHint}>{t('behavior:response.language.hint')}</div>
              <CustomSelect
                value={character.behavior.language}
                options={LANGUAGE_OPTIONS}
                onChange={(v) => onUpdate({ behavior: { ...character.behavior, language: v } })}
              />
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{t('behavior:response.autoModerate.label')}</div>
                <div className={styles.toggleHint}>{t('behavior:response.autoModerate.hint')}</div>
              </div>
              <label className={styles.toggleControl}>
                <input type="checkbox" checked={character.behavior.autoModerate} onChange={(e) => onUpdate({ behavior: { ...character.behavior, autoModerate: e.target.checked } })} />
                <span className={styles.control} />
              </label>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{t('behavior:response.typingSimulation.label')}</div>
                <div className={styles.toggleHint}>{t('behavior:response.typingSimulation.hint')}</div>
              </div>
              <label className={styles.toggleControl}>
                <input type="checkbox" checked={character.behavior.typingSimulation} onChange={(e) => onUpdate({ behavior: { ...character.behavior, typingSimulation: e.target.checked } })} />
                <span className={styles.control} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Auto-Pilot (Autonomous) ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('behavior:section.autoPilot')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{t('behavior:autoPilot.enable.label')}</div>
                <div className={styles.toggleHint}>{t('behavior:autoPilot.enable.hint')}</div>
              </div>
              <label className={styles.toggleControl}>
                <input type="checkbox" checked={character.autoPilot.enabled} onChange={(e) => onUpdate({ autoPilot: { ...character.autoPilot, enabled: e.target.checked } })} />
                <span className={styles.control} />
              </label>
            </div>
            <div className={!character.autoPilot.enabled ? styles.inactiveBlock : undefined}>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>{t('behavior:autoPilot.idleTimeout.label')}</label>
                    <div className={styles.labelHint}>{t('behavior:autoPilot.idleTimeout.hint')}</div>
                  </div>
                  <span className={styles.sliderValue}>{character.autoPilot.idleTimeoutSeconds}s</span>
                </div>
                <SliderWithTicks
                  min={30} max={600} step={10}
                  value={character.autoPilot.idleTimeoutSeconds}
                  onChange={(v) => onUpdate({ autoPilot: { ...character.autoPilot, idleTimeoutSeconds: v } })}
                  formatValue={(v) => `${v}s`}
                  tickCount={6}
                  disabled={!character.autoPilot.enabled}
                />
              </div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>{t('behavior:autoPilot.minInterval.label')}</label>
                    <div className={styles.labelHint}>{t('behavior:autoPilot.minInterval.hint')}</div>
                  </div>
                  <span className={styles.sliderValue}>{character.autoPilot.minIntervalSeconds}s</span>
                </div>
                <SliderWithTicks
                  min={10} max={300} step={10}
                  value={character.autoPilot.minIntervalSeconds}
                  onChange={(v) => onUpdate({ autoPilot: { ...character.autoPilot, minIntervalSeconds: v } })}
                  formatValue={(v) => `${v}s`}
                  tickCount={6}
                  disabled={!character.autoPilot.enabled}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('behavior:autoPilot.mood.label')}</label>
                <div className={styles.labelHint}>{t('behavior:autoPilot.mood.hint')}</div>
                <CustomSelect
                  value={character.autoPilot.mood}
                  options={moodOptions}
                  onChange={(v) => onUpdate({ autoPilot: { ...character.autoPilot, mood: v } })}
                  disabled={!character.autoPilot.enabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkillsTab
