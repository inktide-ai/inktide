import styles from '../ProfilePage.module.css'
import CustomSelect from '../CustomSelect'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '../types'

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
              <span className={styles.sliderValue}>{character.responseDelayMs}ms</span>
            </div>
            <SliderWithTicks
              min={0}
              max={5000}
              step={100}
              value={character.responseDelayMs}
              onChange={(v) => onUpdate({ responseDelayMs: v })}
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
              <span className={styles.sliderValue}>{character.maxResponseLength} chars</span>
            </div>
            <SliderWithTicks
              min={50}
              max={2000}
              step={50}
              value={character.maxResponseLength}
              onChange={(v) => onUpdate({ maxResponseLength: v })}
              formatValue={(v) => String(v)}
              tickCount={5}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Language</label>
            <div className={styles.labelHint}>Primary language for AI responses</div>
            <CustomSelect
              value={character.language}
              options={LANGUAGE_OPTIONS}
              onChange={(v) => onUpdate({ language: v })}
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
                checked={character.autoModerate}
                onChange={(e) => onUpdate({ autoModerate: e.target.checked })}
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
                checked={character.typingSimulation}
                onChange={(e) => onUpdate({ typingSimulation: e.target.checked })}
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
              <span className={styles.sliderValue}>{character.temperature.toFixed(2)}</span>
            </div>
            <SliderWithTicks
              min={0}
              max={2}
              step={0.05}
              value={character.temperature}
              onChange={(v) => onUpdate({ temperature: v })}
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
              <span className={styles.sliderValue}>{character.maxTokens}</span>
            </div>
            <SliderWithTicks
              min={64}
              max={4096}
              step={64}
              value={character.maxTokens}
              onChange={(v) => onUpdate({ maxTokens: v })}
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
              <span className={styles.sliderValue}>{character.topP.toFixed(2)}</span>
            </div>
            <SliderWithTicks
              min={0}
              max={1}
              step={0.05}
              value={character.topP}
              onChange={(v) => onUpdate({ topP: v })}
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
              <span className={styles.sliderValue}>{character.frequencyPenalty.toFixed(2)}</span>
            </div>
            <SliderWithTicks
              min={0}
              max={2}
              step={0.05}
              value={character.frequencyPenalty}
              onChange={(v) => onUpdate({ frequencyPenalty: v })}
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
              <span className={styles.sliderValue}>{character.presencePenalty.toFixed(2)}</span>
            </div>
            <SliderWithTicks
              min={0}
              max={2}
              step={0.05}
              value={character.presencePenalty}
              onChange={(v) => onUpdate({ presencePenalty: v })}
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
                checked={character.memoryEnabled}
                onChange={(e) => onUpdate({ memoryEnabled: e.target.checked })}
              />
              <span className={styles.control} />
            </label>
          </div>
          <div className={!character.memoryEnabled ? styles.inactiveBlock : undefined}>
            <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>Max memories</label>
                    <div className={styles.labelHint}>How many facts the AI can remember</div>
                  </div>
                  <span className={styles.sliderValue}>{character.maxMemories}</span>
                </div>
                <SliderWithTicks
                  min={10}
                  max={500}
                  step={10}
                  value={character.maxMemories}
                  onChange={(v) => onUpdate({ maxMemories: v })}
                  formatValue={(v) => String(v)}
                  tickCount={5}
                  disabled={!character.memoryEnabled}
                />
              </div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>Retention days</label>
                    <div className={styles.labelHint}>How long memories are kept before expiring</div>
                  </div>
                  <span className={styles.sliderValue}>{character.retentionDays}d</span>
                </div>
                <SliderWithTicks
                  min={1}
                  max={365}
                  step={1}
                  value={character.retentionDays}
                  onChange={(v) => onUpdate({ retentionDays: v })}
                  formatValue={(v) => `${v}d`}
                  tickCount={6}
                  disabled={!character.memoryEnabled}
                />
              </div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>Importance threshold</label>
                    <div className={styles.labelHint}>Minimum score for a fact to be stored</div>
                  </div>
                  <span className={styles.sliderValue}>{character.importanceThreshold.toFixed(2)}</span>
                </div>
                <SliderWithTicks
                  min={0}
                  max={1}
                  step={0.05}
                  value={character.importanceThreshold}
                  onChange={(v) => onUpdate({ importanceThreshold: v })}
                  formatValue={(v) => v.toFixed(1)}
                  tickCount={5}
                  disabled={!character.memoryEnabled}
                />
              </div>
          </div>
        </div>
      </div>
    </div>

    <div className={styles.section}>
      <div className={styles.sectionTitle}>Donkey Engine</div>
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
                checked={character.donkeyEnabled}
                onChange={(e) => onUpdate({ donkeyEnabled: e.target.checked })}
              />
              <span className={styles.control} />
            </label>
          </div>
          <div className={!character.donkeyEnabled ? styles.inactiveBlock : undefined}>
            <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>Idle timeout</label>
                    <div className={styles.labelHint}>Seconds of silence before AI can speak on its own</div>
                  </div>
                  <span className={styles.sliderValue}>{character.idleTimeoutSeconds}s</span>
                </div>
                <SliderWithTicks
                  min={30}
                  max={600}
                  step={10}
                  value={character.idleTimeoutSeconds}
                  onChange={(v) => onUpdate({ idleTimeoutSeconds: v })}
                  formatValue={(v) => `${v}s`}
                  tickCount={6}
                  disabled={!character.donkeyEnabled}
                />
              </div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <div className={styles.sliderLabelBlock}>
                    <label className={styles.label}>Min interval</label>
                    <div className={styles.labelHint}>Minimum seconds between autonomous messages</div>
                  </div>
                  <span className={styles.sliderValue}>{character.minIntervalSeconds}s</span>
                </div>
                <SliderWithTicks
                  min={10}
                  max={300}
                  step={10}
                  value={character.minIntervalSeconds}
                  onChange={(v) => onUpdate({ minIntervalSeconds: v })}
                  formatValue={(v) => `${v}s`}
                  tickCount={6}
                  disabled={!character.donkeyEnabled}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Mood</label>
                <div className={styles.labelHint}>Default emotional tone for autonomous messages</div>
                <CustomSelect
                  value={character.mood}
                  options={MOOD_OPTIONS}
                  onChange={(v) => onUpdate({ mood: v })}
                  disabled={!character.donkeyEnabled}
                />
              </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default BehaviorTab
