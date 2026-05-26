'use client'

import { cn } from '@/lib/utils'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import type { CharacterPersonality } from '@/shared/lib/character'
import {
  PERSONALITY_PRESETS,
  PERSONALITY_PRESET_META,
  ALL_PRESET_KEYS,
  type PresetKey,
  type PresetMeta,
} from '@/shared/data/personality-presets'

function moodDescription(p: CharacterPersonality): string {
  const base: Record<string, string> = {
    neutral:     'Composed and balanced',
    happy:       'Warm and cheerful',
    chill:       'Relaxed and easygoing',
    melancholic: 'Introspective and quiet',
    hyped:       'High-energy and expressive',
  }
  let desc = base[p.baselineMood] ?? 'Balanced'
  if (p.sarcasm > 0.65)            desc += ', sharp-tongued'
  else if (p.empathy > 0.85)       desc += ', deeply empathetic'
  else if (p.assertiveness > 0.75) desc += ', assertive by nature'
  else if (p.warmth < 0.3)         desc += ', emotionally reserved'
  return desc
}

function stressLabel(s: string): string {
  return (
    { humor: 'Deflects with humor', deflect: 'Redirects tension', withdraw: 'Becomes quieter', confront: 'Addresses conflict directly' }[s]
    ?? 'Adapts to context'
  )
}

function MetricBar({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="flex items-center gap-3 py-[3px]">
      <span className="text-[14px] text-[var(--text-tertiary)] w-[116px] shrink-0 leading-none">{label}</span>
      <div className="flex-1 h-[2px] rounded-full bg-[rgba(255,255,255,0.07)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: positive ? 'var(--success-text)' : 'var(--accent-primary)' }}
        />
      </div>
      <span className="text-[12px] font-mono tabular-nums text-[var(--text-tertiary)] w-7 text-right">{pct}%</span>
    </div>
  )
}

function TraitSlider({
  label, hint, lowLabel, highLabel, value, onChange,
}: {
  label: string; hint?: string; lowLabel?: string; highLabel?: string; value: number; onChange: (v: number) => void
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="py-0.5">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[14px] font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-[12px] font-mono tabular-nums text-[var(--text-tertiary)]">{pct}%</span>
      </div>
      {hint && <p className="text-[12px] text-[var(--text-tertiary)] mb-2 leading-[1.4]">{hint}</p>}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          'w-full cursor-pointer appearance-none rounded-full outline-none',
          '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.45)]',
          '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100',
          '[&::-webkit-slider-thumb]:hover:scale-[1.2]',
          '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3',
          '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white',
          '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.45)]',
        )}
        style={{
          height: '3px',
          background: `linear-gradient(to right, var(--accent-primary) ${pct}%, rgba(255,255,255,0.09) ${pct}%)`,
        }}
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[var(--text-tertiary)]">{lowLabel}</span>
          <span className="text-[10px] text-[var(--text-tertiary)]">{highLabel}</span>
        </div>
      )}
    </div>
  )
}

function ProfileCard({ meta, isActive, onClick }: { id: string; meta: PresetMeta; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left p-3 rounded-xl border transition-all duration-150 w-full',
        isActive
          ? 'border-[var(--accent-primary)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]',
      )}
      style={isActive ? { background: 'color-mix(in srgb, var(--accent-primary) 9%, transparent)' } : undefined}
    >
      <p className={cn('text-[14px] font-semibold leading-snug mb-0.5', isActive ? 'text-[var(--accent-violet-text)]' : 'text-[var(--text-primary)]')}>
        {meta.label}
      </p>
      <p className="text-[12px] text-[var(--text-tertiary)] mb-2.5">{meta.tagline}</p>
      <div className="flex gap-1 items-center">
        {meta.dots.map((d, i) => (
          <div
            key={i}
            className="h-[3px] rounded-full flex-1 transition-opacity duration-300"
            style={{ opacity: 0.15 + d * 0.85, background: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          />
        ))}
      </div>
    </button>
  )
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-[var(--border-card)] bg-[var(--surface-card)] p-5', className)}>
      {children}
    </div>
  )
}

const BASELINE_MOODS = [
  { value: 'neutral',     label: 'Neutral' },
  { value: 'happy',       label: 'Happy' },
  { value: 'chill',       label: 'Chill' },
  { value: 'melancholic', label: 'Melancholic' },
  { value: 'hyped',       label: 'Hyped' },
]

