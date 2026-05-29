'use client'

import { motion, type Variants } from 'framer-motion'
import SliderWithTicks from '@/shared/ui/slider-with-ticks'
import type { CharacterPersonality } from '@/shared/lib/character'

// ── Presets ───────────────────────────────────────────────────────────────────

type PresetId = 'friendly' | 'streamer' | 'tactical' | 'cozy' | 'chaotic' | 'companion' | 'therapist'

interface PresetDef {
  label: string
  emoji: string
  values: Omit<CharacterPersonality, 'presetId'>
}

const PRESETS: Record<PresetId, PresetDef> = {
  friendly:  { label: 'Friendly',   emoji: '😊', values: { warmth: 0.90, playfulness: 0.70, empathy: 0.85, assertiveness: 0.45, formality: 0.30, sarcasm: 0.10, emotionVolatility: 0.35, emotionResponsiveness: 0.75, emotionMemory: 0.55, baselineMood: 'happy',   stressBehavior: 'deflect'  } },
  streamer:  { label: 'Streamer',   emoji: '🎮', values: { warmth: 0.80, playfulness: 0.85, empathy: 0.70, assertiveness: 0.60, formality: 0.10, sarcasm: 0.30, emotionVolatility: 0.70, emotionResponsiveness: 0.85, emotionMemory: 0.40, baselineMood: 'happy',   stressBehavior: 'humor'    } },
  tactical:  { label: 'Tactical',   emoji: '⚡', values: { warmth: 0.40, playfulness: 0.30, empathy: 0.50, assertiveness: 0.85, formality: 0.65, sarcasm: 0.20, emotionVolatility: 0.25, emotionResponsiveness: 0.55, emotionMemory: 0.75, baselineMood: 'neutral',  stressBehavior: 'confront' } },
  cozy:      { label: 'Cozy',       emoji: '🌙', values: { warmth: 0.85, playfulness: 0.50, empathy: 0.80, assertiveness: 0.35, formality: 0.25, sarcasm: 0.05, emotionVolatility: 0.25, emotionResponsiveness: 0.60, emotionMemory: 0.65, baselineMood: 'chill',   stressBehavior: 'deflect'  } },
  chaotic:   { label: 'Chaotic',    emoji: '🌀', values: { warmth: 0.55, playfulness: 0.95, empathy: 0.45, assertiveness: 0.55, formality: 0.05, sarcasm: 0.70, emotionVolatility: 0.95, emotionResponsiveness: 0.95, emotionMemory: 0.20, baselineMood: 'hyped',   stressBehavior: 'humor'    } },
  companion: { label: 'Companion',  emoji: '🤝', values: { warmth: 0.90, playfulness: 0.55, empathy: 0.95, assertiveness: 0.40, formality: 0.35, sarcasm: 0.05, emotionVolatility: 0.30, emotionResponsiveness: 0.80, emotionMemory: 0.80, baselineMood: 'neutral',  stressBehavior: 'deflect'  } },
  therapist: { label: 'Therapist',  emoji: '💜', values: { warmth: 0.85, playfulness: 0.25, empathy: 0.95, assertiveness: 0.50, formality: 0.55, sarcasm: 0.05, emotionVolatility: 0.15, emotionResponsiveness: 0.65, emotionMemory: 0.90, baselineMood: 'neutral',  stressBehavior: 'withdraw' } },
}

// ── Human-readable descriptors ─────────────────────────────────────────────────

const DESCRIPTORS: Record<string, [string, string, string]> = {
  warmth:        ['Reserved & analytical',    'Balanced',             'Deeply warm & nurturing'],
  empathy:       ['Detached & objective',      'Attuned when needed',  'Deeply emotionally attuned'],
  assertiveness: ['Passive & yielding',        'Balanced',             'Direct & confident'],
  playfulness:   ['Serious & composed',        'Occasionally playful', 'Lighthearted & fun'],
  formality:     ['Casual & relaxed',          'Adaptable tone',       'Formal & professional'],
  sarcasm:       ['Sincere & straightforward', 'Occasionally witty',   'Sharp & ironic'],
  emotionVolatility:     ['Emotionally stable', 'Moderate swings',  'Highly reactive'],
  emotionResponsiveness: ['Slow to respond',   'Balanced pace',     'Instantly reactive'],
  emotionMemory:         ['Forgets quickly',   'Moderate retention', 'Long emotional memory'],
}

const getDescriptor = (field: string, value: number): string => {
  const [low, mid, high] = DESCRIPTORS[field] ?? ['Low', 'Mid', 'High']
  if (value < 0.33) return low
  if (value < 0.67) return mid
  return high
}

// ── Style constants ────────────────────────────────────────────────────────────

const sectionLabel = 'text-caption font-semibold uppercase tracking-[0.07em] text-[var(--text-tertiary)] mb-3 block'
const chipBase = 'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-150 cursor-pointer select-none'
const chipActive = 'bg-[color-mix(in_srgb,var(--accent-base)_20%,transparent)] border-[color-mix(in_srgb,var(--accent-base)_60%,transparent)] text-[var(--accent-base)]'
const chipInactive = 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]'

// ── Sub-components ─────────────────────────────────────────────────────────────

function TraitSlider({
  label,
  field,
  value,
  onChange,
}: {
  label: string
  field: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-body-md font-semibold text-[var(--text-primary)] mb-0.5">{label}</div>
          <div className="text-xs text-[var(--text-tertiary)] leading-snug">
            {getDescriptor(field, value)}
          </div>
        </div>
      </div>
      <SliderWithTicks
        min={0} max={1} step={0.05}
        value={value}
        onChange={onChange}
        formatValue={(v) => v.toFixed(1)}
        tickCount={5}
      />
    </div>
  )
}

