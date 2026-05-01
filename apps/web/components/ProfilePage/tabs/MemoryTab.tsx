'use client'
import { useTranslation } from 'react-i18next'
import styles from '../ProfilePage.module.css'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '@/lib/character'

interface MemoryTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const MemoryTab = ({ character, onUpdate }: MemoryTabProps) => {
  const { t } = useTranslation('behavior')

  return (
    <div className={styles.tabRoot}>
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
    </div>
  )
}

export default MemoryTab
