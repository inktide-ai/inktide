import { useState } from 'react'
import styles from '../ProfilePage.module.css'

interface TtsVoice {
  id: string
  provider: string
  voiceId: string
  displayName: string
  language: string
  gender: string
  tier: string
}

const CATALOG: TtsVoice[] = [
  { id: '1', provider: 'elevenlabs', voiceId: 'rachel', displayName: 'Rachel', language: 'en', gender: 'female', tier: 'free' },
  { id: '2', provider: 'elevenlabs', voiceId: 'adam', displayName: 'Adam', language: 'en', gender: 'male', tier: 'free' },
  { id: '3', provider: 'elevenlabs', voiceId: 'bella', displayName: 'Bella', language: 'en', gender: 'female', tier: 'pro' },
  { id: '4', provider: 'azure', voiceId: 'en-US-JennyNeural', displayName: 'Jenny', language: 'en', gender: 'female', tier: 'free' },
  { id: '5', provider: 'azure', voiceId: 'en-US-GuyNeural', displayName: 'Guy', language: 'en', gender: 'male', tier: 'free' },
  { id: '6', provider: 'silero', voiceId: 'baya', displayName: 'Baya', language: 'ru', gender: 'female', tier: 'free' },
]

const VoiceTab = () => {
  const [selectedVoice, setSelectedVoice] = useState<string | null>('1')
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(1.0)
  const [stability, setStability] = useState(0.5)
  const [similarityBoost, setSimilarityBoost] = useState(0.75)

  return (
    <div className={styles.cardsGrid}>
      <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconRed}`}>🎙️</div>
          <div>
            <div className={styles.cardTitle}>Text-to-Speech</div>
            <div className={styles.cardDescription}>Give your AI a voice</div>
          </div>
          <label className={styles.toggle} style={{ marginLeft: 'auto' }}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={ttsEnabled}
              onChange={(e) => setTtsEnabled(e.target.checked)}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>

        {ttsEnabled && (
          <>
            <label className={styles.label} style={{ marginBottom: '0.75rem', display: 'block' }}>
              Select Voice
            </label>
            <div className={styles.voiceGrid}>
              {CATALOG.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`${styles.voiceCard} ${selectedVoice === v.id ? styles.voiceCardSelected : ''}`}
                  onClick={() => setSelectedVoice(v.id)}
                >
                  <div className={styles.voiceName}>{v.displayName}</div>
                  <div className={styles.voiceProvider}>{v.provider}</div>
                  <div className={styles.voiceMeta}>
                    <span className={styles.voiceTag}>{v.language}</span>
                    <span className={styles.voiceTag}>{v.gender}</span>
                    <span className={styles.voiceTag}>{v.tier}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {ttsEnabled && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconCyan}`}>🎛️</div>
            <div>
              <div className={styles.cardTitle}>Voice Tuning</div>
              <div className={styles.cardDescription}>Fine-tune the voice output</div>
            </div>
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Speed</label>
              <span className={styles.sliderValue}>{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              className={styles.slider}
              min={0.5}
              max={2.0}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
            />
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Pitch</label>
              <span className={styles.sliderValue}>{pitch.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              className={styles.slider}
              min={0.5}
              max={2.0}
              step={0.1}
              value={pitch}
              onChange={(e) => setPitch(+e.target.value)}
            />
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Stability</label>
              <span className={styles.sliderValue}>{stability.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={1}
              step={0.05}
              value={stability}
              onChange={(e) => setStability(+e.target.value)}
            />
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Similarity Boost</label>
              <span className={styles.sliderValue}>{similarityBoost.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={1}
              step={0.05}
              value={similarityBoost}
              onChange={(e) => setSimilarityBoost(+e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceTab
