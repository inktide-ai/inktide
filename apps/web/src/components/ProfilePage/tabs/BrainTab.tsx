import styles from '../ProfilePage.module.css'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '../types'

interface BrainTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const BrainTab = ({ character, onUpdate }: BrainTabProps) => (
  <div className={styles.tabRoot}>
    <div className={styles.section}>
      <div className={styles.sectionTitle}>LLM Config</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <div className={styles.sliderLabelBlock}>
                <label className={styles.label}>Temperature</label>
                <div className={styles.labelHint}>Higher values make output more random and creative</div>
              </div>
              <span className={styles.sliderValue}>{character.temperature.toFixed(2)}</span>
            </div>
            <SliderWithTicks min={0} max={2} step={0.05} value={character.temperature} onChange={(v) => onUpdate({ temperature: v })} formatValue={(v) => v.toFixed(1)} tickCount={5} />
          </div>
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <div className={styles.sliderLabelBlock}>
                <label className={styles.label}>Max tokens</label>
                <div className={styles.labelHint}>Maximum length of the generated response</div>
              </div>
              <span className={styles.sliderValue}>{character.maxTokens}</span>
            </div>
            <SliderWithTicks min={64} max={4096} step={64} value={character.maxTokens} onChange={(v) => onUpdate({ maxTokens: v })} formatValue={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} tickCount={5} />
          </div>
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <div className={styles.sliderLabelBlock}>
                <label className={styles.label}>Top P</label>
                <div className={styles.labelHint}>Nucleus sampling — controls diversity of output</div>
              </div>
              <span className={styles.sliderValue}>{character.topP.toFixed(2)}</span>
            </div>
            <SliderWithTicks min={0} max={1} step={0.05} value={character.topP} onChange={(v) => onUpdate({ topP: v })} formatValue={(v) => v.toFixed(1)} tickCount={5} />
          </div>
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <div className={styles.sliderLabelBlock}>
                <label className={styles.label}>Frequency penalty</label>
                <div className={styles.labelHint}>Reduces repetition of the same phrases</div>
              </div>
              <span className={styles.sliderValue}>{character.frequencyPenalty.toFixed(2)}</span>
            </div>
            <SliderWithTicks min={0} max={2} step={0.05} value={character.frequencyPenalty} onChange={(v) => onUpdate({ frequencyPenalty: v })} formatValue={(v) => v.toFixed(1)} tickCount={5} />
          </div>
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <div className={styles.sliderLabelBlock}>
                <label className={styles.label}>Presence penalty</label>
                <div className={styles.labelHint}>Encourages talking about new topics</div>
              </div>
              <span className={styles.sliderValue}>{character.presencePenalty.toFixed(2)}</span>
            </div>
            <SliderWithTicks min={0} max={2} step={0.05} value={character.presencePenalty} onChange={(v) => onUpdate({ presencePenalty: v })} formatValue={(v) => v.toFixed(1)} tickCount={5} />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default BrainTab
