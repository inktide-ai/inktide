'use client'
import { useTranslation } from 'react-i18next'
import CustomSelect from '../custom-select'
import SliderWithTicks from '../slider-with-ticks'
import type { AiCharacter, CharacterPersonality } from '@/lib/character'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

type PresetId = 'streamer' | 'mentor' | 'comedian' | 'philosopher' | 'tsundere'

const PRESETS: Record<PresetId, Omit<CharacterPersonality, 'presetId'>> = {
  streamer:    { warmth: 0.80, playfulness: 0.85, assertiveness: 0.60, empathy: 0.70, formality: 0.10, sarcasm: 0.30, emotionVolatility: 0.70, emotionResponsiveness: 0.85, emotionMemory: 0.40, stressBehavior: 'humor',    baselineMood: 'happy'   },
  mentor:      { warmth: 0.75, playfulness: 0.30, assertiveness: 0.70, empathy: 0.90, formality: 0.70, sarcasm: 0.05, emotionVolatility: 0.20, emotionResponsiveness: 0.60, emotionMemory: 0.80, stressBehavior: 'withdraw', baselineMood: 'neutral' },
  comedian:    { warmth: 0.65, playfulness: 0.95, assertiveness: 0.50, empathy: 0.50, formality: 0.05, sarcasm: 0.70, emotionVolatility: 0.90, emotionResponsiveness: 0.95, emotionMemory: 0.20, stressBehavior: 'humor',    baselineMood: 'hyped'   },
  philosopher: { warmth: 0.50, playfulness: 0.20, assertiveness: 0.65, empathy: 0.60, formality: 0.80, sarcasm: 0.15, emotionVolatility: 0.15, emotionResponsiveness: 0.40, emotionMemory: 0.90, stressBehavior: 'withdraw', baselineMood: 'neutral' },
  tsundere:    { warmth: 0.20, playfulness: 0.60, assertiveness: 0.80, empathy: 0.35, formality: 0.20, sarcasm: 0.75, emotionVolatility: 0.85, emotionResponsiveness: 0.80, emotionMemory: 0.60, stressBehavior: 'confront', baselineMood: 'neutral' },
}

const sectionCls = 'flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'
const sectionTitle = 'text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2'
const labelHint = 'text-[0.75rem] text-(--text-muted) mt-0.5 leading-[1.4]'
const sliderHeader = 'flex justify-between items-start gap-4 mb-3'
const sliderValue = 'text-[0.6875rem] font-semibold font-mono text-(--accent-red-bright) bg-[linear-gradient(135deg,rgba(237,62,62,0.15),rgba(237,62,62,0.08))] py-0.5 px-[0.375rem] rounded-[0.25rem] border border-[rgba(237,62,62,0.2)] shrink-0'
const labelInBlock = 'block text-[0.9375rem] font-bold text-(--text-primary) mb-1'
const toggleRow = 'flex items-center justify-between py-2 mb-12 last:mb-0'
const inactive = 'opacity-45 pointer-events-none transition-opacity duration-200 ease'

interface BehaviorTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const presetPill = 'px-3 py-1.5 rounded-[0.375rem] text-[0.8125rem] font-semibold font-[var(--font-ui)] border transition-all duration-150 cursor-pointer'
const presetPillActive = 'bg-[linear-gradient(135deg,rgba(139,92,246,0.25),rgba(109,40,217,0.15))] border-[rgba(139,92,246,0.6)] text-(--accent-purple-bright) shadow-[0_0_0_1px_rgba(139,92,246,0.15)]'
const presetPillInactive = 'bg-transparent border-(--border) text-(--text-muted) hover:border-[rgba(139,92,246,0.35)] hover:text-(--text-primary)'
const traitHintRow = 'flex justify-between text-[0.6875rem] text-(--text-muted) mt-1 px-0.5'

