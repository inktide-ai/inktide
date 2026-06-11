'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import type { CharacterPersonality } from '@/shared/lib/character'
import {
  PERSONALITY_PRESETS,
  PERSONALITY_PRESET_META,
  ALL_PRESET_KEYS,
  type PresetKey,
} from '@/shared/data/personality-presets'
import { MetricBar, TraitSlider, ProfileCard } from './components'
import { moodDescription, stressLabel } from './lib/personality-display'

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-[var(--border-card)] bg-[var(--surface-card)] p-5', className)}>
      {children}
    </div>
  )
}

function EmotionalStateSection({ p, onChange }: { p: CharacterPersonality; onChange: (f: Partial<CharacterPersonality>) => void }) {
  const { t } = useTranslation('emotion')
  const stability = Math.max(0, 1 - p.emotionVolatility)

  const BASELINE_MOODS = [
    { value: 'neutral',     label: t('baseline.moods.neutral') },
    { value: 'happy',       label: t('baseline.moods.happy') },
    { value: 'chill',       label: t('baseline.moods.chill') },
    { value: 'melancholic', label: t('baseline.moods.melancholic') },
    { value: 'hyped',       label: t('baseline.moods.hyped') },
  ]

  return (
    <SectionCard className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-[7px] w-[7px] rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', opacity: 0.7 }} />
        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.07em]">{t('baseline.title')}</span>
      </div>

      <p className="text-[20px] font-semibold text-[var(--text-heading)] leading-tight mb-1">{moodDescription(p)}</p>
      <p className="text-body text-[var(--text-tertiary)] mb-5 leading-relaxed">
        {stressLabel(p.stressBehavior)}&ensp;·&ensp;Active state when conversation is idle
      </p>

      <div className="mb-5">
        <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.07em] mb-2">{t('baseline.defaultMood')}</p>
        <div className="flex flex-wrap gap-1.5">
          {BASELINE_MOODS.map((m) => {
            const active = p.baselineMood === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange({ baselineMood: m.value })}
                className={cn(
                  'px-2.5 py-[5px] rounded-lg text-body font-medium border transition-all duration-100',
                  active
                    ? 'border-[var(--accent-primary)] text-[var(--accent-violet-text)]'
                    : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]',
                )}
                style={active ? { background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' } : undefined}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        <MetricBar label={t('baseline.metrics.emotionalIntensity')} value={p.emotionVolatility} />
        <MetricBar label={t('baseline.metrics.responsiveness')}     value={p.emotionResponsiveness} />
        <MetricBar label={t('baseline.metrics.memoryPersistence')}  value={p.emotionMemory} />
        <MetricBar label={t('baseline.metrics.stability')}          value={stability} />
      </div>
    </SectionCard>
  )
}

function EmotionalProfilesSection({ p, onApply }: { p: CharacterPersonality; onApply: (preset: CharacterPersonality) => void }) {
  const { t } = useTranslation('emotion')
  const activeId = p.presetId ?? 'custom'
  return (
    <SectionCard className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-body font-semibold text-[var(--text-heading)] mb-0.5">{t('profiles.title')}</h2>
        <p className="text-xs text-[var(--text-tertiary)]">{t('profiles.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {ALL_PRESET_KEYS.map((id) => (
          <ProfileCard
            key={id}
            id={id}
            meta={PERSONALITY_PRESET_META[id]}
            isActive={activeId === id}
            onClick={() => { if (id !== 'custom') onApply(PERSONALITY_PRESETS[id as PresetKey]) }}
          />
        ))}
      </div>
      <p className="text-2xs text-[var(--text-tertiary)] mt-3 leading-relaxed">
        {t('profiles.hint')}
      </p>
    </SectionCard>
  )
}

type NumericTraitKey = 'warmth' | 'empathy' | 'playfulness' | 'assertiveness' | 'formality' | 'sarcasm'

