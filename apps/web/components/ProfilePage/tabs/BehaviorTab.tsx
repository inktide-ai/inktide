'use client'
import { useTranslation } from 'react-i18next'
import styles from '../ProfilePage.module.css'
import CustomSelect from '../CustomSelect'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '@/lib/character'

// Language labels are intentionally in their native script — not translated
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

interface BehaviorTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const BehaviorTab = ({ character, onUpdate }: BehaviorTabProps) => {
  const { t } = useTranslation('behavior')

  const moodOptions = [
    { value: 'neutral', label: t('autoPilot.mood.neutral') },
    { value: 'happy', label: t('autoPilot.mood.happy') },
    { value: 'chill', label: t('autoPilot.mood.chill') },
    { value: 'hyped', label: t('autoPilot.mood.hyped') },
    { value: 'sarcastic', label: t('autoPilot.mood.sarcastic') },
  ]

  return (
    <div className={styles.tabRoot}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('section.response')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('response.delay.label')}</label>
                  <div className={styles.labelHint}>{t('response.delay.hint')}</div>
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
                  <label className={styles.label}>{t('response.maxLength.label')}</label>
                  <div className={styles.labelHint}>{t('response.maxLength.hint')}</div>
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
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('response.emotionScale.label')}</label>
                  <div className={styles.labelHint}>{t('response.emotionScale.hint')}</div>
                </div>
                <span className={styles.sliderValue}>{character.behavior.emotionIntensityScale.toFixed(2)}×</span>
              </div>
              <SliderWithTicks
                min={0} max={2} step={0.05}
                value={character.behavior.emotionIntensityScale}
                onChange={(v) => onUpdate({ behavior: { ...character.behavior, emotionIntensityScale: v } })}
                formatValue={(v) => v.toFixed(1)}
                tickCount={5}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('response.language.label')}</label>
              <div className={styles.labelHint}>{t('response.language.hint')}</div>
              <CustomSelect
                value={character.behavior.language}
                options={LANGUAGE_OPTIONS}
                onChange={(v) => onUpdate({ behavior: { ...character.behavior, language: v } })}
              />
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{t('response.autoModerate.label')}</div>
                <div className={styles.toggleHint}>{t('response.autoModerate.hint')}</div>
              </div>
              <label className={styles.toggleControl}>
                <input
                  type="checkbox"
                  checked={character.behavior.autoModerate}
                  onChange={(e) => onUpdate({ behavior: { ...character.behavior, autoModerate: e.target.checked } })}
                />
                <span className={styles.control} />
              </label>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{t('response.typingSimulation.label')}</div>
                <div className={styles.toggleHint}>{t('response.typingSimulation.hint')}</div>
              </div>
              <label className={styles.toggleControl}>
                <input
                  type="checkbox"
                  checked={character.behavior.typingSimulation}
                  onChange={(e) => onUpdate({ behavior: { ...character.behavior, typingSimulation: e.target.checked } })}
                />
                <span className={styles.control} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('section.llmConfig')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('llm.temperature.label')}</label>
                  <div className={styles.labelHint}>{t('llm.temperature.hint')}</div>
                </div>
                <span className={styles.sliderValue}>{character.llm.temperature.toFixed(2)}</span>
              </div>
              <SliderWithTicks
                min={0} max={2} step={0.05}
                value={character.llm.temperature}
                onChange={(v) => onUpdate({ llm: { ...character.llm, temperature: v } })}
                formatValue={(v) => v.toFixed(1)}
                tickCount={5}
              />
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('llm.maxTokens.label')}</label>
                  <div className={styles.labelHint}>{t('llm.maxTokens.hint')}</div>
                </div>
                <span className={styles.sliderValue}>{character.llm.maxTokens}</span>
              </div>
              <SliderWithTicks
                min={64} max={4096} step={64}
                value={character.llm.maxTokens}
                onChange={(v) => onUpdate({ llm: { ...character.llm, maxTokens: v } })}
                formatValue={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                tickCount={5}
              />
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('llm.topP.label')}</label>
                  <div className={styles.labelHint}>{t('llm.topP.hint')}</div>
                </div>
                <span className={styles.sliderValue}>{character.llm.topP.toFixed(2)}</span>
              </div>
              <SliderWithTicks
                min={0} max={1} step={0.05}
                value={character.llm.topP}
                onChange={(v) => onUpdate({ llm: { ...character.llm, topP: v } })}
                formatValue={(v) => v.toFixed(1)}
                tickCount={5}
              />
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('llm.frequencyPenalty.label')}</label>
                  <div className={styles.labelHint}>{t('llm.frequencyPenalty.hint')}</div>
                </div>
                <span className={styles.sliderValue}>{character.llm.frequencyPenalty.toFixed(2)}</span>
              </div>
              <SliderWithTicks
                min={0} max={2} step={0.05}
                value={character.llm.frequencyPenalty}
                onChange={(v) => onUpdate({ llm: { ...character.llm, frequencyPenalty: v } })}
                formatValue={(v) => v.toFixed(1)}
                tickCount={5}
              />
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>{t('llm.presencePenalty.label')}</label>
                  <div className={styles.labelHint}>{t('llm.presencePenalty.hint')}</div>
                </div>
                <span className={styles.sliderValue}>{character.llm.presencePenalty.toFixed(2)}</span>
              </div>
              <SliderWithTicks
                min={0} max={2} step={0.05}
                value={character.llm.presencePenalty}
                onChange={(v) => onUpdate({ llm: { ...character.llm, presencePenalty: v } })}
                formatValue={(v) => v.toFixed(1)}
                tickCount={5}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('section.memory')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{t('memory.enable.label')}</div>
                <div className={styles.toggleHint}>{t('memory.enable.hint')}</div>
              </div>
              <label className={styles.toggleControl}>
                <input
                  type="checkbox"
                  checked={character.memory.enabled}
                  onChange={(e) => onUpdate({ memory: { ...character.memory, enabled: e.target.checked } })}
                />
                <span className={styles.control} />
              </label>
            </div>
            <div className={!character.memory.enabled ? styles.inactiveBlock : undefined}>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>{t('memory.maxMemories.label')}</label>
                    <div className={styles.labelHint}>{t('memory.maxMemories.hint')}</div>
                  </div>
                  <span className={styles.sliderValue}>{character.memory.maxMemories}</span>
                </div>
                <SliderWithTicks
                  min={10} max={500} step={10}
                  value={character.memory.maxMemories}
                  onChange={(v) => onUpdate({ memory: { ...character.memory, maxMemories: v } })}
                  formatValue={(v) => String(v)}
                  tickCount={5}
                  disabled={!character.memory.enabled}
                />
              </div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>{t('memory.retentionDays.label')}</label>
                    <div className={styles.labelHint}>{t('memory.retentionDays.hint')}</div>
                  </div>
                  <span className={styles.sliderValue}>{character.memory.retentionDays}d</span>
                </div>
                <SliderWithTicks
                  min={1} max={365} step={1}
                  value={character.memory.retentionDays}
                  onChange={(v) => onUpdate({ memory: { ...character.memory, retentionDays: v } })}
                  formatValue={(v) => `${v}d`}
                  tickCount={6}
                  disabled={!character.memory.enabled}
                />
              </div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>{t('memory.importanceThreshold.label')}</label>
                    <div className={styles.labelHint}>{t('memory.importanceThreshold.hint')}</div>
                  </div>
                  <span className={styles.sliderValue}>{character.memory.importanceThreshold.toFixed(2)}</span>
                </div>
                <SliderWithTicks
                  min={0} max={1} step={0.05}
                  value={character.memory.importanceThreshold}
                  onChange={(v) => onUpdate({ memory: { ...character.memory, importanceThreshold: v } })}
                  formatValue={(v) => v.toFixed(1)}
                  tickCount={5}
                  disabled={!character.memory.enabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('section.autoPilot')}</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{t('autoPilot.enable.label')}</div>
                <div className={styles.toggleHint}>{t('autoPilot.enable.hint')}</div>
              </div>
              <label className={styles.toggleControl}>
                <input
                  type="checkbox"
                  checked={character.autoPilot.enabled}
                  onChange={(e) => onUpdate({ autoPilot: { ...character.autoPilot, enabled: e.target.checked } })}
                />
                <span className={styles.control} />
              </label>
            </div>
            <div className={!character.autoPilot.enabled ? styles.inactiveBlock : undefined}>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>{t('autoPilot.idleTimeout.label')}</label>
                    <div className={styles.labelHint}>{t('autoPilot.idleTimeout.hint')}</div>
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
                    <label className={styles.label}>{t('autoPilot.minInterval.label')}</label>
                    <div className={styles.labelHint}>{t('autoPilot.minInterval.hint')}</div>
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
                <label className={styles.label}>{t('autoPilot.mood.label')}</label>
                <div className={styles.labelHint}>{t('autoPilot.mood.hint')}</div>
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

export default BehaviorTab
