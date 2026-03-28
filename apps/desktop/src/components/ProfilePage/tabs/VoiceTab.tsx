import { useRef } from 'react'
import styles from '../ProfilePage.module.css'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '../types'

interface TtsVoice {
  id: string
  provider: string
  displayName: string
  language: string
  gender: string
  tier: string
}

const CATALOG: TtsVoice[] = [
  { id: '1', provider: 'kokoro', displayName: 'af_heart', language: 'en', gender: 'female', tier: 'free' },
  { id: '2', provider: 'kokoro', displayName: 'af_bella', language: 'en', gender: 'female', tier: 'free' },
  { id: '3', provider: 'kokoro', displayName: 'am_adam', language: 'en', gender: 'male', tier: 'pro' },
  { id: '4', provider: 'azure', displayName: 'Jenny', language: 'en', gender: 'female', tier: 'free' },
  { id: '5', provider: 'azure', displayName: 'Guy', language: 'en', gender: 'male', tier: 'free' },
  { id: '6', provider: 'silero', displayName: 'Baya', language: 'ru', gender: 'female', tier: 'free' },
]

interface VoiceTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const VoiceTab = ({ character, onUpdate }: VoiceTabProps) => {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className={styles.tabRoot}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Text-to-Speech</div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>Enable TTS</div>
                <div className={styles.toggleHint}>Give your AI a voice for spoken responses</div>
              </div>
              <label className={styles.toggleControl}>
                <input type="checkbox" checked={character.ttsEnabled} onChange={(e) => onUpdate({ ttsEnabled: e.target.checked })} />
                <span className={styles.control} />
              </label>
            </div>

            <div className={!character.ttsEnabled ? styles.inactiveBlock : undefined}>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Custom voice</div>
                  <div className={styles.toggleHint}>Upload your own voice sample — WAV or MP3, up to 10 MB</div>
                </div>
                <label className={styles.toggleControl}>
                  <input
                    type="checkbox"
                    checked={character.useCustomVoice}
                    onChange={(e) => onUpdate({
                      useCustomVoice: e.target.checked,
                      ...(e.target.checked ? {} : { customVoiceFile: null, selectedVoiceId: '1' }),
                    })}
                    disabled={!character.ttsEnabled}
                  />
                  <span className={styles.control} />
                </label>
              </div>

              {character.useCustomVoice ? (
                <div className={styles.modelUploadRow} style={{ marginTop: '0.75rem' }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".wav,.mp3,.ogg,.flac"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onUpdate({ customVoiceFile: file.name, useCustomVoice: true, selectedVoiceId: null })
                    }}
                  />
                  <button type="button" className={styles.btnGhost} onClick={() => fileRef.current?.click()} disabled={!character.ttsEnabled}>
                    Choose file
                  </button>
                  <span className={styles.modelFileName}>
                    {character.customVoiceFile ?? <span style={{ color: 'var(--text-muted)' }}>No file — .wav, .mp3, .ogg, .flac</span>}
                  </span>
                  {character.customVoiceFile && (
                    <button type="button" className={styles.modelClearBtn} onClick={() => onUpdate({ customVoiceFile: null, useCustomVoice: false, selectedVoiceId: '1' })}>
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <label className={styles.label} style={{ marginTop: '1rem', marginBottom: '0.25rem', display: 'block' }}>Select voice</label>
                  <div className={styles.labelHint} style={{ marginBottom: '0.75rem' }}>Choose from available TTS providers</div>
                  <div className={styles.voiceGrid}>
                    {CATALOG.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`${styles.voiceCard} ${character.selectedVoiceId === v.id ? styles.voiceCardSelected : ''}`}
                        onClick={() => onUpdate({ selectedVoiceId: v.id, customVoiceFile: null, useCustomVoice: false })}
                        disabled={!character.ttsEnabled}
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
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Voice Tuning</div>
        <div className={styles.infoCard}>
          <div className={`${styles.infoCardContent}${!character.ttsEnabled ? ` ${styles.inactiveBlock}` : ''}`}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>Speed</label>
                  <div className={styles.labelHint}>Playback rate of the synthesized speech</div>
                </div>
                <span className={styles.sliderValue}>{character.speed.toFixed(1)}x</span>
              </div>
              <SliderWithTicks min={0.5} max={2.0} step={0.1} value={character.speed} onChange={(v) => onUpdate({ speed: v })} formatValue={(v) => `${v.toFixed(1)}x`} tickCount={4} disabled={!character.ttsEnabled} />
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>Pitch</label>
                  <div className={styles.labelHint}>Voice pitch — higher values sound more high-pitched</div>
                </div>
                <span className={styles.sliderValue}>{character.pitch.toFixed(1)}x</span>
              </div>
              <SliderWithTicks min={0.5} max={2.0} step={0.1} value={character.pitch} onChange={(v) => onUpdate({ pitch: v })} formatValue={(v) => `${v.toFixed(1)}x`} tickCount={4} disabled={!character.ttsEnabled} />
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>Stability</label>
                  <div className={styles.labelHint}>Higher values reduce variation in voice output</div>
                </div>
                <span className={styles.sliderValue}>{character.stability.toFixed(2)}</span>
              </div>
              <SliderWithTicks min={0} max={1} step={0.05} value={character.stability} onChange={(v) => onUpdate({ stability: v })} formatValue={(v) => v.toFixed(2)} tickCount={5} disabled={!character.ttsEnabled} />
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelBlock}>
                  <label className={styles.label}>Similarity boost</label>
                  <div className={styles.labelHint}>How closely the output matches the original voice</div>
                </div>
                <span className={styles.sliderValue}>{character.similarityBoost.toFixed(2)}</span>
              </div>
              <SliderWithTicks min={0} max={1} step={0.05} value={character.similarityBoost} onChange={(v) => onUpdate({ similarityBoost: v })} formatValue={(v) => v.toFixed(2)} tickCount={5} disabled={!character.ttsEnabled} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceTab
