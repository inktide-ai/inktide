'use client'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SliderWithTicks from '@/shared/ui/slider-with-ticks'
import { LANG_LABELS, VOICE_GROUPS } from '@/shared/data/kokoro-voices'
import { useTtsSynth } from '@/shared/hooks/useTtsSynth'
import type { AiCharacter } from '@/shared/lib/character'
import { useVoiceSandbox } from '../hooks/useVoiceSandbox'

interface VoiceSandboxTabProps {
  character: AiCharacter
  onBack: () => void
}

const AUDIO_FORMATS = ['mp3', 'wav', 'opus'] as const
type AudioFormat = typeof AUDIO_FORMATS[number]

// Shared class strings
const sectionCls = 'flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'
const sectionTitle = 'text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2'
const infoContent = 'py-2'
const formGroup = 'mb-7'
const labelCls = 'block text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary) mb-2'
const labelHint = 'text-[0.75rem] text-(--text-muted) mt-0.5 leading-[1.4]'
const inputCls = 'w-full py-[0.625rem] px-[0.875rem] bg-[#1e1f22] border border-[#2d2f33] rounded-[6px] text-(--text-primary) font-[var(--font-ui)] text-[0.8125rem] outline-none transition-[border-color,background] duration-[120ms] ease focus:border-white/20 focus:bg-[#26282e] placeholder:text-[rgba(139,144,154,0.45)] mt-2'
const textareaCls = `${inputCls} min-h-[120px] resize-y leading-relaxed mt-2`
const voiceSelectWrap = 'relative flex items-center mt-2'
const voiceSelect = 'w-full appearance-none bg-[#1e1f22] border border-[#2d2f33] rounded-[6px] py-[0.625rem] pr-11 pl-[0.875rem] text-(--text-primary) font-[var(--font-ui)] text-[0.875rem] cursor-pointer outline-none transition-[background,border-color] duration-[120ms] ease hover:bg-[#26282e] hover:border-[#42454d] focus:bg-[#26282e] focus:border-white/20 [&_option]:bg-[#1e1f22]'
const voiceSelectChevron = 'absolute right-4 text-white/30 pointer-events-none shrink-0'
const sliderHeader = 'flex justify-between items-start gap-4 mb-3'
const sliderValue = 'text-[0.6875rem] font-semibold font-mono text-(--accent-red-bright) bg-[linear-gradient(135deg,rgba(237,62,62,0.15),rgba(237,62,62,0.08))] py-0.5 px-[0.375rem] rounded-[0.25rem] border border-[rgba(237,62,62,0.2)] shrink-0'
const toggleRow = 'flex items-center justify-between py-2 mb-12 last:mb-0'
const btnPrimary = 'py-2 px-5 bg-(--accent-red) text-white border-none rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-[background] duration-200 ease hover:bg-(--accent-red-bright) disabled:opacity-50 disabled:cursor-not-allowed'
const btnGhost = 'py-2 px-5 bg-transparent text-(--text-muted) border border-(--border) rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ease hover:border-white/12 hover:text-(--text-primary) disabled:opacity-50 disabled:cursor-not-allowed'

