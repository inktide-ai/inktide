import styles from '../ProfilePage.module.css'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '../../../domain/character'

interface MemoryTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const MemoryTab = ({ character, onUpdate }: MemoryTabProps) => (
  <div className={styles.tabRoot}>
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Memory Storage</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Enable memory</div>
              <div className={styles.toggleHint}>AI remembers past conversations and viewer preferences</div>
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
                  <label className={styles.label}>Max memories</label>
                  <div className={styles.labelHint}>How many facts the AI can remember</div>
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
                  <label className={styles.label}>Retention days</label>
                  <div className={styles.labelHint}>How long memories are kept before expiring</div>
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
                  <label className={styles.label}>Importance threshold</label>
                  <div className={styles.labelHint}>Minimum score for a fact to be stored</div>
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

export default MemoryTab