function PersonalitySection({ personality, onUpdate, t }: {
  personality: CharacterPersonality
  onUpdate: (p: CharacterPersonality) => void
  t: (key: string) => string
}) {
  const set = (patch: Partial<CharacterPersonality>) =>
    onUpdate({ ...personality, ...patch, presetId: null })

  const applyPreset = (id: PresetId) =>
    onUpdate({ ...PRESETS[id], presetId: id })

  const allPresets: Array<PresetId | 'custom'> = ['streamer', 'mentor', 'comedian', 'philosopher', 'tsundere', 'custom']
  const activePreset = personality.presetId ?? 'custom'

  return (
    <div className={sectionCls}>
      <div className={sectionTitle}>{t('section.personality')}</div>

      {/* Preset Pills */}
      <div className="mb-6">
        <div className="text-[0.75rem] font-semibold text-(--text-muted) uppercase tracking-[0.06em] mb-2">{t('personality.presetsLabel')}</div>
        <div className="flex flex-wrap gap-2">
          {allPresets.map((id) => (
            <button
              key={id}
              type="button"
              className={`${presetPill} ${activePreset === id ? presetPillActive : presetPillInactive}`}
              onClick={() => id !== 'custom' ? applyPreset(id as PresetId) : undefined}
            >
              {t(`personality.preset.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Core Traits */}
      <div className="mb-5">
        <div className="text-[0.75rem] font-semibold text-(--text-muted) uppercase tracking-[0.06em] mb-4">{t('personality.traitsTitle')}</div>
        {(
          [
            ['warmth',        'warmth'],
            ['playfulness',   'playfulness'],
            ['empathy',       'empathy'],
            ['assertiveness', 'assertiveness'],
            ['formality',     'formality'],
            ['sarcasm',       'sarcasm'],
          ] as Array<[keyof CharacterPersonality, string]>
        ).map(([field, key]) => (
          <div key={field} className="mb-6">
            <div className={sliderHeader}>
              <div className="min-w-0 flex-1">
                <label className={labelInBlock}>{t(`personality.${key}.label`)}</label>
                <div className={labelHint}>{t(`personality.${key}.hint`)}</div>
              </div>
              <span className={sliderValue}>{(personality[field] as number).toFixed(2)}</span>
            </div>
            <SliderWithTicks
              min={0} max={1} step={0.05}
              value={personality[field] as number}
              onChange={(v) => set({ [field]: v })}
              formatValue={(v) => v.toFixed(1)}
              tickCount={5}
            />
            <div className={traitHintRow}>
              <span>{t(`personality.${key}.low`)}</span>
              <span>{t(`personality.${key}.high`)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Emotional Dynamics */}
      <div className="mb-5">
        <div className="text-[0.75rem] font-semibold text-(--text-muted) uppercase tracking-[0.06em] mb-4">{t('personality.dynamicsTitle')}</div>
        {(
          [
            ['emotionVolatility',     'volatility'],
            ['emotionResponsiveness', 'responsiveness'],
            ['emotionMemory',         'emotionMemory'],
          ] as Array<[keyof CharacterPersonality, string]>
        ).map(([field, key]) => (
          <div key={field} className="mb-6">
            <div className={sliderHeader}>
              <div className="min-w-0 flex-1">
                <label className={labelInBlock}>{t(`personality.${key}.label`)}</label>
                <div className={labelHint}>{t(`personality.${key}.hint`)}</div>
              </div>
              <span className={sliderValue}>{(personality[field] as number).toFixed(2)}</span>
            </div>
            <SliderWithTicks
              min={0} max={1} step={0.05}
              value={personality[field] as number}
              onChange={(v) => set({ [field]: v })}
              formatValue={(v) => v.toFixed(1)}
              tickCount={5}
            />
            <div className={traitHintRow}>
              <span>{t(`personality.${key}.low`)}</span>
              <span>{t(`personality.${key}.high`)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stress Behavior + Baseline Mood */}
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary) mb-1">{t('personality.stressBehavior.label')}</label>
          <div className={labelHint + ' mb-2'}>{t('personality.stressBehavior.hint')}</div>
          <CustomSelect
            value={personality.stressBehavior}
            options={['deflect', 'humor', 'withdraw', 'confront'].map((v) => ({ value: v, label: t(`personality.stressBehavior.${v}`) }))}
            onChange={(v) => set({ stressBehavior: v })}
          />
        </div>
        <div className="mb-3">
          <label className="block text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary) mb-1">{t('personality.baselineMood.label')}</label>
          <div className={labelHint + ' mb-2'}>{t('personality.baselineMood.hint')}</div>
          <CustomSelect
            value={personality.baselineMood}
            options={['neutral', 'happy', 'chill', 'melancholic', 'hyped'].map((v) => ({ value: v, label: t(`personality.baselineMood.${v}`) }))}
            onChange={(v) => set({ baselineMood: v })}
          />
        </div>
      </div>
    </div>
  )
}

function SliderGroup({ label, hint, value, display, min, max, step, format, tickCount, disabled, onChange }: {
  label: string; hint: string; value: number; display: string; min: number; max: number; step: number
  format: (v: number) => string; tickCount: number; disabled?: boolean; onChange: (v: number) => void
}) {
  return (
    <div className="mb-7">
      <div className={sliderHeader}>
        <div className="min-w-0 flex-1">
          <label className={labelInBlock}>{label}</label>
          <div className={labelHint}>{hint}</div>
        </div>
        <span className={sliderValue}>{display}</span>
      </div>
      <SliderWithTicks min={min} max={max} step={step} value={value} onChange={onChange} formatValue={format} tickCount={tickCount} disabled={disabled} />
    </div>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={toggleRow}>
      <div>
        <div className="text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary)">{label}</div>
        <div className={labelHint}>{hint}</div>
      </div>
      <label className="toggle-control">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-track" />
      </label>
    </div>
  )
}

const BehaviorTab = ({ character, onUpdate }: BehaviorTabProps) => {
  const { t } = useTranslation('behavior')

  const updatePersonality = (p: CharacterPersonality) => onUpdate({ personalityConfig: p })

  const moodOptions = [
    { value: 'neutral', label: t('autoPilot.mood.neutral') },
    { value: 'happy', label: t('autoPilot.mood.happy') },
    { value: 'chill', label: t('autoPilot.mood.chill') },
    { value: 'hyped', label: t('autoPilot.mood.hyped') },
    { value: 'sarcastic', label: t('autoPilot.mood.sarcastic') },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      {/* ── Personality Engine ── */}
      <PersonalitySection personality={character.personalityConfig} onUpdate={updatePersonality} t={t} />

      {/* ── Response ── */}
      <div className={sectionCls}>
        <div className={sectionTitle}>{t('section.response')}</div>
        <div className="py-2">
          <SliderGroup label={t('response.delay.label')} hint={t('response.delay.hint')} value={character.behavior.responseDelayMs} display={`${character.behavior.responseDelayMs}ms`} min={0} max={5000} step={100} format={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} tickCount={6} onChange={(v) => onUpdate({ behavior: { ...character.behavior, responseDelayMs: v } })} />
          <SliderGroup label={t('response.maxLength.label')} hint={t('response.maxLength.hint')} value={character.behavior.maxResponseLength} display={`${character.behavior.maxResponseLength} chars`} min={50} max={2000} step={50} format={(v) => String(v)} tickCount={5} onChange={(v) => onUpdate({ behavior: { ...character.behavior, maxResponseLength: v } })} />
          <SliderGroup label={t('response.emotionScale.label')} hint={t('response.emotionScale.hint')} value={character.behavior.emotionIntensityScale} display={`${character.behavior.emotionIntensityScale.toFixed(2)}×`} min={0} max={2} step={0.05} format={(v) => v.toFixed(1)} tickCount={5} onChange={(v) => onUpdate({ behavior: { ...character.behavior, emotionIntensityScale: v } })} />
          <div className="mb-7">
            <label className="block text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary) mb-2">{t('response.language.label')}</label>
            <div className={labelHint}>{t('response.language.hint')}</div>
            <CustomSelect value={character.behavior.language} options={LANGUAGE_OPTIONS} onChange={(v) => onUpdate({ behavior: { ...character.behavior, language: v } })} />
          </div>
          <ToggleRow label={t('response.autoModerate.label')} hint={t('response.autoModerate.hint')} checked={character.behavior.autoModerate} onChange={(v) => onUpdate({ behavior: { ...character.behavior, autoModerate: v } })} />
          <ToggleRow label={t('response.typingSimulation.label')} hint={t('response.typingSimulation.hint')} checked={character.behavior.typingSimulation} onChange={(v) => onUpdate({ behavior: { ...character.behavior, typingSimulation: v } })} />
        </div>
      </div>

      {/* ── LLM Config ── */}
      <div className={sectionCls}>
        <div className={sectionTitle}>{t('section.llmConfig')}</div>
        <div className="py-2">
          <SliderGroup label={t('llm.temperature.label')} hint={t('llm.temperature.hint')} value={character.llm.temperature} display={character.llm.temperature.toFixed(2)} min={0} max={2} step={0.05} format={(v) => v.toFixed(1)} tickCount={5} onChange={(v) => onUpdate({ llm: { ...character.llm, temperature: v } })} />
          <SliderGroup label={t('llm.maxTokens.label')} hint={t('llm.maxTokens.hint')} value={character.llm.maxTokens} display={String(character.llm.maxTokens)} min={64} max={4096} step={64} format={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} tickCount={5} onChange={(v) => onUpdate({ llm: { ...character.llm, maxTokens: v } })} />
          <SliderGroup label={t('llm.topP.label')} hint={t('llm.topP.hint')} value={character.llm.topP} display={character.llm.topP.toFixed(2)} min={0} max={1} step={0.05} format={(v) => v.toFixed(1)} tickCount={5} onChange={(v) => onUpdate({ llm: { ...character.llm, topP: v } })} />
          <SliderGroup label={t('llm.frequencyPenalty.label')} hint={t('llm.frequencyPenalty.hint')} value={character.llm.frequencyPenalty} display={character.llm.frequencyPenalty.toFixed(2)} min={0} max={2} step={0.05} format={(v) => v.toFixed(1)} tickCount={5} onChange={(v) => onUpdate({ llm: { ...character.llm, frequencyPenalty: v } })} />
          <SliderGroup label={t('llm.presencePenalty.label')} hint={t('llm.presencePenalty.hint')} value={character.llm.presencePenalty} display={character.llm.presencePenalty.toFixed(2)} min={0} max={2} step={0.05} format={(v) => v.toFixed(1)} tickCount={5} onChange={(v) => onUpdate({ llm: { ...character.llm, presencePenalty: v } })} />
        </div>
      </div>

      {/* ── Memory ── */}
      <div className={sectionCls}>
        <div className={sectionTitle}>{t('section.memory')}</div>
        <div className="py-2">
          <ToggleRow label={t('memory.enable.label')} hint={t('memory.enable.hint')} checked={character.memory.enabled} onChange={(v) => onUpdate({ memory: { ...character.memory, enabled: v } })} />
          <div className={!character.memory.enabled ? inactive : undefined}>
            <SliderGroup label={t('memory.maxMemories.label')} hint={t('memory.maxMemories.hint')} value={character.memory.maxMemories} display={String(character.memory.maxMemories)} min={10} max={500} step={10} format={(v) => String(v)} tickCount={5} disabled={!character.memory.enabled} onChange={(v) => onUpdate({ memory: { ...character.memory, maxMemories: v } })} />
            <SliderGroup label={t('memory.retentionDays.label')} hint={t('memory.retentionDays.hint')} value={character.memory.retentionDays} display={`${character.memory.retentionDays}d`} min={1} max={365} step={1} format={(v) => `${v}d`} tickCount={6} disabled={!character.memory.enabled} onChange={(v) => onUpdate({ memory: { ...character.memory, retentionDays: v } })} />
            <SliderGroup label={t('memory.importanceThreshold.label')} hint={t('memory.importanceThreshold.hint')} value={character.memory.importanceThreshold} display={character.memory.importanceThreshold.toFixed(2)} min={0} max={1} step={0.05} format={(v) => v.toFixed(1)} tickCount={5} disabled={!character.memory.enabled} onChange={(v) => onUpdate({ memory: { ...character.memory, importanceThreshold: v } })} />
          </div>
        </div>
      </div>

      {/* ── Auto-Pilot ── */}
      <div className={sectionCls}>
        <div className={sectionTitle}>{t('section.autoPilot')}</div>
        <div className="py-2">
          <ToggleRow label={t('autoPilot.enable.label')} hint={t('autoPilot.enable.hint')} checked={character.autoPilot.enabled} onChange={(v) => onUpdate({ autoPilot: { ...character.autoPilot, enabled: v } })} />
          <div className={!character.autoPilot.enabled ? inactive : undefined}>
            <SliderGroup label={t('autoPilot.idleTimeout.label')} hint={t('autoPilot.idleTimeout.hint')} value={character.autoPilot.idleTimeoutSeconds} display={`${character.autoPilot.idleTimeoutSeconds}s`} min={30} max={600} step={10} format={(v) => `${v}s`} tickCount={6} disabled={!character.autoPilot.enabled} onChange={(v) => onUpdate({ autoPilot: { ...character.autoPilot, idleTimeoutSeconds: v } })} />
            <SliderGroup label={t('autoPilot.minInterval.label')} hint={t('autoPilot.minInterval.hint')} value={character.autoPilot.minIntervalSeconds} display={`${character.autoPilot.minIntervalSeconds}s`} min={10} max={300} step={10} format={(v) => `${v}s`} tickCount={6} disabled={!character.autoPilot.enabled} onChange={(v) => onUpdate({ autoPilot: { ...character.autoPilot, minIntervalSeconds: v } })} />
            <div className="mb-7">
              <label className="block text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary) mb-2">{t('autoPilot.mood.label')}</label>
              <div className={labelHint}>{t('autoPilot.mood.hint')}</div>
              <CustomSelect value={character.autoPilot.mood} options={moodOptions} onChange={(v) => onUpdate({ autoPilot: { ...character.autoPilot, mood: v } })} disabled={!character.autoPilot.enabled} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BehaviorTab
