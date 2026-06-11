'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Check, Loader2 } from 'lucide-react'
import { getProject, updateProject, type Project } from '@/features/projects'
import { PersonalitySchema } from '@/shared/lib/character/schemas'
import type { CharacterPersonality } from '@/shared/lib/character/types'
import { handleError } from '@/shared/lib/handle-error'
import { PageContent } from '@/shared/ui'
import { TraitSlider, MetricBar, ProfileCard, AnimatedMoodFace } from '@/features/soul/emotion/components'
import { moodDescription } from '@/features/soul/emotion/lib/personality-display'
import {
  PERSONALITY_PRESETS,
  PERSONALITY_PRESET_META,
  ALL_PRESET_KEYS,
  type PresetKey,
} from '@/shared/data/personality-presets'
import { cn } from '@/lib/utils'


function toPersonality(raw: Record<string, unknown> | string | null): CharacterPersonality {
  const obj = typeof raw === 'string' ? (JSON.parse(raw) as Record<string, unknown>) : (raw ?? {})
  const parsed = PersonalitySchema.parse(obj)
  return {
    warmth:                parsed.warmth,
    playfulness:           parsed.playfulness,
    assertiveness:         parsed.assertiveness,
    empathy:               parsed.empathy,
    formality:             parsed.formality,
    sarcasm:               parsed.sarcasm,
    emotionVolatility:     parsed.emotion_volatility,
    emotionResponsiveness: parsed.emotion_responsiveness,
    emotionMemory:         parsed.emotion_memory,
    stressBehavior:        parsed.stress_behavior,
    baselineMood:          parsed.baseline_mood,
    presetId:              parsed.preset_id,
  }
}

function fromPersonality(p: CharacterPersonality): string {
  return JSON.stringify({
    warmth:                p.warmth,
    playfulness:           p.playfulness,
    assertiveness:         p.assertiveness,
    empathy:               p.empathy,
    formality:             p.formality,
    sarcasm:               p.sarcasm,
    emotion_volatility:    p.emotionVolatility,
    emotion_responsiveness:p.emotionResponsiveness,
    emotion_memory:        p.emotionMemory,
    stress_behavior:       p.stressBehavior,
    baseline_mood:         p.baselineMood,
    preset_id:             p.presetId,
  })
}

const BASELINE_MOODS = [
  { value: 'neutral',     labelKey: 'projectEmotion.moodNeutral'     },
  { value: 'happy',       labelKey: 'projectEmotion.moodHappy'       },
  { value: 'chill',       labelKey: 'projectEmotion.moodChill'       },
  { value: 'melancholic', labelKey: 'projectEmotion.moodMelancholic' },
  { value: 'hyped',       labelKey: 'projectEmotion.moodHyped'       },
]

const STRESS_BEHAVIORS = [
  { value: 'deflect',  labelKey: 'projectEmotion.stressDeflect'  },
  { value: 'engage',   labelKey: 'projectEmotion.stressEngage'   },
  { value: 'withdraw', labelKey: 'projectEmotion.stressWithdraw' },
]


function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[.08em] text-[var(--text-secondary)] mb-6">
      {children}
    </p>
  )
}

