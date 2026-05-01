'use client'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '../ProfilePage.module.css'
import sandboxStyles from './VoiceSandboxTab.module.css'
import SliderWithTicks from '../SliderWithTicks'
import { getTtsProviders, getTtsVoices, type SpeechProviderDescriptor, type SpeechVoice } from '../../../api/tts'
import { LANG_LABELS, VOICE_GROUPS } from '@/lib/kokoroVoices'
import { useTtsSynth } from '../../../hooks/useTtsSynth'
import type { AiCharacter } from '@/lib/character'

/** Returns a static fallback voice list when the backend is unavailable. */
function getFallbackVoices(_providerId: string): SpeechVoice[] {
  return []
}

interface VoiceSandboxTabProps {
  character: AiCharacter
  onBack: () => void
}

const AUDIO_FORMATS = ['mp3', 'wav', 'opus'] as const
type AudioFormat = typeof AUDIO_FORMATS[number]

const VoiceSandboxTab = ({ character, onBack }: VoiceSandboxTabProps) => {
  const { t } = useTranslation('voice')

  // ── Provider / voice catalog ──────────────────────────────────────────────
  const [providers, setProviders] = useState<SpeechProviderDescriptor[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)

  const [selectedProviderId, setSelectedProviderId] = useState(character.tts.providerId ?? '')
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const [voicesLoading, setVoicesLoading] = useState(false)

  // ── Form state ────────────────────────────────────────────────────────────
  const [voiceId, setVoiceId] = useState(character.tts.voiceId ?? '')
  const [apiKey, setApiKey] = useState('')
  const [text, setText] = useState(() => t('text.defaultSample'))
  const [ssmlMode, setSsmlMode] = useState(false)
  const [speed, setSpeed] = useState(character.tts.speed ?? 1.0)
  const [format, setFormat] = useState<AudioFormat>('mp3')

  const { state, audioUrl, error: synthError, chunks, synthesize, streamChunked, reset } = useTtsSynth()

  // ── Load providers on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setProvidersLoading(true)
    getTtsProviders()
      .then((list) => {
        if (cancelled) return
        setProviders(list)
        // Ensure selectedProviderId is valid, else default to first
        if (list.length > 0 && !list.find((p) => p.id === selectedProviderId)) {
          setSelectedProviderId(list[0].id)
        }
      })
      .catch(() => { /* non-critical — sandbox still usable with empty list */ })
      .finally(() => { if (!cancelled) setProvidersLoading(false) })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load voices when provider changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedProviderId) return
    const provider = providers.find((p) => p.id === selectedProviderId)
    if (!provider?.capabilities.supportsVoiceListing) {
      setVoices([])
      return
    }

    let cancelled = false
    setVoicesLoading(true)
    setVoices([])
    getTtsVoices(selectedProviderId, needsApiKey ? apiKey : undefined)
      .then((list) => {
        if (cancelled) return
        // Backend returned voices — use them
        setVoices(list.length > 0 ? list : getFallbackVoices(selectedProviderId))
      })
      .catch(() => {
        // Backend unavailable (old deploy, 404) — use local fallback for known providers
        if (!cancelled) setVoices(getFallbackVoices(selectedProviderId))
      })
      .finally(() => { if (!cancelled) setVoicesLoading(false) })

    return () => { cancelled = true }
  }, [selectedProviderId, providers])

  // Reset voice when provider switches
  const handleProviderChange = useCallback((id: string) => {
    setSelectedProviderId(id)
    setVoiceId('')
    reset()
  }, [reset])

  // ── Derived capabilities ──────────────────────────────────────────────────
  const provider = providers.find((p) => p.id === selectedProviderId)
  const needsApiKey = provider?.capabilities.requiresApiKey ?? false
  const canListVoices = provider?.capabilities.supportsVoiceListing ?? false
  const canStream = provider?.capabilities.supportsStreaming ?? false

  // ── Validation ────────────────────────────────────────────────────────────
  const validationErrors: string[] = []
  if (!text.trim()) validationErrors.push(t('validation.textEmpty'))
  if (!voiceId.trim()) validationErrors.push(t('validation.voiceRequired'))
  if (needsApiKey && !apiKey.trim()) validationErrors.push(t('validation.apiKeyRequired'))

  const isBusy = state === 'loading' || state === 'streaming'
  const canTest = validationErrors.length === 0 && !isBusy

  // ── Stream stats ──────────────────────────────────────────────────────────
  const totalBytes = chunks.reduce((acc, c) => acc + c.byteLength, 0)
  const elapsedMs = chunks.length > 1
    ? chunks[chunks.length - 1].receivedAt - chunks[0].receivedAt
    : 0

  const maxChunkBytes = Math.max(...chunks.map((c) => c.byteLength), 1)
  const BAR_MAX_H = 40

  return (
    <div className={styles.tabRoot}>
      {/* ── Header ── */}
      <div className={styles.providerPageHeader}>
        <button
          type="button"
          className={styles.providerBackBtn}
          onClick={onBack}
          aria-label="Back"
        >
          ←
        </button>
        <span className={styles.providerPageTitle}>{t('sandbox.title')}</span>
      </div>

      {/* ── Synthesis Panel ── */}
      <div className={styles.section} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
        <div className={styles.infoCardContent}>

          {/* Provider picker */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('provider.label')}</label>
            <div className={styles.labelHint}>{t('provider.hint')}</div>
            {providersLoading ? (
              <div className={sandboxStyles.voiceLoadingHint}>{t('provider.loading')}</div>
            ) : (
              <div className={styles.voiceSelectWrap}>
                <select
                  className={styles.voiceSelect}
                  value={selectedProviderId}
                  onChange={(e) => handleProviderChange(e.target.value)}
                >
                  {providers.length === 0 && (
                    <option value="">{t('provider.none')}</option>
                  )}
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
                <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>

          {/* API key (only when required) */}
          {needsApiKey && (
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('apiKey.label')}</label>
              <div className={styles.labelHint}>{t('apiKey.hint')}</div>
              <input
                className={styles.input}
                type="password"
                placeholder="sk-…"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}

          {/* Voice selector — dropdown if provider supports listing, text input otherwise */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('voice.label')}</label>
            <div className={styles.labelHint}>
              {canListVoices ? t('voice.hintList') : t('voice.hintManual')}
            </div>
            {canListVoices ? (
              voicesLoading ? (
                <div className={sandboxStyles.voiceLoadingHint}>{t('voice.loading')}</div>
              ) : (
                <div className={styles.voiceSelectWrap}>
                  <select
                    className={styles.voiceSelect}
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                  >
                    <option value="">{t('voice.selectPlaceholder')}</option>
                    {selectedProviderId === 'kokoro'
                      ? Array.from(VOICE_GROUPS.entries()).map(([lang, voiceOpts]) => (
                          <optgroup key={lang} label={LANG_LABELS[lang] ?? lang}>
                            {voiceOpts.map((v) => (
                              <option key={v.id} value={v.id}>{v.label}</option>
                            ))}
                          </optgroup>
                        ))
                      : voices.map((v) => (
                          <option key={v.id} value={v.id}>{v.name ?? v.id}</option>
                        ))
                    }
                  </select>
                  <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )
            ) : (
              <input
                className={styles.input}
                type="text"
                placeholder={t('voice.idPlaceholder')}
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
              />
            )}
          </div>

          {/* Audio format */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('audioFormat.label')}</label>
            <div className={styles.voiceSelectWrap}>
              <select
                className={styles.voiceSelect}
                value={format}
                onChange={(e) => setFormat(e.target.value as AudioFormat)}
              >
                {AUDIO_FORMATS.map((f) => (
                  <option key={f} value={f}>{f.toUpperCase()}</option>
                ))}
              </select>
              <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Speed */}
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <div className={styles.sliderLabelBlock}>
                <label className={styles.label}>{t('speed.label')}</label>
              </div>
              <span className={styles.sliderValue}>{speed.toFixed(2)}×</span>
            </div>
            <SliderWithTicks
              min={0.25} max={4.0} step={0.05}
              value={speed}
              onChange={setSpeed}
              formatValue={(v) => `${v}×`}
              tickCount={4}
            />
          </div>

          {/* SSML toggle */}
          <div className={styles.toggleRow}>
            <div className={styles.toggleLabel}>
              {t('ssml.toggle')}
              <div className={styles.toggleHint}>{t('ssml.toggleHint')}</div>
            </div>
            <label className={styles.toggleControl}>
              <input
                type="checkbox"
                checked={ssmlMode}
                onChange={(e) => setSsmlMode(e.target.checked)}
              />
              <div className={styles.control} />
            </label>
          </div>

          {/* Text input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{ssmlMode ? t('ssml.inputLabel') : t('text.label')}</label>
            <div className={styles.labelHint}>
              {ssmlMode
                ? t('ssml.inputHint')
                : t('text.hint')}
            </div>
            <textarea
              className={ssmlMode ? styles.textareaLarge : styles.textarea}
              placeholder={ssmlMode
                ? t('ssml.inputPlaceholder')
                : t('text.placeholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={ssmlMode ? 8 : 4}
            />
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className={styles.errorBanner}>
              {validationErrors.map((e) => <div key={e}>{e}</div>)}
            </div>
          )}

          {/* Synthesis error from API */}
          {state === 'error' && synthError && (
            <div className={styles.errorBanner}>{synthError}</div>
          )}

          {/* Test Voice button */}
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={!canTest}
            onClick={() => {
              if (!canTest) return
              synthesize({
                text,
                voiceId,
                speed,
                audioFormat: format,
                stream: false,
                providerId: selectedProviderId,
                apiKey: needsApiKey ? apiKey : undefined,
              })
            }}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isBusy && state === 'loading' && <span className={sandboxStyles.spinnerInline} />}
            {isBusy && state === 'loading' ? t('sandbox.synthesizing') : t('sandbox.testVoice')}
          </button>

          {/* Audio player */}
          {audioUrl && !isBusy && state === 'playing' && (
            <audio
              key={audioUrl}
              src={audioUrl}
              controls
              autoPlay
              className={sandboxStyles.audioPlayer}
              onEnded={() => { /* state remains 'playing' — user may replay */ }}
            />
          )}
        </div>
      </div>

      {/* ── Streaming Playground (only for providers that support it) ── */}
      {canStream && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>{t('sandbox.streamingPlayground')}</div>
          <div className={styles.infoCardContent}>
            <div className={styles.labelHint}>
              {t('sandbox.streamingDesc')}
            </div>

            <button
              type="button"
              className={styles.btnGhost}
              disabled={!canTest || isBusy}
              onClick={() => {
                if (!canTest || isBusy) return
                streamChunked({
                  text,
                  voiceId,
                  speed,
                  audioFormat: format,
                  stream: true,
                  providerId: selectedProviderId,
                  apiKey: needsApiKey ? apiKey : undefined,
                })
              }}
              style={{ marginTop: '0.5rem' }}
            >
              {isBusy && state === 'streaming' && <span className={sandboxStyles.spinnerInline} />}
              {isBusy && state === 'streaming' ? t('sandbox.streaming') : t('sandbox.testChunking')}
            </button>

            {/* Buffer visualization */}
            {chunks.length > 0 && (
              <>
                <div className={sandboxStyles.bufferViz}>
                  {chunks.map((c) => (
                    <div
                      key={c.index}
                      className={sandboxStyles.bufferBar}
                      style={{ height: `${Math.max(4, Math.round((c.byteLength / maxChunkBytes) * BAR_MAX_H))}px` }}
                      title={`Chunk ${c.index}: ${c.byteLength} B`}
                    />
                  ))}
                </div>
                <div className={sandboxStyles.streamStats}>
                  <span className={sandboxStyles.streamStatItem}>
                    <span className={sandboxStyles.streamStatLabel}>chunks</span>
                    <strong>{chunks.length}</strong>
                  </span>
                  <span className={sandboxStyles.streamStatItem}>
                    <span className={sandboxStyles.streamStatLabel}>total</span>
                    <strong>{(totalBytes / 1024).toFixed(1)} KB</strong>
                  </span>
                  {elapsedMs > 0 && (
                    <span className={sandboxStyles.streamStatItem}>
                      <span className={sandboxStyles.streamStatLabel}>elapsed</span>
                      <strong>{elapsedMs} ms</strong>
                    </span>
                  )}
                </div>

                {/* Audio player for streamed result */}
                {audioUrl && state === 'playing' && (
                  <audio
                    key={`stream-${audioUrl}`}
                    src={audioUrl}
                    controls
                    autoPlay
                    className={sandboxStyles.audioPlayer}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceSandboxTab
