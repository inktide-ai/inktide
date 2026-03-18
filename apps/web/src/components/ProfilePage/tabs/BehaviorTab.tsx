import { useState } from 'react'
import styles from '../ProfilePage.module.css'

interface BehaviorConfig {
  responseDelayMs: number
  maxResponseLength: number
  autoModerate: boolean
  language: string
  typingSimulation: boolean
}

interface LlmConfig {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

interface MemorySettings {
  enabled: boolean
  maxMemories: number
  retentionDays: number
  importanceThreshold: number
}

interface DonkeyEngine {
  enabled: boolean
  idleTimeoutSeconds: number
  minIntervalSeconds: number
  mood: string
}

const BehaviorTab = () => {
  const [behavior, setBehavior] = useState<BehaviorConfig>({
    responseDelayMs: 1500,
    maxResponseLength: 400,
    autoModerate: true,
    language: 'en',
    typingSimulation: true,
  })

  const [llm, setLlm] = useState<LlmConfig>({
    temperature: 0.7,
    maxTokens: 512,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  })

  const [memory, setMemory] = useState<MemorySettings>({
    enabled: true,
    maxMemories: 100,
    retentionDays: 30,
    importanceThreshold: 0.5,
  })

  const [donkey, setDonkey] = useState<DonkeyEngine>({
    enabled: false,
    idleTimeoutSeconds: 120,
    minIntervalSeconds: 60,
    mood: 'neutral',
  })

  return (
    <div className={styles.cardsGrid}>
      {/* Response Settings */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconRed}`}>⚡</div>
          <div>
            <div className={styles.cardTitle}>Response</div>
            <div className={styles.cardDescription}>Timing and output limits</div>
          </div>
        </div>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label className={styles.label}>Response Delay</label>
            <span className={styles.sliderValue}>{behavior.responseDelayMs}ms</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={5000}
            step={100}
            value={behavior.responseDelayMs}
            onChange={(e) => setBehavior((b) => ({ ...b, responseDelayMs: +e.target.value }))}
          />
        </div>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label className={styles.label}>Max Response Length</label>
            <span className={styles.sliderValue}>{behavior.maxResponseLength} chars</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={50}
            max={2000}
            step={50}
            value={behavior.maxResponseLength}
            onChange={(e) => setBehavior((b) => ({ ...b, maxResponseLength: +e.target.value }))}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Language</label>
          <select
            className={styles.select}
            value={behavior.language}
            onChange={(e) => setBehavior((b) => ({ ...b, language: e.target.value }))}
          >
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Auto-moderate</div>
            <div className={styles.toggleHint}>Filter inappropriate content automatically</div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={behavior.autoModerate}
              onChange={(e) => setBehavior((b) => ({ ...b, autoModerate: e.target.checked }))}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Typing simulation</div>
            <div className={styles.toggleHint}>Show typing indicator before responding</div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={behavior.typingSimulation}
              onChange={(e) => setBehavior((b) => ({ ...b, typingSimulation: e.target.checked }))}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>
      </div>

      {/* LLM Config */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>🧠</div>
          <div>
            <div className={styles.cardTitle}>LLM Config</div>
            <div className={styles.cardDescription}>Model generation parameters</div>
          </div>
        </div>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label className={styles.label}>Temperature</label>
            <span className={styles.sliderValue}>{llm.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={2}
            step={0.05}
            value={llm.temperature}
            onChange={(e) => setLlm((l) => ({ ...l, temperature: +e.target.value }))}
          />
        </div>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label className={styles.label}>Max Tokens</label>
            <span className={styles.sliderValue}>{llm.maxTokens}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={64}
            max={4096}
            step={64}
            value={llm.maxTokens}
            onChange={(e) => setLlm((l) => ({ ...l, maxTokens: +e.target.value }))}
          />
        </div>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label className={styles.label}>Top P</label>
            <span className={styles.sliderValue}>{llm.topP.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={1}
            step={0.05}
            value={llm.topP}
            onChange={(e) => setLlm((l) => ({ ...l, topP: +e.target.value }))}
          />
        </div>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label className={styles.label}>Frequency Penalty</label>
            <span className={styles.sliderValue}>{llm.frequencyPenalty.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={2}
            step={0.05}
            value={llm.frequencyPenalty}
            onChange={(e) => setLlm((l) => ({ ...l, frequencyPenalty: +e.target.value }))}
          />
        </div>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label className={styles.label}>Presence Penalty</label>
            <span className={styles.sliderValue}>{llm.presencePenalty.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={2}
            step={0.05}
            value={llm.presencePenalty}
            onChange={(e) => setLlm((l) => ({ ...l, presencePenalty: +e.target.value }))}
          />
        </div>
      </div>

      {/* Memory */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconCyan}`}>🧩</div>
          <div>
            <div className={styles.cardTitle}>Memory</div>
            <div className={styles.cardDescription}>Long-term memory for your AI</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Enable memory</div>
            <div className={styles.toggleHint}>AI remembers past conversations</div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={memory.enabled}
              onChange={(e) => setMemory((m) => ({ ...m, enabled: e.target.checked }))}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>

        {memory.enabled && (
          <>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <label className={styles.label}>Max Memories</label>
                <span className={styles.sliderValue}>{memory.maxMemories}</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={10}
                max={500}
                step={10}
                value={memory.maxMemories}
                onChange={(e) => setMemory((m) => ({ ...m, maxMemories: +e.target.value }))}
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <label className={styles.label}>Retention Days</label>
                <span className={styles.sliderValue}>{memory.retentionDays}d</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={365}
                step={1}
                value={memory.retentionDays}
                onChange={(e) => setMemory((m) => ({ ...m, retentionDays: +e.target.value }))}
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <label className={styles.label}>Importance Threshold</label>
                <span className={styles.sliderValue}>{memory.importanceThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={1}
                step={0.05}
                value={memory.importanceThreshold}
                onChange={(e) => setMemory((m) => ({ ...m, importanceThreshold: +e.target.value }))}
              />
            </div>
          </>
        )}
      </div>

      {/* Donkey Engine */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconPink}`}>🔥</div>
          <div>
            <div className={styles.cardTitle}>Donkey Engine</div>
            <div className={styles.cardDescription}>Autonomous behavior when chat is idle</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Enable autonomous mode</div>
            <div className={styles.toggleHint}>AI speaks on its own when chat is quiet</div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={donkey.enabled}
              onChange={(e) => setDonkey((d) => ({ ...d, enabled: e.target.checked }))}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>

        {donkey.enabled && (
          <>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <label className={styles.label}>Idle Timeout</label>
                <span className={styles.sliderValue}>{donkey.idleTimeoutSeconds}s</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={30}
                max={600}
                step={10}
                value={donkey.idleTimeoutSeconds}
                onChange={(e) => setDonkey((d) => ({ ...d, idleTimeoutSeconds: +e.target.value }))}
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <label className={styles.label}>Min Interval</label>
                <span className={styles.sliderValue}>{donkey.minIntervalSeconds}s</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={10}
                max={300}
                step={10}
                value={donkey.minIntervalSeconds}
                onChange={(e) => setDonkey((d) => ({ ...d, minIntervalSeconds: +e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Mood</label>
              <select
                className={styles.select}
                value={donkey.mood}
                onChange={(e) => setDonkey((d) => ({ ...d, mood: e.target.value }))}
              >
                <option value="neutral">Neutral</option>
                <option value="happy">Happy</option>
                <option value="chill">Chill</option>
                <option value="hyped">Hyped</option>
                <option value="sarcastic">Sarcastic</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BehaviorTab