const ChevronSVG = () => (
  <svg className={voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const VoiceSandboxTab = ({ character, onBack }: VoiceSandboxTabProps) => {
  const { t } = useTranslation('voice')

  const {
    providers, providersLoading,
    selectedProviderId, setSelectedProviderId,
    voices, voicesLoading,
    provider, needsApiKey, canListVoices, canStream,
  } = useVoiceSandbox(character.tts.providerId ?? '')

  // Simple form fields — no external data dependency, stay in component
  const [voiceId, setVoiceId] = useState(character.tts.voiceId ?? '')
  const [apiKey, setApiKey]   = useState('')
  const [text, setText]       = useState(() => t('text.defaultSample'))
  const [ssmlMode, setSsmlMode] = useState(false)
  const [speed, setSpeed]     = useState(character.tts.speed ?? 1.0)
  const [format, setFormat]   = useState<AudioFormat>('mp3')

  const { state, audioUrl, error: synthError, chunks, synthesize, streamChunked, reset } = useTtsSynth()

  const handleProviderChange = useCallback((id: string) => {
    setSelectedProviderId(id)
    setVoiceId('')
    reset()
  }, [setSelectedProviderId, reset])

  const validationErrors: string[] = []
  if (!text.trim()) validationErrors.push(t('validation.textEmpty'))
  if (!voiceId.trim()) validationErrors.push(t('validation.voiceRequired'))
  if (needsApiKey && !apiKey.trim()) validationErrors.push(t('validation.apiKeyRequired'))

  const isBusy = state === 'loading' || state === 'streaming'
  const canTest = validationErrors.length === 0 && !isBusy
  const totalBytes = chunks.reduce((acc, c) => acc + c.byteLength, 0)
  const elapsedMs = chunks.length > 1 ? chunks[chunks.length - 1].receivedAt - chunks[0].receivedAt : 0
  const maxChunkBytes = Math.max(...chunks.map((c) => c.byteLength), 1)
  const BAR_MAX_H = 40

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7 pb-4 border-b border-white/[0.06]">
        <button type="button" className="flex items-center justify-center w-7 h-7 bg-white/[0.04] border border-[#2d2f33] rounded-[6px] text-white/45 cursor-pointer transition-all duration-[120ms] ease shrink-0 hover:border-[#42454d] hover:text-white/85 hover:bg-white/[0.07]" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="text-[1rem] font-semibold text-(--text-primary) tracking-[-0.01em]">{t('sandbox.title')}</span>
      </div>

      {/* Synthesis Panel */}
      <div className={sectionCls} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
        <div className={infoContent}>
          {/* Provider picker */}
          <div className={formGroup}>
            <label className={labelCls}>{t('provider.label')}</label>
            <div className={labelHint}>{t('provider.hint')}</div>
            {providersLoading ? (
              <div className="text-[0.75rem] text-(--text-muted) py-[0.375rem] italic">{t('provider.loading')}</div>
            ) : (
              <div className={voiceSelectWrap}>
                <select className={voiceSelect} value={selectedProviderId} onChange={(e) => handleProviderChange(e.target.value)}>
                  {providers.length === 0 && <option value="">{t('provider.none')}</option>}
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                </select>
                <ChevronSVG />
              </div>
            )}
          </div>

          {needsApiKey && (
            <div className={formGroup}>
              <label className={labelCls}>{t('apiKey.label')}</label>
              <div className={labelHint}>{t('apiKey.hint')}</div>
              <input className={inputCls} type="password" placeholder="sk-…" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
          )}

          <div className={formGroup}>
            <label className={labelCls}>{t('voice.label')}</label>
            <div className={labelHint}>{canListVoices ? t('voice.hintList') : t('voice.hintManual')}</div>
            {canListVoices ? (
              voicesLoading ? (
                <div className="text-[0.75rem] text-(--text-muted) py-[0.375rem] italic">{t('voice.loading')}</div>
              ) : (
                <div className={voiceSelectWrap}>
                  <select className={voiceSelect} value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
                    <option value="">{t('voice.selectPlaceholder')}</option>
                    {selectedProviderId === 'kokoro'
                      ? Array.from(VOICE_GROUPS.entries()).map(([lang, voiceOpts]) => (
                          <optgroup key={lang} label={LANG_LABELS[lang] ?? lang}>
                            {voiceOpts.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                          </optgroup>
                        ))
                      : voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}</option>)}
                  </select>
                  <ChevronSVG />
                </div>
              )
            ) : (
              <input className={inputCls} type="text" placeholder={t('voice.idPlaceholder')} value={voiceId} onChange={(e) => setVoiceId(e.target.value)} />
            )}
          </div>

          <div className={formGroup}>
            <label className={labelCls}>{t('audioFormat.label')}</label>
            <div className={voiceSelectWrap}>
              <select className={voiceSelect} value={format} onChange={(e) => setFormat(e.target.value as AudioFormat)}>
                {AUDIO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
              <ChevronSVG />
            </div>
          </div>

          <div className="mb-7">
            <div className={sliderHeader}>
              <div className="min-w-0 flex-1">
                <label className="block text-[0.9375rem] font-bold text-(--text-primary) mb-1">{t('speed.label')}</label>
              </div>
              <span className={sliderValue}>{speed.toFixed(2)}×</span>
            </div>
            <SliderWithTicks min={0.25} max={4.0} step={0.05} value={speed} onChange={setSpeed} formatValue={(v) => `${v}×`} tickCount={4} />
          </div>

          <div className={toggleRow}>
            <div>
              <div className="text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary)">{t('ssml.toggle')}</div>
              <div className={labelHint}>{t('ssml.toggleHint')}</div>
            </div>
            <label className="toggle-control">
              <input type="checkbox" checked={ssmlMode} onChange={(e) => setSsmlMode(e.target.checked)} />
              <div className="toggle-track" />
            </label>
          </div>

          <div className={formGroup}>
            <label className={labelCls}>{ssmlMode ? t('ssml.inputLabel') : t('text.label')}</label>
            <div className={labelHint}>{ssmlMode ? t('ssml.inputHint') : t('text.hint')}</div>
            <textarea className={ssmlMode ? `${textareaCls} min-h-[200px] font-mono text-[0.75rem]` : textareaCls} placeholder={ssmlMode ? t('ssml.inputPlaceholder') : t('text.placeholder')} value={text} onChange={(e) => setText(e.target.value)} rows={ssmlMode ? 8 : 4} />
          </div>

          {validationErrors.length > 0 && (
            <div className="py-3 px-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg text-[#ef4444] text-[0.8125rem] mb-4 flex items-center gap-2">
              {validationErrors.map((e) => <div key={e}>{e}</div>)}
            </div>
          )}
          {state === 'error' && synthError && (
            <div className="py-3 px-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg text-[#ef4444] text-[0.8125rem] mb-4">{synthError}</div>
          )}

          <button type="button" className={btnPrimary} disabled={!canTest} onClick={() => { if (!canTest) return; synthesize({ text, voiceId, speed, audioFormat: format, stream: false, providerId: selectedProviderId, apiKey: needsApiKey ? apiKey : undefined }) }} style={{ width: '100%', marginTop: '0.5rem' }}>
            {isBusy && state === 'loading' && <span className="inline-block align-middle w-[14px] h-[14px] border-2 border-white/30 border-t-white rounded-full animate-spin mr-[6px] shrink-0" />}
            {isBusy && state === 'loading' ? t('sandbox.synthesizing') : t('sandbox.testVoice')}
          </button>

          {audioUrl && !isBusy && state === 'playing' && (
            <audio key={audioUrl} src={audioUrl} controls autoPlay className="w-full mt-3 rounded-lg overflow-hidden block [filter:invert(0.85)_hue-rotate(180deg)]" />
          )}
        </div>
      </div>

      {canStream && (
        <div className={sectionCls}>
          <div className={sectionTitle}>{t('sandbox.streamingPlayground')}</div>
          <div className={infoContent}>
            <div className={labelHint}>{t('sandbox.streamingDesc')}</div>
            <button type="button" className={btnGhost} disabled={!canTest || isBusy} onClick={() => { if (!canTest || isBusy) return; streamChunked({ text, voiceId, speed, audioFormat: format, stream: true, providerId: selectedProviderId, apiKey: needsApiKey ? apiKey : undefined }) }} style={{ marginTop: '0.5rem' }}>
              {isBusy && state === 'streaming' && <span className="inline-block align-middle w-[14px] h-[14px] border-2 border-white/30 border-t-white rounded-full animate-spin mr-[6px] shrink-0" />}
              {isBusy && state === 'streaming' ? t('sandbox.streaming') : t('sandbox.testChunking')}
            </button>

            {chunks.length > 0 && (
              <>
                <div className="flex items-end gap-[3px] h-12 py-1 overflow-hidden">
                  {chunks.map((c) => (
                    <div key={c.index} className="w-2 rounded-t-[2px] bg-[var(--accent-voice,#f0abfc)] opacity-75 min-h-1 shrink-0 transition-[height] duration-100 ease" style={{ height: `${Math.max(4, Math.round((c.byteLength / maxChunkBytes) * BAR_MAX_H))}px` }} title={`Chunk ${c.index}: ${c.byteLength} B`} />
                  ))}
                </div>
                <div className="flex gap-5 text-[0.6875rem] font-mono text-(--text-muted) mt-[0.375rem]">
                  {[{ label: 'chunks', val: chunks.length }, { label: 'total', val: `${(totalBytes / 1024).toFixed(1)} KB` }, ...(elapsedMs > 0 ? [{ label: 'elapsed', val: `${elapsedMs} ms` }] : [])].map(({ label, val }) => (
                    <span key={label} className="flex gap-1">
                      <span className="opacity-60">{label}</span>
                      <strong>{val}</strong>
                    </span>
                  ))}
                </div>
                {audioUrl && state === 'playing' && (
                  <audio key={`stream-${audioUrl}`} src={audioUrl} controls autoPlay className="w-full mt-3 rounded-lg overflow-hidden block [filter:invert(0.85)_hue-rotate(180deg)]" />
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