function BipolarSlider({
  lowLabel,
  highLabel,
  field,
  value,
  onChange,
}: {
  lowLabel: string
  highLabel: string
  field: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1 text-sm font-medium">
        <span className={value < 0.5 ? 'text-[var(--accent-base)]' : 'text-[var(--text-tertiary)]'}>{lowLabel}</span>
        <span className={value >= 0.5 ? 'text-[var(--accent-base)]' : 'text-[var(--text-tertiary)]'}>{highLabel}</span>
      </div>
      <SliderWithTicks
        min={0} max={1} step={0.05}
        value={value}
        onChange={onChange}
        formatValue={(v) => v.toFixed(1)}
        tickCount={5}
      />
      <div className="text-center text-caption text-[var(--text-tertiary)] mt-1">
        {getDescriptor(field, value)}
      </div>
    </div>
  )
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`${chipBase} ${value === o.id ? chipActive : chipInactive}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Stagger animation helper ───────────────────────────────────────────────────

const EASE_CURVE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, delay: i * 0.06, ease: EASE_CURVE },
  }),
}

function Section({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="rounded-xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--accent-base)_3%,var(--surface-1))] p-4"
    >
      {children}
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface PersonalityWorkspaceProps {
  personality: CharacterPersonality
  onChange: (p: CharacterPersonality) => void
  onClose: () => void
}

const MOOD_OPTIONS = [
  { id: 'neutral'    as const, label: 'Neutral' },
  { id: 'happy'      as const, label: 'Happy' },
  { id: 'chill'      as const, label: 'Chill' },
  { id: 'melancholic'as const, label: 'Melancholic' },
  { id: 'hyped'      as const, label: 'Hyped' },
]

const STRESS_OPTIONS = [
  { id: 'deflect'  as const, label: 'Deflect' },
  { id: 'humor'    as const, label: 'Humor' },
  { id: 'withdraw' as const, label: 'Withdraw' },
  { id: 'confront' as const, label: 'Confront' },
]

export function PersonalityWorkspace({ personality, onChange, onClose }: PersonalityWorkspaceProps) {
  const set = (patch: Partial<CharacterPersonality>) => onChange({ ...personality, ...patch })

  const applyPreset = (id: PresetId) =>
    onChange({ ...PRESETS[id].values, presetId: id })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="home-heading-font text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Personality & Emotions
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            Shape the character, communication style and emotional behavior.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close personality workspace"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] ml-3"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Section 1 — Emotional Profiles */}
      <Section index={0}>
        <span className={sectionLabel}>Emotional Profiles</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESETS) as PresetId[]).map((id) => {
            const p = PRESETS[id]
            const isActive = personality.presetId === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => applyPreset(id)}
                className={`${chipBase} flex items-center gap-1.5 ${isActive ? chipActive : chipInactive}`}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Section 2 — Personality Traits */}
      <Section index={1}>
        <span className={sectionLabel}>Personality Traits</span>
        <TraitSlider label="Warmth"        field="warmth"        value={personality.warmth}        onChange={(v) => set({ warmth: v,        presetId: null })} />
        <TraitSlider label="Empathy"       field="empathy"       value={personality.empathy}       onChange={(v) => set({ empathy: v,       presetId: null })} />
        <TraitSlider label="Assertiveness" field="assertiveness" value={personality.assertiveness} onChange={(v) => set({ assertiveness: v, presetId: null })} />
        <TraitSlider label="Playfulness"   field="playfulness"   value={personality.playfulness}   onChange={(v) => set({ playfulness: v,   presetId: null })} />
      </Section>

      {/* Section 3 — Communication Style */}
      <Section index={2}>
        <span className={sectionLabel}>Communication Style</span>
        <BipolarSlider lowLabel="Casual"   highLabel="Formal"  field="formality" value={personality.formality} onChange={(v) => set({ formality: v, presetId: null })} />
        <BipolarSlider lowLabel="Sincere"  highLabel="Witty"   field="sarcasm"   value={personality.sarcasm}   onChange={(v) => set({ sarcasm: v,   presetId: null })} />
      </Section>

      {/* Section 4 — Emotional State */}
      <Section index={3}>
        <span className={sectionLabel}>Emotional State</span>
        <div className="mb-4">
          <div className="text-sm font-medium text-[var(--text-secondary)] mb-2">Default mood</div>
          <ChipRow
            options={MOOD_OPTIONS}
            value={personality.baselineMood as typeof MOOD_OPTIONS[number]['id']}
            onChange={(v) => set({ baselineMood: v, presetId: null })}
          />
        </div>
        <TraitSlider label="Emotional intensity" field="emotionVolatility"     value={personality.emotionVolatility}     onChange={(v) => set({ emotionVolatility: v,     presetId: null })} />
        <TraitSlider label="Adaptability"        field="emotionResponsiveness" value={personality.emotionResponsiveness} onChange={(v) => set({ emotionResponsiveness: v, presetId: null })} />
      </Section>

      {/* Section 5 — Response Behavior */}
      <Section index={4}>
        <span className={sectionLabel}>Response Behavior</span>
        <div className="mb-4">
          <div className="text-sm font-medium text-[var(--text-secondary)] mb-2">Under pressure</div>
          <ChipRow
            options={STRESS_OPTIONS}
            value={personality.stressBehavior as typeof STRESS_OPTIONS[number]['id']}
            onChange={(v) => set({ stressBehavior: v, presetId: null })}
          />
        </div>
        <TraitSlider label="Emotional carry-over" field="emotionMemory" value={personality.emotionMemory} onChange={(v) => set({ emotionMemory: v, presetId: null })} />
      </Section>
    </div>
  )
}