function Segmented({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex p-1 rounded-lg bg-[var(--surface-1)] border border-[var(--border-card)]">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 text-center py-[7px] text-[11px] rounded-md transition-all duration-150 cursor-pointer',
            value === o.value
              ? 'bg-[var(--surface-2)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}


export default function ProjectEmotionPage() {
  const { t } = useTranslation('behavior')
  const params = useParams<{ id: string; projectId?: string }>()
  const id = params.projectId ?? params.id  // soul route: /souls/[id]/projects/[projectId]/..., project route: /projects/[id]/...

  const [project, setProject]         = useState<Project | null>(null)
  const [personality, setPersonality] = useState<CharacterPersonality | null>(null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    getProject(id)
      .then(p => {
        setProject(p)
        setPersonality(toPersonality(p.personality_config))
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [id])

  const update = useCallback((patch: Partial<CharacterPersonality>) => {
    setPersonality(prev => prev ? { ...prev, ...patch } : prev)
  }, [])

  async function handleSave() {
    if (!project || !personality || saving) return
    setSaving(true)
    try {
      await updateProject(id, {
        name: project.name,
        personality_config: fromPersonality(personality),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      handleError(new Error('Failed to save'))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !personality) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--text-primary)]" />
      </div>
    )
  }

  const activePresetId = personality.presetId ?? 'custom'
  const activeMeta     = PERSONALITY_PRESET_META[activePresetId as PresetKey | 'custom']

  return (
    <PageContent>
      <div className="flex items-start justify-between mb-[42px]">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">{t('projectEmotion.title')}</h2>
          <span className="text-body text-balance text-[var(--text-secondary)]">{t('projectEmotion.subtitle')}</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[6px] bg-[var(--text-primary)] px-[18px] text-[12px] font-semibold text-[var(--bg-0)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          {saved  && <Check   size={12} />}
          {saving ? t('projectEmotion.saving') : saved ? t('projectEmotion.saved') : t('projectEmotion.save')}
        </button>
      </div>

      <div className="grid grid-cols-[1fr_330px] gap-[42px]">

        <div>

          {/* Personality Traits */}
          <SectionTitle>{t('projectEmotion.personalityTraits')}</SectionTitle>
          <div className="grid grid-cols-2 gap-x-[26px] gap-y-[30px]">
            <TraitSlider label={t('projectEmotion.warmth')}        value={personality.warmth}        onChange={v => update({ warmth: v })} />
            <TraitSlider label={t('projectEmotion.playfulness')}   value={personality.playfulness}   onChange={v => update({ playfulness: v })} />
            <TraitSlider label={t('projectEmotion.assertiveness')} value={personality.assertiveness} onChange={v => update({ assertiveness: v })} />
            <TraitSlider label={t('projectEmotion.empathy')}       value={personality.empathy}       onChange={v => update({ empathy: v })} />
            <TraitSlider label={t('projectEmotion.formality')}     value={personality.formality}     onChange={v => update({ formality: v })} />
            <TraitSlider label={t('projectEmotion.sarcasm')}       value={personality.sarcasm}       onChange={v => update({ sarcasm: v })} />
          </div>

          {/* Behavioral Dynamics */}
          <div className="mt-[70px]">
            <SectionTitle>{t('projectEmotion.behavioralDynamics')}</SectionTitle>
            <div className="grid grid-cols-2 gap-x-[26px] gap-y-[30px]">
              <TraitSlider label={t('projectEmotion.volatility')}     value={personality.emotionVolatility}     onChange={v => update({ emotionVolatility: v })} />
              <TraitSlider label={t('projectEmotion.responsiveness')} value={personality.emotionResponsiveness} onChange={v => update({ emotionResponsiveness: v })} />
              <TraitSlider label={t('projectEmotion.contextMemory')} value={personality.emotionMemory}         onChange={v => update({ emotionMemory: v })} />
            </div>
          </div>

          {/* Baseline Mood + Stress Behaviour */}
          <div className="mt-[80px] grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-[14px]">
              <span className="text-[12px] text-[var(--text-secondary)]">{t('projectEmotion.baselineMood')}</span>
              <Segmented options={BASELINE_MOODS.map(o => ({ value: o.value, label: t(o.labelKey) }))} value={personality.baselineMood} onChange={v => update({ baselineMood: v })} />
            </div>
            <div className="flex flex-col gap-[14px]">
              <span className="text-[12px] text-[var(--text-secondary)]">{t('projectEmotion.stressBehaviour')}</span>
              <Segmented options={STRESS_BEHAVIORS.map(o => ({ value: o.value, label: t(o.labelKey) }))} value={personality.stressBehavior} onChange={v => update({ stressBehavior: v })} />
            </div>
          </div>
        </div>

        <aside>

          {/* Active preset card */}
          <div className="rounded-xl border border-[var(--border-card)] bg-[var(--surface-1)] p-[18px]">
            <div className="flex items-start gap-3 mb-[18px]">
              <AnimatedMoodFace personality={personality} />
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">
                  {activeMeta.label}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-[3px]">
                  {activePresetId === 'custom' ? t('projectEmotion.customProfile') : activeMeta.tagline}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-tertiary)] leading-[1.6] mb-5">
              {moodDescription(personality)}
            </p>

            <MetricBar label={t('projectEmotion.stabilityThreshold')} value={Math.max(0, 1 - personality.emotionVolatility)} />
            <MetricBar label={t('projectEmotion.engagementBias')}     value={(personality.emotionResponsiveness + personality.playfulness) / 2} />
            <MetricBar label={t('projectEmotion.perceivedWarmth')}    value={personality.warmth} />
          </div>

          {/* Presets */}
          <div className="mt-7">
            <p className="text-[11px] uppercase tracking-[.08em] text-[var(--text-tertiary)] mb-[14px]">
              {t('projectEmotion.archetypePresets')}
            </p>
            <div className="grid grid-cols-2 gap-[10px]">
              {ALL_PRESET_KEYS.map(key => (
                <ProfileCard
                  key={key}
                  id={key}
                  meta={PERSONALITY_PRESET_META[key]}
                  isActive={activePresetId === key}
                  onClick={() => {
                    if (key !== 'custom') {
                      update({ ...PERSONALITY_PRESETS[key as PresetKey], presetId: key })
                    }
                  }}
                />
              ))}
            </div>
          </div>

        </aside>
      </div>
    </PageContent>
  )
}
