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

const MOOD_OPTIONS = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'happy', label: 'Happy' },
  { value: 'chill', label: 'Chill' },
  { value: 'hyped', label: 'Hyped' },
  { value: 'sarcastic', label: 'Sarcastic' },
]

interface BehaviorTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const BehaviorTab = ({ character, onUpdate }: BehaviorTabProps) => (
  <div className={styles.tabRoot}>
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Response</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <div className={styles.sliderLabelBlock}>
                <label className={styles.label}>Response delay</label>
                <div className={styles.labelHint}>Time to wait before sending the reply to chat</div>
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
                <label className={styles.label}>Max response length</label>
                <div className={styles.labelHint}>Maximum number of characters per reply</div>
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
            <label className={styles.label}>Language</label>
            <div className={styles.labelHint}>Primary language for AI responses</div>
            <CustomSelect
              value={character.behavior.language}
              options={LANGUAGE_OPTIONS}
              onChange={(v) => onUpdate({ behavior: { ...character.behavior, language: v } })}
            />
          </div>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Auto-moderate</div>
              <div className={styles.toggleHint}>Filter inappropriate content automatically</div>
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
              <div className={styles.toggleLabel}>Typing simulation</div>
              <div className={styles.toggleHint}>Show typing indicator before responding</div>
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
      <div className={styles.sectionTitle}>LLM Config</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <div className={styles.sliderLabelBlock}>
                <label className={styles.label}>Temperature</label>
                <div className={styles.labelHint}>Higher values make output more random and creative</div>
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
                <label className={styles.label}>Max tokens</label>
                <div className={styles.labelHint}>Maximum length of the generated response</div>
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
                <label className={styles.label}>Top P</label>
                <div className={styles.labelHint}>Nucleus sampling — controls diversity of output</div>
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
                <label className={styles.label}>Frequency penalty</label>
                <div className={styles.labelHint}>Reduces repetition of the same phrases</div>
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
                <label className={styles.label}>Presence penalty</label>
                <div className={styles.labelHint}>Encourages talking about new topics</div>
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
      <div className={styles.sectionTitle}>Memory</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Enable memory</div>
              <div className={styles.toggleHint}>AI remembers past conversations</div>
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

    <div className={styles.section}>
      <div className={styles.sectionTitle}>Auto-Pilot</div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardContent}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Enable autonomous mode</div>
              <div className={styles.toggleHint}>AI speaks on its own when chat is quiet</div>
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
                  <label className={styles.label}>Idle timeout</label>
                  <div className={styles.labelHint}>Seconds of silence before AI can speak on its own</div>
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
                  <label className={styles.label}>Min interval</label>
                  <div className={styles.labelHint}>Minimum seconds between autonomous messages</div>
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
              <label className={styles.label}>Mood</label>
              <div className={styles.labelHint}>Default emotional tone for autonomous messages</div>
              <CustomSelect
                value={character.autoPilot.mood}
                options={MOOD_OPTIONS}
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

export default BehaviorTab