function PersonalityTraitsSection({ p, onChange }: { p: CharacterPersonality; onChange: (f: Partial<CharacterPersonality>) => void }) {
  const { t } = useTranslation('emotion')

  const TRAITS: Array<{ key: NumericTraitKey; label: string; hint: string; lowLabel: string; highLabel: string }> = [
    { key: 'warmth',        label: t('traits.warmth.label'),       hint: t('traits.warmth.hint'),       lowLabel: t('traits.warmth.low'),       highLabel: t('traits.warmth.high') },
    { key: 'empathy',       label: t('traits.empathy.label'),      hint: t('traits.empathy.hint'),      lowLabel: t('traits.empathy.low'),      highLabel: t('traits.empathy.high') },
    { key: 'playfulness',   label: t('traits.playfulness.label'),  hint: t('traits.playfulness.hint'),  lowLabel: t('traits.playfulness.low'),  highLabel: t('traits.playfulness.high') },
    { key: 'assertiveness', label: t('traits.assertiveness.label'),hint: t('traits.assertiveness.hint'),lowLabel: t('traits.assertiveness.low'),highLabel: t('traits.assertiveness.high') },
    { key: 'formality',     label: t('traits.formality.label'),    hint: t('traits.formality.hint'),    lowLabel: t('traits.formality.low'),    highLabel: t('traits.formality.high') },
    { key: 'sarcasm',       label: t('traits.sarcasm.label'),      hint: t('traits.sarcasm.hint'),      lowLabel: t('traits.sarcasm.low'),      highLabel: t('traits.sarcasm.high') },
  ]

  return (
    <SectionCard>
      <div className="mb-5">
        <h2 className="text-body font-semibold text-[var(--text-heading)] mb-0.5">{t('traits.title')}</h2>
        <p className="text-xs text-[var(--text-tertiary)]">{t('traits.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        {TRAITS.map((trait) => (
          <TraitSlider
            key={trait.key}
            label={trait.label}
            hint={trait.hint}
            lowLabel={trait.lowLabel}
            highLabel={trait.highLabel}
            value={p[trait.key]}
            onChange={(v) => onChange({ [trait.key]: v } as Partial<CharacterPersonality>)}
          />
        ))}
      </div>
    </SectionCard>
  )
}

const TTS_PROVIDERS = [
  { name: 'Kokoro',     speed: true,  energy: false, pitch: false },
  { name: 'ElevenLabs', speed: true,  energy: true,  pitch: true  },
  { name: 'Azure TTS',  speed: true,  energy: true,  pitch: true  },
  { name: 'OpenAI TTS', speed: true,  energy: false, pitch: false },
]