function EmotionalStateSection({ p, onChange }: { p: CharacterPersonality; onChange: (f: Partial<CharacterPersonality>) => void }) {
  const stability = Math.max(0, 1 - p.emotionVolatility)
  return (
    <SectionCard className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-[7px] w-[7px] rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', opacity: 0.7 }} />
        <span className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.07em]">Emotional Baseline</span>
      </div>

      <p className="text-[20px] font-semibold text-[var(--text-heading)] leading-tight mb-1">{moodDescription(p)}</p>
      <p className="text-[14px] text-[var(--text-tertiary)] mb-5 leading-relaxed">
        {stressLabel(p.stressBehavior)}&ensp;·&ensp;Active state when conversation is idle
      </p>

      <div className="mb-5">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.07em] mb-2">Default Mood</p>
        <div className="flex flex-wrap gap-1.5">
          {BASELINE_MOODS.map((m) => {
            const active = p.baselineMood === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange({ baselineMood: m.value })}
                className={cn(
                  'px-2.5 py-[5px] rounded-lg text-[14px] font-medium border transition-all duration-100',
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
        <MetricBar label="Emotional Intensity"  value={p.emotionVolatility} />
        <MetricBar label="Responsiveness"       value={p.emotionResponsiveness} />
        <MetricBar label="Memory Persistence"   value={p.emotionMemory} />
        <MetricBar label="Emotional Stability"  value={stability} positive />
      </div>
    </SectionCard>
  )
}

function EmotionalProfilesSection({ p, onApply }: { p: CharacterPersonality; onApply: (preset: CharacterPersonality) => void }) {
  const activeId = p.presetId ?? 'custom'
  return (
    <SectionCard className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-[14px] font-semibold text-[var(--text-heading)] mb-0.5">Emotional Profiles</h2>
        <p className="text-[12px] text-[var(--text-tertiary)]">One-tap personality presets</p>
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
      <p className="text-[10px] text-[var(--text-tertiary)] mt-3 leading-relaxed">
        Dots represent warmth · energy · empathy. Custom is selected automatically when you edit traits.
      </p>
    </SectionCard>
  )
}

type NumericTraitKey = 'warmth' | 'empathy' | 'playfulness' | 'assertiveness' | 'formality' | 'sarcasm'

const TRAITS: Array<{ key: NumericTraitKey; label: string; hint: string; lowLabel: string; highLabel: string }> = [
  { key: 'warmth',        label: 'Warmth',       hint: 'Emotional warmth and care in expression',               lowLabel: 'Cold',     highLabel: 'Warm' },
  { key: 'empathy',       label: 'Empathy',       hint: 'How strongly the AI mirrors and acknowledges emotions', lowLabel: 'Detached', highLabel: 'Empathetic' },
  { key: 'playfulness',   label: 'Playfulness',   hint: 'Tendency to use humor, wit, and banter',               lowLabel: 'Serious',  highLabel: 'Playful' },
  { key: 'assertiveness', label: 'Assertiveness', hint: 'Directness and confidence in expression',              lowLabel: 'Passive',  highLabel: 'Assertive' },
  { key: 'formality',     label: 'Formality',     hint: 'Speech register and vocabulary formality',             lowLabel: 'Casual',   highLabel: 'Formal' },
  { key: 'sarcasm',       label: 'Sarcasm',       hint: 'Ironic or sarcastic edge in responses',               lowLabel: 'Sincere',  highLabel: 'Sarcastic' },
]

function PersonalityTraitsSection({ p, onChange }: { p: CharacterPersonality; onChange: (f: Partial<CharacterPersonality>) => void }) {
  return (
    <SectionCard>
      <div className="mb-5">
        <h2 className="text-[14px] font-semibold text-[var(--text-heading)] mb-0.5">Personality Traits</h2>
        <p className="text-[12px] text-[var(--text-tertiary)]">Core character dimensions that persist across all conversations.</p>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        {TRAITS.map((t) => (
          <TraitSlider
            key={t.key}
            label={t.label}
            hint={t.hint}
            lowLabel={t.lowLabel}
            highLabel={t.highLabel}
            value={p[t.key]}
            onChange={(v) => onChange({ [t.key]: v } as Partial<CharacterPersonality>)}
          />
        ))}
      </div>
    </SectionCard>
  )
}

const STRESS_OPTIONS = [
  { value: 'deflect',  label: 'Deflect',  desc: 'Redirect tension' },
  { value: 'humor',    label: 'Humor',    desc: 'Lighten the mood' },
  { value: 'withdraw', label: 'Withdraw', desc: 'Become quieter' },
  { value: 'confront', label: 'Confront', desc: 'Address directly' },
]

const TTS_PROVIDERS = [
  { name: 'Kokoro',     speed: true,  energy: false, pitch: false },
  { name: 'ElevenLabs', speed: true,  energy: true,  pitch: true  },
  { name: 'Azure TTS',  speed: true,  energy: true,  pitch: true  },
  { name: 'OpenAI TTS', speed: true,  energy: false, pitch: false },
]

function SpeechBehaviorSection({ p, onChange }: { p: CharacterPersonality; onChange: (f: Partial<CharacterPersonality>) => void }) {
  return (
    <SectionCard>
      <div className="mb-5">
        <h2 className="text-[14px] font-semibold text-[var(--text-heading)] mb-0.5">Speech Expression</h2>
        <p className="text-[12px] text-[var(--text-tertiary)]">How emotion shapes vocal delivery and TTS parameters.</p>
      </div>
      <div className="space-y-4 mb-5">
        <TraitSlider
          label="Emotional Energy"
          hint="How energetically the AI speaks during strong emotional states"
          lowLabel="Reserved"
          highLabel="Expressive"
          value={p.emotionVolatility}
          onChange={(v) => onChange({ emotionVolatility: v })}
        />
        <TraitSlider
          label="Emotional Reactivity"
          hint="How strongly emotions modulate speech pacing, energy, and pitch"
          lowLabel="Subtle"
          highLabel="Reactive"
          value={p.emotionResponsiveness}
          onChange={(v) => onChange({ emotionResponsiveness: v })}
        />
      </div>
      <div className="mb-5">
        <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">Stress Expression</p>
        <p className="text-[12px] text-[var(--text-tertiary)] mb-2.5">How the AI responds under pressure or repeated stimuli</p>
        <div className="grid grid-cols-2 gap-1.5">
          {STRESS_OPTIONS.map((opt) => {
            const active = p.stressBehavior === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ stressBehavior: opt.value })}
                className={cn(
                  'text-left px-3 py-2 rounded-lg border text-[14px] transition-all duration-100',
                  active
                    ? 'border-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]',
                )}
                style={active ? { background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' } : undefined}
              >
                <span className={cn('block text-[14px] font-semibold', active ? 'text-[var(--accent-violet-text)]' : 'text-[var(--text-primary)]')}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{opt.desc}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.07em] mb-2">Provider Support</p>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
          <div className="grid grid-cols-4 px-3 py-2 border-b border-[var(--border-subtle)]">
            {['Provider', 'Speed', 'Energy', 'Pitch'].map((h) => (
              <span key={h} className="text-[10px] font-medium text-[var(--text-tertiary)] text-center first:text-left">{h}</span>
            ))}
          </div>
          {TTS_PROVIDERS.map((prov) => (
            <div key={prov.name} className="grid grid-cols-4 px-3 py-[7px] border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-[14px] text-[var(--text-secondary)]">{prov.name}</span>
              {[prov.speed, prov.energy, prov.pitch].map((ok, i) => (
                <span key={i} className={cn('text-center text-[14px]', ok ? 'text-[var(--success-text)]' : 'text-[var(--text-tertiary)] opacity-25')}>
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
  const memoryRows = [
    { label: 'State TTL',            desc: 'Emotion resets after inactivity',                               badge: '20 min',  badgeStyle: 'font-mono' },
    { label: 'Trajectory Tracking',  desc: 'Emotional arc injected into LLM context',                       badge: 'Active',  badgeStyle: 'text-[var(--success-text)] bg-[var(--success-bg)]' },
    { label: 'Blending Mode',        desc: 'New emotions average with prior state via personality weights',  badge: 'Weighted', badgeStyle: 'font-mono' },
  ]
  return (
    <SectionCard>
      <div className="mb-5">
        <h2 className="text-[14px] font-semibold text-[var(--text-heading)] mb-0.5">Emotional Continuity</h2>
        <p className="text-[12px] text-[var(--text-tertiary)]">How emotional states evolve and persist across conversation turns.</p>
      </div>
      <div className="space-y-4 mb-6">
        <TraitSlider
          label="Memory Persistence"
          hint="How much past emotions bleed into the current turn"
          lowLabel="Forgetful"
          highLabel="Persistent"
          value={p.emotionMemory}
          onChange={(v) => onChange({ emotionMemory: v })}
        />
        <TraitSlider
          label="Mood Volatility"
          hint="How widely emotional state can shift per message"
          lowLabel="Stable"
          highLabel="Volatile"
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
              <p className="text-[14px] font-medium text-[var(--text-primary)]">{row.label}</p>
              <p className="text-[12px] text-[var(--text-tertiary)]">{row.desc}</p>
            </div>
            <span className={cn('text-[12px] font-semibold px-2 py-0.5 rounded-md text-[var(--text-secondary)] bg-[var(--surface-2)] shrink-0 ml-3', row.badgeStyle)}>
              {row.badge}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export default function EmotionPage() {
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
          <h1 className="text-[1.625rem] font-semibold leading-8 text-[var(--text-heading)]">Emotion</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[12px] font-semibold text-blue-500 capitalize">
            Beta
          </span>
        </div>
        <p className="mt-1 text-[1rem] leading-6 text-[var(--text-secondary)]">
          Configure emotional intelligence, personality dynamics, and speech expression.
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