function SpeechBehaviorSection({ p, onChange }: { p: CharacterPersonality; onChange: (f: Partial<CharacterPersonality>) => void }) {
  const { t } = useTranslation('emotion')

  const STRESS_OPTIONS = [
    { value: 'deflect',  label: t('stress.deflect'),  desc: t('stress.deflectDesc') },
    { value: 'humor',    label: t('stress.humor'),    desc: t('stress.humorDesc') },
    { value: 'withdraw', label: t('stress.withdraw'), desc: t('stress.withdrawDesc') },
    { value: 'confront', label: t('stress.confront'), desc: t('stress.confrontDesc') },
  ]

  return (
    <SectionCard>
      <div className="mb-5">
        <h2 className="text-body font-semibold text-[var(--text-heading)] mb-0.5">{t('speech.title')}</h2>
        <p className="text-xs text-[var(--text-tertiary)]">{t('speech.subtitle')}</p>
      </div>
      <div className="space-y-4 mb-5">
        <TraitSlider
          label={t('speech.energy.label')}
          hint={t('speech.energy.hint')}
          lowLabel={t('speech.energy.low')}
          highLabel={t('speech.energy.high')}
          value={p.emotionVolatility}
          onChange={(v) => onChange({ emotionVolatility: v })}
        />
        <TraitSlider
          label={t('speech.reactivity.label')}
          hint={t('speech.reactivity.hint')}
          lowLabel={t('speech.reactivity.low')}
          highLabel={t('speech.reactivity.high')}
          value={p.emotionResponsiveness}
          onChange={(v) => onChange({ emotionResponsiveness: v })}
        />
      </div>
      <div className="mb-5">
        <p className="text-body font-medium text-[var(--text-primary)] mb-1">{t('stress.label')}</p>
        <p className="text-xs text-[var(--text-tertiary)] mb-2.5">{t('stress.description')}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {STRESS_OPTIONS.map((opt) => {
            const active = p.stressBehavior === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ stressBehavior: opt.value })}
                className={cn(
                  'text-left px-3 py-2 rounded-lg border text-body transition-all duration-100',
                  active
                    ? 'border-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]',
                )}
                style={active ? { background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' } : undefined}
              >
                <span className={cn('block text-body font-semibold', active ? 'text-[var(--accent-violet-text)]' : 'text-[var(--text-primary)]')}>
                  {opt.label}
                </span>
                <span className="text-2xs text-[var(--text-tertiary)]">{opt.desc}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.07em] mb-2">{t('speech.providers.title')}</p>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
          <div className="grid grid-cols-4 px-3 py-2 border-b border-[var(--border-subtle)]">
            {[t('speech.providers.provider'), t('speech.providers.speed'), t('speech.providers.energy'), t('speech.providers.pitch')].map((h) => (
              <span key={h} className="text-2xs font-medium text-[var(--text-tertiary)] text-center first:text-left">{h}</span>
            ))}
          </div>
          {TTS_PROVIDERS.map((prov) => (
            <div key={prov.name} className="grid grid-cols-4 px-3 py-[7px] border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-body text-[var(--text-secondary)]">{prov.name}</span>
              {[prov.speed, prov.energy, prov.pitch].map((ok, i) => (
                <span key={i} className={cn('text-center text-body', ok ? 'text-[var(--success-text)]' : 'text-[var(--text-tertiary)] opacity-25')}>
                  {ok ? '✓' : '–'}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

function EmotionalMemorySection({ p, onChange }: { p: CharacterPersonality; onChange: (f: Partial<CharacterPersonality>) => void }) {
  const { t } = useTranslation('emotion')

  const memoryRows = [
    { label: t('continuity.stateTtl.label'),   desc: t('continuity.stateTtl.desc'),   badge: t('continuity.stateTtl.badge'),   badgeStyle: 'font-mono' },
    { label: t('continuity.trajectory.label'), desc: t('continuity.trajectory.desc'), badge: t('continuity.trajectory.badge'), badgeStyle: 'text-[var(--success-text)] bg-[var(--success-bg)]' },
    { label: t('continuity.blending.label'),   desc: t('continuity.blending.desc'),   badge: t('continuity.blending.badge'),   badgeStyle: 'font-mono' },
  ]

  return (
    <SectionCard>
      <div className="mb-5">
        <h2 className="text-body font-semibold text-[var(--text-heading)] mb-0.5">{t('continuity.title')}</h2>
        <p className="text-xs text-[var(--text-tertiary)]">{t('continuity.subtitle')}</p>
      </div>
      <div className="space-y-4 mb-6">
        <TraitSlider
          label={t('continuity.persistence.label')}
          hint=""
          lowLabel={t('continuity.persistence.low')}
          highLabel={t('continuity.persistence.high')}
          value={p.emotionMemory}
          onChange={(v) => onChange({ emotionMemory: v })}
        />
        <TraitSlider
          label={t('continuity.volatility.label')}
          hint=""
          lowLabel={t('continuity.volatility.low')}
          highLabel={t('continuity.volatility.high')}
          value={p.emotionVolatility}
          onChange={(v) => onChange({ emotionVolatility: v })}
        />
      </div>
      <div className="space-y-0 border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        {memoryRows.map((row, i) => (
          <div
            key={row.label}
            className={cn('flex items-center justify-between px-4 py-3 bg-[var(--surface-1)]', i < memoryRows.length - 1 && 'border-b border-[var(--border-subtle)]')}
          >
            <div>
              <p className="text-body font-medium text-[var(--text-primary)]">{row.label}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{row.desc}</p>
            </div>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md text-[var(--text-secondary)] bg-[var(--surface-2)] shrink-0 ml-3', row.badgeStyle)}>
              {row.badge}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export default function EmotionPage() {
  const { t } = useTranslation('emotion')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null

  const p = selected.personalityConfig

  const patch = (fields: Partial<CharacterPersonality>) =>
    updateCharacter(selectedId, { personalityConfig: { ...p, ...fields, presetId: null } })

  const applyPreset = (preset: CharacterPersonality) =>
    updateCharacter(selectedId, { personalityConfig: preset })

  return (
    <div className="mx-auto w-full max-w-7xl px-24 pb-14 pt-9 xl:max-w-[90rem]">
      <header className="mb-9">
        <div className="flex items-center gap-2">
          <h1 className="text-[1.625rem] font-semibold leading-8 text-[var(--text-heading)]">{t('title')}</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 capitalize">
            {t('badge')}
          </span>
        </div>
        <p className="mt-1 text-[1rem] leading-6 text-[var(--text-secondary)]">
          {t('subtitle')}
        </p>
      </header>
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <EmotionalStateSection p={p} onChange={patch} />
          </div>
          <div className="col-span-2">
            <EmotionalProfilesSection p={p} onApply={applyPreset} />
          </div>
        </div>
        <PersonalityTraitsSection p={p} onChange={patch} />
        <div className="grid grid-cols-2 gap-4">
          <SpeechBehaviorSection p={p} onChange={patch} />
          <EmotionalMemorySection p={p} onChange={patch} />
        </div>
      </div>
    </div>
  )
}
